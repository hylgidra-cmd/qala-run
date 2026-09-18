from fastapi.testclient import TestClient

from app.main import app


def test_liveness() -> None:
    with TestClient(app) as client:
        response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_index_points_at_the_docs_instead_of_returning_404() -> None:
    with TestClient(app) as client:
        response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert body["docs"] == "/docs"
    assert body["health"] == "/health"
    assert any("/api/v1/runs/start" in entry for entry in body["endpoints"])


def test_api_prefix_also_points_at_the_docs() -> None:
    """Opening /api/v1 in a browser is a dead end otherwise."""
    with TestClient(app) as client:
        response = client.get("/api/v1")

    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"
