from typing import Optional


class CalibrationClient:
    """Mock client for external calibration system."""

    async def fetch_camera_data(self, sn: str) -> Optional[dict]:
        # In production, this calls the real calibration system API.
        # For now, returns mock data if SN format is valid.
        if not sn or len(sn) < 3:
            return None
        return {
            "sn": sn,
            "model": f"CAM-{sn[:3].upper()}",
            "intrinsics": {
                "fx": 800.0,
                "fy": 800.0,
                "cx": 320.0,
                "cy": 240.0,
                "distortion": [0.1, -0.05, 0, 0, 0],
            },
            "extrinsics": {
                "rotation": [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0],
                "translation": [0.0, 0.0, 0.0],
            },
        }


calibration_client = CalibrationClient()
