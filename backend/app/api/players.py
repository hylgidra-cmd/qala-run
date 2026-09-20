"""The player's own profile.

Every browser that shows up is given an 8-digit player id, the way PUBG and
Free Fire hand one out: short enough to read to a friend, random, and never
reused. The id is public; the device key behind it never leaves the server.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.clans import clan_of
from app.api.deps import get_connection, get_demo_user
from app.api.schemas import DisplayNameIn, MeOut, PlayerStats

router = APIRouter(prefix="/api/v1", tags=["players"])


async def load_me(connection: AsyncConnection, user_id: str) -> MeOut:
    player = (
        await connection.execute(
            text(
                """
                SELECT u.id,
                       u.player_id,
                       u.display_name,
                       u.color_hex,
                       u.city,
                       u.avatar_data,
                       u.created_at,
                       (SELECT count(*) FROM runs r
                         WHERE r.user_id = u.id AND r.status = 'accepted') AS runs_accepted,
                       COALESCE(
                           (SELECT sum(t.area_m2) FROM territories t
                             WHERE t.mode = 'solo' AND t.owner_user_id = u.id),
                           0
                       ) AS solo_area_m2
                  FROM demo_users u
                 WHERE u.id = :user_id
                """
            ),
            {"user_id": user_id},
        )
    ).one_or_none()

    if player is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No such player")

    clan = await clan_of(connection, user_id)

    # Clan ground belongs to the clan, so the figure shown is the clan's, not
    # the share this member walked.
    clan_area = 0.0
    if clan is not None:
        clan_area = float(
            await connection.scalar(
                text(
                    """
                    SELECT COALESCE(sum(area_m2), 0) FROM territories
                     WHERE mode = 'clan' AND owner_clan_id = :clan_id
                    """
                ),
                {"clan_id": clan.id},
            )
        )

    return MeOut(
        user_id=str(player.id),
        player_id=player.player_id,
        display_name=player.display_name,
        color_hex=getattr(player, "color_hex", None) or "#00ff88",
        city=getattr(player, "city", "nukus") or "nukus",
        avatar_data=getattr(player, "avatar_data", None),
        joined_at=player.created_at.isoformat(),
        stats=PlayerStats(
            runs_accepted=int(player.runs_accepted),
            solo_area_m2=float(player.solo_area_m2),
            clan_area_m2=clan_area,
        ),
        clan=clan,
    )


@router.get("/me", response_model=MeOut)
async def read_me(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> MeOut:
    return await load_me(connection, user_id)


@router.patch("/me", response_model=MeOut)
async def rename_me(
    body: DisplayNameIn,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> MeOut:
    if body.display_name is None and body.color_hex is None and body.city is None and body.avatar_data is None:
        raise HTTPException(422, "No update fields provided")

    updates = []
    params: dict[str, str | None] = {"user_id": user_id}

    if body.display_name is not None:
        name = body.display_name.strip()
        if len(name) < 2:
            raise HTTPException(422, "display_name is too short")
        updates.append("display_name = :name")
        params["name"] = name

    if body.color_hex is not None:
        updates.append("color_hex = :color_hex")
        params["color_hex"] = body.color_hex

    if body.city is not None:
        updates.append("city = :city")
        params["city"] = body.city.lower()

    if body.avatar_data is not None:
        updates.append("avatar_data = :avatar_data")
        params["avatar_data"] = body.avatar_data

    if updates:
        await connection.execute(
            text(f"UPDATE demo_users SET {', '.join(updates)} WHERE id = :user_id"),
            params,
        )

    return await load_me(connection, user_id)

