import os
import logging
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
from passlib.context import CryptContext

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# --- Koneksi MongoDB ---
mongo_uri = os.environ.get("MONGODB_URI")
client = MongoClient(mongo_uri)
db = client.get_default_database()  # Mengambil 'homytech' dari URI

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def current_utc_time():
    # Always store as UTC in DB
    return datetime.now(timezone.utc)

# --- Fungsi untuk Mendapatkan Koleksi --- 
def get_collection(collection_name: str):
    try:
        # Koneksi ke koleksi MongoDB, pastikan koleksi ada
        return db[collection_name]
    except Exception as e:
        logger.error(f"Failed to get collection {collection_name}: {e}")
        raise

# --- Fungsi untuk Menyisipkan Log RFID --- 
def insert_door_log(user: str, action: str, source: str, timestamp=None):
    timestamp = timestamp or current_utc_time()
    try:
        collection = get_collection("log_door")
        collection.insert_one({
            "user": user,
            "action": action,
            "source": source,
            "timestamp": timestamp,
        })
        logger.info(f"Inserted door log: User={user}, action={action}, Source={source}")
    except Exception as e:
        logger.error(f"Error inserting door log: {e}")

# --- Fungsi untuk Menyisipkan Log light --- 
def insert_light_log(light_id: int, action: str, user: str, timestamp=None):
    timestamp = timestamp or current_utc_time()  # Gunakan waktu UTC
    try:
        collection = get_collection("log_light")
        collection.insert_one({
            "user": user, 
            "light_id": light_id,
            "action": action,
            "timestamp": timestamp
        })
        logger.info(f"Inserted light log: LightID={light_id}, action={action}")
    except Exception as e:
        logger.error(f"Error inserting light log: {e}")

# --- Fungsi untuk Menyisipkan Log Jemuran --- 
def insert_clothesline_log(action: str, source: str, user: str, timestamp=None):
    timestamp = timestamp or current_utc_time()  # Gunakan waktu UTC
    try:
        collection = get_collection("log_clothesline")
        collection.insert_one({
            "user": user,
            "action": action,
            "source": source,
            "timestamp": timestamp
        })
        logger.info(f"Inserted clothesline log: Action={action}")
    except Exception as e:
        logger.error(f"Error inserting clothesline log: {e}")

# --- Fungsi untuk Mendapatkan Status Terbaru dari Light, Pintu, dan Jemuran ---
def get_latest_light_state():
    try:
        collection = get_collection("log_light")
        latest_logs = collection.aggregate([
            {"$sort": {"timestamp": -1}},
            {"$group": {
                "_id": "$light_id",
                "user": {"$first": "$user"},
                "action": {"$first": "$action"},
                "timestamp": {"$first": "$timestamp"},
            }},
            {"$project": {
                "light_id": "$_id",
                "user": 1,
                "action": 1,
                "timestamp": 1,
                "_id": 0,
            }}
        ])
        return {"lights": list(latest_logs)}
    except Exception as e:
        logger.error(f"Error fetching latest lights state: {e}")
        return {"lights": []}

def get_latest_door_state():
    try:
        collection = get_collection("log_door")
        latest = collection.find_one(
            {"user": {"$ne": "Unknown"}},  # Filter: user tidak sama dengan "Unknown"
            sort=[("timestamp", -1)]
        )
        return latest if latest else {}
    except Exception as e:
        logger.error(f"Error fetching latest door state: {e}")
        return {}

def get_latest_clothesline_state():
    try:
        collection = get_collection("log_clothesline")
        latest = collection.find_one(sort=[("timestamp", -1)])
        return latest if latest else {}
    except Exception as e:
        logger.error(f"Error fetching latest clothesline state: {e}")
        return {}

def get_door_logs(page=1, limit=10, user=None, action=None, source=None, from_date=None, to_date=None):
    collection = get_collection("log_door")
    query = {}
    if user:
        query["user"] = user
    if action:
        query["action"] = action
    if source:
        query["source"] = source
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date

    total = collection.count_documents(query)
    skips = limit * (page - 1)
    logs = list(
        collection.find(query)
        .sort("timestamp", -1)
        .skip(skips)
        .limit(limit)
    )
    for log in logs:
        log["id"] = str(log.get("_id", ""))
        log["_id"] = str(log.get("_id", ""))
        if "timestamp" in log and hasattr(log["timestamp"], "isoformat"):
            log["timestamp"] = log["timestamp"].isoformat()
    return {"logs": logs, "total": total}

def get_light_logs(page=1, limit=10, user=None, action=None, light_id=None, from_date=None, to_date=None):
    collection = get_collection("log_light")
    query = {}
    if user:
        query["user"] = user
    if action:
        query["action"] = action
    if light_id:
        query["light_id"] = light_id
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date

    total = collection.count_documents(query)
    skips = limit * (page - 1)
    logs = list(
        collection.find(query)
        .sort("timestamp", -1)
        .skip(skips)
        .limit(limit)
    )
    for log in logs:
        log["id"] = str(log.get("_id", ""))
        log["_id"] = str(log.get("_id", ""))
        if "timestamp" in log and hasattr(log["timestamp"], "isoformat"):
            log["timestamp"] = log["timestamp"].isoformat()
    return {"logs": logs, "total": total}

def get_clothesline_logs(page=1, limit=10, user=None, action=None, source=None, from_date=None, to_date=None):
    collection = get_collection("log_clothesline")
    query = {}
    if user:
        query["user"] = user
    if action:
        query["action"] = action
    if source:
        query["source"] = source
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date

    total = collection.count_documents(query)
    skips = limit * (page - 1)
    logs = list(
        collection.find(query)
        .sort("timestamp", -1)
        .skip(skips)
        .limit(limit)
    )
    for log in logs:
        log["id"] = str(log.get("_id", ""))
        log["_id"] = str(log.get("_id", ""))
        if "timestamp" in log and hasattr(log["timestamp"], "isoformat"):
            log["timestamp"] = log["timestamp"].isoformat()
    return {"logs": logs, "total": total}

def get_user_by_email(email: str):
    """
    Mengambil user dari koleksi 'users' berdasarkan email.
    Return: dict user (termasuk hashed_password) atau None jika tidak ditemukan.
    """
    try:
        collection = get_collection("users")
        user = collection.find_one({"email": email})
        if user:
            user["id"] = str(user.get("_id", ""))
            user["_id"] = str(user.get("_id", ""))
        return user
    except Exception as e:
        logger.error(f"Error fetching user by email: {e}")
        return None

def register_user(email: str, password: str, name: str = None):
    """
    Mendaftarkan user baru ke koleksi 'users'.
    Password akan di-hash sebelum disimpan.
    Return: dict user baru atau None jika email sudah terdaftar.
    """
    try:
        collection = get_collection("users")
        # Cek apakah email sudah terdaftar
        if collection.find_one({"email": email}):
            return None
        hashed_password = pwd_context.hash(password)
        user_data = {
            "email": email,
            "hashed_password": hashed_password,
            "created_at": current_utc_time()
        }
        if name:
            user_data["name"] = name
        result = collection.insert_one(user_data)
        user_data["id"] = str(result.inserted_id)
        user_data["_id"] = str(result.inserted_id)
        return user_data
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return None