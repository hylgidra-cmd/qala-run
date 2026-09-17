# TEXNIK TOPSHIRIQ — QARAQALPAQ RUN
## Lokal ishlab chiqish muhiti, xarita, OSM, GPS simulyatori va demo doirasi

**Hujjat:** TZ-2 v2.1
**Sana:** 2026-yil 17-sentyabr
**Asos:** v2.0 (barcha texnik tuzatishlari saqlangan)
**Bog'liq hujjat:** `TZ-demo-v0.1.md`

---

## 0. HUJJAT MAQSADI

Ushbu hujjat Qaraqalpaq Run loyihasini Windows/macOS/Linux noutbukda ishga tushirish, xarita infratuzilmasini qurish, OpenStreetMap ma'lumotlarini PostGIS bazasiga import qilish va haqiqiy GPS bo'lmagan holatda yugurishni simulyatsiya qilish tartibini belgilaydi.

`TZ-demo-v0.1.md` o'yin qoidalarini (hudud egallash, decay, reyting, konflikt) belgilaydi. Ikki hujjat orasida **infratuzilma yoki xarita** bo'yicha ziddiyat chiqsa — ushbu hujjat amal qiladi. **O'yin qoidalarida** esa asosiy TZ amal qiladi.

### 0.1 v2.0 dan farqlar

| № | O'zgarish | Sabab |
|---:|---|---|
| 1 | MVP **faqat web demo** deb aniqlandi | Jamoa qarori: avval web, APK alohida bosqich |
| 2 | **Clan va chat MVP ichiga qaytarildi** | Clan — raqobatchilarda yo'q yagona farq; demo uni sinamasa asosiy gipoteza sinalmaydi |
| 3 | **Kalman filtri va activity modul qaytarildi** (`app/ai/`) | Kalman ML emas — u aniq tezlikning o'zi; ML klassifikator esa haqiqatan kechiktiriladi |
| 4 | GPX fixture'lar **9 ta** bo'ldi | `tiny_loop` ikkiga bo'lindi: `TOO_SHORT` va `AREA_TOO_SMALL` alohida sinaladi |
| 5 | **Muddatlar qo'shildi** (8 hafta) | v2.0 da bosqichlar bor edi, hafta yo'q edi |
| 6 | `pgcrypto` olib tashlandi | PostgreSQL 13+ da `gen_random_uuid()` o'rnatilgan |

v2.0 ning barcha texnik tuzatishlari **o'zgarishsiz saqlangan** (`pmtiles serve`, mock timestamp, MVT SRID, geoBoundaries, ESLint override, `barrier` LineString, idempotent import).

### 0.2 MVP CHEGARASI — WEB DEMO

**MVP ichiga kiradi:**

- Nukus pilot hududi xaritasi (~27 km²)
- Ro'yxatdan o'tish va login
- **Solo** yugurish va hudud egallash
- **Clan** (max 10 kishi) va alohida clan xaritasi
- **Chat-xarita** (xonalar + xavfsiz coarse presence)
- Yopiq halqani aniqlash
- Exclusion zonalarni ayirish
- Kalman filtri orqali aniq tezlik + qoida asosidagi activity aniqlash
- Mock GPS va 9 ta GPX testi
- Server-side anti-cheat qoidalari
- Yugurish tarixi, reyting, admin panel

**MVP ichiga KIRMAYDI:**

- **Android APK va native background GPS** — alohida bosqich (5-bosqich)
- Offline queue va sync — APK bilan birga keladi
- ML classifier'ni productionga chiqarish
- Butun Qoraqalpog'istonni qo'lda xaritalash
- Aniq live joylashuvni barcha foydalanuvchilarga ko'rsatish
- Clan urushlari, turnirlar, do'stlik tizimi
- iOS

**Muhim:** MVP web brauzerda ishlaydi. Telefon brauzerida sinaladi (ekran yoqiq holda). Bu chegara ongli ravishda qo'yilgan — 21.4-bo'limga qarang.

---

# I QISM — TEXNIK QARORLAR

## 1. TEXNOLOGIYALAR

| Qism | Texnologiya | Vazifa |
|---|---|---|
| Frontend | React + TypeScript + Vite | Web UI va keyinchalik Capacitor UI |
| Xarita | MapLibre GL JS + `react-map-gl/maplibre` | Xarita va o'yin qatlamlari |
| API | FastAPI + Pydantic | REST va WebSocket backend |
| ORM | SQLAlchemy 2 async + Alembic | DB va migratsiyalar |
| Database | PostgreSQL 16 + PostGIS 3.4+ | Geometriya va tranzaksiyalar |
| Cache/realtime | Redis 7 | Chat Pub/Sub, presence, rate limit |
| Geometriya | Shapely 2 + pyproj | Poligon amallari |
| **Signal ishlov** | **filterpy (Kalman) + NumPy** | **Aniq tezlik** |
| **Activity** | **Qoida asosidagi klassifikator** | **walk/run/bike/vehicle** |
| DEV basemap | OpenFreeMap | API keysiz tez development |
| PROD basemap | Protomaps PMTiles, o'z serverimizda | Barqaror va nazorat qilinadigan xarita |
| Geo-data | OpenStreetMap PBF/Overpass | Bino, suv va exclusion zonalari |
| Test | Pytest + Vitest | Backend va frontend testlari |

### 1.1 Xarita bo'yicha yakuniy qaror

```text
DEV:
MapLibre → OpenFreeMap public style (positron)

PRODUCTION:
MapLibre + pmtiles.js → o'z Nginx serverimizdagi raw nukus.pmtiles

HISOB-KITOB:
OSM geo-data → PostGIS → server-side polygon amallari
```

Tiles faqat foydalanuvchiga fon xaritasini ko'rsatadi. PostGIS'dagi geometriyalar hudud berish va exclusion hisoblash uchun ishlatiladi. **Ular bitta narsa emas.**

### 1.2 Muhim cheklov — hovlilar haqida

OSM'dagi `building` tegi faqat **bino footprintini** bildiradi. U har doim hovlining to'liq chegarasi emas. Shuning uchun mahsulotda **"barcha hovlilar 100% bloklanadi"** degan va'da berilmaydi.

Foydalanuvchi shartnomasida (ToS) aniq yozilishi shart: ilova xususiy hududga kirishni jismonan to'xtata olmaydi; javobgarlik foydalanuvchida.

### 1.3 AI bo'yicha aniqlik — nima ML, nima emas

Chalkashlikni oldini olish uchun:

| Komponent | ML'mi? | MVP'da | Izoh |
|---|---|---|---|
| **Kalman filtri** | **Yo'q** | **Ha** | Klassik signal ishlov berish. Aniq tezlik aynan shundan keladi |
| **Activity klassifikator (qoida)** | **Yo'q** | **Ha** | Threshold va statistika asosida |
| Activity klassifikator (ML) | Ha | Yo'q | 500+ label'langan run yig'ilgach |
| Anomaly detector (IsolationForest) | Ha | Yo'q | Dataset bo'lgach |

MVP'da ML yo'q, lekin **aniq tezlik bor**. Bu ikkisi alohida masala.

---

## 2. NOUTBUK VA DASTURIY TALABLAR

| Resurs | Minimal | Tavsiya |
|---|---:|---:|
| RAM | 8 GB | 16 GB |
| Bo'sh disk | 30 GB | 50–60 GB |
| CPU | 4 yadro | 4+ yadro |
| OS | Windows 10+, macOS 12+, Linux | Windows 11 + WSL2 ham mos |

16 GB RAM va 512 GB SSD'li noutbuk lokal MVP uchun yetarli. GPU talab qilinmaydi. Butun dunyo PMTiles build qilish lokal noutbuk vazifasi emas.

### 2.1 Windows

- WSL2 va Ubuntu ishlatiladi
- Docker Desktop WSL2 backend bilan ishlaydi
- Repository WSL ichida saqlanadi: `/home/<user>/qaraqalpaq-run`
- `/mnt/c/...` ichida ishlash tavsiya etilmaydi — volume I/O sekinlashadi

### 2.2 Versiyalar

```text
Node.js        24 LTS
Python         3.12
PostgreSQL     16
PostGIS        3.4+
Redis          7
Docker Desktop 4.30+
Git            2.40+
```

"24 LTS" yoki "3.12"ning o'zi to'liq pin emas. Repository quyidagilarni saqlashi shart:

- `.nvmrc` — jamoa tanlagan aniq Node patch versiya
- `package-lock.json` — Git'ga qo'shiladi
- Python dependency'lari aniq versiyalar bilan lock qilinadi
- Docker image'da `latest` ishlatilmaydi
- CI ham xuddi shu versiyalardan foydalanadi

### 2.3 Kerakli dasturlar

```bash
# Ubuntu / WSL2
sudo apt update
sudo apt install -y git curl jq osmium-tool osm2pgsql gdal-bin
```

VS Code kengaytmalari: Python, Pylance, Ruff, ESLint, Prettier, Tailwind CSS IntelliSense, Docker.

Paketlarni rasmiy `npm` va PyPI registry'dan o'rnating. Uchinchi tomon mirror'ini global sozlama sifatida majburiy qo'ymang.

---

## 3. REPOSITORY TUZILMASI

```text
qaraqalpaq-run/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── infra/
│   └── nginx/
│       └── tiles.conf
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/versions/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── deps.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── clan.py            ◄── MVP
│   │   │   ├── run.py
│   │   │   ├── territory.py
│   │   │   └── chat.py            ◄── MVP
│   │   ├── schemas/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── runs.py
│   │   │   ├── territories.py
│   │   │   ├── clans.py           ◄── MVP
│   │   │   ├── zones.py
│   │   │   └── chat.py            ◄── MVP
│   │   ├── ws/
│   │   │   ├── chat.py            ◄── MVP
│   │   │   └── live.py            ◄── MVP (coarse presence)
│   │   ├── geo/
│   │   │   ├── loop.py
│   │   │   ├── polygon.py
│   │   │   ├── exclusion.py
│   │   │   ├── conflict.py
│   │   │   └── constants.py
│   │   ├── signal/                ◄── QAYTARILDI
│   │   │   ├── kalman.py          # Kalman filtri (ML EMAS)
│   │   │   ├── features.py        # 14 ta xususiyat
│   │   │   ├── activity.py        # klassifikator interfeysi + qoida
│   │   │   └── models/            # kelajakdagi .pkl fayllar (bo'sh)
│   │   ├── services/
│   │   └── workers/
│   │       └── decay.py
│   ├── scripts/
│   │   ├── import_boundaries.py
│   │   ├── import_exclusions.py
│   │   ├── seed_demo.py
│   │   ├── refresh_osm.py
│   │   └── train_activity.py      # kelajak uchun skelet
│   ├── fixtures/                  # 9 ta GPX
│   └── tests/
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── .nvmrc
│   ├── vite.config.ts
│   └── src/
│       ├── map/
│       │   ├── MapView.tsx
│       │   ├── style.ts
│       │   ├── layers/
│       │   │   ├── TerritoryLayer.tsx
│       │   │   ├── ExclusionLayer.tsx
│       │   │   ├── BoundaryLayer.tsx
│       │   │   ├── LiveTrackLayer.tsx
│       │   │   └── PresenceLayer.tsx   ◄── MVP
│       │   └── hooks/
│       ├── location/
│       │   ├── types.ts
│       │   ├── BrowserProvider.ts
│       │   ├── MockProvider.ts
│       │   ├── NativeProvider.ts       # skelet, 5-bosqichda to'ldiriladi
│       │   └── index.ts
│       ├── dev/
│       ├── api/
│       ├── store/
│       ├── pages/
│       └── components/
│
└── data/
    ├── osm/
    └── tiles/
```

**Papka nomi haqida:** `ai/` emas, `signal/` deb nomlandi. Sabab — ichida hozir ML yo'q, Kalman va qoidalar bor. ML qo'shilganda ham shu papkada qoladi. Nomi realroq va jamoani chalkashtirmaydi.

`.gitignore`:

```gitignore
data/
node_modules/
__pycache__/
*.pyc
.env
*.pem
frontend/dist/
backend/.venv/
backend/app/signal/models/*.pkl
```

---

# II QISM — LOKAL INFRATUZILMA

## 4. ENVIRONMENT VARIABLES

`.env.example`:

```dotenv
POSTGRES_DB=qrun
POSTGRES_USER=qrun
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql+asyncpg://qrun:change_me@db:5432/qrun
REDIS_URL=redis://redis:6379/0
JWT_SECRET=replace_with_at_least_32_random_bytes
ENV=development
CORS_ORIGINS=http://localhost:5173
MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron
```

Haqiqiy `.env` Git'ga kiritilmaydi. Production secretlari repository, Dockerfile yoki compose faylida yozilmaydi.

## 5. DOCKER COMPOSE

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build: ./backend
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    env_file:
      - .env
    volumes:
      - ./backend:/app
      - ./data:/data:ro
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  tiles:
    image: nginx:1.27-alpine
    volumes:
      - ./data/tiles:/usr/share/nginx/html/tiles:ro
      - ./infra/nginx/tiles.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8080:80"

volumes:
  pgdata:
```

Frontend Docker ichida emas, lokal `npm run dev` bilan ishlaydi.

### 5.1 Raw PMTiles uchun Nginx

`infra/nginx/tiles.conf`:

```nginx
server {
    listen 80;

    location /tiles/ {
        root /usr/share/nginx/html;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        add_header Cache-Control "public, max-age=3600";
    }
}
```

Tekshiruv:

```bash
curl -I -H "Range: bytes=0-127" \
  http://localhost:8080/tiles/nukus.pmtiles
```

Fayl mavjud bo'lsa javob `206 Partial Content` va `Content-Range` qaytarishi kerak.

**`pmtiles serve` bu arxitekturada ishlatilmaydi.** Rasmiy hujjatda aniq yozilgan: u ZXY endpoint beradi, raw fayl uchun *"either whole or partial range requests, are not supported"*. `pmtiles.js` esa raw faylga Range so'rovi yuboradi. Agar kelajakda ZXY API tanlansa, frontend source konfiguratsiyasi alohida o'zgartiriladi.

## 6. BACKEND DOCKERFILE

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libgeos-dev libproj-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir .
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Alembic'ning birinchi migratsiyasi:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

`pgcrypto` **kerak emas** — PostgreSQL 13+ da `gen_random_uuid()` yadroga kiritilgan.

---

# III QISM — XARITA

## 7. DEV XARITASI

```bash
cd frontend
npm install maplibre-gl react-map-gl pmtiles @protomaps/basemaps
```

`src/map/style.ts`:

```typescript
export const DEV_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/positron';

export const NUKUS_CENTER = {
  longitude: 59.6103,
  latitude: 42.4531,
};

// Pilot zona: ~4.9 × 5.6 km ≈ 27 km²
export const PILOT_BOUNDS: [number, number, number, number] = [
  59.58, 42.43, 59.64, 42.48,
];
```

Pilot bbox butun Nukus emas. Birinchi demo kichik va tekshiriladigan hududda ishlaydi. Keyinchalik admin panel orqali ochiq region kengaytiriladi.

`MapView`:

```tsx
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEV_MAP_STYLE, NUKUS_CENTER, PILOT_BOUNDS } from './style';

export function MapView({ children }: { children?: React.ReactNode }) {
  return (
    <Map
      mapStyle={DEV_MAP_STYLE}
      initialViewState={{ ...NUKUS_CENTER, zoom: 14 }}
      maxBounds={PILOT_BOUNDS}
      minZoom={12}
      maxZoom={19}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" trackUserLocation />
      {children}
    </Map>
  );
}
```

`positron` (och kulrang) tanlangan: xarita rangsiz bo'lsa ustidagi hudud ranglari aniq ajralib turadi.

## 8. PRODUCTION PMTILES

PMTiles build manzili har kuni o'zgarishi mumkin. Aniq mavjud build URL tanlanadi va lokal faylga kesib olinadi:

```bash
pmtiles extract \
  "<CURRENT_PROTOMAPS_BUILD_URL>" \
  data/tiles/nukus.pmtiles \
  --bbox=59.58,42.43,59.64,42.48 \
  --maxzoom=16

pmtiles verify data/tiles/nukus.pmtiles
```

Protomaps hujjatlari hotlinkni tavsiya qilmaydi — fayl o'z serverimizda saqlanadi.

Production source:

```typescript
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';
import { layers, namedFlavor } from '@protomaps/basemaps';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

export const PROD_STYLE = {
  version: 8 as const,
  glyphs: '/map-assets/fonts/{fontstack}/{range}.pbf',
  sprite: '/map-assets/sprites/v4/light',
  sources: {
    protomaps: {
      type: 'vector' as const,
      url: 'pmtiles://https://xarita.example.uz/tiles/nukus.pmtiles',
      attribution:
        '<a href="https://protomaps.com">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  layers: layers('protomaps', namedFlavor('light'), { lang: 'en' }),
};
```

Font va sprite assetlari ham o'z serverimizda saqlanadi.

### 8.1 Offline chegarasi

APK ichiga quyidagilar joylashtirilsa basemap offline ko'rinishi mumkin: `nukus.pmtiles`, style JSON, glyph fayllari, sprite PNG/JSON va Range requestni qo'llaydigan native bridge yoki lokal server.

Offline holatda auth, chat, boshqa o'yinchilar va territory conflict **ishlamaydi**. Run lokal queue'da saqlanadi va internet qaytganda backend qayta tekshiradi. Bu "to'liq offline multiplayer" emas.

**Bu MVP'ga kirmaydi** — 5-bosqich (APK) bilan birga keladi.

## 9. QATLAMLAR TARTIBI

Pastdan yuqoriga:

1. Basemap
2. Region boundary
3. Exclusion fill va outline
4. Territory fill (**mode: solo yoki clan — bir vaqtda faqat bittasi**)
5. Territory outline
6. Start/closure indicator
7. Live run track
8. Foydalanuvchi markeri
9. Coarse player presence (chat-xarita sahifasida)

Har bir source va layer ID yagona bo'lishi shart. Map qayta render bo'lganda layerlar takror qo'shilmaydi.

**Solo/Clan almashtirish:** yuqorida toggle. Almashganda `territories` source `data` si yangilanadi, layer qayta yaratilmaydi.

## 10. BBOX API

```http
GET /api/v1/territories?bbox=minLon,minLat,maxLon,maxLat&mode=solo|clan
GET /api/v1/zones/exclusions?bbox=minLon,minLat,maxLon,maxLat
```

Backend talablari:

- bbox tartibi GeoJSON kabi `west,south,east,north`
- barcha qiymatlar validatsiya qilinadi
- maksimal bbox maydoni cheklanadi
- endpoint auth/rate limit qoidalariga ega
- response GeoJSON `FeatureCollection`
- geometriyaga GiST indeks ishlatiladi

Frontend dastlabki bboxni `onLoad` da, keyingilarni `onMoveEnd` da oladi (debounce 300 ms). Bbox koordinatalari kesh ko'payib ketmasligi uchun grid bo'yicha yaxlitlanadi.

## 11. KO'P POLIGON UCHUN MVT

| Ko'rinayotgan poligonlar | Yechim |
|---:|---|
| 0–2,000 | GeoJSON |
| 2,000–20,000 | bbox + zoom filter + `ST_SimplifyPreserveTopology` |
| 20,000+ | MVT endpoint |

To'g'ri MVT asosiy SQL:

```sql
WITH bounds AS (
  SELECT ST_TileEnvelope(:z, :x, :y) AS geom
), tile AS (
  SELECT
    t.id,
    t.owner_id,
    t.color,
    t.area_m2,
    ST_AsMVTGeom(
      ST_Transform(t.geom, 3857),
      bounds.geom,
      4096,
      64,
      true
    ) AS geom
  FROM territories t
  CROSS JOIN bounds
  WHERE t.is_active
    AND t.mode = :mode
    AND ST_Intersects(t.geom, ST_Transform(bounds.geom, 4326))
)
SELECT ST_AsMVT(tile, 'territories', 4096, 'geom')
FROM tile;
```

**Muhim:** `ST_AsMVTGeom` ga beriladigan geometriya va tile bounds bir xil SRID'da (3857) bo'lishi kerak.

---

# IV QISM — OSM VA EXCLUSION ZONALARI

## 12. MA'LUMOT MODELI

Ushbu hujjat doirasidagi jadvallar (to'liq schema asosiy TZ'da):

```sql
CREATE TABLE region_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  level integer NOT NULL,
  is_open boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  source_version text,
  imported_at timestamptz NOT NULL DEFAULT now(),
  geom geometry(MultiPolygon, 4326) NOT NULL
);

CREATE INDEX idx_region_geom
  ON region_boundaries USING GIST (geom);

CREATE TABLE exclusion_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  source text NOT NULL DEFAULT 'osm',
  osm_type text,
  osm_id bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  geom geometry(MultiPolygon, 4326) NOT NULL,
  UNIQUE (source, osm_type, osm_id)
);

CREATE INDEX idx_exclusion_geom
  ON exclusion_zones USING GIST (geom);
```

Ruxsat etilgan `kind`:

```text
building, private, school, hospital, military, water, industrial, other
```

`UNIQUE (source, osm_type, osm_id)` — import idempotentligini ta'minlaydi. Qayta import duplicate yaratmaydi.

## 13. TEZ DEV IMPORT — OVERPASS

Overpass faqat boshlang'ich development uchun. Production refresh uchun PBF pipeline ishlatiladi.

```overpass
[out:json][timeout:300];
(
  way["building"](42.43,59.58,42.48,59.64);
  relation["building"](42.43,59.58,42.48,59.64);
  way["access"~"^(private|no)$"](42.43,59.58,42.48,59.64);
  relation["access"~"^(private|no)$"](42.43,59.58,42.48,59.64);
  way["amenity"~"^(school|kindergarten|hospital)$"](42.43,59.58,42.48,59.64);
  relation["amenity"~"^(school|kindergarten|hospital)$"](42.43,59.58,42.48,59.64);
  way["landuse"~"^(military|industrial)$"](42.43,59.58,42.48,59.64);
  relation["landuse"~"^(military|industrial)$"](42.43,59.58,42.48,59.64);
  way["natural"="water"](42.43,59.58,42.48,59.64);
  relation["natural"="water"](42.43,59.58,42.48,59.64);
);
out geom;
```

**Diqqat:** Overpass bbox tartibi `(south, west, north, east)` — GeoJSON'dan farqli.

Import talablari:

- faqat yopiq way poligonga aylantiriladi
- relation/multipolygon to'g'ri yig'iladi
- `ST_MakeValid` ishlatiladi
- natija `MultiPolygon, 4326` ga normalizatsiya qilinadi
- `(source, osm_type, osm_id)` bo'yicha upsert qilinadi
- import qayta ishlatilganda duplicate yaratmaydi
- `User-Agent` da loyiha nomi va aloqa manzili bo'ladi

## 14. BARQAROR IMPORT — GEOFABRIK PBF

```bash
mkdir -p data/osm
cd data/osm

# O'zbekiston OSM — ~118 MB, har kuni yangilanadi
wget -O uzbekistan-latest.osm.pbf \
  https://download.geofabrik.de/asia/uzbekistan-latest.osm.pbf

osmium extract \
  -b 59.58,42.43,59.64,42.48 \
  uzbekistan-latest.osm.pbf \
  -o nukus-pilot.osm.pbf

osmium tags-filter nukus-pilot.osm.pbf \
  wr/building \
  wr/access=private,no \
  wr/amenity=school,kindergarten,hospital \
  wr/landuse=military,industrial \
  wr/natural=water \
  -o nukus-exclusions.osm.pbf
```

**`barrier=fence,wall` haqida:** bu teglar odatda LineString bo'ladi. Ularni polygon exclusion sifatida ko'r-ko'rona ayirish mumkin emas. Faqat yopiq va haqiqatan hududni ifodalovchi barrier alohida tekshiruvdan keyin poligonga aylantiriladi. Ochiq barrier'ni exclusion poligoniga buffer qilish **product qarorisiz bajarilmaydi**.

`osm2pgsql` importidan keyin `industrial` ham SQL mappingga kiritiladi. Import tugagach:

```sql
VACUUM ANALYZE exclusion_zones;
```

## 15. CHEGARALAR

geoBoundaries API manzili to'g'ridan-to'g'ri GeoJSON emas, **metadata JSON** qaytaradi:

```bash
curl -fsSL \
  "https://www.geoboundaries.org/api/current/gbOpen/UZB/ADM1/" \
  | jq -r '.gjDownloadURL' \
  | xargs curl -fL -o uz_adm1.geojson
```

ADM1 Qoraqalpog'iston chegarasi uchun ishlatilishi mumkin. Nukus shahar/tuman chegarasi uchun OSM administrative relation yoki tekshirilgan rasmiy ochiq ma'lumot ishlatiladi. Har bir boundary uchun manba, sana va versiya saqlanadi.

**MVP'da faqat pilot bbox `is_open = true`.** Qolgan chegaralar bazada bor, lekin yopiq.

## 16. OSM QOPLAMASI VA ADMIN QA

`/admin/coverage` sahifasi quyidagilarni ko'rsatadi:

- building soni
- exclusion turlari bo'yicha soni
- bo'sh yoki shubhali joylar
- oxirgi import vaqti
- source/version
- invalid geometry soni

**Nukusda OSM to'liq emas.** Import qilgandan keyin ham ba'zi hovlilar chiqarilmaydi. Yetishmayotgan joylarni OSM iD editor'da qo'lda chizish kerak — bu bepul va qonuniy.

**Bu ish 2-haftada boshlanadi, 7-haftada emas.** Geofabrik kuniga bir marta yangilanadi, shoshilinch qilib bo'lmaydi. Pilot hudud ~27 km², 1 kishi uchun ~3 kunlik ish.

OSM'ga qo'lda ma'lumot kiritishda **Google Maps yoki boshqa mualliflik huquqi bilan himoyalangan xaritadan ko'chirilmaydi.** Faqat OSM ruxsat bergan imagery, ochiq manba yoki joydagi kuzatuv ishlatiladi.

---

# V QISM — GEOMETRIYA VA TERRITORY

## 17. SERVER-SIDE PIPELINE

Run tugagach backend quyidagi qat'iy tartibda ishlaydi:

```text
 1. Auth va payload validatsiyasi
 2. Pointlarni vaqt bo'yicha saralash
 3. Duplicate va yaroqsiz pointlarni tozalash
 4. KALMAN FILTRI — tezlikni tiklash            ◄── 20-bo'lim
 5. Xususiyatlarni hisoblash + activity aniqlash ◄── 20-bo'lim
 6. Accuracy/speed/teleport tekshiruvi
 7. Activity ruxsat etilganmi (walk|run)
 8. Region ichida ekanini tekshirish
 9. Loop yopilganini tekshirish
10. LineString → Polygon
11. Geometriyani ST_MakeValid bilan tuzatish
12. Shape va minimal masofa/maydon tekshiruvi
13. Exclusion union'ini ayirish
14. Mavjud territory conflict qoidalarini qo'llash (mode bo'yicha)
15. Maydonni geography orqali hisoblash
16. Bitta DB transaction ichida saqlash
17. Eski egalarga bildirishnoma yozish
18. Natija va audit reasonlarni qaytarish
```

Maydon:

```sql
ST_Area(geom::geography)
```

gradusdagi `ST_Area(geom)` **ishlatilmaydi**.

## 18. CONCURRENCY

Ikki foydalanuvchi bir vaqtda kesishuvchi hudud yuborsa, hisob va yozish **bitta transaction ichida** bajariladi. Kerakli row/advisory lock olinadi. Transaction qayta tekshirmasdan frontend hisobiga ishonmaydi.

Solo va clan qatlamlari alohida lock oladi (`mode` bo'yicha) — ular bir-birini bloklamaydi.

**Frontend hech qachon yakuniy area, accepted/rejected yoki owner natijasini belgilamaydi.** Barcha authoritative qaror backendda.

## 19. RESPONSE

```json
{
  "run_id": "uuid",
  "status": "accepted",
  "reason": null,
  "mode": "solo",
  "raw_area_m2": 42000.5,
  "excluded_area_m2": 7800.2,
  "awarded_area_m2": 34200.3,
  "territory_id": "uuid",
  "activity": { "type": "run", "confidence": 0.86, "avg_speed_ms": 3.12 },
  "captured_from": [
    { "user_id": "uuid", "username": "Aziz", "area_lost_m2": 5100.0 }
  ],
  "warnings": ["LOW_OSM_COVERAGE"]
}
```

Rad etish reasonlari barqaror enum:

```text
LOOP_NOT_CLOSED
TOO_SHORT
AREA_TOO_SMALL
BAD_SHAPE
ACTIVITY_NOT_ALLOWED
TELEPORT_DETECTED
LOW_GPS_QUALITY
OUTSIDE_REGION
NO_AWARDABLE_AREA
DUPLICATE_RUN
```

`TOO_SHORT` va `AREA_TOO_SMALL` **alohida** reasonlar:

- `TOO_SHORT` — perimetr < `MIN_LOOP_PERIMETER` (300 m)
- `AREA_TOO_SMALL` — maydon < `MIN_AREA` (2,000 m²)

Uzun lekin ingichka halqa birinchisidan o'tadi, ikkinchisida yiqiladi. Shuning uchun ikkalasi ham alohida sinaladi.

---

# VI QISM — TEZLIK, ACTIVITY VA SIMULYATOR

## 20. SIGNAL MODULI — ANIQ TEZLIK

### 20.1 Muammo

Brauzerdan keladigan `speed` maydoni:

- iOS Safari'da ko'pincha `null`
- Android'da shovqinli, ±3 m/s tebranadi
- Shahar ichida bino orasida GPS "sakraydi" (multipath)

Koordinatalardan xom ayirma (`Δdistance / Δtime`) olish ham yetarli emas — bir xil shovqinni oladi.

**Client yuborgan `speed` ga ishonilmaydi.** Tezlik serverda qayta hisoblanadi — lekin xom ayirma bilan emas, filtr bilan.

### 20.2 Kalman filtri

`app/signal/kalman.py`. Bu **ML emas**, klassik signal ishlov berish.

```python
import numpy as np
from filterpy.kalman import KalmanFilter
from filterpy.common import Q_discrete_white_noise

def build_kf(dt: float, accuracy_m: float) -> KalmanFilter:
    """Holat: [x, y, vx, vy] — lokal ENU koordinatada, metrlarda."""
    kf = KalmanFilter(dim_x=4, dim_z=2)
    kf.F = np.array([[1, 0, dt, 0],
                     [0, 1, 0, dt],
                     [0, 0, 1,  0],
                     [0, 0, 0,  1]])
    kf.H = np.array([[1, 0, 0, 0],
                     [0, 1, 0, 0]])
    kf.R = np.eye(2) * (accuracy_m ** 2)     # har nuqta o'z aniqligi bilan
    kf.Q = Q_discrete_white_noise(dim=2, dt=dt, var=0.5, block_size=2)
    return kf

def smooth_track(points: list[RawPoint]) -> list[SmoothPoint]:
    """Har nuqta uchun kalman_speed_ms qaytaradi."""
    # 1. lat/lon → lokal ENU (birinchi nuqta origin)
    # 2. Har nuqtada predict + update
    # 3. speed = hypot(vx, vy)
    ...
```

Natija xom tezlikdan **3–5 barobar barqarorroq**. Har nuqta uchun `track_points.kalman_speed_ms` ga yoziladi; `raw_speed_ms` ham audit uchun saqlanadi.

### 20.3 Xususiyatlar

`app/signal/features.py` — 10 sekundlik oynadan 14 ta xususiyat:

```
mean_speed, std_speed, max_speed
p25_speed, p75_speed, p95_speed
mean_accel, std_accel, max_abs_accel
bearing_change_rate
stop_ratio
mean_accuracy
speed_entropy
duration_s
```

Hammasi Kalman tezligidan hisoblanadi, xomidan emas.

### 20.4 Activity klassifikatori

`app/signal/activity.py`. **Interfeys bir xil, implementatsiya almashtiriladi:**

```python
from typing import Protocol

class ActivityClassifier(Protocol):
    def predict(self, f: Features) -> tuple[str, float]: ...


class RuleBasedClassifier:
    """MVP. ML emas — threshold va statistika."""

    def predict(self, f: Features) -> tuple[str, float]:
        # Mashina: yuqori tezlik + PAST tezlanish tarqoqligi.
        # Mashina bir tekis ketadi; odam har qadamda tebranadi.
        if f.mean_speed > 11.0 and f.std_accel < 0.8:
            return ("vehicle", 0.90)

        # Velosiped: run tezligida, lekin silliq va to'xtashsiz
        if 4.0 < f.mean_speed < 12.0 and f.std_accel < 1.2 and f.stop_ratio < 0.05:
            return ("bike", 0.70)

        if f.mean_speed < 2.2:
            return ("walk", 0.85)

        return ("run", 0.80)


class MLClassifier:
    """Kelajak. 500+ label'langan run yig'ilgach."""
    def __init__(self, model_path: str): ...
    def predict(self, f: Features) -> tuple[str, float]: ...
```

Almashtirish — **bitta qator** config'da:

```python
classifier: ActivityClassifier = RuleBasedClassifier()   # MVP
# classifier = MLClassifier("app/signal/models/activity_v1.pkl")
```

### 20.5 Dataset yig'ish (MVP davomida)

Har run tugagach foydalanuvchidan so'raladi: *"Bu yugurish edimi?"* → `[Yugurdim] [Yurdim] [Velosipedda] [Boshqa]` → `runs.user_label`.

Bu javob **hech qanday qarorga ta'sir qilmaydi** — faqat kelajakdagi model uchun ma'lumot.

Maqsad: MVP oxirida **500+ label'langan run**. Shundan keyin ML bosqichi boshlanadi. Dataset yig'ish foydalanuvchi roziligi bilan va maxfiylik siyosatida yozilgan holda amalga oshiriladi.

## 21. LOCATION PROVIDER

### 21.1 Abstraksiya

```typescript
export interface RawPoint {
  lat: number;
  lon: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  ts: number;
  mocked?: boolean;
}

export interface LocationProvider {
  readonly name: 'browser' | 'mock' | 'native';
  isAvailable(): boolean;
  start(
    onPoint: (point: RawPoint) => void,
    onError: (error: Error) => void,
  ): Promise<void>;
  stop(): Promise<void>;
}
```

`navigator.geolocation` faqat `BrowserProvider.ts` ichida ishlatiladi.

**ESLint:** `no-restricted-globals` qoidasi `src/location/BrowserProvider.ts` uchun aniq `overrides` bloki bilan yumshatiladi — aks holda ruxsat berilgan faylning o'zi ham lint xato beradi:

```json
{
  "rules": {
    "no-restricted-globals": ["error", {
      "name": "navigator",
      "message": "Faqat src/location/BrowserProvider.ts ichida"
    }]
  },
  "overrides": [
    {
      "files": ["src/location/BrowserProvider.ts"],
      "rules": { "no-restricted-globals": "off" }
    }
  ]
}
```

### 21.2 Provider tanlash

```typescript
export function createLocationProvider(): LocationProvider {
  if (import.meta.env.DEV && isDevModeEnabled()) {
    return new MockLocationProvider();
  }

  if (isNativePlatform()) {
    return new NativeLocationProvider();
  }

  return new BrowserLocationProvider();
}
```

Production buildda query parameter bilan MockProvider **yoqilmaydi**. DEV panel code-splitting orqali production bundle'dan chiqariladi yoki build-time flag bilan yopiladi.

### 21.3 Mock provider — vaqt to'g'ri boshqariladi

```typescript
export class MockLocationProvider implements LocationProvider {
  readonly name = 'mock' as const;

  private timer: number | null = null;
  private distanceAlongM = 0;
  private simulatedTs = Date.now();

  isAvailable() {
    return true;
  }

  async start(onPoint: (point: RawPoint) => void): Promise<void> {
    await this.stop();

    const { route, speedMs, noiseM, tempo } = useMockStore.getState();
    if (route.length < 2) {
      throw new Error('Avval xaritada yo‘l chizing');
    }

    const simulatedStepSeconds = 1;
    const intervalMs = 1000 / tempo;

    this.timer = window.setInterval(() => {
      this.distanceAlongM += speedMs * simulatedStepSeconds;
      this.simulatedTs += simulatedStepSeconds * 1000;

      const pos = interpolateAlongRoute(route, this.distanceAlongM);
      if (!pos) {
        void this.stop();
        return;
      }

      const noise = gaussianOffset(noiseM, pos.lat);

      onPoint({
        lat: pos.lat + noise.dLat,
        lon: pos.lon + noise.dLon,
        accuracy: noiseM + Math.random() * 5,
        speed: speedMs + (Math.random() - 0.5) * 0.6,
        heading: pos.bearing,
        altitude: 80 + Math.random() * 4,
        ts: this.simulatedTs,
        mocked: true,
      });
    }, intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    this.distanceAlongM = 0;
    this.simulatedTs = Date.now();
  }
}
```

**Nima uchun bu muhim:** tempo faqat testni **ekranda** tez ko'rsatadi. Simulyatsiya timestampi har point uchun aniq bir soniya oldinga yuradi. Shu sabab 20x tempo backendga 20 barobar tez yugurish sifatida ko'rinmaydi va `nukus_car` testi bilan aralashib ketmaydi.

### 21.4 Web demo GPS cheklovi — ONGLI QAROR

MVP web brauzerda ishlaydi. Brauzerda `watchPosition()` **fon rejimida ishlamaydi**:

| Platforma | Xulq |
|---|---|
| iOS Safari | Ekran qulflansa GPS to'liq to'xtaydi |
| Android Chrome | Fonda sekinlashadi (throttling) |
| Desktop | GPS yo'q — IP/Wi-Fi taxmini, 500 m – 5 km |

**Ya'ni sinov foydalanuvchisi ekranni o'chirmasdan, brauzer ochiq holda yugurishi kerak.**

Yumshatish (MVP'da majburiy):

- `navigator.wakeLock.request('screen')` — ekran o'chmaydi
- PWA manifest + o'rnatish taklifi
- Tab fonga o'tsa vibratsiya/ovozli ogohlantirish
- Run ekranida ochiq yozuv: *"Yugurish paytida ekranni o'chirmang"*
- Geolocation API faqat HTTPS da ishlaydi — dev uchun `mkcert` yoki `cloudflared tunnel`

Bu cheklov **qabul qilingan**. To'liq yechim — APK (5-bosqich).

## 22. DEV PANEL

Dev panel faqat ikkala shartda ochiladi:

```text
import.meta.env.DEV === true
?dev=1
```

Funksiyalar:

- xaritada route chizish
- GPX import/export
- tezlik: 1–15 m/s
- noise: 0–30 m
- tempo: 1x, 5x, 20x
- scenario tanlash (9 ta fixture)
- start/stop/reset
- point, distance, elapsed time ko'rsatish
- Kalman tezligini xom tezlik bilan yonma-yon ko'rsatish (debug grafik)
- faqat lokal development uchun fake presence (chat-xaritani sinash uchun)

Fake presence haqiqiy foydalanuvchi yoki production WebSocket kanaliga yozilmaydi.

---

# VII QISM — CLAN VA CHAT

## 23. CLAN — MVP ICHIDA

### 23.1 Nima uchun MVP'da

Raqobat tahlili: Turf, Run An Empire, Captivate, Enclaves — **hech birida clan yo'q**. Clan loyihaning yagona farqi. Agar demo uni sinamasa, demo asosiy gipotezani sinamaydi.

Qo'shimcha: solo o'yinchi tashlab ketadi, clan a'zosi o'rtoqlari oldida qoladi. Retention farqi shu yerdan keladi.

### 23.2 Qoidalar

| Parametr | Qiymat |
|---|---|
| Maksimal a'zo | **10** (DB trigger bilan majburlanadi) |
| Rollar | `owner` (1), `officer` (≤2), `member` |
| Kirish | Invite code orqali |
| Clan hududi TTL | 14 kun (solo — 7 kun) |
| Chiqqan a'zo | Egallagan clan hududi clanda qoladi |

Rejim yugurish **boshlanishida** tanlanadi va o'rtada o'zgartirilmaydi. Bitta run faqat bitta `mode` ga tegishli.

### 23.3 API

```http
POST   /api/v1/clans                        {name, tag, color_hex}
GET    /api/v1/clans/{id}
POST   /api/v1/clans/{id}/join              {invite_code}
POST   /api/v1/clans/{id}/leave
DELETE /api/v1/clans/{id}/members/{user_id}  # owner/officer
GET    /api/v1/clans/leaderboard?limit=50
```

Validatsiya: `name` 3–48 belgi, `tag` 2–5 belgi (`A-Z0-9`), `color_hex` qat'iy `^#[0-9a-fA-F]{6}$`. Foydalanuvchi yuborgan barcha string uzunligi va formati tekshiriladi.

## 24. CHAT-XARITA — MVP ICHIDA

### 24.1 Xonalar

```text
region:UZ-QR       — respublika (MVP'da 1 ta umumiy)
district:NUKUS     — pilot hudud
clan:{clan_id}     — clan ichki chati
```

Shaxsiy (1-1) chat MVP'ga kirmaydi.

### 24.2 Backend

```python
@app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket, room_id: str, token: str):
    user = await auth_ws(token)               # token tekshiruvi MAJBURIY
    await require_room_access(user, room_id)  # clan xonasiga faqat a'zo
    await ws.accept()

    pubsub = redis.pubsub()
    await pubsub.subscribe(f"chat:{room_id}")

    async def reader():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await ws.send_text(msg["data"])

    task = asyncio.create_task(reader())
    try:
        while True:
            data = await ws.receive_json()
            await rate_limit(user.id, "chat", per_second=1)
            body = sanitize(data["body"])[:500]
            saved = await save_message(room_id, user.id, body)
            await redis.publish(f"chat:{room_id}", saved.json())
    except WebSocketDisconnect:
        task.cancel()
        await pubsub.unsubscribe(f"chat:{room_id}")
```

**Redis Pub/Sub boshidan** — bitta process'da kerak emasdek tuyuladi, lekin `uvicorn --workers 4` qilinganda 1-worker'dagi foydalanuvchi 3-worker'dagini ko'rmaydi. Keyin qayta yozmaslik uchun boshidan shunday.

### 24.3 Moderatsiya — MVP'da minimal, lekin majburiy

- Har xabarda "Shikoyat qilish" tugmasi
- Admin panelda shikoyatlar ro'yxati
- Mute (24h) va ban
- Stop-words filtri (o'zbek, qoraqalpoq, rus)
- Xabar tarixi saqlanadi, `is_deleted` bilan soft delete

### 24.4 Presence — coarse, aniq emas

Bu xavfsizlik masalasi, qulaylik emas.

| Kim | Nima ko'rinadi |
|---|---|
| Notanish o'yinchi | **H3 resolution 8 katakcha markazi (~0.7 km²)** |
| Clan a'zosi | Aniq joylashuv — **faqat ikkala tomon ruxsat bergan bo'lsa** |
| Offline | Ko'rinmaydi |

`/ws/live` ga kelgan aniq `lat/lon` serverda darhol H3 katakchaga aylantiriladi. **Aniq koordinata `user_presence` jadvaliga yozilmaydi va hech qanday API javobida tarqatilmaydi.**

```sql
CREATE TABLE user_presence (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  h3_cell    varchar(16) NOT NULL,   -- resolution 8
  is_running boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Aniq koordinata bu yerda YO'Q. Bu ataylab shunday.
```

---

# VIII QISM — ANTI-CHEAT, MAXFIYLIK VA XAVFSIZLIK

## 25. ANTI-CHEAT

MVP'da ML shart emas. Server-side qoidalar ishlatiladi:

| № | Tekshiruv | Rad etish |
|---:|---|---|
| 1 | Timestamp monoton o'sishi | `LOW_GPS_QUALITY` |
| 2 | Juda eski yoki kelajak timestamp | `LOW_GPS_QUALITY` |
| 3 | Minimal/maksimal point intervali | `LOW_GPS_QUALITY` |
| 4 | GPS accuracy > 35 m — nuqta tashlanadi | — |
| 5 | Kalman tezligi > 7.5 m/s (`run` uchun) | `ACTIVITY_NOT_ALLOWED` |
| 6 | Teleport: `dist/dt > 15 m/s` | `TELEPORT_DETECTED` |
| 7 | Nuqtalar zichligi < 0.5/s | `LOW_GPS_QUALITY` |
| 8 | Juda tekis/sun'iy track (R² > 0.999) | `LOW_GPS_QUALITY` |
| 9 | Duplicate run hash (24 soat) | `DUPLICATE_RUN` |
| 10 | Region tekshiruvi | `OUTSIDE_REGION` |
| 11 | Activity ∉ {walk, run} | `ACTIVITY_NOT_ALLOWED` |
| 12 | Bir user uchun parallel active run | Yangi run rad etiladi |
| 13 | Native mock-location signali | Auditga yoziladi |

Client yuborgan `speed`, `distance`, `area`, `mocked=false` qiymatlariga yakuniy qarorda **ishonilmaydi**. Tezlik va masofa serverda koordinata, timestamp va Kalman filtri orqali qayta hisoblanadi.

Rate limiting:

```text
POST /api/v1/runs/{id}/points   → 2 req/s per user
POST /api/v1/runs/start          → 10 req/hour per user
WS   chat message                → 1 req/s per user
```

ML anomaly detector faqat yetarli, qonuniy va label qilingan dataset yig'ilgandan keyin qo'shiladi.

## 26. LOCATION PRIVACY

Aniq real-time koordinata default holatda ommaga berilmaydi.

Majburiy talablar:

- live sharing default `off`
- foydalanuvchi aniq rozilik beradi
- faqat tanlangan clan guruhiga ulashish
- block va report
- foydalanuvchi ko'rinmas rejimni yoqa oladi
- public map uchun koordinata coarse (H3 res 8) yoki kechiktirilgan
- uy/start/end atrofida privacy radius qo'llash imkoniyati
- location log retention muddati belgilanadi
- run history'ni o'chirish imkoniyati
- transportda TLS
- admin koordinataga kirishi audit qilinadi

**Yuridik:** geolokatsiya — shaxsiy ma'lumot. O'zbekiston qonunchiligi bo'yicha lokalizatsiya talabi bor: **server O'zbekistonda bo'lishi kerak.** ToS va maxfiylik siyosati demo ishga tushishidan oldin tayyor bo'ladi.

## 27. AUTH VA API XAVFSIZLIGI

- parollar Argon2id yoki bcrypt bilan hash qilinadi
- qisqa muddatli access token va refresh token
- refresh token rotation/revoke
- login/register rate limit
- WebSocket ulanishida token tekshiruvi
- CORS faqat aniq originlar
- Pydantic orqali payload va bbox limitlari
- productionda debug o'chiq
- secretlar logga yozilmaydi
- foydalanuvchi yuborgan rang/string uzunligi validatsiya qilinadi

---

# IX QISM — TESTLAR

## 28. 9 TA GPX FIXTURE

| Fayl | Kutilgan natija |
|---|---|
| `nukus_good_loop.gpx` | `accepted` |
| `nukus_open_path.gpx` | `LOOP_NOT_CLOSED` |
| `nukus_short_loop.gpx` | `TOO_SHORT` (perimetr < 300 m) |
| `nukus_small_area.gpx` | `AREA_TOO_SMALL` (perimetr ≥ 300 m, maydon < 2,000 m²) |
| `nukus_thread.gpx` | `BAD_SHAPE` |
| `nukus_car.gpx` | `ACTIVITY_NOT_ALLOWED` |
| `nukus_teleport.gpx` | `TELEPORT_DETECTED` |
| `nukus_over_houses.gpx` | `accepted`; awarded area raw area'dan kichik |
| `nukus_outside.gpx` | `OUTSIDE_REGION` |

**`short_loop` va `small_area` ataylab alohida.** Uzun lekin ingichka halqa perimetr testidan o'tadi va maydon testida yiqiladi — ikkala shart mustaqil ishlashini isbotlash kerak.

`over_houses` uchun faqat status emas, maydon ham tekshiriladi:

```python
assert result["status"] == "accepted"
assert result["excluded_area_m2"] > 0
assert result["awarded_area_m2"] < result["raw_area_m2"]
```

## 29. QO'SHIMCHA TESTLAR

**Backend:**

- invalid bbox / oversized bbox
- invalid polygon
- duplicate run
- concurrent territory submissions (solo va clan alohida)
- exclusion import idempotency (2 marta import → bir xil qator soni)
- unauthorized WebSocket / expired token
- clan 11-a'zo qo'shish → `CLAN_FULL`
- clan chat xonasiga begona user → 403
- geography area sanity check
- MVT endpoint content type
- **Kalman: shovqinli sinov trackda `std(kalman_speed) < std(raw_speed)`**
- **Activity: `car.gpx` → `vehicle`, `good_loop.gpx` → `run`**

**Frontend:**

- initial `onLoad` bbox request
- provider factory
- MockProvider 1x/20x bir xil simulyatsion tezlik berishi
- start/stop timer cleanup
- productionda DEV panel bundle'da yo'q
- map layer IDs takrorlanmasligi
- solo/clan toggle source data'ni almashtirishi, layer qayta yaratmasligi

**CI har PR'da:**

```text
ruff check
pytest
npm run lint
npm run test
npm run build
```

---

# X QISM — ISHGA TUSHIRISH

## 30. BIRINCHI ISHGA TUSHIRISH

```bash
git clone <repo-url> qaraqalpaq-run
cd qaraqalpaq-run
cp .env.example .env

docker compose up -d db redis api
docker compose exec api alembic upgrade head

docker compose exec api python -m scripts.import_boundaries
docker compose exec api python -m scripts.import_exclusions
docker compose exec api python -m scripts.seed_demo --users 10 --clans 2

curl http://localhost:8000/health

cd frontend
npm ci
npm run dev
```

Manzillar:

```text
Frontend:  http://localhost:5173
API docs:  http://localhost:8000/docs
Dev panel: http://localhost:5173/?dev=1
```

PMTiles hali yaratilmagan bo'lsa `tiles` servisining ishlamasligi DEV OpenFreeMap xaritasini to'xtatmaydi. Raw tiles servisi kerak bo'lganda:

```bash
docker compose up -d tiles
```

## 31. HEALTH ENDPOINT

```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "postgis": "ok",
  "version": "0.1.0"
}
```

HTTP status: hammasi tayyor → `200`; kritik dependency tayyor emas → `503`.

---

# XI QISM — ACCEPTANCE CRITERIA

## 32. BIRINCHI SPRINT (1–2 hafta)

**Infratuzilma:**

- [ ] `docker compose up -d db redis api` muvaffaqiyatli
- [ ] PostGIS extension yoqilgan
- [ ] Alembic yangi bazada ishlaydi
- [ ] `.env.example` to'liq, secretlar Git'da yo'q
- [ ] `/health` DB, Redis va PostGIS holatini qaytaradi

**Xarita:**

- [ ] OpenFreeMap Positron xaritasi ko'rinadi
- [ ] Pilot bbox ~27 km², `maxBounds` ishlaydi
- [ ] Attribution ko'rinadi
- [ ] Initial bbox so'rovi xaritani surmasdan ketadi
- [ ] Exclusion zonalari turlari bo'yicha rangli ko'rinadi

**OSM:**

- [ ] Overpass/PBF import relation va way'larni oladi
- [ ] Import idempotent (2 marta → bir xil qator soni)
- [ ] GiST indekslar mavjud, `EXPLAIN` da `Index Scan`
- [ ] Invalid geometriyalar log qilinadi
- [ ] `/admin/coverage` import holatini ko'rsatadi

## 33. MVP "DONE" TA'RIFI — WEB DEMO

MVP faqat quyidagi holatda tayyor hisoblanadi:

1. **Telefon brauzerida** (ekran yoqiq) Nukusda real GPS run yozildi va hudud berildi
2. Olingan maydon real maydondan **±10%** ichida to'g'ri hisoblandi
3. Uy/suv kabi mavjud exclusionlar maydondan ayirildi (5 ta turli joyda vizual tekshiruv)
4. Ikkinchi foydalanuvchi o'sha yerni olganda birinchisiga **10 soniya ichida** xabar keldi
5. `nukus_car.gpx` ssenariysi 10/10 sinovda `vehicle` deb aniqlandi va yer bermadi
6. **Kalman tezligi** xom tezlikdan sezilarli barqarorroq (test bilan isbotlandi)
7. **10 kishilik clan tuzildi**, clan xaritasida hudud egallandi, solo xarita o'zgarmadi
8. **Chat-xaritada 5 foydalanuvchi bir-birini ko'rdi va yozishdi**
9. Notanish o'yinchining aniq koordinatasi **hech qanday API javobida** yo'q
10. Bir vaqtdagi conflict transaction bilan to'g'ri hal qilindi
11. 9 ta GPX va integration testlar CI'da o'tdi
12. 20 parallel foydalanuvchi bilan server yiqilmadi
13. Pilot bboxdan tashqarida yer berilmadi
14. ToS va maxfiylik siyosati tayyor; server O'zbekistonda
15. Production secretlari va debug sozlamalari tekshirildi

**Diqqat:** APK, background GPS, offline queue va sync bu ro'yxatda **yo'q**. Ular 5-bosqich. MVP — web demo.

---

# XII QISM — BOSQICHLAR VA MUDDATLAR

## 34. REJA — 8 HAFTA

Taxmin: 1 backend + 1 frontend dasturchi + 1 kishi qisman (dizayn/OSM).

| Hafta | Backend | Frontend | Parallel |
|---:|---|---|---|
| **1** | Docker, PostGIS, migratsiyalar, auth, `/health` | Vite skelet, MapLibre + OpenFreeMap, auth ekranlari | — |
| **2** | Boundary + exclusion import, `/zones`, `/regions`, admin coverage | Exclusion va boundary qatlamlari | **OSM qo'lda xaritalash boshlanadi** |
| **3** | Run API, Kalman filtri, features, halqa algoritmi | MockProvider, dev panel, route chizish, run ekrani | OSM davom etadi |
| **4** | Polygon validatsiya, exclusion ayirish, conflict transaction, activity klassifikator | Natija ekrani, territory qatlami, bildirishnomalar | OSM tugaydi |
| **5** | Clan CRUD, clan mode, leaderboard, decay worker | Clan ekranlari, SOLO/CLAN toggle, reyting | — |
| **6** | Chat WS + Redis, xonalar, coarse presence, moderatsiya | Chat-xarita sahifasi, presence qatlami | — |
| **7** | Anti-cheat to'liq, admin panel, rate limit, audit | Sayqallash, PWA + wake lock, mobil layout | ToS/privacy matni |
| **8** | **Nukusda 20 kishi bilan real sinov** | Bug fixing | Server O'zbekistonda sozlanadi |

**Kritik yo'l (critical path):** 2-haftada boshlanadigan OSM qo'lda xaritalash. Agar u kechiksa, 4-haftadagi exclusion ayirish sinovlari haqiqiy ma'lumotsiz qoladi.

## 35. BOSQICHLAR (MVP dan keyin)

**5-bosqich — Mobile (2 hafta):**
Capacitor o'rash, `@capacitor-community/background-geolocation` (MIT), foreground/background permission flow, offline queue, reconnect/sync, real device QA, APK to'g'ridan-to'g'ri tarqatish.

**6-bosqich — Production map va Play Store (2–4 hafta):**
PMTiles cutout, self-hosted glyph/sprite, HTTPS + cache, OSM refresh job, monitoring va backup. Google Play background location declaration — **1–3 hafta kutish, rad etilishi mumkin.**

**7-bosqich — Kengaytirish:**
Xo'jayli/Taxiatosh ochish, ML classifier (500+ dataset bo'lsa), anomaly detector, clan urushlari, turnirlar, iOS.

---

# XIII QISM — YAKUNIY JAMOA QARORLARI

| № | Masala | Qaror |
|---:|---|---|
| 1 | DEV basemap | OpenFreeMap Positron |
| 2 | PROD basemap | Raw PMTiles + Nginx + pmtiles.js (`pmtiles serve` EMAS) |
| 3 | Pilot hudud | `59.58, 42.43, 59.64, 42.48` ≈ 27 km², Nukus markazi |
| 4 | Geo hisob | Faqat server-side PostGIS |
| 5 | Area | `ST_Area(geom::geography)` |
| 6 | MVT SRID | Geometriya va bounds 3857 |
| 7 | OSM import | DEV Overpass, barqaror PBF pipeline, idempotent |
| 8 | Hovli va bino | Faqat mavjud OSM geometriya darajasida; **100% va'da yo'q** |
| 9 | Tezlik | **Kalman filtri (ML emas), serverda** |
| 10 | Activity | **Qoida asosida; ML faqat 500+ dataset bo'lsa** |
| 11 | Anti-cheat | Server-side rules; ML keyin |
| 12 | Live location | Default off, opt-in, public uchun H3 res 8 coarse |
| 13 | **MVP doirasi** | **Faqat web demo. Clan va chat ICHIDA. APK — 5-bosqich** |
| 14 | Clan limiti | 10 kishi, DB trigger bilan |
| 15 | Offline | MVP'da yo'q; APK bilan keladi |
| 16 | CI | Backend va frontend tekshiruvlari har PR'da |
| 17 | Branch | `main` + `feat/*`, PR orqali |
| 18 | Commit | Inglizcha Conventional Commits |
| 19 | Server joylashuvi | **O'zbekiston** (shaxsiy ma'lumot lokalizatsiyasi) |

---

## 36. OCHIQ SAVOLLAR

| № | Savol | Holat |
|---:|---|---|
| 1 | Domen nomi | Aniqlanmagan |
| 2 | Hosting provayderi (O'zbekistonda) | Aniqlanmagan |
| 3 | Kim OSM'da hovlilarni chizadi | **2-haftada boshlanishi shart** |
| 4 | Ro'yxatdan o'tish SMS bilanmi | Taklif: demo uchun SMS'siz |
| 5 | Loyiha rasmiy nomi | "Qaraqalpaq Run" — vaqtinchalik |
| 6 | Jamoa taqsimoti (kim backend, kim frontend) | Aniqlanmagan |
| 7 | ToS va maxfiylik siyosatini kim yozadi | 7-haftaga tayyor bo'lishi kerak |

---

## 37. RASMIY TEXNIK MANBALAR

- OpenFreeMap: <https://openfreemap.org/>
- Protomaps PMTiles CLI: <https://docs.protomaps.com/pmtiles/cli>
- Protomaps MapLibre basemap: <https://docs.protomaps.com/basemaps/maplibre>
- Protomaps basemap downloads: <https://docs.protomaps.com/basemaps/downloads>
- Geofabrik O'zbekiston: <https://download.geofabrik.de/asia/uzbekistan.html>
- geoBoundaries API: <https://www.geoboundaries.org/api/current/gbOpen/UZB/ADM1/>
- PostGIS `ST_AsMVTGeom`: <https://postgis.net/docs/ST_AsMVTGeom.html>
- Uber H3: <https://github.com/uber/h3>
- filterpy (Kalman): <https://filterpy.readthedocs.io/>
- OpenStreetMap copyright: <https://www.openstreetmap.org/copyright>
- Android location permissions: <https://developer.android.com/develop/sensors-and-location/location/permissions>
- Capacitor background geolocation (MIT): <https://github.com/capacitor-community/background-geolocation>

---

**Hujjat oxiri — TZ-2 v2.1**
