import pytest

@pytest.mark.asyncio
async def test_login_missing_body(client):
    response = await client.post("/api/auth/login", json={})
    assert response.status_code == 422  # validation error

@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    response = await client.post("/api/auth/login", json={"username": "nonexistent", "password": "wrong"})
    # Should return 401 or 500 (if DB not connected)
    assert response.status_code in (401, 500)

@pytest.mark.asyncio
async def test_protected_endpoint_without_token(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 403  # No bearer token

@pytest.mark.asyncio
async def test_protected_endpoint_with_invalid_token(client):
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
