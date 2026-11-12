# TEXNIK VAZIFA (TZ / TECHNICAL SPECIFICATION) v2.0
## Loyiha: **«Don't Stop» (Qala Run)** — Gamified Fitness & Real-Time Territory Capture Platform
**Hujjat Turi:** To'liq Texnik Topshiriq va Tizim Arxitekturasi Hujjati  
**Sanasi:** 2026-yil 12-noyabr  
**Holati:** MVP (Pre-Seed) bosqichi yakunlangan, Startup Base platformasida tasdiqlangan, Go-To-Market (Seed) bosqichiga tayyor  
**GitHub Repozitoriy:** [https://github.com/hylgidra-cmd/qala-run](https://github.com/hylgidra-cmd/qala-run)  
**Jonli Veb-Platforma:** [https://qalarun-web.onrender.com](https://qalarun-web.onrender.com)  
**Word Formati (.docx):** [docs/TEXNIK_VAZIFA_DONT_STOP_V2.0.docx](file:///C:/Users/hylgi/.gemini/antigravity/worktrees/qala-run-main/analyze_codebase_and_algorithms/docs/TEXNIK_VAZIFA_DONT_STOP_V2.0.docx) yoki saytdan to'g'ridan-to'g'ri yuklab olish: `https://qalarun-web.onrender.com/TEXNIK_VAZIFA_DONT_STOP.docx`

---

## 1. Loyiha Haqida Umumiy Ma'lumot va Maqsad (Executive Summary)

**«Don't Stop» (Qala Run)** — bu real hayotdagi jismoniy faollikni (yugurish va piyoda yurish) zamonaviy geolokatsion mobil o'yin (Gamified Fitness / Territory Capture) mexanikasi bilan birlashtiruvchi innovatsion raqamli platformadir. Foydalanuvchilar shahar bo'ylab yugurib, yopiq GPS trayektoriyasini (kontur/shenber) hosil qilganlarida, ushbu trayektoriya ichidagi maydon real vaqt rejimida hisoblab chiqiladi va xaritada o'yinchining shaxsiy (yoki klani/gildiyasi) rangi bilan bo'yalgan hududga aylanadi.

Loyiha hozirgi kunda **Startup Base** platformasida **«Tasdiqlangan» (Approved MVP)** holatida bo'lib, quyidagi ko'rsatkichlarga ega:
- **Bosqich:** MVP (Pre-Seed) — Ishlaydigan mahsulot yaratilgan, test sinovlaridan to'liq o'tgan;
- **Rejalashtirilgan Bosqich:** Go-To-Market (Seed) va Masshtablash (Scaling);
- **Kerakli Investitsiya Hajmi:** $30,000;
- **Qiziqish Bildirishlar:** 50+;
- **Asosiy Maqsad:** O'zbekiston va Markaziy Osiyo bo'ylab millionlab odamlarni yugurishga undaydigan, raqobatbardosh, monetizatsiyalangan raqamli sport o'yini ekotizimini barpo etish.

---

## 2. Tizim Arxitekturasi va Texnologik Stek

Loyihada **Gibrid Native-Web (Capacitor 7 + React 19 + PostGIS 3.4)** arxitekturasi qo'llanilgan:

| Qatlam (Layer) | Texnologiya | Funksional Vazifasi |
| :--- | :--- | :--- |
| **Frontend Veb SPA** | React 19, TypeScript, Vite 6, CSS3 (Cyberpunk/Neon) | Yuqori unumdorlikdagi UI, ko'p tillilik (Qoraqalpoq, O'zbek, Rus, Ingliz), responsiv mobil dizayn. |
| **Xarita va Fazoviy Render** | MapLibre GL JS, Turf.js, OpenFreeMap Positron | Vektorli plitalar (tiles), 60 FPS silliq chizish, real vaqtda GPS chizig'i va hudud poligonlarini ko'rsatish. |
| **Mobil Qobiq (Native Bridge)** | Capacitor 7 (`@capacitor/core`, `@capacitor/android`), Gradle 8.11 | Web kodni to'liq Android `.apk` / `.aab` ilovasiga aylantirish, doimiy orqa fon GPS xizmati (Foreground Service), Haptics tebranishi. |
| **Backend REST API** | FastAPI (Python 3.12, async/await), Uvicorn | Asinxron yuqori tezlikdagi API, GPS filtrlash, anticheat tekshiruvlari, klanlar va to'lovlar boshqaruvi. |
| **Fazoviy Geometriya & Baza** | PostgreSQL 16 + PostGIS 3.4 (asyncpg, SQLAlchemy 2) | Poligonlarni kesish va birlashtirish (`ST_Difference`, `ST_Union`, `ST_Area`), fazoviy indekslash (`GIST`). |
| **Kesh va Jonli Xabarlar** | Redis 7.2 (`aioredis`) | Jonli GPS tracking, real vaqtdagi yuguruvchilar lokatsiyasi, shahar chati va tezkor kesh. |
| **Infratuzilma va CI/CD** | Render.com, GitHub Actions, Android SDK (Java 21) | Bulutli veb-servis, boshqariladigan ma'lumotlar bazasi va avtomatlashtirilgan deploy. |

---

## 3. Amalga Oshirilgan va To'liq Ishlab Turgan Funksiyalar (Detailed Feature Matrix)

Loyiha doirasida quyidagi funksiyalar 100% ishlab chiqilgan, testlangan va jonli foydalanishga tayyor:

### 3.1. GPS Yugurish va Poligon Egallash Yadrosi (Run Tracking Engine)
1. **Real Vaqtda GPS Yozish:** Bosib o'tilgan masofa (m/km), vaqt (mm:ss), o'rtacha tezlik (km/soat) va joriy koordinatalarni uzluksiz yangilash.
2. **Loop Closure (Aylana yopilishini aniqlash):** O'yinchi boshlagan nuqtasiga qaytib kelganda (yoki boshlang'ich marshrut bilan kesishganda), tizim yopiq poligon hosil bo'lganini avtomatik aniqlaydi va **«Loop Ready»** (Aylana tayyor!) indikatorini yoqadi.
3. **Closing Gap (Bo'shliqni yopish):** Agar yuguruvchi finish qilganida boshlang'ich nuqtaga 20-50 metr yetmay qolsa, server ruxsat etilgan radiusda chiziqni avtomatik ulab beradi.
4. **Lollipop Loop va 🚩 Bayroq (Anchor Flag):** Uydan 200–500 metr yugurib borib aylana hosil qilinganda, bayroqcha qadalgan nuqtadan keyingi aylana hududga aylanadi, boshidagi chiziq esa koridor bo'lib qoladi.
5. **Statsionar Drift Filtri:** Foydalanuvchi joyida to'xtab turganda (masalan, svetoforda) 0–2 metrli GPS tebranishi trekingni buzmasligi uchun statsionar shovqin avtomatik filtrlanadi.
6. **Multipath / Transport / Sakrash Filtri:** Tezligi 16 m/s (57.6 km/soat) dan oshgan yoki GPS signalining anomal sakrashlari (mashina, avtobus) avtomatik aniqlanib, trek rad etiladi.
7. **Oflayn Buferlash (Offline Buffer):** Internet aloqasi uzilib qolgan taqdirda, barcha koordinatalar qurilma xotirasida (IndexedDB) to'planadi va internet tiklanishi bilan avtomatik yuboriladi.
8. **Gibrid Mahalliy Fallback (Local Fallback):** Agar bulutli backend uxlayotgan yoki vaqtincha javob bermayotgan bo'lsa (`503`), frontenddagi Turf.js motori poligonni qurilmada mustaqil hisoblab, xaritada hududni darhol topshiradi.

### 3.2. Shahar Kartasi va Qizil Hisoblanmaydigan Hududlar (Exclusions)
1. **OpenFreeMap Positron Xaritasi:** Yuguruvchilarning neon rangli treklari va poligonlari eng tiniq ko'rinishi uchun optimallashtirilgan neytral uslub.
2. **Qizil Rangli Taqiqlangan Zonalar (Esaplanbaytuǵın jer):** Binolar, suv havzalari, xususiy mulklar, maktablar, shifoxonalar va harbiy ob'ektlar xaritada yorqin qizil rang bilan belgilangan.
3. **PostGIS ST_Difference:** Yugurib egallangan aylanadan qizil binolar va suvlar avtomatik kesib tashlanadi — foydalanuvchi faqat haqiqiy jismoniy yugurgan ochiq maydoni (ko'cha, xiyobon, stadion) uchun maydon oladi.
4. **Menyudan Boshqarish:** Xaritani ortiqcha yuklamaslik uchun ushbu qizil zonalarni ochish/yopish tugmasi qulay mobil menyuga (`MENYU`) joylashtirildi.
5. **Shahar Tanlash Tizimi:** Nukus, Toshkent, Samarqand, Buxoro va boshqa shaharlar bo'yicha markazlashtirilgan koordinatalar va chegaralar.

### 3.3. Foydalanuvchi Tizimi, Autentifikatsiya va Profil
1. **Unikal 8 xonali Player ID (masalan, `DS-849201`):** Murakkab parolsiz ham har bir o'yinchining shaxsiy identifikatori.
2. **2-Bosqichli Google Kirish (Google Account Chooser):** Foydalanuvchi bir tugma bilan Google akkauntini tanlaydi, so'ngra Nickname (o'yin nomi) va rangini tanlab darhol o'yinga kiradi.
3. **Kompyuterdagidek 2D Spektr Rang Tanlagich (`SpectrumColorPicker`):** 2D to'yinganlik/yorqinlik maydoni + kamalak ranglar slayderi + 20 ta tayyor neon palitra orqali o'z hudud rangini erkin tanlash.
4. **Avatar Yuklash va Siqish:** Rasm avtomatik ravishda 200x200 pikselga siqilib, tezkor yuklanadi.
5. **Maxfiylik Zonasi (Privacy Zone):** Foydalanuvchi o'z uyining 200 metr atrofidagi yugurish nuqtalarini xaritada hammaga ko'rsatmaslik funksiyasi.

### 3.4. Monetizatsiya va Obuna Tizimi (Subscription & 3-Day Trial)
1. **3 Kunlik Bepul Sinov (3-Day Free Trial):** Har bir yangi ro'yxatdan o'tgan foydalanuvchiga tizim tomonidan avtomatik ravishda 3 kun bepul to'liq kirish huquqi beriladi.
2. **Qat'iy Tarif Rejalari:**
   - **Kunlik:** 5,000 so'm;
   - **Haftalik:** 15,999 so'm;
   - **Oylik:** 30,999 so'm.
3. **Mahalliy To'lov Provayderlari UI:** Click, Payme va Uzum Bank tanlash oynasi.
4. **Avtomatik Tekshirish:** Obuna muddati tugagan paytda yangi yugurish boshlanishi bloklanadi va to'lov oynasi ochiladi.

### 3.5. Klanlar / Gildiyalar va Xarita Rejimlari
1. **Klan Yaratish va Qo'shilish:** 6 belgili unikal taklif kodi orqali do'stlar bilan jamoa tuzish.
2. **Solo va Klan Xarita Rejimlari:** Bir tugma bilan xaritani shaxsiy yuguruvchilar hududidan klanlararo hududlar xaritasiga o'tkazish.
3. **Klan Birlashuvi:** Klan a'zolarining egallagan maydonlari umumlashtirilib, shahar klanlari reytingida aks etadi.

### 3.6. Ijtimoiy Funksiyalar, Reyting va Jonli Chat
1. **Reyting Jadvali (Leaderboard):** Masofa (km) va egallangan maydon (m² / ga) bo'yicha shahar va global peshqadamlar jadvali.
2. **Yugurishlar Tariyxi (History):** Har bir yugurilgan sana, sarflangan vaqt, masofa va xaritada o'sha yugurilgan marshrutni ko'rish (`FlyTo` kamera).
3. **Jonli Shahar Chati (City Chat):** Har bir shahar yuguruvchilari uchun umumiy chat va xaritadagi koordinata havolalarini ulashish.
4. **Do'stlik va Bosqin Bildirishnomalari (Invasion Toast):** O'yinchining hududini boshqa birov bosib olganida real vaqtda ogohlantirish.

### 3.7. Android APK Native Ilovasi va QR Onboarding
1. **Capacitor 7 Native Android:** To'liq yig'ilgan `dontstop.apk` (18 MB).
2. **PhoneQr Vidjeti:** Veb-sayt ichida avtomatik ochiluvchi/skanerlanuvchi QR kod — telefon kamerasini tutish orqali to'g'ridan-to'g'ri APK ni o'rnatish.
3. **Notch va Safe Area:** Zamonaviy ekran kavislariga moslashgan to'liq ekranli interfeys.
4. **Avtomatik GPS Ruxsat:** Dastur ochilganda avtomatik GPS ruxsatini so'rash va xaritani foydalanuvchining ustiga olib borish.

### 3.8. Admin Boshqaruv Markazi (Admin Live Operations Center)
1. **Parol bilan himoyalangan kirish:** `dontstop-admin-2026`.
2. **Jonli monitoring (Live Runners):** Real vaqtda shaharda yugurayotgan barcha foydalanuvchilar, ularning onlayn holati, koordinatalari va treklari.
3. **Xaritani tozalash:** Bir tugma bilan xaritadagi hududlarni tozalash / reset qilish funksiyasi.

---

## 4. Nimalar Chala Ishlangan yoki Yaxshilanishi Kerak (Gap Analysis)

Loyihani to'liq tijoriy masshtabga (Scale & Go-To-Market) olib chiqish uchun quyidagi qismlarda rasmiy integratsiyalar talab etiladi:

| Qism / Modul | Hozirgi Holati (MVP) | Nima Chala / Nima Yaxshilanishi Kerak? |
| :--- | :--- | :--- |
| **To'lov Tizimlari (Click/Payme)** | Frontend modali va backend token generatsiyasi mavjud, test rejimida. | Rasmiy Click Shop va Payme Merchant shartnomalari imzolanmagan. Haqiqiy bank webhooklari (`Click Complete`, `Payme PerformTransaction`) ulanishi lozim. |
| **Google OAuth Rasmiy Kaliti** | Frontend 2-bosqichli akkaunt tanlagich va Gmail kiritish ishlamoqda. | Google Cloud Console orqali rasmiy OAuth Client ID va SHA-1 sertifikat kalitini ulab, bir marta bosishda Google tizim oynasidan tasdiqlash. |
| **Bulutli Server Uyqu Rejimi (Render Free)** | Render Free Tier 15 daqiqa harakatsizlikdan so'ng serverni uxlatadi (`503` / 50s wake up). | Loyihani pullik (Render Starter / Dedicated VPS $7-$15/oy) rejimga o'tkazish kerak, shunda server hech qachon uxlamaydi va 100% tezlikda ishlaydi. |
| **Push Bildirishnomalari (FCM)** | Ilova ochiq bo'lganda bildirishnomalar keladi (Invasion Toast). | Ilova butunlay yopiq bo'lganda ham telefonga xabar kelishi uchun Firebase Cloud Messaging (FCM) integratsiyasini ulash kerak. |
| **Google Play Store Nashri** | To'liq ishlovchi debug/release `.apk` fayllari mavjud. | Google Play Console akkaunti orqali rasmiy AAB (Android App Bundle), Play Keystore imzosi, Privacy Policy havolasi va do'konga yuklash. |

---

## 5. Nimalar Ishlashi Kerak — Keyingi Bosqich Rejasi (Roadmap)

### 5.1. 1-Ustuvor Vazifa: Rasmiy Billing Agregatorlarini Ishga Tushirish
1. **Click Merchant API:** `prepare` va `complete` webhooklarini backendga kiritish.
2. **Payme Business API:** `CheckPerformTransaction` va `PerformTransaction` tekshiruvlarini ulash.
3. Har bir to'langan 5 000 / 15 999 / 30 999 so'm to'lovdan so'ng avtomatik ravishda foydalanuvchining `subscription.expires_at` sanasini PostgreSQL bazasida uzaytirish.

### 5.2. 2-Ustuvor Vazifa: Google Play Market va Apple App Store Nashri
1. Google Play Console dasturchi akkauntini faollashtirish (bir martalik $25 to'lov).
2. Release AAB (Android App Bundle) paketini yig'ish va imzolash (`keytool` va Android Keystore).
3. Maxfiylik Siyosati (Privacy Policy) sahifasini joylashtirish va ilovani do'konga chiqarish.
4. Apple Developer akkaunt ($99/yil) orqali iOS versiyasini TestFlight va App Store da nashr qilish.

### 5.3. 3-Ustuvor Vazifa: O'yin Mexanikasi va Anti-Cheat Tizimini Kuchaytirish
1. **Sun'iy Intellekt / ML asosidagi Anti-cheat:** Mashina, skuter yoki Fake GPS dasturlarini tezlanish va yurak urishi kabi dinamik ko'rsatkichlar asosida avtomatik diskvalifikatsiya qilish.
2. **Ovozli Murabbiy (Audio Coach):** Yugurish paytida naushnik orqali «Muvaffaqiyatli! Siz 2,400 m² maydonni egalladingiz!» deb ovoz berish.
3. **Haftalik Klan Janglari (Guild Seasons):** Har yakshanba soat 20:00 da eng ko'p maydon egallagan klanlarga raqamli medallar va homiylik sovg'alarini topshirish.

### 5.4. 4-Ustuvor Vazifa: Infratuzilmani Mustahkamlash (Production Scaling)
1. Render.com da pullik Always-On server va PostgreSQL bazasini yoqish (uyqu xatolarini butunlay yo'q qilish).
2. CDN (Cloudflare) ulash: Plitalar (tiles) va statik resurslarni keshlab, mobil ilovada yuklanish tezligini 0.3 soniyaga tushirish.
3. Push Notifications (Firebase FCM): Foydalanuvchi ilovadan chiqqan bo'lsa ham uning maydoniga hujum bo'lganda ogohlantirish yuborish.

---

## 6. Ma'lumotlar Bazasi Sxemasi (Database Schema)

Loyiha PostgreSQL 16 va PostGIS fazoviy kengaytmasi bazasida qurilgan:

| Jadval Nomi | Asosiy Ustunlar | Vazifasi |
| :--- | :--- | :--- |
| **`users` / `players`** | `id, player_id, email, display_name, color_hex, city, avatar_data, created_at` | Foydalanuvchilar shaxsiy ma'lumotlari, tanlangan ranglari va profillari. |
| **`runs`** | `id, user_id, status, started_at, finished_at, distance_m, duration_s, track_geometry` | Har bir yugurish sessiyasi, to'plangan GPS nuqtalar va holati (`accepted`, `rejected`). |
| **`territories`** | `id, run_id, owner_id, clan_id, area_m2, polygon_geometry (GEOMETRY)` | Egallangan barcha hudud poligonlari, ularning maydoni va egalik huquqi. |
| **`clans`** | `id, name, tag, invite_code, color_hex, leader_id, total_area_m2` | Gildiyalar, ularning taklif kodlari va umumiy klan ko'rsatkichlari. |
| **`subscriptions`** | `id, user_id, plan, status, trial_until, expires_at, provider` | Foydalanuvchining 3 kunlik sinovi va pullik obunasi ma'lumotlari. |

---

## 7. Xulosa va Investitsiya / Marketing Tavsiyalari

«Don't Stop» loyihasi eng murakkab texnik bosqichdan — ya'ni fazoviy geometriya, PostGIS poligoni, real vaqtdagi GPS trekingi, oflayn chidamlilik va native APK yig'ilishidan 100% muvaffaqiyatli o'tdi. Hozirda ilova ishlayotgan jonli holatda turibdi va foydalanuvchilar yugurib hudud egallashlari mumkin.

Startup Base'da ko'rsatilgan $30,000 investitsiya va 50 nafar qiziqish bildiruvchilar bilan ishlashda ushbu Texnik Vazifa asosiy texnik va strategik hujjat bo'lib xizmat qiladi. Keyingi qadam — Click/Payme shartnomasini faollashtirish, serverni Always-On ga o'tkazish hamda Google Play Marketga chiqarish orqali 10,000+ faol o'yinchilarni jalb qilishdir.
