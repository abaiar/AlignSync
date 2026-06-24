from typing import Any, List, Optional

from pydantic import BaseModel


class StatisticsFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    product_model: Optional[str] = None
    enterprise_id: Optional[int] = None


class StatisticsSummary(BaseModel):
    purchase_count: int
    purchase_amount: float
    production_count: int  # devices assembled
    shipment_count: int
    return_count: int
    camera_count: int
    software_lock_count: int
    by_month: List[dict]  # [{month, purchase, production, shipment, return}]
    by_enterprise: List[dict]  # [{enterprise_id, name, purchase, production, shipment}]
    by_product: List[dict]  # [{product_model, quantity, amount}]
