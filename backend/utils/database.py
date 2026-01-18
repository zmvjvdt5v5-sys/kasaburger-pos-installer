"""Database connection and utilities"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "kasaburger_db")

# MONGO_URL'deki tırnak işaretlerini temizle
if MONGO_URL:
    MONGO_URL = MONGO_URL.strip('"').strip("'")

client = None
db = None

async def connect_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        # Bağlantı testi
        await client.admin.command('ping')
        return db
    except Exception as e:
        print(f"MongoDB bağlantı hatası: {e}")
        return None

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
