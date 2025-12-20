from bson import ObjectId
from fastapi import FastAPI, HTTPException, WebSocket, Query, Depends, Body
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from datetime import datetime, timezone, timedelta
from typing import Optional
from mqtt_client import MQTTClientManager
from contextlib import asynccontextmanager
from db import (
    insert_light_log, 
    insert_door_log, 
    insert_clothesline_log, 
    get_latest_clothesline_state, 
    get_latest_door_state, 
    get_latest_light_state, 
    get_latest_clothesline_state,
    get_door_logs,
    get_light_logs,
    get_clothesline_logs,
    get_user_by_email,
)
from websocket_manager import (
    connect_client_light,
    connect_client_door,
    connect_client_clothesline,
    connect_client_alert,
    disconnect_client_light,
    disconnect_client_door,
    disconnect_client_clothesline,
    disconnect_client_alert,
    broadcast_light_status,
    broadcast_door_status,
    broadcast_clothesline_status,
)
from jose import jwt
from passlib.context import CryptContext
import logging
import sys
import os
import asyncio

mqtt_manager = None  

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,  # atau INFO jika tidak ingin terlalu verbose
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    stream=sys.stdout
)

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
ALGORITHM = os.environ.get("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JAKARTA_TZ = timezone(timedelta(hours=7))

def to_jakarta_time(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(JAKARTA_TZ)

def convert_mongo_types(obj, to_jakarta=False):
    if isinstance(obj, dict):
        return {k: convert_mongo_types(v, to_jakarta) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_mongo_types(i, to_jakarta) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        if to_jakarta:
            return to_jakarta_time(obj).isoformat()
        return obj.isoformat()
    elif isinstance(obj, str):
        # Try to parse ISO datetime string and convert if needed
        try:
            dt = datetime.fromisoformat(obj)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if to_jakarta:
                return to_jakarta_time(dt).isoformat()
            return dt.isoformat()
        except Exception:
            return obj
    else:
        return obj


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mqtt_manager
    loop = asyncio.get_running_loop()
    mqtt_manager = MQTTClientManager(loop)
    mqtt_manager.connect()
    yield
    mqtt_manager.stop()
    logger.info("Aplikasi dihentikan, koneksi MQTT ditutup.")

app = FastAPI(lifespan=lifespan)

@app.websocket("/ws/light")
async def websocket_light(websocket: WebSocket):
    await connect_client_light(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        disconnect_client_light(websocket)

@app.websocket("/ws/door")
async def websocket_door(websocket: WebSocket):
    await connect_client_door(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        disconnect_client_door(websocket)

@app.websocket("/ws/clothesline")
async def websocket_clothesline(websocket: WebSocket):
    await connect_client_clothesline(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        disconnect_client_clothesline(websocket)

@app.websocket("/ws/alert")
async def websocket_alert(websocket: WebSocket):
    await connect_client_alert(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        disconnect_client_alert(websocket)

class DeviceControlRequest(BaseModel):
    user: str
    action: str

class ModeControlRequest(BaseModel):
    mode: str

@app.post("/api/light/{light_id}")
async def control_light(light_id: int, req: DeviceControlRequest):
    action = req.action.lower()
    if action not in ["on", "off"]:
        raise HTTPException(status_code=400, detail="action harus on atau off")
    
    topic = f"homytech/light/{light_id}/web"
    result = publish(topic, {"action": action})
    
    if result.rc != 0:
        raise HTTPException(status_code=500, detail="Gagal mengirim perintah ke broker MQTT")
    
    await broadcast_light_status({
        "user": req.user,
        "light_id": light_id,
        "action": action,
        "timestamp": datetime.now().isoformat(),
    })
    
    insert_light_log(light_id, action, req.user)
    return {"message": f"light {light_id} dikirim perintah {action}"}

@app.post("/api/door/")
async def control_door(req: DeviceControlRequest):
    action = req.action.lower()
    if action not in ["open", "close"]:
        raise HTTPException(status_code=400, detail="action harus open atau close")
    
    topic = "homytech/door/web"
    result = publish(topic, {"action": action})
    
    if result.rc != 0:  
        raise HTTPException(status_code=500, detail="Gagal mengirim perintah ke broker MQTT")
    
    await broadcast_door_status({
        "user": req.user,
        "action": action,
        "timestamp": datetime.now().isoformat(),
        "source": "web"
    })

    insert_door_log(req.user, action, "web")
    return {"message": f"door dikirim perintah {action}"}

@app.post("/api/clothesline/")
async def control_clothesline(req: DeviceControlRequest):
    action = req.action.lower()
    if action not in ["retract", "extend"]:
        raise HTTPException(status_code=400, detail="action harus retract atau extend")
    
    topic = "homytech/clothesline/web"
    result = publish(topic, {"action": action})
    
    if result.rc != 0:  
        raise HTTPException(status_code=500, detail="Gagal mengirim perintah ke broker MQTT")
    
    await broadcast_clothesline_status({
        "user": req.user,
        "action": action,
        "timestamp": datetime.now().isoformat(),
        "source": "web",
    })

    insert_clothesline_log(action, "web", req.user)
    return {"message": f"clothesline dikirim perintah {action}"}

@app.post("/api/clothesline/mode")
async def control_clothesline_mode(req: ModeControlRequest):
    mode = req.mode.lower()
    if mode not in ["manual", "auto"]:
        raise HTTPException(status_code=400, detail="mode harus manual atau auto")
    
    topic = "homytech/clothesline-mode/web"
    result = publish(topic, {"mode": mode})

    if result.rc != 0:  
        raise HTTPException(status_code=500, detail="Gagal mengirim perintah ke broker MQTT")

    return {"message": f"clothesline berada pada mode {mode}"}


@app.post("/api/sync-state")
async def sync_state():
    try:
        # Fetch latest states
        light_state = get_latest_light_state()
        door_state = get_latest_door_state()
        clothesline_state = get_latest_clothesline_state()

        # Publish to MQTT
        if light_state and "lights" in light_state:
            for light in light_state["lights"]:
                topic = f"homytech/light/{light['light_id']}/web"
                publish(topic, {"action": light["action"]})
        if door_state:
            publish("homytech/door/web", {"action": door_state["action"]})
        if clothesline_state:
            publish("homytech/clothesline/web", {"action": clothesline_state["action"]})
        
        publish("homytech/clothesline-mode/web", {"mode": "auto"})
        
        return {"message": "State synchronized to IoT devices via MQTT"}
    except Exception as e:
        logger.error(f"Error syncing state: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync state")

@app.get("/api/latest-state/light")
def get_light_state():
    try:
        state = get_latest_light_state()
        if state is None:
            raise HTTPException(status_code=404, detail="Tidak ada data status lampu")
        state = convert_mongo_types(state, to_jakarta=True)
        return JSONResponse(content=state)
    except Exception as e:
        logger.error(f"Error in get_light_state: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@app.get("/api/latest-state/door")
def get_door_state():
    try:
        state = get_latest_door_state()
        if state is None:
            raise HTTPException(status_code=404, detail="Tidak ada data status pintu")
        state = convert_mongo_types(state, to_jakarta=True)
        return JSONResponse(content=state)
    except Exception as e:
        logger.error(f"Error in get_door_state: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")
    
@app.get("/api/latest-state/clothesline")
def get_clothesline_state():
    try:
        state = get_latest_clothesline_state()
        if state is None:
            raise HTTPException(status_code=404, detail="Tidak ada data status jemuran")
        state = convert_mongo_types(state, to_jakarta=True)
        return JSONResponse(content=state)
    except Exception as e:
        logger.error(f"Error in get_clothesline_state: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@app.get("/api/logs/door")
def api_get_door_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user: Optional[str] = None,
    action: Optional[str] = None,
    source: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    try:
        logs = get_door_logs(page, limit, user, action, source, from_date, to_date)
        # Convert timestamps to Jakarta time before returning
        logs["logs"] = [convert_mongo_types(log, to_jakarta=True) for log in logs["logs"]]
        return logs
    except Exception as e:
        logger.error(f"Error fetching door logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch door logs")

@app.get("/api/logs/light")
def api_get_light_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    user: Optional[str] = None,
    action: Optional[str] = None,
    light_id: Optional[int] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
): 
    logger.info(f"API /api/logs/light called with params: page={page}, limit={limit}, user={user}, action={action}, light_id={light_id}, from_date={from_date}, to_date={to_date}")
    try:
        logs = get_light_logs(page, limit, user, action, light_id, from_date, to_date)
        logs["logs"] = [convert_mongo_types(log, to_jakarta=True) for log in logs["logs"]]
        logger.info(f"Successfully fetched {len(logs['logs'])} light logs")
        return logs
    except Exception as e:
        logger.error(f"Error fetching light logs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch light logs: {e}")

@app.get("/api/logs/clothesline")
def api_get_clothesline_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user: Optional[str] = None,
    action: Optional[str] = None,
    source: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
):
    try:
        logs = get_clothesline_logs(page, limit, user, action, source, from_date, to_date)
        logs["logs"] = [convert_mongo_types(log, to_jakarta=True) for log in logs["logs"]]
        return logs
    except Exception as e:
        logger.error(f"Error fetching clothesline logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch clothesline logs")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login(req: LoginRequest = Body(...)):
    user = authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token({"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer", "name": user.get("name", "")}


@app.get("/api/light-usage/hourly")
def get_light_usage_hourly():
    """
    Mengembalikan total durasi ON (menit) per jam untuk setiap lampu pada 8 jam terakhir.
    """
    from db import get_light_logs
    now = datetime.now(timezone.utc)
    from_date = now - timedelta(hours=8)
    # Ambil semua log lampu 8 jam terakhir, limit besar agar tidak terpotong
    logs_data = get_light_logs(page=1, limit=1000, from_date=from_date)
    logs = logs_data["logs"]
    logs.sort(key=lambda x: x["timestamp"])

    # Siapkan struktur data
    hour_labels = []
    hour_starts = []
    for i in range(8):
        hour_start = (from_date + timedelta(hours=i)).astimezone(JAKARTA_TZ)
        hour_starts.append(hour_start)
        hour_labels.append(hour_start.strftime("%H:%M"))

    chart_data = [
        {"hour": label, "light1": 0, "light2": 0, "light3": 0}
        for label in hour_labels
    ]

    for light_id in [1, 2, 3]:
        # Ambil semua log lampu 8 jam terakhir
        lamp_logs = [log for log in logs if log.get("light_id") == light_id]
        # Ambil log terakhir sebelum from_date
        prev_logs_data = get_light_logs(page=1, limit=1, light_id=light_id, to_date=from_date)
        prev_logs = prev_logs_data["logs"]
        prev_status = "off"
        prev_time = from_date
        if prev_logs:
            prev_log = prev_logs[0]
            prev_status = prev_log["action"]
            prev_time = prev_log["timestamp"]
            if isinstance(prev_time, str):
                prev_time = datetime.fromisoformat(prev_time)
            if prev_time.tzinfo is None:
                prev_time = prev_time.replace(tzinfo=timezone.utc)
        else:
            prev_status = "off"
            prev_time = from_date

        # Gabungkan prev_log (jika status "on") dengan lamp_logs
        events = []
        if prev_status == "on":
            # Lampu sudah ON sebelum from_date, tambahkan event ON di from_date
            events.append({"action": "on", "timestamp": from_date})
        # Pastikan semua timestamp di lamp_logs bertipe datetime
        for log in lamp_logs:
            log_time = log["timestamp"]
            if isinstance(log_time, str):
                log_time = datetime.fromisoformat(log_time)
            if log_time.tzinfo is None:
                log_time = log_time.replace(tzinfo=timezone.utc)
            events.append({**log, "timestamp": log_time})
        # Pastikan semua timestamp di events bertipe datetime
        for event in events:
            if isinstance(event["timestamp"], str):
                event["timestamp"] = datetime.fromisoformat(event["timestamp"])
            if event["timestamp"].tzinfo is None:
                event["timestamp"] = event["timestamp"].replace(tzinfo=timezone.utc)
        events.sort(key=lambda x: x["timestamp"])

        last_status = 0
        last_time = from_date

        for log in events:
            log_time = log["timestamp"]
            if isinstance(log_time, str):
                log_time = datetime.fromisoformat(log_time)
            if log_time.tzinfo is None:
                log_time = log_time.replace(tzinfo=timezone.utc)
            if last_time.tzinfo is None:
                last_time = last_time.replace(tzinfo=timezone.utc)
            if log["action"] == "on":
                last_status = 1
                last_time = log_time
            elif log["action"] == "off" and last_status == 1:
                start = last_time
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                while start < log_time:
                    hour_idx = int((start - from_date).total_seconds() // 3600)
                    if 0 <= hour_idx < 8:
                        hour_start = from_date + timedelta(hours=hour_idx)
                        hour_end = hour_start + timedelta(hours=1)
                        segment_end = min(log_time, hour_end)
                        minutes = int((segment_end - start).total_seconds() // 60)
                        chart_data[hour_idx][f"light{light_id}"] += minutes
                        start = segment_end
                    else:
                        break
                last_status = 0

        # Jika lampu masih ON sampai sekarang
        if last_status == 1:
            start = last_time
            end = now
            while start < end:
                hour_idx = int((start - from_date).total_seconds() // 3600)
                if 0 <= hour_idx < 8:
                    hour_start = from_date + timedelta(hours=hour_idx)
                    hour_end = hour_start + timedelta(hours=1)
                    segment_end = min(end, hour_end)
                    minutes = int((segment_end - start).total_seconds() // 60)
                    chart_data[hour_idx][f"light{light_id}"] += minutes
                    start = segment_end
                else:
                    break

    return {"data": chart_data}

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

@app.post("/api/register")
def register_user_api(req: RegisterRequest = Body(...)):
    from db import register_user
    user = register_user(req.email, req.password, req.name)
    if user is None:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    return {"message": "Registrasi berhasil", "user": {"email": user["email"], "name": user.get("name", "")}}

def authenticate_user(email: str, password: str):
    """
    Autentikasi user berdasarkan email dan password.
    Return user dict jika sukses, None jika gagal.
    """
    user = get_user_by_email(email)
    if not user:
        return None
    hashed_password = user.get("hashed_password")
    if not hashed_password or not pwd_context.verify(password, hashed_password):
        return None
    return user

def create_access_token(data: dict):
    """
    Membuat JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def publish(topic: str, message: dict):
    return mqtt_manager.publish(topic, message)
