"""The player's own profile and their 8-digit id."""
import uuid


def device(prefix: str) -> dict[str, str]:
    return {"X-Demo-User": f"{prefix}{uuid.uuid4().hex}"[:32]}


class TestPlayerId:
    async def test_a_new_browser_is_given_an_eight_digit_id(self, client) -> None:
        response = await client.get("/api/v1/me", headers=device("id1"))

        assert response.status_code == 200, response.text
        player_id = response.json()["player_id"]
        assert len(player_id) == 8
        assert player_id.isdigit()
        assert not player_id.startswith("0")

    async def test_the_id_stays_with_the_browser(self, client) -> None:
        headers = device("id2")

        first = (await client.get("/api/v1/me", headers=headers)).json()
        second = (await client.get("/api/v1/me", headers=headers)).json()

        assert first["player_id"] == second["player_id"]

    async def test_two_players_never_share_an_id(self, client) -> None:
        first = (await client.get("/api/v1/me", headers=device("id3"))).json()
        second = (await client.get("/api/v1/me", headers=device("id4"))).json()

        assert first["player_id"] != second["player_id"]

    async def test_the_device_key_is_never_returned(self, client) -> None:
        headers = device("id5")

        body = (await client.get("/api/v1/me", headers=headers)).json()

        assert headers["X-Demo-User"] not in str(body)

    async def test_a_profile_needs_a_device_header(self, client) -> None:
        assert (await client.get("/api/v1/me")).status_code == 401


class TestProfile:
    async def test_a_new_player_is_named_after_their_id(self, client) -> None:
        body = (await client.get("/api/v1/me", headers=device("pr1"))).json()

        assert body["display_name"].endswith(body["player_id"])

    async def test_a_player_can_rename_themselves(self, client) -> None:
        headers = device("pr2")

        renamed = await client.patch(
            "/api/v1/me", headers=headers, json={"display_name": "Aydos"}
        )

        assert renamed.status_code == 200, renamed.text
        assert renamed.json()["display_name"] == "Aydos"
        assert (await client.get("/api/v1/me", headers=headers)).json()["display_name"] == "Aydos"

    async def test_a_rename_keeps_the_player_id(self, client) -> None:
        headers = device("pr3")
        before = (await client.get("/api/v1/me", headers=headers)).json()["player_id"]

        after = (
            await client.patch("/api/v1/me", headers=headers, json={"display_name": "Gulnaz"})
        ).json()["player_id"]

        assert after == before

    async def test_an_empty_name_is_refused(self, client) -> None:
        response = await client.patch(
            "/api/v1/me", headers=device("pr4"), json={"display_name": " "}
        )

        assert response.status_code == 422

    async def test_a_very_long_name_is_refused(self, client) -> None:
        response = await client.patch(
            "/api/v1/me", headers=device("pr5"), json={"display_name": "x" * 25}
        )

        assert response.status_code == 422

    async def test_a_fresh_profile_starts_at_zero(self, client) -> None:
        body = (await client.get("/api/v1/me", headers=device("pr6"))).json()

        assert body["stats"] == {"runs_accepted": 0, "solo_area_m2": 0.0, "clan_area_m2": 0.0}
        assert body["clan"] is None
