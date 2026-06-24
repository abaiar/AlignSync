import pytest

@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_api_docs_accessible(client):
    response = await client.get("/docs")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_openapi_schema(client):
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert data["info"]["title"] == "AlignSync API"
    # Verify all expected paths exist
    expected_paths = [
        "/api/auth/login", "/api/cameras/sync", "/api/cameras/batch-sync",
        "/api/software-locks/sync", "/api/purchase-orders", "/api/devices",
        "/api/payments", "/api/shipments", "/api/receive/confirm",
        "/api/traceability", "/api/statistics/summary", "/api/after-sales",
    ]
    for path in expected_paths:
        assert path in data["paths"], f"Missing path: {path}"
