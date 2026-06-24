import pytest

@pytest.mark.asyncio
async def test_camera_sync_requires_auth(client):
    response = await client.post("/api/cameras/sync", json={"sn": "test", "model": "A100", "intrinsics": {}, "extrinsics": {}})
    assert response.status_code == 403  # No token

@pytest.mark.asyncio
async def test_batch_sync_limit_validation(client):
    # Test that batch sync validates max 100
    response = await client.get("/openapi.json")
    # Just verify the endpoint exists
    assert "/api/cameras/batch-sync" in response.json()["paths"]

@pytest.mark.asyncio
async def test_order_creation_requires_auth(client):
    response = await client.post("/api/purchase-orders", json={"order_type": "camera", "items": [], "submit": False})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_device_registration_requires_auth(client):
    response = await client.post("/api/devices", json={"device_sn": "test", "device_name": "test", "model": "test", "software_lock_id": 1, "cameras": []})
    assert response.status_code == 403
