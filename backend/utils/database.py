"""Database connection and utilities"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "kasaburger")

client = None
db = None

async def connect_db():
    global client, db
    if MONGO_URL:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        return db
    return None

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
