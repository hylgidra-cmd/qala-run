import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_tz_document():
    doc = docx.Document()
    
    # Page setup
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(40, 40, 40)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Colors
    PRIMARY = RGBColor(16, 120, 80)     # Dark Emerald
    ACCENT = RGBColor(0, 102, 204)       # Deep Blue
    DARK = RGBColor(25, 30, 28)
    MUTED = RGBColor(100, 100, 100)
    RED_ACCENT = RGBColor(200, 30, 30)

    # Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_sub = title_p.add_run("O'ZBEKISTON RESPUBLIKASI / QORAQALPOG'ISTON RESPUBLIKASI\nSTARTUP VA RAQAMLI EKOTIZIM LOYIHASI\n")
    run_sub.font.size = Pt(8.5)
    run_sub.font.bold = True
    run_sub.font.color.rgb = MUTED

    run_title = title_p.add_run("TEXNIK VAZIFA (TZ / TECHNICAL SPECIFICATION) v2.0\n")
    run_title.font.size = Pt(20)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY

    run_proj = title_p.add_run("LOYIHA: «DON'T STOP» (QALA RUN) — GAMIFIED FITNESS & REAL-TIME TERRITORY CAPTURE PLATFORM\n(VEB-PLATFORMA, ANDROID APK VA IOS GIBRID MOBIL ILOVASI)")
    run_proj.font.size = Pt(13)
    run_proj.font.bold = True
    run_proj.font.color.rgb = DARK

    # Meta Table
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Loyiha Nomi:", "Don't Stop (Qala Run)"),
        ("Hozirgi Bosqich:", "MVP (Pre-Seed) — Startup Base platformasida TASDIQLANGAN"),
        ("Tizim Platformalari:", "Web SPA (PWA), Android Native APK, iOS Web-Native tayyorgarligi, REST API"),
        ("Manba Kodi (GitHub):", "https://github.com/hylgidra-cmd/qala-run"),
        ("Jonli Veb-Sayt & API:", "https://qalarun-web.onrender.com | https://qalarun-api.onrender.com"),
        ("Hujjat Sanasi & Versiyasi:", "2026-yil 12-noyabr | Versiya 2.0 (To'liq tizimli)")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.6)
        set_cell_background(c0, "F0F4F2")
        set_cell_background(c1, "FAFAFA")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = DARK
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = PRIMARY
        # Add a subtle bottom border or separator
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        r_line = p.add_run("━" * 55)
        r_line.font.size = Pt(8)
        r_line.font.color.rgb = RGBColor(180, 210, 195)
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = ACCENT
        return h

    def add_h3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.size = Pt(10.5)
        r.font.bold = True
        r.font.color.rgb = DARK
        return h

    # SECTION 1
    add_h1("1. LOYIHA HAQIDA UMUMIY MA'LUMOT VA MAQSAD (EXECUTIVE SUMMARY)")
    p = doc.add_paragraph(
        "«Don't Stop» (Qala Run) — bu real hayotdagi jismoniy faollikni (yugurish va piyoda yurish) "
        "zamonaviy geolokatsion mobil o'yin (Gamified Fitness / Territory Capture) mexanikasi bilan birlashtiruvchi "
        "innovatsion raqamli platformadir. Foydalanuvchilar shahar bo'ylab yugurib, yopiq GPS trayektoriyasini (kontur/shenber) "
        "hosil qilganlarida, ushbu trayektoriya ichidagi maydon real vaqt rejimida hisoblab chiqiladi va xaritada "
        "o'yinchining shaxsiy (yoki klani/gildiyasi) rangi bilan bo'yalgan hududga aylanadi."
    )
    p = doc.add_paragraph(
        "Loyiha hozirgi kunda Startup Base platformasida «Tasdiqlangan» (Approved MVP) maqomiga ega bo'lib, "
        "mahsulotning texnik yechimi (Frontend, Backend, PostGIS fazoviy arxitekturasi, Android APK va sinovdan o'tgan algoritmlar) "
        "MVP bosqichidan to'liq o'tgan va Go-To-Market (Seed) hamda Scaling bosqichiga tayyorlangan."
    )

    # Status highlights table
    t_status = doc.add_table(rows=5, cols=3)
    t_status.alignment = WD_TABLE_ALIGNMENT.CENTER
    status_headers = ["Bosqich", "Holat", "Tavsif va Natija"]
    for j, h_text in enumerate(status_headers):
        c = t_status.rows[0].cells[j]
        set_cell_background(c, "0F4C3A")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)
    
    stages = [
        ("1. Idea (G'oya)", "Bajarilgan (100%)", "Muammo va yechim aniqlangan, gamifikatsiya va shahar hududlarini egallash konsepsiyasi shakllangan."),
        ("2. MVP (Pre-Seed)", "Bajarilgan (100%)", "Ishlaydigan veb-platforma, Capacitor Android APK, PostGIS hisob-kitob yadrosi va dastlabki foydalanuvchilar sinovi."),
        ("3. Go To Market (Seed)", "Tayyorgarlikda (Hozirgi maqsad)", "Mahsulotni Play Market va App Store ga chiqarish, Click/Payme billing agregatorlarini to'liq ulash, ommaviy marketing."),
        ("4. Scale & Expansion", "Rejalashtirilgan", "O'zbekistonning barcha viloyatlariga va xorijiy shaharlarga kengayish, yirik brendlar homiylik aksiyalari.")
    ]
    for i, row_data in enumerate(stages):
        row = t_status.rows[i+1]
        for j, val in enumerate(row_data):
            c = row.cells[j]
            set_cell_background(c, "F9FBF9" if i % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if j == 1:
                r.font.bold = True
                if "Bajarilgan" in val:
                    r.font.color.rgb = PRIMARY
                elif "Tayyorgarlikda" in val:
                    r.font.color.rgb = ACCENT

    # SECTION 2
    add_h1("2. TIZIM ARXITEKTURASI VA TEXNOLOGIK STEK")
    doc.add_paragraph(
        "Tizim modulli mikro-arxitektura tamoyillariga asoslangan bo'lib, yuqori yuklamalarga chidamli, "
        "oflayn rejimda ishlash qobiliyatiga ega va kross-platforma xususiyatiga ega."
    )

    t_tech = doc.add_table(rows=7, cols=3)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_headers = ["Qatlam (Layer)", "Texnologiya va Versiya", "Funksional Vazifasi"]
    for j, h_text in enumerate(tech_headers):
        c = t_tech.rows[0].cells[j]
        set_cell_background(c, "1A365D")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)

    tech_stack = [
        ("Frontend Veb SPA", "React 19, TypeScript, Vite 6, CSS3 (Cyberpunk/Neon)", "Foydalanuvchi interfeysi, tezkor render, ko'p tillilik (Qoraqalpoq, O'zbek, Rus, Ingliz), responsiv dizayn."),
        ("Xarita & Fazoviy Render", "MapLibre GL JS, Turf.js, OpenFreeMap Positron", "Vektor plitalar, 60 FPS silliq harakat, real vaqtda GPS chizig'i va hudud poligonlarini chizish."),
        ("Mobil Qobiq (Native Bridge)", "Capacitor 7, Android Studio SDK, Gradle 8.11", "Web kodni haqiqiy Android (.apk / .aab) ga o'rash, doimiy fon GPS xizmati (Foreground Service), Haptics vibratsiyasi."),
        ("Backend REST API", "FastAPI (Python 3.12, async/await), Uvicorn", "Yuqori tezlikdagi asinxron API, GPS koordinatalarni validatsiya qilish, klanlar, to'lovlar va admin nazorati."),
        ("Geometriya & Ma'lumotlar Bazasi", "PostgreSQL 16 + PostGIS 3.4 (asyncpg, SQLAlchemy 2)", "Poligonlarni birlashtirish va kesish (ST_Difference, ST_Union, ST_Area, ST_Contains), fazoviy indekslar (GIST)."),
        ("Kesh & Jonli Xabarlar", "Redis 7.2 (aioredis)", "Jonli GPS tracking, real vaqtdagi yuguruvchilar lokatsiyasi, shahar chati va tezkor kesh.")
    ]
    for i, row_data in enumerate(tech_stack):
        row = t_tech.rows[i+1]
        for j, val in enumerate(row_data):
            c = row.cells[j]
            set_cell_background(c, "F7FAFC" if i % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if j == 0:
                r.font.bold = True

    # SECTION 3
    add_h1("3. AMALGA OSHIRILGAN VA TO'LIQ ISHLAB TURGAN FUNKSIYALAR")
    doc.add_paragraph(
        "Loyiha doirasida quyidagi murakkab algoritmlar, interfeyslar va platformalar 100% ishlab chiqilgan, "
        "sinovdan o'tkazilgan va jonli serverda ishlab turibdi:"
    )

    add_h2("3.1. GPS Yugurish va Poligon Egallash Yadrosi (Run Tracking & Loop Engine)")
    features_loop = [
        "Real vaqt rejimida GPS koordinatalarni yozib borish, umumiy masofa (m/km), tezlik (km/soat) va davomiylik vaqtini hisoblash.",
        "Loop Closure (Yopiq sikl aniqlash): O'yinchi boshlagan nuqtasiga qaytib kelganda (yoki boshlang'ich marshrut bilan kesishganda), algoritm poligon hosil bo'lganini avtomatik aniqlaydi va «Loop Ready» indikatorini yoqadi.",
        "Server-side Closing Gap: Agar yuguruvchi boshlang'ich nuqtasiga bir necha o'n metr yetmasdan finish qilsa, ruxsat etilgan me'yorda server chiziqni avtomatik ulab beradi.",
        "Lollipop Loop & Bayroq (Anchor Flag): Uydan ma'lum masofagacha yugurib borib, keyin aylana yugurilganda, bayroqcha qadalgan nuqtadan keyingi aylana hududga aylanadi, boshidagi chiziq esa koridor bo'lib qoladi.",
        "Statsionar Drift Filtri: Foydalanuvchi svetoforda yoki joyida to'xtab turganda GPS tebranishi (0–2 metr) treking sifatini buzmasligi uchun statsionar shovqin avtomatik filtrlanadi.",
        "Multipath / Transport / Teleportatsiya Filtri: Tezligi 16 m/s (57.6 km/soat) dan oshgan yoki anomal sakrash bo'lgan nuqtalar avtomobil yoki transport deb topilib, yaroqsiz qilinadi.",
        "Oflayn Buferlash (Offline Buffer): Internet aloqasi uzilib qolgan taqdirda, barcha koordinatalar qurilma xotirasida (IndexedDB) xavfsiz to'planadi va internet tiklanishi bilan avtomatik yuboriladi.",
        "Gibrid Mahalliy Fallback (Local Fallback): Agar bulutli server uxlayotgan yoki javob bermayotgan holatda ham, frontenddagi Turf.js motori poligonni qurilmada mustaqil hisoblab, foydalanuvchiga hududni darhol topshiradi."
    ]
    for feat in features_loop:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.2. Shahar Kartasi va Qizil Hisoblanmaydigan Hududlar (Exclusions)")
    features_map = [
        "OpenFreeMap Positron neytral xarita uslubi: O'yinchilarning neon rangli treklari va poligonlari xaritada eng yorqin va tiniq ko'rinishi uchun optimallashtirilgan.",
        "Qizil Rangli Taqiqlangan Zonalar (Esaplanbaytuǵın jer): Binolar, suv havzalari, xususiy mulklar, maktablar, shifoxonalar va harbiy ob'ektlar xaritada yorqin qizil rang bilan belgilangan.",
        "PostGIS ST_Difference: Yugurib egallangan aylanadan qizil binolar va suvlar avtomatik kesib tashlanadi — foydalanuvchi faqat haqiqiy jismoniy yugurgan ochiq maydoni (ko'cha, xiyobon, stadion) uchun ball oladi.",
        "Menyudan Boshqarish: Foydalanuvchi chalg'imasligi uchun ushbu qizil zonalarni ochish/yopish tugmasi qulay mobil menyuga joylashtirildi.",
        "Shahar tanlash tizimi: Nukus, Toshkent, Samarqand, Buxoro va boshqa shaharlar bo'yicha markazlashtirilgan koordinatalar va bounding box (chegaralar)."
    ]
    for feat in features_map:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.3. Foydalanuvchi Tizimi, Autentifikatsiya va Profil")
    features_auth = [
        "Unikal 8 xonali Player ID (masalan, DS-849201): Hech qanday murakkab parolsiz ham har bir o'yinchining shaxsiy identifikatori.",
        "2-Bosqichli Google Kirish (Google Account Chooser): Foydalanuvchi bir tugma bilan o'zining Google akkauntini tanlaydi, so'ngra Nickname (o'yin ismi) va rangini tanlab darhol o'yinga kiradi.",
        "Kompyuterdagidek 2D Spektr Rang Tanlagich (SpectrumColorPicker): 2D to'yinganlik/yorqinlik maydoni + kamalak ranglar slayderi + 20 ta tayyor neon palitra orqali minglab ranglardan o'z hudud rangini tanlash.",
        "Avatar yuklash va siqish: Rasm avtomatik ravishda 200x200 pikselga siqilib, tezkor yuklanadi.",
        "Maxfiylik Zonasi (Privacy Zone): Foydalanuvchi o'z uyining 200 metr atrofidagi yugurish nuqtalarini xaritada hammaga ko'rsatmaslik funksiyasi."
    ]
    for feat in features_auth:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.4. Monetizatsiya va Obuna Tizimi (Subscription & 3-Day Trial)")
    features_sub = [
        "3 Kunlik Bepul Sinov (3-Day Free Trial): Har bir yangi ro'yxatdan o'tgan foydalanuvchiga tizim tomonidan avtomatik ravishda 3 kun bepul to'liq kirish huquqi beriladi.",
        "Qat'iy Tarif Rejalari: Kunlik — 5,000 so'm | Haftalik — 15,999 so'm | Oylik — 30,999 so'm.",
        "Mahalliy To'lov Provayderlari UI: Click, Payme va Uzum Bank tanlash oynasi.",
        "Avtomatik Tekshirish: Obuna muddati tugagan paytda yangi yugurish boshlanishi bloklanadi va to'lov oynasi ochiladi."
    ]
    for feat in features_sub:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.5. Klanlar / Gildiyalar va Xarita Rejimlari")
    features_clan = [
        "Klan Yaratish va Qo'shilish: 6 belgili unikal taklif kodi orqali do'stlar bilan jamoa tuzish.",
        "Solo va Klan Xarita Rejimlari: Bir tugma bilan xaritani shaxsiy yuguruvchilar hududidan klanlararo hududlar xaritasiga o'tkazish.",
        "Klan Birlashuvi: Klan a'zolarining egallagan maydonlari umumlashtirilib, shahar klanlari reytingida aks etadi."
    ]
    for feat in features_clan:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.6. Ijtimoiy Funksiyalar, Reyting va Jonli Chat")
    features_social = [
        "Reyting Jadvali (Leaderboard): Masofa (km) va egallangan maydon (m² / ga) bo'yicha shahar va global peshqadamlar jadvali.",
        "Yugurishlar Tariyxi (History): Har bir yugurilgan sana, sarflangan vaqt, masofa va xaritada o'sha yugurilgan marshrutni ko'rish (FlyTo kamera).",
        "Jonli Shahar Chati (City Chat): Har bir shahar yuguruvchilari uchun umumiy chat va xaritadagi koordinata havolalarini ulashish.",
        "Do'stlik va Bosqin Bildirishnomalari (Invasion Toast): O'yinchining hududini boshqa birov bosib olganida real vaqtda ogohlantirish."
    ]
    for feat in features_social:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.7. Android APK Native Ilovasi va QR Onboarding")
    features_apk = [
        "Capacitor 7 Native Android qobig'i bilan to'liq yig'ilgan `dontstop.apk` (18 MB).",
        "Veb-sayt ichida avtomatik ochiluvchi/skanerlanuvchi PhoneQr vidjeti — kamerani tutish orqali to'g'ridan-to'g'ri APK ni telefonga o'rnatish.",
        "Notch va ekran kavislariga moslashgan Safe Area to'liq ekranli dizayn.",
        "Dastur ochilganda avtomatik GPS ruxsatini so'rash va kamerani foydalanuvchining ustiga olib borish."
    ]
    for feat in features_apk:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    add_h2("3.8. Admin Boshqaruv Markazi (Admin Live Operations Center)")
    features_admin = [
        "Parolli himoyalangan kirish (`dontstop-admin-2026`).",
        "Real vaqtda shaharda yugurayotgan barcha foydalanuvchilar (Live Runners), ularning onlayn holati, koordinatalari va jonli treklari.",
        "Bir tugma bilan xaritani qayta tozalash / reset qilish funksiyasi."
    ]
    for feat in features_admin:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(2)
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(feat)
        r.font.size = Pt(9.5)

    # SECTION 4
    add_h1("4. NIMALAR CHALA ISHLANGAN YOKI YAXSHILANISHI KERAK (GAP ANALYSIS)")
    doc.add_paragraph(
        "Loyihani to'liq tijoriy masshtabga (Scale & Go-To-Market) olib chiqish uchun quyidagi qismlarda "
        "yaxshilanish va rasmiy integratsiyalar talab etiladi:"
    )

    t_gaps = doc.add_table(rows=6, cols=3)
    t_gaps.alignment = WD_TABLE_ALIGNMENT.CENTER
    gap_headers = ["Qism / Modul", "Hozirgi Holati (MVP)", "Nima Chala / Nima Yaxshilanishi Kerak?"]
    for j, h_text in enumerate(gap_headers):
        c = t_gaps.rows[0].cells[j]
        set_cell_background(c, "742A2A")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)

    gaps = [
        ("To'lov Tizimlari (Click/Payme)", "Frontend modali va backend token generatsiyasi mavjud, test rejimida.", "Rasmiy Click Shop va Payme Merchant shartnomalari imzolanmagan. Haqiqiy bank webhooklari (Click Complete, Payme PerformTransaction) ulanishi lozim."),
        ("Google OAuth Rasmiy Kaliti", "Frontend 2-bosqichli akkaunt tanlagich va Gmail kiritish ishlamoqda.", "Google Cloud Console orqali rasmiy OAuth Client ID va SHA-1 sertifikat kalitini ulab, bir marta bosishda Google tizim oynasidan tasdiqlash."),
        ("Bulutli Server Uyqu Rejimi (Render Free)", "Render Free Tier 15 daqiqa harakatsizlikdan so'ng serverni uxlatadi (503 / 50s wake up).", "Loyihani pullik (Render Starter / Dedicated VPS $7-$15/oy) rejimga o'tkazish kerak, shunda server hech qachon uxlamaydi va 100% tezlikda ishlaydi."),
        ("Push Bildirishnomalari (FCM)", "Ilova ochiq bo'lganda bildirishnomalar keladi (Invasion Toast).", "Ilova butunlay yopiq bo'lganda ham telefonga xabar kelishi uchun Firebase Cloud Messaging (FCM) integratsiyasini ulash kerak."),
        ("Google Play Store nashri", "To'liq ishlovchi debug/release .apk fayllari mavjud.", "Google Play Console akkaunti orqali rasmiy AAB (Android App Bundle), Play Keystore imzosi, Privacy Policy havolasi va do'konga yuklash.")
    ]
    for i, row_data in enumerate(gaps):
        row = t_gaps.rows[i+1]
        for j, val in enumerate(row_data):
            c = row.cells[j]
            set_cell_background(c, "FFF5F5" if i % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if j == 0:
                r.font.bold = True
            if j == 2:
                r.font.color.rgb = RED_ACCENT

    # SECTION 5
    add_h1("5. NIMALAR ISHLASHI KERAK — KEYINGI BOSQICH REJASI (ROADMAP)")
    doc.add_paragraph(
        "Startapning keyingi bosqichda investitsiya jalb qilishi va o'n minglab faol yuguruvchilarni qamrab olishi uchun "
        "amalga oshirilishi lozim bo'lgan ustuvor vazifalar:"
    )

    add_h2("5.1. 1-Ustuvor Vazifa: Rasmiy Billing Agregatorlarini Ishga Tushirish")
    doc.add_paragraph(
        "1. Click Merchant API integratsiyasi: `prepare` va `complete` webhooklarini backendga kiritish.\n"
        "2. Payme Business API: `CheckPerformTransaction` va `PerformTransaction` tekshiruvlarini ulash.\n"
        "3. Har bir to'langan 5 000 / 15 999 / 30 999 so'm to'lovdan so'ng avtomatik ravishda foydalanuvchining "
        "`subscription.expires_at` sanasini PostgreSQL bazasida uzaytirish."
    )

    add_h2("5.2. 2-Ustuvor Vazifa: Google Play Market va Apple App Store Nashri")
    doc.add_paragraph(
        "1. Google Play Console dasturchi akkauntini faollashtirish (bir martalik $25 to'lov).\n"
        "2. Release AAB (Android App Bundle) paketini yig'ish va imzolash (`keytool` va Android Keystore).\n"
        "3. Maxfiylik Siyosati (Privacy Policy) sahifasini joylashtirish va ilovani do'konga chiqarish.\n"
        "4. Apple Developer akkaunt ($99/yil) orqali iOS versiyasini TestFlight va App Store da nashr qilish."
    )

    add_h2("5.3. 3-Ustuvor Vazifa: O'yin Mexanikasi va Anti-Cheat Tizimini Kuchaytirish")
    doc.add_paragraph(
        "1. Sun'iy intellekt / ML asosidagi Anti-cheat: Mashina, skuter yoki Fake GPS dasturlarini tezlanish va yurak urishi "
        "kabi dinamik ko'rsatkichlar asosida avtomatik diskvalifikatsiya qilish.\n"
        "2. Ovozli Murabbiy (Audio Coach): Yugurish paytida naushnik orqali «Muvaffaqiyatli! Siz 2,400 m² maydonni egalladingiz!» deb ovoz berish.\n"
        "3. Haftalik Klan Janglari (Guild Seasons): Har yakshanba soat 20:00 da eng ko'p maydon egallagan klanlarga raqamli medallar va homiylik sovg'alarini topshirish."
    )

    add_h2("5.4. 4-Ustuvor Vazifa: Infratuzilmani Mustahkamlash (Production Scaling)")
    doc.add_paragraph(
        "1. Render.com da pullik Always-On server va PostgreSQL bazasini yoqish (uyqu xatolarini butunlay yo'q qilish).\n"
        "2. CDN (Cloudflare) ulash: Plitalar (tiles) va statik resurslarni keshlab, mobil ilovada yuklanish tezligini 0.3 soniyaga tushirish.\n"
        "3. Push Notifications (Firebase FCM): Foydalanuvchi ilovadan chiqqan bo'lsa ham uning maydoniga hujum bo'lganda ogohlantirish yuborish."
    )

    # SECTION 6
    add_h1("6. MA'LUMOTLAR BAZASI SXEMASI VA ASOSIY JADVALLAR")
    doc.add_paragraph(
        "Loyiha PostgreSQL 16 va PostGIS fazoviy kengaytmasi bazasida qurilgan. Quyida asosiy ma'lumotlar sxemasi keltirilgan:"
    )

    t_db = doc.add_table(rows=6, cols=3)
    t_db.alignment = WD_TABLE_ALIGNMENT.CENTER
    db_headers = ["Jadval Nomi", "Asosiy Ustunlar", "Vazifasi"]
    for j, h_text in enumerate(db_headers):
        c = t_db.rows[0].cells[j]
        set_cell_background(c, "2C3E50")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        r.font.size = Pt(9.5)

    db_tables = [
        ("users / players", "id, player_id, email, display_name, color_hex, city, avatar_data, created_at", "Foydalanuvchilar shaxsiy ma'lumotlari, tanlangan ranglari va profillari."),
        ("runs", "id, user_id, status, started_at, finished_at, distance_m, duration_s, track_geometry", "Har bir yugurish sessiyasi, to'plangan GPS nuqtalar va holati (accepted, rejected)."),
        ("territories", "id, run_id, owner_id, clan_id, area_m2, polygon_geometry (GEOMETRY)", "Egallangan barcha hudud poligonlari, ularning maydoni va egalik huquqi."),
        ("clans", "id, name, tag, invite_code, color_hex, leader_id, total_area_m2", "Gildiyalar, ularning taklif kodlari va umumiy klan ko'rsatkichlari."),
        ("subscriptions", "id, user_id, plan (daily/weekly/monthly), status, trial_until, expires_at, provider", "Foydalanuvchining 3 kunlik sinovi va pullik obunasi ma'lumotlari.")
    ]
    for i, row_data in enumerate(db_tables):
        row = t_db.rows[i+1]
        for j, val in enumerate(row_data):
            c = row.cells[j]
            set_cell_background(c, "F8F9FA" if i % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 60, 60, 100, 100)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9)
            if j == 0:
                r.font.bold = True

    # SECTION 7
    add_h1("7. XULOSA VA INVESTITSIYA / MARKETING TAVSIYALARI")
    doc.add_paragraph(
        "«Don't Stop» loyihasi eng qiyin texnik bosqichdan — ya'ni fazoviy geometriya, PostGIS poligoni, "
        "real vaqtdagi GPS trekingi, oflayn chidamlilik va native APK yig'ilishidan 100% muvaffaqiyatli o'tdi. "
        "Hozirda ilova ishlayotgan jonli holatda turibdi va foydalanuvchilar yugurib hudud egallashlari mumkin."
    )
    doc.add_paragraph(
        "Startup Base'da ko'rsatilgan $30,000 investitsiya va 50 nafar qiziqish bildiruvchilar bilan ishlashda "
        "ushbu Texnik Vazifa asosiy hujjat hisoblanadi. Keyingi qadam — Click/Payme shartnomasini faollashtirish, "
        "serverni Always-On ga o'tkazish hamda Google Play Marketga chiqarish orqali 10,000+ o'yinchilarni jalb qilishdir."
    )

    # Signatures block
    doc.add_paragraph().paragraph_format.space_after = Pt(20)
    sig_p = doc.add_paragraph()
    sig_p.paragraph_format.keep_with_next = True
    r_sig1 = sig_p.add_run("Texnik Vazifani Tayyorladi: ")
    r_sig1.font.bold = True
    sig_p.add_run("Bosh Arxitektor / Lead Engineer\n")
    r_sig2 = sig_p.add_run("Tasdiqladi (Loyiha Rahbari): ")
    r_sig2.font.bold = True
    sig_p.add_run("Madiyar (Don't Stop Founder)\n")
    r_sig3 = sig_p.add_run("Sana: ")
    r_sig3.font.bold = True
    sig_p.add_run("2026-yil 12-noyabr\n")

    # Output paths
    docs_dir = os.path.abspath("docs")
    os.makedirs(docs_dir, exist_ok=True)
    out_docx_path = os.path.join(docs_dir, "TEXNIK_VAZIFA_DONT_STOP_V2.0.docx")
    public_docx_path = os.path.abspath(os.path.join("frontend", "public", "TEXNIK_VAZIFA_DONT_STOP.docx"))

    doc.save(out_docx_path)
    doc.save(public_docx_path)
    print(f"Saved docx to: {out_docx_path}")
    print(f"Saved docx to: {public_docx_path}")

if __name__ == "__main__":
    create_tz_document()
