"""Clans and the clan territory layer (TZ section 23).

A clan owns its ground, not the member who walked it, so the ground stays when
someone leaves. Solo and clan are separate layers everywhere: nothing here
reads or writes a solo territory (CLAUDE.md rule 8).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import enforce_rate_limit, get_connection, get_demo_user
from app.api.schemas import (
    ClanBrief,
    ClanCreate,
    ClanJoin,
    ClanMemberOut,
    ClanOut,
    ClanStanding,
)

router = APIRouter(prefix="/api/v1", tags=["clans"])

MAX_MEMBERS = 10


async def clan_of(connection: AsyncConnection, user_id: str) -> ClanBrief | None:
    """The clan a player belongs to, or None. One clan per player."""
    row = (
        await connection.execute(
            text(
                """
                SELECT c.id,
                       c.name,
                       c.tag,
                       c.color_hex,
                       m.role,
                       (SELECT count(*) FROM clan_members WHERE clan_id = c.id) AS member_count
                  FROM clan_members m
                  JOIN clans c ON c.id = m.clan_id
                 WHERE m.user_id = :user_id
                """
            ),
            {"user_id": user_id},
        )
    ).one_or_none()

    if row is None:
        return None

    return ClanBrief(
        id=str(row.id),
        name=row.name,
        tag=row.tag,
        color_hex=row.color_hex,
        role=row.role,
        member_count=int(row.member_count),
    )


async def load_clan(connection: AsyncConnection, clan_id: str, viewer_id: str) -> ClanOut:
    clan = (
        await connection.execute(
            text(
                """
                SELECT c.id,
                       c.name,
                       c.tag,
                       c.color_hex,
                       c.invite_code,
                       c.created_at,
                       COALESCE(
                           (SELECT sum(t.area_m2)
                              FROM territories t
                             WHERE t.mode = 'clan' AND t.owner_clan_id = c.id),
                           0
                       ) AS area_m2
                  FROM clans c
                 WHERE c.id = :clan_id
                """
            ),
            {"clan_id": clan_id},
        )
    ).one_or_none()

    if clan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No clan with that id")

    members = (
        await connection.execute(
            text(
                """
                SELECT m.user_id,
                       u.player_id,
                       u.display_name,
                       m.role,
                       m.joined_at
                  FROM clan_members m
                  JOIN demo_users u ON u.id = m.user_id
                 WHERE m.clan_id = :clan_id
                 ORDER BY m.joined_at
                """
            ),
            {"clan_id": clan_id},
        )
    ).all()

    is_member = any(str(member.user_id) == viewer_id for member in members)

    return ClanOut(
        id=str(clan.id),
        name=clan.name,
        tag=clan.tag,
        color_hex=clan.color_hex,
        created_at=clan.created_at.isoformat(),
        member_count=len(members),
        area_m2=float(clan.area_m2),
        members=[
            ClanMemberOut(
                user_id=str(member.user_id),
                player_id=member.player_id,
                display_name=member.display_name,
                role=member.role,
                joined_at=member.joined_at.isoformat(),
            )
            for member in members
        ],
        # The code is what lets someone in, so only a member can read it.
        invite_code=clan.invite_code if is_member else None,
    )


@router.post("/clans", response_model=ClanOut, status_code=status.HTTP_201_CREATED)
async def create_clan(
    body: ClanCreate,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> ClanOut:
    await enforce_rate_limit(f"clans-create:{user_id}", limit=5, window_s=3600)

    if await clan_of(connection, user_id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Already in a clan")

    taken = await connection.scalar(
        text("SELECT id FROM clans WHERE upper(tag) = upper(:tag)"), {"tag": body.tag}
    )
    if taken is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "That tag is taken")

    clan_id = await connection.scalar(
        text(
            """
            INSERT INTO clans (name, tag, color_hex, created_by)
            VALUES (:name, upper(:tag), :color_hex, :user_id)
            RETURNING id
            """
        ),
        {
            "name": body.name.strip(),
            "tag": body.tag,
            "color_hex": body.color_hex.lower(),
            "user_id": user_id,
        },
    )

    await connection.execute(
        text(
            "INSERT INTO clan_members (user_id, clan_id, role) "
            "VALUES (:user_id, :clan_id, 'owner')"
        ),
        {"user_id": user_id, "clan_id": clan_id},
    )

    return await load_clan(connection, str(clan_id), user_id)


async def _join(connection: AsyncConnection, user_id: str, invite_code: str) -> ClanOut:
    if await clan_of(connection, user_id) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Already in a clan")

    # The row lock serialises concurrent joins, so the tenth seat cannot be
    # taken twice. The database trigger is still the last word on the limit.
    clan_id = await connection.scalar(
        text("SELECT id FROM clans WHERE invite_code = upper(:code) FOR UPDATE"),
        {"code": invite_code},
    )
    if clan_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No clan with that invite code")

    members = await connection.scalar(
        text("SELECT count(*) FROM clan_members WHERE clan_id = :clan_id"),
        {"clan_id": clan_id},
    )
    if int(members) >= MAX_MEMBERS:
        raise HTTPException(status.HTTP_409_CONFLICT, "Clan is full")

    await connection.execute(
        text("INSERT INTO clan_members (user_id, clan_id) VALUES (:user_id, :clan_id)"),
        {"user_id": user_id, "clan_id": clan_id},
    )

    return await load_clan(connection, str(clan_id), user_id)


@router.post("/clans/join", response_model=ClanOut)
async def join_by_code(
    body: ClanJoin,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> ClanOut:
    """Join with the code alone, the way a game lobby does."""
    await enforce_rate_limit(f"clans-join:{user_id}", limit=20, window_s=3600)

    return await _join(connection, user_id, body.invite_code)


@router.get("/clans/leaderboard", response_model=list[ClanStanding])
async def leaderboard(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[ClanStanding]:
    rows = (
        await connection.execute(
            text(
                """
                SELECT c.id,
                       c.name,
                       c.tag,
                       c.color_hex,
                       (SELECT count(*) FROM clan_members WHERE clan_id = c.id) AS member_count,
                       COALESCE(
                           (SELECT sum(t.area_m2)
                              FROM territories t
                             WHERE t.mode = 'clan' AND t.owner_clan_id = c.id),
                           0
                       ) AS area_m2
                  FROM clans c
                 ORDER BY area_m2 DESC, c.created_at
                 LIMIT :limit
                """
            ),
            {"limit": limit},
        )
    ).all()

    return [
        ClanStanding(
            id=str(row.id),
            name=row.name,
            tag=row.tag,
            color_hex=row.color_hex,
            member_count=int(row.member_count),
            area_m2=float(row.area_m2),
        )
        for row in rows
    ]


@router.get("/clans/{clan_id}", response_model=ClanOut)
async def read_clan(
    clan_id: str,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> ClanOut:
    return await load_clan(connection, clan_id, user_id)


@router.post("/clans/{clan_id}/join", response_model=ClanOut)
async def join_clan(
    clan_id: str,
    body: ClanJoin,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> ClanOut:
    """The path TZ section 23.3 specifies; the code still has to match."""
    await enforce_rate_limit(f"clans-join:{user_id}", limit=20, window_s=3600)

    joined = await _join(connection, user_id, body.invite_code)
    if joined.id != clan_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That code is for another clan")

    return joined


@router.post("/clans/{clan_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_clan(
    clan_id: str,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> None:
    membership = await clan_of(connection, user_id)
    if membership is None or membership.id != clan_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not a member of that clan")

    await connection.execute(
        text("DELETE FROM clan_members WHERE user_id = :user_id"), {"user_id": user_id}
    )

    # The ground stays with the clan (TZ section 23.2), so a clan without an
    # owner would be unmanageable: the longest-standing member takes over.
    if membership.role == "owner":
        await connection.execute(
            text(
                """
                UPDATE clan_members
                   SET role = 'owner'
                 WHERE user_id = (
                     SELECT user_id FROM clan_members
                      WHERE clan_id = :clan_id
                      ORDER BY joined_at
                      LIMIT 1
                 )
                """
            ),
            {"clan_id": clan_id},
        )


@router.delete("/clans/{clan_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    clan_id: str,
    member_id: str,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> None:
    membership = await clan_of(connection, user_id)
    if membership is None or membership.id != clan_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not a member of that clan")
    if membership.role not in {"owner", "officer"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an owner or officer can remove")
    if member_id == user_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Leave the clan instead")

    target_role = await connection.scalar(
        text("SELECT role FROM clan_members WHERE user_id = :member_id AND clan_id = :clan_id"),
        {"member_id": member_id, "clan_id": clan_id},
    )
    if target_role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not a member of that clan")
    if target_role == "owner" or (membership.role == "officer" and target_role == "officer"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot remove that member")

    await connection.execute(
        text("DELETE FROM clan_members WHERE user_id = :member_id"), {"member_id": member_id}
    )
