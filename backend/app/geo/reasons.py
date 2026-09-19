"""Stable rejection reasons (TZ section 19).

These strings are part of the API contract and must not be renamed.
"""
from enum import StrEnum


class RejectionReason(StrEnum):
    LOOP_NOT_CLOSED = "LOOP_NOT_CLOSED"
    TOO_SHORT = "TOO_SHORT"
    AREA_TOO_SMALL = "AREA_TOO_SMALL"
    BAD_SHAPE = "BAD_SHAPE"
    ACTIVITY_NOT_ALLOWED = "ACTIVITY_NOT_ALLOWED"
    TELEPORT_DETECTED = "TELEPORT_DETECTED"
    LOW_GPS_QUALITY = "LOW_GPS_QUALITY"
    OUTSIDE_REGION = "OUTSIDE_REGION"
    NO_AWARDABLE_AREA = "NO_AWARDABLE_AREA"
    DUPLICATE_RUN = "DUPLICATE_RUN"
    NOT_IN_CLAN = "NOT_IN_CLAN"
