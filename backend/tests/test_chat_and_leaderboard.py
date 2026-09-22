import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_and_leaderboard_flow(client: AsyncClient) -> None:
    # 1. Register two players
    res1 = await client.post(
        "/api/v1/auth/register",
        json={"username": "runner_one", "password": "password123", "display_name": "Runner One", "city": "nukus"},
    )
    assert res1.status_code == 201
    token1 = res1.json()["token"]

    res2 = await client.post(
        "/api/v1/auth/register",
        json={"username": "runner_two", "password": "password123", "display_name": "Runner Two", "city": "nukus"},
    )
    assert res2.status_code == 201
    token2 = res2.json()["token"]

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 2. Test Leaderboard endpoint
    lb_res = await client.get("/api/v1/players/leaderboard?city=nukus")
    assert lb_res.status_code == 200
    players = lb_res.json()
    assert isinstance(players, list)
    assert any(p["display_name"] == "Runner One" for p in players)

    # 3. Test My Runs endpoint
    runs_res = await client.get("/api/v1/me/runs", headers=headers1)
    assert runs_res.status_code == 200
    assert isinstance(runs_res.json(), list)

    # 4. Test Global Chat (sending text message)
    chat_send = await client.post(
        "/api/v1/chat/messages",
        headers=headers1,
        json={
            "channel_type": "global",
            "channel_id": "nukus",
            "content": "Salom barchaga!",
            "msg_type": "text",
        },
    )
    assert chat_send.status_code == 201
    msg_data = chat_send.json()
    assert msg_data["content"] == "Salom barchaga!"
    assert msg_data["sender"]["display_name"] == "Runner One"

    # 5. Test Global Chat (sending location message)
    loc_send = await client.post(
        "/api/v1/chat/messages",
        headers=headers1,
        json={
            "channel_type": "global",
            "channel_id": "nukus",
            "content": "📍 Jaylasıw: 42.4531, 59.6103",
            "msg_type": "location",
            "payload": {"lat": 42.4531, "lon": 59.6103},
        },
    )
    assert loc_send.status_code == 201
    assert loc_send.json()["msg_type"] == "location"

    # 6. Read Global Chat messages
    chat_list = await client.get(
        "/api/v1/chat/messages?channel_type=global&channel_id=nukus",
        headers=headers2,
    )
    assert chat_list.status_code == 200
    msgs = chat_list.json()
    assert len(msgs) >= 2
    assert any(m["content"] == "Salom barchaga!" for m in msgs)

