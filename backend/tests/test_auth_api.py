"""Tests for authentication API (username + password + JWT)."""
import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.api import auth
from app.config import get_settings


def account(username: str, password: str) -> dict[str, str]:
    """A registration body; the address is the mandatory Gmail one."""
    return {"username": username, "email": f"{username}@gmail.com", "password": password}


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "madiyar_99",
            "email": "madiyar_99@gmail.com",
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
        json=account("unique_user", "password123"),
    )
    res = await client.post(
        "/api/v1/auth/register",
        json=account("unique_user", "password123"),
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json=account("login_user", "password123"),
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
        json=account("wrong_pass_user", "correct_password"),
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
            "email": "jwt_tester@gmail.com",
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
async def test_admin_destructive_endpoints_require_admin_key(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "admin_key", "test-admin-key-0123456789")

    reset_res = await client.post("/api/v1/admin/reset-map")
    assert reset_res.status_code == 403

    cleanup_res = await client.post("/api/v1/admin/cleanup")
    assert cleanup_res.status_code == 403

    valid_cleanup = await client.post(
        "/api/v1/admin/cleanup",
        headers={"X-Admin-Key": "test-admin-key-0123456789"},
    )
    assert valid_cleanup.status_code == 200
    assert "abandoned_runs_closed" in valid_cleanup.json()


@pytest.mark.asyncio
async def test_admin_is_closed_when_no_key_is_configured(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """There is no built-in key: an unset ADMIN_KEY lets nobody in."""
    monkeypatch.setattr(get_settings(), "admin_key", "")

    for key in ("", "dontstop-admin-2026"):
        res = await client.post("/api/v1/admin/cleanup", headers={"X-Admin-Key": key})
        assert res.status_code == 403


# ── Google sign-in ───────────────────────────────────────────────────────────

CLIENT_ID = "1234-test.apps.googleusercontent.com"


def google_claims(**overrides: str) -> dict[str, str]:
    claims = {
        "aud": CLIENT_ID,
        "iss": "https://accounts.google.com",
        "sub": "108000000000000000001",
        "email": "Runner@Gmail.com",
        "email_verified": "true",
        "name": "Runner",
    }
    claims.update(overrides)
    return claims


@pytest.fixture
def google(monkeypatch: pytest.MonkeyPatch):
    """Stand in for Google: the 'token' is the name of a set of claims."""
    monkeypatch.setattr(get_settings(), "google_client_ids", CLIENT_ID)
    tokens: dict[str, dict[str, str]] = {}

    async def fake_verify(id_token: str) -> dict[str, str]:
        return auth._google_identity(tokens[id_token], [CLIENT_ID])

    monkeypatch.setattr(auth, "_verify_google_id_token", fake_verify)
    return tokens


def token_name(label: str) -> str:
    return f"fake-google-id-token-{label}"


class TestGoogleClaims:
    def test_a_good_token_yields_the_identity_google_vouches_for(self) -> None:
        identity = auth._google_identity(google_claims(), [CLIENT_ID])

        assert identity == {
            "email": "runner@gmail.com",
            "sub": "108000000000000000001",
            "name": "Runner",
        }

    @pytest.mark.parametrize(
        "bad",
        [
            {"aud": "someone-elses-app.apps.googleusercontent.com"},
            {"iss": "https://evil.example"},
            {"email_verified": "false"},
            {"sub": ""},
            {"email": ""},
        ],
    )
    def test_a_token_for_another_app_or_an_unverified_email_is_refused(self, bad) -> None:
        with pytest.raises(HTTPException) as caught:
            auth._google_identity(google_claims(**bad), [CLIENT_ID])

        assert caught.value.status_code == 401


class TestGoogleSignIn:
    async def test_an_email_alone_proves_nothing(self, client: AsyncClient, google) -> None:
        """The takeover this guards against: naming a victim's address."""
        res = await client.post(
            "/api/v1/auth/google",
            json={"email": "victim@gmail.com", "google_sub": "1", "display_name": "x"},
        )

        assert res.status_code == 422

    async def test_it_is_off_until_a_client_id_is_configured(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(get_settings(), "google_client_ids", "")

        res = await client.post("/api/v1/auth/google", json={"id_token": token_name("any")})

        assert res.status_code == 503

    async def test_first_sign_in_creates_the_player_and_the_second_finds_them(
        self, client: AsyncClient, google
    ) -> None:
        google[token_name("a")] = google_claims()

        first = await client.post(
            "/api/v1/auth/google",
            json={"id_token": token_name("a"), "display_name": "Shamol_07", "city": "nukus"},
        )
        second = await client.post("/api/v1/auth/google", json={"id_token": token_name("a")})

        assert first.status_code == 200
        assert first.json()["email"] == "runner@gmail.com"
        assert first.json()["display_name"] == "Shamol_07"
        assert second.json()["user_id"] == first.json()["user_id"]
        # Profile setup is offered once, to the sign-in that made the account.
        assert first.json()["is_new"] is True
        assert second.json()["is_new"] is False

    async def test_a_token_for_another_app_is_refused(self, client: AsyncClient, google) -> None:
        google[token_name("b")] = google_claims(aud="other.apps.googleusercontent.com")

        res = await client.post("/api/v1/auth/google", json={"id_token": token_name("b")})

        assert res.status_code == 401

    async def test_the_request_body_cannot_pick_the_account(
        self, client: AsyncClient, google
    ) -> None:
        """Extra fields are ignored: the identity is the token's, always."""
        google[token_name("c")] = google_claims(sub="2", email="attacker@gmail.com")

        res = await client.post(
            "/api/v1/auth/google",
            json={"id_token": token_name("c"), "email": "victim@gmail.com", "google_sub": "1"},
        )

        assert res.json()["email"] == "attacker@gmail.com"

    async def test_google_takes_over_an_account_registered_with_that_address(
        self, client: AsyncClient, google
    ) -> None:
        """Registration never proved ownership of the address, so a password
        set there must not survive the real owner arriving through Google."""
        registered = await client.post(
            "/api/v1/auth/register",
            json={"username": "squatter", "email": "owner@gmail.com", "password": "password123"},
        )
        google[token_name("d")] = google_claims(sub="3", email="owner@gmail.com")

        signed_in = await client.post("/api/v1/auth/google", json={"id_token": token_name("d")})
        old_password = await client.post(
            "/api/v1/auth/login",
            json={"username": "squatter", "password": "password123"},
        )

        assert signed_in.json()["user_id"] == registered.json()["user_id"]
        assert old_password.status_code == 401
