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
        json={"username": "jwt_tester", "password": "password123", "display_name": "JWT Tester"},
    )
    token = reg_res.json()["token"]

    # Request /api/v1/me with Bearer token
    me_res = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["display_name"] == "JWT Tester"
