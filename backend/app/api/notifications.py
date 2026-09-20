"""In-app notifications (territory invasion alerts).

GET  /api/v1/me/notifications        — list unread notifications
POST /api/v1/me/notifications/read   — mark all as read
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.deps import get_connection, get_demo_user

router = APIRouter(prefix="/api/v1/me", tags=["notifications"])


class Notification(BaseModel):
    id: int
    type: str
    payload: dict
    created_at: str


@router.get("/notifications", response_model=list[Notification])
async def get_notifications(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> list[Notification]:
    """Returns unread notifications for the current user, newest first."""
    rows = (
        await connection.execute(
            text(
                """
                SELECT id, type, payload, created_at
                  FROM notifications
                 WHERE user_id = :user_id
                   AND read_at IS NULL
                 ORDER BY created_at DESC
                 LIMIT 20
                """
            ),
            {"user_id": user_id},
        )
    ).all()

    return [
        Notification(
            id=row.id,
            type=row.type,
            payload=dict(row.payload) if row.payload else {},
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]


@router.post("/notifications/read", status_code=204)
async def mark_read(
    user_id: Annotated[str, Depends(get_demo_user)],
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> None:
    """Mark all unread notifications as read."""
    await connection.execute(
        text(
            "UPDATE notifications SET read_at = now() WHERE user_id = :user_id AND read_at IS NULL"
        ),
        {"user_id": user_id},
    )
