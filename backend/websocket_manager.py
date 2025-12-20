from fastapi import WebSocket
from typing import List
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

connected_clients_light: List[WebSocket] = []
connected_clients_door: List[WebSocket] = []
connected_clients_clothesline: List[WebSocket] = []
connected_clients_alert: List[WebSocket] = []

# === Fungsi koneksi/disconnect ===
async def connect_client_light(websocket: WebSocket):
    await websocket.accept()
    connected_clients_light.append(websocket)

async def connect_client_door(websocket: WebSocket):
    await websocket.accept()
    connected_clients_door.append(websocket)

async def connect_client_clothesline(websocket: WebSocket):
    await websocket.accept()
    connected_clients_clothesline.append(websocket)

async def connect_client_alert(websocket: WebSocket):
    await websocket.accept()
    connected_clients_alert.append(websocket)


def disconnect_client_light(websocket: WebSocket):
    if websocket in connected_clients_light:
        connected_clients_light.remove(websocket)

def disconnect_client_door(websocket: WebSocket):
    if websocket in connected_clients_door:
        connected_clients_door.remove(websocket)

def disconnect_client_clothesline(websocket: WebSocket):
    if websocket in connected_clients_clothesline:
        connected_clients_clothesline.remove(websocket)

def disconnect_client_alert(websocket: WebSocket):
    if websocket in connected_clients_alert:
        connected_clients_alert.remove(websocket)

# === Fungsi broadcast ke WebSocket ===

async def broadcast_light_status(data: dict):
    disconnected = []
    for client in connected_clients_light:
        try:
            await client.send_json(data)
            logger.info(f"Broadcast to {client.client}: {data}")
        except:
            disconnected.append(client)
    for client in disconnected:
        disconnect_client_light(client)

async def broadcast_door_status(data: dict):
    disconnected = []
    for client in connected_clients_door:
        try:
            await client.send_json(data)
            logger.info(f"Broadcast to {client.client}: {data}")
        except:
            disconnected.append(client)
    for client in disconnected:
        disconnect_client_door(client)

async def broadcast_clothesline_status(data: dict):
    disconnected = []
    for client in connected_clients_clothesline:
        try:
            await client.send_json(data)
        except:
            disconnected.append(client)
    for client in disconnected:
        disconnect_client_clothesline(client)

async def broadcast_alert_status(data: dict):
    disconnected = []
    for client in connected_clients_alert:
        try:
            await client.send_json(data)
            logger.info(f"Broadcast to {client.client}: {data}")
        except:
            disconnected.append(client)
    for client in disconnected:
        disconnect_client_alert(client)
