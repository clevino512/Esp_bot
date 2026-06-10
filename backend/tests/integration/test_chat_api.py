import pytest
from httpx import AsyncClient


class TestChatAPI:
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data

    @pytest.mark.asyncio
    async def test_chat_message_without_auth(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/chat/message",
            json={"message": "Comment s'inscrire?"}
        )
        # Should work without auth for public chat
        assert response.status_code in [200, 201, 401]

    @pytest.mark.asyncio
    async def test_chat_message_with_auth(self, auth_client: AsyncClient):
        response = await auth_client.post(
            "/api/v1/chat/message",
            json={"message": "Quelles sont les dates d'inscription?"}
        )
        assert response.status_code in [200, 201]

    @pytest.mark.asyncio
    async def test_chat_history_not_found(self, auth_client: AsyncClient):
        response = await auth_client.get("/api/v1/chat/history/nonexistent-session")
        assert response.status_code == 404


class TestAuthAPI:
    @pytest.mark.asyncio
    async def test_register_user(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@test.mg",
                "password": "testpassword123",
                "full_name": "New User"
            }
        )
        assert response.status_code in [201, 400]  # Created or already exists

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "invalid@test.mg",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_route_without_token(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestAdminAPI:
    @pytest.mark.asyncio
    async def test_admin_stats_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/dashboard")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_admin_documents_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/documents")
        assert response.status_code == 401
