"""Tests for authentication API (username + password + JWT)."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "madiyar_99",
            "password": "secret_password",
            "display_name": "Madiyar",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert "token" in body
    assert body["display_name"] == "Madiyar"
    assert len(body["player_id"]) == 8


@pytest.mark.asyncio
async def test_register_duplicate_username_fails(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"username": "unique_user", "password": "password123"},
    )
    res = await client.post(
        "/api/v1/auth/register",
        json={"username": "unique_user", "password": "password123"},
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"username": "login_user", "password": "password123"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"username": "login_user", "password": "password123"},
    )
    assert res.status_code == 200
    body = res.json()
    assert "token" in body


@pytest.mark.asyncio
async def test_login_wrong_password_fails(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"username": "wrong_pass_user", "password": "correct_password"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"username": "wrong_pass_user", "password": "wrong_password"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_request_with_jwt(client: AsyncClient) -> None:
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "jwt_tester",
            "password": "password123",
            "display_name": "JWT Tester",
            "city": "tashkent",
            "avatar_data": "data:image/png;base64,testdata",
        },
    )
    assert reg_res.status_code == 201
    body = reg_res.json()
    assert body["city"] == "tashkent"
    assert body["avatar_data"] == "data:image/png;base64,testdata"
    token = body["token"]

    # Request /api/v1/me with Bearer token
    me_res = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["display_name"] == "JWT Tester"
    assert me["city"] == "tashkent"
    assert me["avatar_data"] == "data:image/png;base64,testdata"

    # Update city and avatar
    patch_res = await client.patch(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": "almaty", "avatar_data": "data:image/png;base64,updated"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["city"] == "almaty"
    assert updated["avatar_data"] == "data:image/png;base64,updated"

    # Also verify /api/v1/auth/me returns the current user
    auth_me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert auth_me_res.status_code == 200
    assert auth_me_res.json()["city"] == "almaty"


@pytest.mark.asyncio
async def test_admin_destructive_endpoints_require_admin_key(client: AsyncClient) -> None:
    reset_res = await client.post("/api/v1/admin/reset-map")
    assert reset_res.status_code == 403

    cleanup_res = await client.post("/api/v1/admin/cleanup")
    assert cleanup_res.status_code == 403

    valid_cleanup = await client.post(
        "/api/v1/admin/cleanup",
        headers={"X-Admin-Key": "dontstop-admin-2026"},
    )
    assert valid_cleanup.status_code == 200
    assert "abandoned_runs_closed" in valid_cleanup.json()



