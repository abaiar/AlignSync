import pytest

@pytest.mark.asyncio
async def test_camera_routes(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/cameras/sync" in paths
    assert "post" in paths["/api/cameras/sync"]
    assert "/api/cameras/batch-sync" in paths
    assert "/api/cameras" in paths
    assert "/api/cameras/{camera_id}" in paths

@pytest.mark.asyncio
async def test_order_routes(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/purchase-orders" in paths
    assert "/api/purchase-orders/{order_id}" in paths
    assert "/api/purchase-orders/{order_id}/confirm" in paths
    assert "/api/purchase-orders/{order_id}/reject" in paths
    assert "/api/purchase-orders/{order_id}/submit" in paths

@pytest.mark.asyncio
async def test_device_routes(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/devices" in paths
    assert "/api/devices/{device_id}" in paths

@pytest.mark.asyncio
async def test_traceability_routes(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/traceability" in paths
    assert "/api/traceability/export" in paths

@pytest.mark.asyncio
async def test_statistics_route(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/statistics/summary" in paths

@pytest.mark.asyncio
async def test_after_sales_routes(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    assert "/api/after-sales" in paths
    assert "/api/after-sales/{ticket_id}" in paths
    assert "/api/after-sales/{ticket_id}/handle" in paths
