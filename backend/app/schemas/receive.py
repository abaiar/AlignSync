from typing import List, Optional

from pydantic import BaseModel


class ReceiveConfirmRequest(BaseModel):
    shipment_id: int
    received_items: Optional[List[dict]] = None  # [{order_item_id, received_quantity}], None=all received
    remark: Optional[str] = None


class ReceiveDiffRequest(BaseModel):
    shipment_id: int
    order_item_id: int
    diff_description: str
    diff_type: str  # "missing" | "damaged" | "wrong"
