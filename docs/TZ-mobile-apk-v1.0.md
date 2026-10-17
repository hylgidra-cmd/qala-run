# TEXNIK TOPSHIRIQ (TZ) v1.0
## Loyiha: **Don't Stop** (QalaRun) — Mobil Ilova (Android APK & iOS) Platformasi
**Sanasi:** 2026-yil 17-oktabr  
**Holati:** Web-versiya yakunlangan, Mobil APK bosqichiga tayyor  

---

## 1. Loyiha Havolalari (GitHub, Render va Infrastrukturasi)

| Tizim / Xizmat | Manzil (URL) | Izoh |
| :--- | :--- | :--- |
| **GitHub Repozitoriy** | **[https://github.com/hylgidra-cmd/qala-run](https://github.com/hylgidra-cmd/qala-run)** | Asosiy kod bazasi (`main` branch) |
| **Jonli Web Ilova (Frontend)** | **[https://qalarun-web.onrender.com](https://qalarun-web.onrender.com)** | React 19 + MapLibre GL + Vite |
| **Admin Boshqaruv Markazi** | **[https://qalarun-web.onrender.com/#admin](https://qalarun-web.onrender.com/#admin)** | Admin kalit: `dontstop-admin-2026` |
| **Backend API (FastAPI)** | **[https://qalarun-api.onrender.com](https://qalarun-api.onrender.com)** | `/api/v1` (PostGIS + Redis + Kalman) |
| **API Health Check** | **[https://qalarun-api.onrender.com/health](https://qalarun-api.onrender.com/health)** | PostgreSQL, PostGIS va Redis holati |

---

## 2. Asosiy Savolga Javob: APK tayyor bo'lgandan keyin uni o'zgartirish, yangi g'oya qo'shish yoki olib tashlash mumkinmi?

**HA, 100% mumkin va juda oson!** Biz arxitekturani shunday quramizki, sizda **2 xil yangilash (o'zgartirish) imkoniyati** bo'ladi:

### 1-Usul: APK'ni qayta o'rnatmasdan jonli o'zgartirish (Live / OTA Update — 90% o'zgarishlar)
- Yangi dizayn, yangi tugmalar (masalan, "Bayroq", yangi klan funksiyalari, yangi shaharlar, reyting qoidalari, o'yin fizikasi, anti-cheat sozlamalari) qo'shmoqchi yoki biror narsani olib tashlamoqchi bo'lsangiz — **kodni o'zgartirib GitHub'ga push qilasiz**.
- Server (`qalarun-api` va `qalarun-web`) yangilanadi va foydalanuvchilar telefonidagi APK ilovani ochishi bilan **yangi funksiyalar avtomatik ishlayveradi** (odamlarga "yangi APK yuklab oling" deyish shart bo'lmaydi!).

### 2-Usul: Yangi `.apk` fayl chiqarish (GitHub Actions Cloud Build — 3 daqiqada)
- Agar telefonning chuqur tizimiga oid narsa o'zgarsa (masalan, ilova ikonkasini almashtirish, ilova nomini o'zgartirish, yangi Android ruxsatnomasi qo'shish):
- Kompyuteringizga og'ir Android Studio o'rnatishingiz ham shart emas. GitHub'dagi **`.github/workflows/build-apk.yml`** avtomatik ravishda har safar kod o'zgarganda yangi **`dontstop-release.apk`** faylini yig'ib (build qilib) beradi. Uni 1 ta tugma bilan yuklab olib, Telegram kanalda yoki Google Play'da tarqataverasiz.

---

## 3. Qaysi Dasturlash Tillari va Texnologiyalarda Ishlaymiz?

Biz loyihani noldan ikki marta yozmaslik va Web hamda APK bir xil mukammal ishlashi uchun **Гибрид Native-Web (Capacitor + Native Android Bridge)** yondashuvidan foydalanamiz:

| Qatlam | Dasturlash Tili | Texnologiya / Freymvork | Vazifasi |
| :--- | :--- | :--- | :--- |
| **1. Mobil Qobiq va Native Plaginlar** | **TypeScript + Kotlin / Java** | **Capacitor 6 (`@capacitor/core`, `@capacitor/android`)** | Web kodni haqiqiy Android `.apk` / `.aab` ilovaga aylantirish va telefonning GPS/Sensor/Push tizimiga ulash. |
| **2. Frontend (UI va Xarita)** | **TypeScript / TSX + CSS3** | **React 19 + Vite 6 + MapLibre GL JS** | 60 FPS xarita, chiziqlar, Bayroq (`🚩`), GPS Art, Chat, Klanlar va Reyting interfeysi. |
| **3. Orqa fon GPS va Sensorlar** | **Kotlin (Android) + TS** | **`@capacitor-community/background-geolocation` + `@capacitor/geolocation`** | Telefon ekrani o'chiq (cho'ntakda) bo'lganda ham GPS chiziqni uzmasdan yozib borish (**Foreground Service**). |
| **4. Backend va Geometriya** | **Python 3.11 + SQL** | **FastAPI + PostgreSQL 16 + PostGIS 3.4** | Poligonlarni kesish (`ST_Difference`), 2D Kalman filtri, Anti-cheat va ma'lumotlar bazasi. |
| **5. Avtomatik APK Yig'ish (CI/CD)** | **YAML + Gradle** | **GitHub Actions + Android SDK (Java 21)** | Har bir o'zgarishdan so'ng bulutda avtomatik `.apk` fayl tayyorlash. |

> **Alternativ kelajak varianti:** Agar keyinchalik App Store / Google Play uchun 100% alohida mobil ilova yozilsa, **Flutter (Dart)** yoki **React Native (TypeScript)** ishlatish mumkin — chunki Backend API (`https://qalarun-api.onrender.com/api/v1`) tayyor va har qanday platforma bilan to'g'ridan-to'g'ri ishlaydi. Lekin hozir **Capacitor** orqali 1 kunda haqiqiy, jonli `.apk` chiqarish — eng tez va eng samarali yo'l!

---

## 4. APK Ilovaning Asosiy Funksional Talablari (Nimalar bo'ladi?)

### 4.1. Telefon Cho'ntakda Bo'lganda ham Ishlaydigan GPS (Background Tracking)
Oddiy brauzerda telefon ekranini qulflasangiz, GPS to'xtab qoladi. APK versiyada esa:
- Android bildirishnomalar panelida (Notification bar) doimiy bildirishnoma chiqib turadi:  
  **"🏃 Don't Stop: Yugurish davom etmoqda (1.42 km | 08:15)"**.
- O'yinchi telefonni ekranini o'chirib cho'ntagiga solib yugursa ham, GPS nuqtalar uzluksiz yoziladi va serverga yuboriladi.

### 4.2. Oflayn Bufer (Internet uzilganda ham chiziq yo'qolmaydi)
- Agar o'yinchi yugurayotganda internet past joyga kirib qolsa, GPS nuqtalar telefon xotirasiga (`Preferences / SQLite`) yig'ilib boradi.
- Internet qaytishi bilan barcha yig'ilgan nuqtalar avtomatik `/api/v1/runs/{id}/points` ga yuboriladi.

### 4.3. O'yin Mexanikalari (To'liq qurollangan)
1. **Erkin Hudud Egallash (Freeform Polygon):** Yopiq marshrut ichidagi barcha maydon (`m²` / `ga`) o'yinchining rangiga bo'yaladi.
2. **🚩 Bayroq Qadash (Anchor Flag) va Lollipop Loop:**
   - Uydan 100–500 metr yugurib borib, **"🚩 Bayraq"** tugmasini bosish (yoki avtomatik kesishuv).
   - Boshidagi yo'l **moviy neon chiziq** bo'lib qoladi, bayroqdan keyingi aylana esa **hududga** aylanadi.
3. **🎨 GPS Art (Xaritada rasm chizish):**
   - Yugurib chizilgan har qanday shakl (yurak, yozuv, portret) "Tariyx"da saqlanadi va **"🗺️ Kartada izdi kóriw"** orqali xaritada neon chizma sifatida ko'rinadi.
4. **⚔️ Raqib Hududini Bosib Olish (PostGIS `ST_Difference`):**
   - Boshqa o'yinchining (yoki klanning) hududi ustidan aylanib yugurilganda, kesishgan qism tortib olinadi va raqibga jonli bildirishnoma (`InvasionToast` / Push Notification) boradi.
5. **🛡️ Anti-Cheat va Xaotik GPS Filtri:**
   - Frontendda EMA silliqlash (zig-zaglarni tekislash) + Backendda 2D Kalman filtri.
   - Mashinada (`> 11 m/s`) yoki soxta GPS (`Fake GPS / Mock Location`) bilan harakatlanganda avtomatik bloklash.

### 4.4. Telefon Funksiyalari (Native UX)
- **Tebranish (Haptics / Vibration):**
  - Yugurish boshlanganda, `🚩 Bayroq` qadalganda, aylana yopilganda (`Aylana tayyor!`) va hudud egallanganda telefon qo'lda yoqimli titraydi (`@capacitor/haptics`).
- **To'liq Ekran (Full-Screen Splash & Status Bar):**
  - Brauzerning manzil qatori (URL bar) bo'lmaydi — 100% haqiqiy mobil o'yin ko'rinishida ochiladi (`#10251F` qoramtir-zumrad tema bilan).

---

## 5. APK Ishlab Chiqish Bosqichlari (Qanday ishlaymiz?)

### 1-Bosqich: Capacitor va Android Loyihasini Qo'shish (`frontend/android`)
- `frontend/capacitor.config.ts` faylini yaratamiz:
  - `appId: "com.dontstop.qalarun"`
  - `appName: "Don't Stop"`
  - `webDir: "dist"`
- Android manifestiga (`AndroidManifest.xml`) kerakli ruxsatnomalarni qo'shamiz:
  - `ACCESS_FINE_LOCATION` (Aniq GPS)
  - `ACCESS_COARSE_LOCATION`
  - `ACCESS_BACKGROUND_LOCATION` (Orqa fonda GPS)
  - `FOREGROUND_SERVICE` va `FOREGROUND_SERVICE_LOCATION`
  - `WAKE_LOCK` va `VIBRATE`

### 2-Bosqich: Native GPS, Haptics va Offline Queue Integratsiyasi
- `useRunTracker.ts` ichiga Capacitor bridge qo'shamiz: ilova APK ichida ochilganda Native GPS va Haptics (vibratsiya) ishlaydi, brauzerda ochilganda esa Web Geolocation ishlaydi.

### 3-Bosqich: GitHub Actions orqali Avtomatik `.apk` Chiqarish (`.github/workflows/build-apk.yml`)
- GitHub'ga push qilinganda avtomatik ravishda:
  1. Frontend (`npm run build`) yig'iladi (`VITE_API_URL=https://qalarun-api.onrender.com/api/v1` bilan).
  2. `npx cap sync android` bajariladi.
  3. `./gradlew assembleDebug` (va imzolangan `assembleRelease`) bajarilib, tayyor **`dontstop.apk`** fayli GitHub Actions Artifacts / Releases bo'limiga yuklanadi!

---

## 6. O'zgartirish va Boshqarish Qo'llanmasi (Siz uchun)

1. **Yangi g'oya kelsa yoki biror joyni o'zgartirmoqchi bo'lsangiz:**
   - Menga (yoki kodga) aytasiz: *"Mana bu tugmani olib tashla"* yoki *"Mana bunday yangi bonus qo'sh"*.
   - Biz uni `frontend/src/` yoki `backend/app/` da o'zgartiramiz va `git push origin main` qilamiz.
2. **Natijani ko'rish:**
   - 2 daqiqada [https://qalarun-web.onrender.com](https://qalarun-web.onrender.com) da yangilanadi.
   - GitHub Actions esa yangi `.apk` faylni avtomatik tayyorlab qo'yadi.
