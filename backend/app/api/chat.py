"""Chat messaging endpoints (Global, Clan, and Direct)."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.clans import clan_of
from app.api.deps import enforce_rate_limit, get_connection, get_demo_user

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

ALLOWED_CHANNELS = frozenset({"global", "clan", "direct"})
ALLOWED_MSG_TYPES = frozenset({"text", "location"})


class ChatMessageIn(BaseModel):
    channel_type: str = Field(pattern=r"^(global|clan|direct)$")
    channel_id: str = Field(min_length=1, max_length=64)
    recipient_id: str | None = None
    content: str = Field(min_length=1, max_length=1000)
    msg_type: str = Field(default="text", pattern=r"^(text|location)$")
    payload: dict = Field(default_factory=dict)


class ChatSender(BaseModel):
    user_id: str
    player_id: str
    display_name: str
    color_hex: str
    avatar_data: str | None = None


class ChatMessageOut(BaseModel):
    id: int
    channel_type: str
    channel_id: str
    sender: ChatSender
    recipient_id: str | None = None
    content: str
    msg_type: str
    payload: dict
    created_at: str
    read_at: str | None = None


class DirectConversation(BaseModel):
    partner: ChatSender
    last_message: str
    last_message_at: str
    unread_count: int


@router.get("/messages", response_model=list[ChatMessageOut])
async def list_messages(
    channel_type: Annotated[str, Query(pattern=r"^(global|clan|direct)$")],
    channel_id: Annotated[str, Query(min_length=1, max_length=64)],
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    before_id: int | None = None,
) -> list[ChatMessageOut]:
    """Fetch messages for a channel. Clan channel enforces clan membership."""
    if channel_type == "clan":
        user_clan = await clan_of(connection, user_id)
        if user_clan is None or user_clan.id != channel_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this clan")

    if channel_type == "direct":
        # Ensure user is one of the participants
        parts = channel_id.split(":")
        if user_id not in parts:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to view this direct chat")

    before_filter = "AND m.id < :before_id" if before_id is not None else ""
    params: dict[str, object] = {
        "channel_type": channel_type,
        "channel_id": channel_id,
        "limit": limit,
    }
    if before_id is not None:
        params["before_id"] = before_id

    query = f"""
        SELECT m.id,
               m.channel_type,
               m.channel_id,
               m.sender_id,
               m.recipient_id,
               m.content,
               m.msg_type,
               m.payload,
               m.created_at,
               m.read_at,
               u.player_id,
               u.display_name,
               u.color_hex,
               u.avatar_data
          FROM chat_messages m
          JOIN demo_users u ON u.id = m.sender_id
         WHERE m.channel_type = :channel_type
           AND m.channel_id = :channel_id
           {before_filter}
         ORDER BY m.id DESC
         LIMIT :limit
    """
    rows = (await connection.execute(text(query), params)).all()


    # Return in chronological order (oldest to newest)
    result = [
        ChatMessageOut(
            id=row.id,
            channel_type=row.channel_type,
            channel_id=row.channel_id,
            sender=ChatSender(
                user_id=str(row.sender_id),
                player_id=row.player_id,
                display_name=row.display_name,
                color_hex=getattr(row, "color_hex", None) or "#00ff88",
                avatar_data=getattr(row, "avatar_data", None),
            ),
            recipient_id=str(row.recipient_id) if row.recipient_id else None,
            content=row.content,
            msg_type=row.msg_type,
            payload=dict(row.payload) if row.payload else {},
            created_at=row.created_at.isoformat(),
            read_at=row.read_at.isoformat() if row.read_at else None,
        )
        for row in reversed(rows)
    ]

    return result


@router.post("/messages", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    body: ChatMessageIn,
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> ChatMessageOut:
    """Send a new message to global, clan, or direct channel."""
    await enforce_rate_limit(f"chat-send:{user_id}", limit=20, window_s=10)

    channel_id = body.channel_id.strip()

    if body.channel_type == "clan":
        user_clan = await clan_of(connection, user_id)
        if user_clan is None or user_clan.id != channel_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this clan")

    recipient_id = None
    if body.channel_type == "direct":
        if not body.recipient_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "recipient_id is required for direct chat")
        recipient_id = body.recipient_id
        # Canonical channel_id for direct chat is sorted pair: min(u1, u2):max(u1, u2)
        pair = sorted([user_id, recipient_id])
        channel_id = f"{pair[0]}:{pair[1]}"

    import json
    row = (
        await connection.execute(
            text(
                """
                INSERT INTO chat_messages (channel_type, channel_id, sender_id, recipient_id, content, msg_type, payload)
                VALUES (:channel_type, :channel_id, :sender_id, :recipient_id, :content, :msg_type, CAST(:payload AS jsonb))
                RETURNING id, created_at
                """
            ),
            {
                "channel_type": body.channel_type,
                "channel_id": channel_id,
                "sender_id": user_id,
                "recipient_id": recipient_id,
                "content": body.content.strip(),
                "msg_type": body.msg_type,
                "payload": json.dumps(body.payload),
            },
        )
    ).one()


    # Fetch sender profile for response
    sender = (
        await connection.execute(
            text("SELECT player_id, display_name, color_hex, avatar_data FROM demo_users WHERE id = :uid"),
            {"uid": user_id},
        )
    ).one()

    return ChatMessageOut(
        id=row.id,
        channel_type=body.channel_type,
        channel_id=channel_id,
        sender=ChatSender(
            user_id=user_id,
            player_id=sender.player_id,
            display_name=sender.display_name,
            color_hex=getattr(sender, "color_hex", None) or "#00ff88",
            avatar_data=getattr(sender, "avatar_data", None),
        ),
        recipient_id=recipient_id,
        content=body.content.strip(),
        msg_type=body.msg_type,
        payload=body.payload,
        created_at=row.created_at.isoformat(),
        read_at=None,
    )


@router.post("/mark-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_messages_read(
    channel_id: Annotated[str, Query()],
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> None:
    """Mark direct messages received in this channel as read."""
    await connection.execute(
        text(
            """
            UPDATE chat_messages
               SET read_at = now()
             WHERE channel_id = :channel_id
               AND recipient_id = :user_id
               AND read_at IS NULL
            """
        ),
        {"channel_id": channel_id, "user_id": user_id},
    )


@router.get("/unread-count")
async def get_unread_count(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> dict[str, int]:
    """Total unread direct messages for the current user."""
    count = await connection.scalar(
        text("SELECT count(*) FROM chat_messages WHERE recipient_id = :uid AND read_at IS NULL"),
        {"uid": user_id},
    )
    return {"unread": int(count or 0)}

