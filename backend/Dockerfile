FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libgeos-dev libproj-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml ./
COPY app ./app

# Local development installs the test extra so that `docker compose exec api
# python -m pytest` works; production builds stay lean with INSTALL_DEV=false.
ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ]; then pip install --no-cache-dir ".[dev,geo]"; else pip install --no-cache-dir ".[geo]"; fi

COPY alembic.ini ./
COPY alembic ./alembic

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
