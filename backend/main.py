from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.api.endpoints import cameras, dongles, orders, devices, tenants
from app.core.config import settings
from app.db.session import init_db, get_db
from app.models import Camera, CameraStatus, Dongle, DongleStatus, Order, OrderStatus, Device


# Security: set baseline HTTP security response headers on every response.
# Based on OWASP HTTP Headers Cheat Sheet (FASTAPI-HEADERS-001 / VUE-HEADERS-001).
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # CSP: allow self for scripts; styles need 'unsafe-inline' for Vue/Tailwind/ECharts
        # dynamic styles; images allow blob:/data: for upload previews; block everything else.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'"
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    # No cookie-based auth in this app, so credentials stay off (FASTAPI-CORS-001).
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants.router, prefix=settings.API_PREFIX)
app.include_router(cameras.router, prefix=settings.API_PREFIX)
app.include_router(dongles.router, prefix=settings.API_PREFIX)
app.include_router(orders.router, prefix=settings.API_PREFIX)
app.include_router(devices.router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}


@app.get("/api/v1/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    camera_in_stock = await db.execute(
        select(func.count()).select_from(Camera).where(Camera.status == CameraStatus.IN_STOCK)
    )
    dongle_in_stock = await db.execute(
        select(func.count()).select_from(Dongle).where(
            Dongle.status.in_([DongleStatus.AUTHORIZED, DongleStatus.IN_STOCK])
        )
    )
    pending_orders = await db.execute(
        select(func.count()).select_from(Order).where(
            Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.AWAITING_PAYMENT])
        )
    )
    total_devices = await db.execute(select(func.count()).select_from(Device))

    return {
        "camera_in_stock": camera_in_stock.scalar(),
        "dongle_in_stock": dongle_in_stock.scalar(),
        "pending_orders": pending_orders.scalar(),
        "total_devices": total_devices.scalar(),
    }


static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "vouchers"), exist_ok=True)
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    app.mount("/vouchers", StaticFiles(directory=os.path.join(static_dir, "vouchers")), name="vouchers")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Security: prevent path traversal (FASTAPI-FILES-001). Resolve the real path
        # and ensure it stays within static_dir before serving.
        static_real = os.path.realpath(static_dir)
        file_path = os.path.realpath(os.path.join(static_dir, full_path))
        if full_path and os.path.commonpath([static_real, file_path]) == static_real and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
