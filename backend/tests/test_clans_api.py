"""Clans, and the promise that solo and clan ground never mix (TZ section 23)."""
import uuid

from helpers import run_track, square_points


def device(prefix: str) -> dict[str, str]:
    return {"X-Demo-User": f"{prefix}{uuid.uuid4().hex}"[:32]}


def clan_body(tag: str, name: str = "Nókis juwırıwshıları") -> dict:
    return {"name": name, "tag": tag, "color_hex": "#c7ff4a"}


async def make_clan(client, headers: dict[str, str], tag: str) -> dict:
    response = await client.post("/api/v1/clans", headers=headers, json=clan_body(tag))
    assert response.status_code == 201, response.text

    return response.json()


class TestClanLife:
    async def test_the_founder_owns_the_clan(self, client) -> None:
        headers = device("cl1")

        clan = await make_clan(client, headers, "NKS1")

        assert clan["member_count"] == 1
        assert clan["members"][0]["role"] == "owner"
        assert len(clan["invite_code"]) == 6
        assert clan["tag"] == "NKS1"

    async def test_the_clan_shows_up_on_the_profile(self, client) -> None:
        headers = device("cl2")
        clan = await make_clan(client, headers, "NKS2")

        me = (await client.get("/api/v1/me", headers=headers)).json()

        assert me["clan"]["id"] == clan["id"]
        assert me["clan"]["role"] == "owner"

    async def test_a_second_player_joins_with_the_code(self, client) -> None:
        owner = device("cl3")
        clan = await make_clan(client, owner, "NKS3")
        joiner = device("cl4")

        joined = await client.post(
            "/api/v1/clans/join", headers=joiner, json={"invite_code": clan["invite_code"]}
        )

        assert joined.status_code == 200, joined.text
        assert joined.json()["member_count"] == 2
        assert {member["role"] for member in joined.json()["members"]} == {"owner", "member"}

    async def test_the_tz_path_joins_the_same_clan(self, client) -> None:
        owner = device("cl5")
        clan = await make_clan(client, owner, "NKS5")

        joined = await client.post(
            f"/api/v1/clans/{clan['id']}/join",
            headers=device("cl6"),
            json={"invite_code": clan["invite_code"]},
        )

        assert joined.status_code == 200, joined.text
        assert joined.json()["id"] == clan["id"]

    async def test_a_wrong_code_lets_nobody_in(self, client) -> None:
        response = await client.post(
            "/api/v1/clans/join", headers=device("cl7"), json={"invite_code": "ZZZZZZ"}
        )

        assert response.status_code == 404

    async def test_a_player_belongs_to_one_clan_at_a_time(self, client) -> None:
        headers = device("cl8")
        await make_clan(client, headers, "NKS8")

        second = await client.post("/api/v1/clans", headers=headers, json=clan_body("NKS9"))

        assert second.status_code == 409

    async def test_a_tag_cannot_be_taken_twice(self, client) -> None:
        await make_clan(client, device("cl9"), "SAME")

        again = await client.post("/api/v1/clans", headers=device("cl10"), json=clan_body("same"))

        assert again.status_code == 409

    async def test_a_malformed_tag_is_refused(self, client) -> None:
        response = await client.post(
            "/api/v1/clans", headers=device("cl11"), json=clan_body("no spaces")
        )

        assert response.status_code == 422

    async def test_a_clan_stops_at_ten_members(self, client) -> None:
        """TZ section 23.2. The eleventh player is turned away, not silently dropped."""
        owner = device("cl12")
        clan = await make_clan(client, owner, "FULL")

        for seat in range(9):
            joined = await client.post(
                "/api/v1/clans/join",
                headers=device(f"seat{seat}"),
                json={"invite_code": clan["invite_code"]},
            )
            assert joined.status_code == 200, joined.text

        eleventh = await client.post(
            "/api/v1/clans/join",
            headers=device("cl13"),
            json={"invite_code": clan["invite_code"]},
        )

        assert eleventh.status_code == 409

    async def test_an_outsider_cannot_read_the_invite_code(self, client) -> None:
        clan = await make_clan(client, device("cl14"), "SECR")

        seen = await client.get(f"/api/v1/clans/{clan['id']}", headers=device("cl15"))

        assert seen.status_code == 200
        assert seen.json()["invite_code"] is None
        assert seen.json()["member_count"] == 1

    async def test_leaving_hands_the_clan_to_the_next_member(self, client) -> None:
        owner = device("cl16")
        clan = await make_clan(client, owner, "HAND")
        joiner = device("cl17")
        await client.post(
            "/api/v1/clans/join", headers=joiner, json={"invite_code": clan["invite_code"]}
        )

        left = await client.post(f"/api/v1/clans/{clan['id']}/leave", headers=owner)

        assert left.status_code == 204
        assert (await client.get("/api/v1/me", headers=owner)).json()["clan"] is None
        assert (await client.get("/api/v1/me", headers=joiner)).json()["clan"]["role"] == "owner"

    async def test_an_owner_can_remove_a_member(self, client) -> None:
        owner = device("cl18")
        clan = await make_clan(client, owner, "KICK")
        joiner = device("cl19")
        joined = await client.post(
            "/api/v1/clans/join", headers=joiner, json={"invite_code": clan["invite_code"]}
        )
        member_id = next(
            member["user_id"]
            for member in joined.json()["members"]
            if member["role"] == "member"
        )

        removed = await client.delete(
            f"/api/v1/clans/{clan['id']}/members/{member_id}", headers=owner
        )

        assert removed.status_code == 204
        assert (await client.get("/api/v1/me", headers=joiner)).json()["clan"] is None

    async def test_a_member_cannot_remove_anyone(self, client) -> None:
        owner = device("cl20")
        clan = await make_clan(client, owner, "NOKI")
        joiner = device("cl21")
        joined = await client.post(
            "/api/v1/clans/join", headers=joiner, json={"invite_code": clan["invite_code"]}
        )
        owner_id = next(
            member["user_id"] for member in joined.json()["members"] if member["role"] == "owner"
        )

        refused = await client.delete(
            f"/api/v1/clans/{clan['id']}/members/{owner_id}", headers=joiner
        )

        assert refused.status_code == 403

    async def test_the_leaderboard_lists_clans(self, client) -> None:
        clan = await make_clan(client, device("cl22"), "LEAD")

        board = await client.get("/api/v1/clans/leaderboard")

        assert board.status_code == 200
        assert any(entry["id"] == clan["id"] for entry in board.json())


class TestClanRuns:
    async def test_a_run_for_a_clan_needs_a_clan(self, client) -> None:
        response = await client.post("/api/v1/runs/start?mode=clan", headers=device("cr1"))

        assert response.status_code == 403

    async def test_clan_ground_belongs_to_the_clan(self, client) -> None:
        headers = device("cr2")
        clan = await make_clan(client, headers, "GRND")

        started = await client.post("/api/v1/runs/start?mode=clan", headers=headers)
        assert started.status_code == 201, started.text
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=headers,
            json={"points": square_points(side_m=120.0)},
        )
        finished = await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)

        assert finished.status_code == 200, finished.text
        assert finished.json()["status"] == "accepted"
        assert finished.json()["mode"] == "clan"

        me = (await client.get("/api/v1/me", headers=headers)).json()
        assert me["stats"]["clan_area_m2"] > 0
        assert me["stats"]["solo_area_m2"] == 0

        board = (await client.get("/api/v1/clans/leaderboard")).json()
        standing = next(entry for entry in board if entry["id"] == clan["id"])
        assert standing["area_m2"] > 0

    async def test_a_clan_run_is_invisible_on_the_solo_map(self, client) -> None:
        """The two layers are separate maps over the same ground (rule 8)."""
        params = {"bbox": "59.58,42.43,59.64,42.48"}
        solo_before = len(
            (await client.get("/api/v1/territories", params={**params, "mode": "solo"})).json()[
                "features"
            ]
        )

        headers = device("cr3")
        await make_clan(client, headers, "HIDE")
        started = await client.post("/api/v1/runs/start?mode=clan", headers=headers)
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=headers,
            json={"points": square_points(side_m=120.0)},
        )
        await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)

        solo = (
            await client.get("/api/v1/territories", params={**params, "mode": "solo"})
        ).json()["features"]
        clan_side = (
            await client.get("/api/v1/territories", params={**params, "mode": "clan"})
        ).json()["features"]

        assert len(solo) == solo_before
        assert any(feature["properties"]["mode"] == "clan" for feature in clan_side)

    async def test_a_solo_run_does_not_take_clan_ground(self, client) -> None:
        """And the other way round: the same square, captured twice, once per layer."""
        clan_runner = device("cr4")
        await make_clan(client, clan_runner, "KEEP")
        started = await client.post("/api/v1/runs/start?mode=clan", headers=clan_runner)
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=clan_runner,
            json={"points": square_points(side_m=120.0)},
        )
        clan_result = await client.post(f"/api/v1/runs/{run_id}/finish", headers=clan_runner)
        clan_area = clan_result.json()["awarded_area_m2"]

        _, solo_result = await run_track(client, device("cr5"), square_points(side_m=120.0))

        assert solo_result.json()["status"] == "accepted"
        # Nothing was taken from the clan: the solo run only ever met solo ground.
        assert solo_result.json()["captured_from"] == []

        params = {"bbox": "59.58,42.43,59.64,42.48", "mode": "clan"}
        clan_side = (await client.get("/api/v1/territories", params=params)).json()["features"]
        assert sum(feature["properties"]["area_m2"] for feature in clan_side) >= clan_area

    async def test_a_second_clan_takes_the_ground_from_the_first(self, client) -> None:
        first = device("cr6")
        await make_clan(client, first, "ONE1")
        started = await client.post("/api/v1/runs/start?mode=clan", headers=first)
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=first,
            json={"points": square_points(side_m=120.0)},
        )
        await client.post(f"/api/v1/runs/{run_id}/finish", headers=first)

        second = device("cr7")
        await make_clan(client, second, "TWO2")
        started = await client.post("/api/v1/runs/start?mode=clan", headers=second)
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=second,
            json={"points": square_points(side_m=120.0)},
        )
        finished = await client.post(f"/api/v1/runs/{run_id}/finish", headers=second)

        taken = finished.json()["captured_from"]
        assert [entry["username"] for entry in taken] == ["Nókis juwırıwshıları"]
        assert taken[0]["area_lost_m2"] > 0

    async def test_the_clan_layer_carries_the_clan_colours(self, client) -> None:
        """The map paints clan ground in the clan's own colour."""
        headers = device("cr8")
        clan = await make_clan(client, headers, "PNT1")
        started = await client.post("/api/v1/runs/start?mode=clan", headers=headers)
        run_id = started.json()["run_id"]
        await client.post(
            f"/api/v1/runs/{run_id}/points",
            headers=headers,
            json={"points": square_points(side_m=120.0)},
        )
        await client.post(f"/api/v1/runs/{run_id}/finish", headers=headers)

        features = (
            await client.get(
                "/api/v1/territories",
                params={"bbox": "59.58,42.43,59.64,42.48", "mode": "clan"},
            )
        ).json()["features"]

        ours = [
            feature
            for feature in features
            if feature["properties"]["owner_id"] == clan["id"]
        ]
        assert ours
        assert ours[0]["properties"]["owner_tag"] == "PNT1"
        assert ours[0]["properties"]["color"] == "#c7ff4a"
        assert ours[0]["properties"]["owner_name"] == clan["name"]
