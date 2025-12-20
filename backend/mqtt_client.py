# mqtt_client.py

import os
import time
import logging
import json
import paho.mqtt.client as mqtt
import random
import string
import asyncio
import datetime

from db import insert_door_log, insert_clothesline_log
from websocket_manager import (
    broadcast_door_status,
    broadcast_clothesline_status,
    broadcast_alert_status,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class MQTTClientManager:
    def __init__(self, loop):
        self.loop = loop
        self.client = mqtt.Client(client_id=self._generate_client_id())

        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

        self._setup_auth()

    def _generate_client_id(self):
        return 'mqtt_client_' + ''.join(random.choices(string.ascii_letters + string.digits, k=8))

    def _setup_auth(self):
        mqtt_user = os.environ.get("MQTT_USERNAME")
        mqtt_pass = os.environ.get("MQTT_PASSWORD")
        if mqtt_user and mqtt_pass:
            self.client.username_pw_set(mqtt_user, mqtt_pass)
        self.client.clean_session = True

    def connect(self, max_retries=30, delay=2):
        broker_host = os.environ.get("MQTT_HOST", "localhost")
        broker_port = int(os.environ.get("MQTT_PORT", "1883"))

        attempts = 0
        while attempts < max_retries:
            try:
                self.client.connect(broker_host, broker_port)
                self.client.loop_start()
                logger.info(f"🚀 MQTT client loop started on {broker_host}:{broker_port}")
                return
            except Exception as e:
                attempts += 1
                logger.warning(f"⏳ MQTT connect attempt {attempts}/{max_retries} failed: {e}")
                time.sleep(delay)

        logger.error("❌ Maximum retry attempts reached. MQTT connection failed.")
        raise ConnectionError("Unable to connect to MQTT broker after multiple attempts.")

    def stop(self):
        self.client.loop_stop()

    def publish(self, topic, message):
        if isinstance(message, dict):
            message = json.dumps(message)
        result = self.client.publish(topic, message)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            logger.info(f"📤 Sent '{message}' to topic '{topic}'")
        else:
            logger.warning(f"⚠️ Failed to send message to topic {topic}, error code: {result.rc}")
        return result

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("✅ Connected to MQTT broker successfully.")
            client.subscribe("homytech/door/iot")
            client.subscribe("homytech/clothesline/iot")
            client.subscribe("homytech/alert/iot")
            logger.info("📡 Subscribed to MQTT topics.")
        else:
            logger.error(f"❌ Failed to connect, return code {rc}")

    def _on_message(self, client, userdata, msg):
        topic = msg.topic
        try:
            payload = json.loads(msg.payload.decode())
            logger.info(f"📥 Received message on {topic}: {payload}")

            now = datetime.datetime.now().isoformat()

            if topic == "homytech/door/iot":
                insert_door_log(
                    user=payload.get("user", "-"),
                    action=payload.get("action", "-"),
                    source="RFID"
                )
                asyncio.run_coroutine_threadsafe(
                    broadcast_door_status({
                        "user": payload.get("user", "-"),
                        "action": payload.get("action", "-"),
                        "timestamp": now,
                        "source": "RFID"
                    }),
                    self.loop
                )

            elif topic == "homytech/clothesline/iot":
                insert_clothesline_log(
                    user="System",
                    action=payload.get("action", "-"),
                    source="Rain Sensor"
                )
                asyncio.run_coroutine_threadsafe(
                    broadcast_clothesline_status({
                        "user": "System",
                        "action": payload.get("action", "-"),
                        "timestamp": now,
                        "source": "Rain Sensor"
                    }),
                    self.loop
                )

            elif topic == "homytech/alert/iot":
                insert_door_log(
                    user="Unknown",
                    action=f"Tried to {payload.get('action', 'access')} door",
                    source="Alert System"
                )
                asyncio.run_coroutine_threadsafe(
                    broadcast_alert_status({
                        "action": payload.get("action"),
                        "timestamp": now
                    }),
                    self.loop
                )
        except Exception as e:
            logger.error(f"❌ Failed to process message on {topic}: {e}")
