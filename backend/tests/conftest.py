import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def client():
    # raise_app_exceptions=False so DB-connection failures surface as 500
    # responses (sent by Starlette's ServerErrorMiddleware) instead of being
    # re-raised through httpx. Tests assert on status codes, not exceptions.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def auth_headers():
    # Return headers with a mock JWT token
    # Since we can't easily connect to DB in test env, just test API structure
    from app.core.security import create_access_token
    token = create_access_token("test_user")
    return {"Authorization": f"Bearer {token}"}
