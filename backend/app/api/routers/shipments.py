from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.db.base import get_db
from app.models.user import User
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentListResponse,
    ShipmentResponse,
)
from app.services import shipment_service

router = APIRouter(prefix="/api/shipments", tags=["shipments"])


@router.post("", response_model=ShipmentResponse)
async def create_shipment(
    req: ShipmentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("shipment:create")),
):
    return await shipment_service.create_shipment(db, req, user)


@router.get("", response_model=ShipmentListResponse)
async def list_shipments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await shipment_service.list_shipments(db, skip, limit, user)


@router.get("/{shipment_id}", response_model=ShipmentResponse)
async def get_shipment(
    shipment_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await shipment_service.get_shipment(db, shipment_id, user)
