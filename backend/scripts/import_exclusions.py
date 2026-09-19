"""Import exclusion zones from Overpass for the pilot bbox (TZ section 13).

    docker compose exec api python -m scripts.import_exclusions

Overpass is the development path. A stable refresh uses the Geofabrik PBF
pipeline described in TZ section 14, which is a separate job.

The import is idempotent: rows are upserted on (source, osm_type, osm_id), so
running it twice creates no duplicates.
"""
import argparse
import asyncio
import json
import sys
import time
import urllib.error
import urllib.request

from sqlalchemy import text

from app.config import get_settings
from app.db import get_engine
from app.geo.osm import overpass_query, parse_elements

# The public instances rate-limit and time out under load, so the import
# tries each one in turn rather than failing on the first 504.
OVERPASS_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.jp/api/interpreter",
)
RETRY_DELAY_S = 10

# Overpass asks every client to identify itself with a contact address.
USER_AGENT = "DontStop/0.1 (+https://github.com/hylgidra-cmd/dont-stop)"

UPSERT = text(
    """
    INSERT INTO exclusion_zones (kind, source, osm_type, osm_id, geom, updated_at)
    VALUES (
        :kind, 'osm', :osm_type, :osm_id,
        ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromText(:wkt, 4326)), 3)),
        now()
    )
    ON CONFLICT (source, osm_type, osm_id) DO UPDATE
       SET kind = EXCLUDED.kind,
           geom = EXCLUDED.geom,
           updated_at = now()
    """
)


def fetch(query: str, timeout_s: int) -> dict:
    """Ask each mirror in turn; raise the last error if all of them refuse."""
    last_error: Exception | None = None

    for index, url in enumerate(OVERPASS_URLS):
        request = urllib.request.Request(
            url,
            data=query.encode("utf-8"),
            headers={"User-Agent": USER_AGENT, "Content-Type": "text/plain; charset=utf-8"},
        )

        try:
            with urllib.request.urlopen(request, timeout=timeout_s) as response:
                return json.loads(response.read())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            print(f"  {url} failed: {exc}", flush=True)
            if index + 1 < len(OVERPASS_URLS):
                time.sleep(RETRY_DELAY_S)

    raise last_error if last_error else RuntimeError("no Overpass mirror configured")


# Row-at-a-time costs one network round trip per polygon, which is minutes of
# waiting against a remote database. Batches keep it to seconds.
BATCH_SIZE = 500


async def store(rows: list[dict]) -> int:
    """Write in one transaction; a geometry PostGIS cannot fix is skipped.

    Each batch goes in one round trip. If a batch fails, only that batch is
    retried row by row, so one bad way costs a little time instead of the run.
    """
    written = 0

    async with get_engine().begin() as connection:
        for start in range(0, len(rows), BATCH_SIZE):
            batch = rows[start : start + BATCH_SIZE]

            try:
                await connection.execute(UPSERT, batch)
                written += len(batch)
                continue
            except Exception:  # noqa: BLE001 - fall back to finding the bad row
                pass

            for row in batch:
                savepoint = await connection.begin_nested()
                try:
                    await connection.execute(UPSERT, row)
                    await savepoint.commit()
                    written += 1
                except Exception as exc:  # noqa: BLE001 - skip only the bad way
                    await savepoint.rollback()
                    print(f"  skipped {row['osm_type']}/{row['osm_id']}: {type(exc).__name__}")

            print(f"  ... {written}/{len(rows)}", flush=True)

        await connection.execute(text("ANALYZE exclusion_zones"))

    return written


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=int, default=300, help="Overpass timeout in seconds")
    parser.add_argument(
        "--dry-run", action="store_true", help="Print the counts without writing"
    )
    arguments = parser.parse_args()

    settings = get_settings()
    query = overpass_query(settings.pilot_bbox, timeout_s=arguments.timeout)

    print(f"Querying Overpass for bbox {settings.pilot_bbox} ...", flush=True)
    try:
        payload = fetch(query, timeout_s=arguments.timeout + 30)
    except Exception as exc:  # noqa: BLE001 - every mirror refused
        print(f"Overpass request failed: {exc}", file=sys.stderr)
        return 1

    elements = payload.get("elements", [])
    rows = parse_elements(elements)

    by_kind: dict[str, int] = {}
    for row in rows:
        by_kind[row["kind"]] = by_kind.get(row["kind"], 0) + 1

    print(f"Elements returned: {len(elements)}", flush=True)
    print(f"Usable polygons:   {len(rows)}")
    for kind, count in sorted(by_kind.items()):
        print(f"  {kind:<11} {count}")

    if arguments.dry_run:
        print("Dry run: nothing written.")
        return 0

    written = await store(rows)
    print(f"Upserted {written} exclusion zones.")
    print("OSM coverage in Nukus is incomplete; this is never a full picture.")

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
