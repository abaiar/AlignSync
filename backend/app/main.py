import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routers import (
    auth, users, cameras, software_locks, orders, devices,
    payments, shipments, receive, traceability, statistics, after_sales,
)
from app.core.config import settings

app = FastAPI(title="AlignSync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(cameras.router)
app.include_router(software_locks.router)
app.include_router(orders.router)
app.include_router(devices.router)
app.include_router(payments.router)
app.include_router(shipments.router)
app.include_router(receive.router)
app.include_router(traceability.router)
app.include_router(statistics.router)
app.include_router(after_sales.router)
