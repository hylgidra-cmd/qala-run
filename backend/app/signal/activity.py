"""Activity classification (TZ section 20.4).

The interface stays fixed so the rule-based MVP can be swapped for a trained
model later without touching the run pipeline.
"""
from typing import Protocol

from app.signal.features import Features

# Only these two count as capturing a territory (TZ section 25, rule 11).
ALLOWED_ACTIVITIES = frozenset({"walk", "run"})


class ActivityClassifier(Protocol):
    def predict(self, f: Features) -> tuple[str, float]: ...


class RuleBasedClassifier:
    """MVP. Not ML - thresholds and statistics."""

    def predict(self, f: Features) -> tuple[str, float]:
        # A vehicle is fast *and* smooth. A person bounces at every step, so a
        # low acceleration spread at speed is the giveaway.
        if f.mean_speed > 11.0 and f.std_accel < 0.8:
            return ("vehicle", 0.90)

        # A bike sits at running speed but stays smooth and rarely stops.
        if 4.0 < f.mean_speed < 12.0 and f.std_accel < 1.2 and f.stop_ratio < 0.05:
            return ("bike", 0.70)

        if f.mean_speed < 2.2:
            return ("walk", 0.85)

        return ("run", 0.80)


def get_classifier() -> ActivityClassifier:
    """Swapping in the ML model is a one-line change here."""
    return RuleBasedClassifier()
