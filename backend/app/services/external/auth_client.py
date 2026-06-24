from datetime import datetime, timedelta
from typing import Optional


class AuthSystemClient:
    """Mock client for external authorization system."""

    async def fetch_authorization(self, lock_id: str) -> Optional[dict]:
        if not lock_id or len(lock_id) < 4:
            return None
        return {
            "lock_id": lock_id,
            "software_version": "v2.3.1",
            "function_version": "professional",
            "function_list": ["3d_alignment", "wheel_measurement", "report_export"],
            "expire_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
        }


auth_system_client = AuthSystemClient()
