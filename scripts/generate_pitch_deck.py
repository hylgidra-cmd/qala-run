import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_paths):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    C_BG = RGBColor(13, 31, 26)        # #0D1F1A (Deep Dark Forest)
    C_CARD = RGBColor(18, 43, 36)      # #122B24 (Card Background)
    C_CARD_LIGHT = RGBColor(25, 59, 49) # #193B31
    C_MINT = RGBColor(0, 229, 153)     # #00E599 (Accent Mint)
    C_CYAN = RGBColor(0, 229, 255)     # #00E5FF (Accent Cyan)
    C_GOLD = RGBColor(255, 184, 0)     # #FFB800 (Accent Gold)
    C_WHITE = RGBColor(255, 255, 255)  # #FFFFFF
    C_MUTED = RGBColor(167, 189, 180)  # #A7BDB4 (Muted Greenish Gray)
    C_RED = RGBColor(255, 75, 75)       # #FF4B4B

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = C_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, subtitle_text=None):
        # Tag Badge
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(8), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_MINT

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = C_WHITE

        if subtitle_text:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.55), Inches(11.5), Inches(0.5))
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = C_MUTED

    def add_card(slide, left, top, width, height, title, subtitle="", bg_color=C_CARD, border_color=None):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        if border_color:
            shape.line.color.rgb = border_color
            shape.line.width = Pt(1.5)
        else:
            shape.line.fill.background()

        if title or subtitle:
            tx = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), height - Inches(0.3))
            tf = tx.text_frame
            tf.word_wrap = True
            if title:
                p1 = tf.paragraphs[0]
                p1.text = title
                p1.font.size = Pt(14)
                p1.font.bold = True
                p1.font.color.rgb = C_WHITE
            if subtitle:
                p2 = tf.add_paragraph()
                p2.text = subtitle
                p2.font.size = Pt(11)
                p2.font.color.rgb = C_MUTED
                p2.space_before = Pt(4)
        return shape

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 1: COVER
    # ══════════════════════════════════════════════════════════════════════
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1)

    # Decorative glow card in center
    glow = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.2), Inches(10.333), Inches(5.1))
    glow.fill.solid()
    glow.fill.fore_color.rgb = C_CARD
    glow.line.color.rgb = C_MINT
    glow.line.width = Pt(2)

    # Brand badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.6), Inches(3.7), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = C_CARD_LIGHT
    badge.line.color.rgb = C_GOLD
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = "⚡ PRE-SEED PITCH DECK • 2026"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = C_GOLD

    # Title & Subtitle
    t_box = s1.shapes.add_textbox(Inches(2.0), Inches(2.3), Inches(9.333), Inches(2.2))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "DON'T STOP"
    p.font.size = Pt(54)
    p.font.bold = True
    p.font.color.rgb = C_MINT

    p_sub = tf.add_paragraph()
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.text = "Shahar sen bilan o'ynaydi: Real Geolocation Territory Capture Game"
    p_sub.font.size = Pt(20)
    p_sub.font.bold = True
    p_sub.font.color.rgb = C_WHITE
    p_sub.space_before = Pt(8)

    p_desc = tf.add_paragraph()
    p_desc.alignment = PP_ALIGN.CENTER
    p_desc.text = "Yugurish, yurish va jamoaviy raqobatni birlashtiruvchi real-vaqtdagi strategik platforma"
    p_desc.font.size = Pt(14)
    p_desc.font.color.rgb = C_MUTED
    p_desc.space_before = Pt(10)

    # Bottom Pill Badges
    pills = [
        ("📍 4 ta Shaharda Faol", C_CYAN),
        ("🛡️ 10 kishilik Gildiyalar", C_MINT),
        ("📱 Android APK + Web Live", C_GOLD),
        ("🚀 Pre-Seed Bosqichi", C_WHITE)
    ]
    for i, (text, col) in enumerate(pills):
        px = Inches(2.0 + i * 2.4)
        sh = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px, Inches(5.1), Inches(2.2), Inches(0.55))
        sh.fill.solid()
        sh.fill.fore_color.rgb = C_CARD_LIGHT
        sh.line.color.rgb = col
        sh.line.width = Pt(1)
        tf_p = sh.text_frame
        pp = tf_p.paragraphs[0]
        pp.alignment = PP_ALIGN.CENTER
        pp.text = text
        pp.font.size = Pt(11)
        pp.font.bold = True
        pp.font.color.rgb = col

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 2: EXECUTIVE SUMMARY & NOYOB QIYMAT TAKLIFI (UVP)
    # ══════════════════════════════════════════════════════════════════════
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "Umumiy Ko'rinish", "Loyihaning Asosiy Mohiyati va Noyob Qiymati", "Sport va geymifikatsiyaning kesishmasidagi yangi avlod mobil o'yini")

    # 3 Large Cards
    cards_s2 = [
        ("🎯 Missiya", 
         "Yugurish va sog'lom turmush tarzini qiziqarli shahar kiber-sportiga aylantirish. Yoshlarni xonada video o'yin o'ynash o'rniga, ko'chada haqiqiy hududlar uchun bellashishga ilhomlantirish.",
         C_MINT),
        ("⭐ Noyob Qiymat Taklifi (UVP)",
         "Faqat quruq statistika ko'rsatuvchi odatiy ilovalardan (Strava, Nike) farqli ravishda, Don't Stop har bir yugurilgan metrni xaritadagi m² hududga va jamoaviy g'alabaga aylantiradi.",
         C_CYAN),
        ("🔥 Hozirgi Holat & Tayyorgarlik",
         "Loyiha to'liq ishlaydigan MVP holatida: PostGIS fazoviy arxitekturasi, Render serverlari, Live Web xaritasi va 5.1 MB hajmli Android ilovasi (APK) tayyor va sinovdan o'tgan.",
         C_GOLD),
    ]
    for i, (ctitle, cdesc, ccolor) in enumerate(cards_s2):
        cx = Inches(0.8 + i * 3.9)
        c = add_card(s2, cx, Inches(2.2), Inches(3.7), Inches(4.5), ctitle, "", C_CARD, ccolor)
        tb = s2.shapes.add_textbox(cx + Inches(0.25), Inches(3.0), Inches(3.2), Inches(3.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = cdesc
        p.font.size = Pt(13)
        p.font.color.rgb = C_WHITE
        p.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 3: PROBLEM (MUAMMO)
    # ══════════════════════════════════════════════════════════════════════
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "Bozor Muammosi", "Biz Qaysi Og'riqli Muammolarni Hal Qilamiz?", "Zamonaviy shahar aholisi va yoshlar oldidagi 3 ta asosiy to'siq")

    problems = [
        ("01", "Motivatsiya Yetishmasligi va Zerikarlilik",
         "Odamlarning 78%i yugurishni boshlagach, 2-3 haftada tashlab ketadi. Yolg'iz yugurish zerikarli va uzoq muddatli qiziqish uyg'otmaydi.",
         C_RED),
        ("02", "Mavjud Ilovalarning Bir Xilligi",
         "Strava, Nike Run Club yoki Garmin kabi gigantlar faqat quruq raqamlar (tezlik, kilometr, yurak urishi) ko'rsatadi. Ularda raqobat va o'yin mexanikasi yo'q.",
         C_GOLD),
        ("03", "Yoshlar Kamharakatligi (Gipodinamiya)",
         "Yosh avlod kuniga 4-6 soatini kompyuter va mobil o'yinlar qarshisida o'tkazmoqda. Ular real hayotda harakatlanish uchun yetarli rag'bat topa olmayapti.",
         C_CYAN)
    ]
    for i, (num, p_title, p_desc, col) in enumerate(problems):
        py = Inches(2.2 + i * 1.55)
        card = add_card(s3, Inches(0.8), py, Inches(11.733), Inches(1.35), "", "", C_CARD, col)
        
        # Num Badge
        nb = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.1), py + Inches(0.2), Inches(1.0), Inches(0.95))
        nb.fill.solid()
        nb.fill.fore_color.rgb = C_CARD_LIGHT
        nb.line.color.rgb = col
        nb.line.width = Pt(1.5)
        p_n = nb.text_frame.paragraphs[0]
        p_n.alignment = PP_ALIGN.CENTER
        p_n.text = num
        p_n.font.size = Pt(20)
        p_n.font.bold = True
        p_n.font.color.rgb = col

        # Text
        tx = s3.shapes.add_textbox(Inches(2.3), py + Inches(0.15), Inches(10.0), Inches(1.0))
        tf = tx.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = p_title
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(4)

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 4: SOLUTION & PRODUCT (YECHIM VA MAHSULOT)
    # ══════════════════════════════════════════════════════════════════════
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "Bizning Yechimimiz", "Don't Stop — Shahar Ko'chalaridagi Haqiqiy Strategiya", "O'yin hayajoni + Jismoniy faollik + Jamoaviy g'urur")

    features = [
        ("🗺️ Loop Capture (Hudud Egallash)", "GPS orqali yopiq halqa chizib yugurasiz. Ichidagi butun maydon (m²) bir zumda sizniki yoki gildiyangizniki bo'ladi.", C_MINT),
        ("🛡️ 10 Kishilik Gildiyalar", "Har bir gildiyada maksimal 10 o'yinchi, unikal [TAG] va 10 ta vektor gerb. Katta jamoalar emas, faol guruhlar g'olib bo'ladi.", C_CYAN),
        ("🚩 Bayroq Qadash (Anchor Flag)", "Yugurish boshida strategik joyga bayroq qadab, keyin aylanib kelsangiz, tizim boshlang'ich yo'lni saqlab halqani aniq yopadi.", C_GOLD),
        ("🎨 GPS-Art & Iz Ko'rish", "Yugurgan yo'lingiz shahar xaritasida san'at asariga aylanadi. Tarix modalida bosib o'tilgan izlarni qayta tomosha qilish imkoniyati.", C_WHITE),
    ]
    for i, (ftitle, fdesc, fcol) in enumerate(features):
        row = i // 2
        col = i % 2
        fx = Inches(0.8 + col * 5.95)
        fy = Inches(2.2 + row * 2.35)
        add_card(s4, fx, fy, Inches(5.75), Inches(2.15), ftitle, "", C_CARD, fcol)
        
        tb = s4.shapes.add_textbox(fx + Inches(0.25), fy + Inches(0.8), Inches(5.25), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = fdesc
        p.font.size = Pt(13)
        p.font.color.rgb = C_MUTED
        p.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 5: GAMEPLAY LOGIC (QANDAY ISHLAYDI?)
    # ══════════════════════════════════════════════════════════════════════
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, "O'yin Jarayoni", "Hududni Egallashning 4 Ta Oddiy Qadami", "O'yinchi uchun qulay, orqa fonda esa qat'iy geodezik hisob-kitoblar")

    steps = [
        ("QADAM 1", "Marshrutni Tanlang", "Ilovada xaritani ochasiz, shahringizdagi o'zingiz egallamoqchi bo'lgan kvartal yoki ko'chalarni belgilaysiz.", C_CYAN),
        ("QADAM 2", "Yugurishni Boshlang", "Start tugmasini bosib harakatlanasiz. GPS koordinatalari real vaqtda orqa fonda ekranni o'chirgan holda ham yoziladi.", C_MINT),
        ("QADAM 3", "Halqani Yoping", "Boshlagan nuqtangizga qaytib kelasiz yoki Lollipop algoritmi orqali yopiq halqa hosil qilib, Finish tugmasini bosasiz.", C_GOLD),
        ("QADAM 4", "Hudud Sizniki!", "Tizim binolar va xususiy joylarni avtomatik chiqarib tashlab, toza yer maydonini (m²) hisoblaydi va reytingga qo'shadi.", C_WHITE),
    ]
    for i, (step_num, step_title, step_desc, col) in enumerate(steps):
        sx = Inches(0.8 + i * 2.95)
        add_card(s5, sx, Inches(2.2), Inches(2.8), Inches(4.5), "", "", C_CARD, col)

        # Step Pill
        sp = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, sx + Inches(0.2), Inches(2.4), Inches(2.4), Inches(0.45))
        sp.fill.solid()
        sp.fill.fore_color.rgb = C_CARD_LIGHT
        sp.line.color.rgb = col
        p_sp = sp.text_frame.paragraphs[0]
        p_sp.alignment = PP_ALIGN.CENTER
        p_sp.text = step_num
        p_sp.font.size = Pt(11)
        p_sp.font.bold = True
        p_sp.font.color.rgb = col

        # Content
        stx = s5.shapes.add_textbox(sx + Inches(0.2), Inches(3.0), Inches(2.4), Inches(3.5))
        tf = stx.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = step_title
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE

        p2 = tf.add_paragraph()
        p2.text = step_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(8)
        p2.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 6: UNIQUE TECH & ANTI-CHEAT (TEXNOLOGIYA VA XAVFSIZLIK)
    # ══════════════════════════════════════════════════════════════════════
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6)
    add_header(s6, "Texnik Ustunlik", "Mustahkam Texnologik Arxitektura va Anti-Chit Tizimi", "Aldovlarsiz, xavfsiz va aniq geolokatsion hisob-kitoblar")

    tech_items = [
        ("🛡️ Ko'p Bosqichli Anti-Chit", 
         "• Fake GPS va emulyatorlarni avtomatik aniqlash\n• Teleport tezligini cheklash (>15 m/s bloklanadi)\n• Kalman filtri va EMA orqali GPS sakrashlarini silliqlash\n• Harakat turini aniqlash (avtomobil yoki velosipedda yurishni cheklash)",
         C_RED),
        ("🗺️ PostGIS Fazoviy Matematika",
         "• ST_Difference orqali binolar, maktablar va harbiy zonalarni chegirish\n• Lollipop loop ekstraktori: dastlabki yo'lni saqlab, aylana qismini maydon qilish\n• ST_Area orqali millisekundlarda aniq kvadrat metr (m²) hisoblash",
         C_MINT),
        ("🔒 200m Maxfiylik Zonasi (Privacy)",
         "• O'yinchining uy yoki ish joyi atrofida 200 metrli shaxsiy zona belgilanadi\n• Mazkur zonadagi yugurish koordinatalari boshqa o'yinchilarga ko'rinmaydi\n• Foydalanuvchilar xavfsizligi va shaxsiy hayot daxlsizligi to'liq himoyalangan",
         C_CYAN),
        ("⚡ Avtonom va Ofline Bufer",
         "• Internet uzilib qolsa ham yugurish nuqtalari lokal xotirada saqlanadi\n• Internet qaytishi bilan avtomatik serverga sinxronizatsiya qilinadi\n• Android Foreground Service: Ekran o'chiq holatda ham batareyani tejab GPS yozish",
         C_GOLD),
    ]
    for i, (ttitle, tdesc, tcol) in enumerate(tech_items):
        row = i // 2
        col = i % 2
        tx = Inches(0.8 + col * 5.95)
        ty = Inches(2.2 + row * 2.35)
        add_card(s6, tx, ty, Inches(5.75), Inches(2.15), ttitle, "", C_CARD, tcol)
        
        tb = s6.shapes.add_textbox(tx + Inches(0.25), ty + Inches(0.7), Inches(5.25), Inches(1.35))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = tdesc
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.line_spacing = 1.25

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 7: CURRENT STATUS - 4 ACTIVE CITIES (HOZIRGI 4 SHAHAR)
    # ══════════════════════════════════════════════════════════════════════
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7)
    add_header(s7, "Hozirgi Bosqich", "Don't Stop Bugun: 4 Ta Faol Shahar Xaritasi", "Loyihamiz MVP darajasida quyidagi 4 ta strategik shaharda to'liq sozlangan")

    cities_now = [
        ("NÓKIS (Nukus)", "Qoraqalpog'iston • Pilot Hudud", "Aholi: ~350,000", "Boshlang'ich test maydoni. Shahar koordinatalari, binolar kesimi va exclusion zonalari 100% integratsiya qilingan.", C_MINT),
        ("TOSHKENT (Tashkent)", "O'zbekiston Poytaxti", "Aholi: ~3,000,000", "Eng yirik metropolitan bozor. Talabalar, yugurish klublari va IT-hamjamiyat uchun asosiy maydon.", C_CYAN),
        ("ALMATY (Olmaota)", "Qozog'iston Metropolisi", "Aholi: ~2,200,000", "Markaziy Osiyodagi eng faol sport shaharlaridan biri. Tog' va park yuguruvchilari uchun ulkan imkoniyat.", C_GOLD),
        ("ISTANBUL (Istanbul)", "Turkiya Megapolisi", "Aholi: ~16,000,000", "Yevropa va Osiyo chorrahasi. Global bozorga chiqish va kengaytirish uchun sinov platformasi.", C_WHITE),
    ]
    for i, (cname, csub, cpop, cinfo, col) in enumerate(cities_now):
        cx = Inches(0.8 + i * 2.95)
        add_card(s7, cx, Inches(2.2), Inches(2.8), Inches(4.5), "", "", C_CARD, col)

        # Name & Pop
        tx = s7.shapes.add_textbox(cx + Inches(0.15), Inches(2.4), Inches(2.5), Inches(4.1))
        tf = tx.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = cname
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = csub
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(2)

        # Population Badge
        p3 = tf.add_paragraph()
        p3.text = f"👥 {cpop}"
        p3.font.size = Pt(12)
        p3.font.bold = True
        p3.font.color.rgb = C_WHITE
        p3.space_before = Pt(10)

        p4 = tf.add_paragraph()
        p4.text = cinfo
        p4.font.size = Pt(11)
        p4.font.color.rgb = C_MUTED
        p4.space_before = Pt(8)
        p4.line_spacing = 1.25

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 8: EXPANSION PLAN & HIGH POPULATION CITIES (KEYINGI SHAHARLAR)
    # ══════════════════════════════════════════════════════════════════════
    s8 = prs.slides.add_slide(blank_layout)
    add_bg(s8)
    add_header(s8, "Geografik Ekspansiya", "Keyingi Bosqich: Aholisi Ko'p Strategik Shaharlar", "O'zbekiston viloyat markazlari va Markaziy Osiyo poytaxtlariga kengayish tahlili")

    # 2 Big Columns: 1) O'zbekiston, 2) Markaziy Osiyo
    # Column 1
    add_card(s8, Inches(0.8), Inches(2.2), Inches(5.75), Inches(4.5), "🇺🇿 O'zbekiston Yirik Shaharlari (1-Bosqich)", "", C_CARD, C_MINT)
    tb1 = s8.shapes.add_textbox(Inches(1.0), Inches(2.8), Inches(5.35), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    cities_uz = [
        ("Samarqand", "~600,000", "Turizm va yoshlar markazi, faol yugurish jamoalari"),
        ("Namangan", "~700,000", "O'zbekistonning aholi soni bo'yicha 2-yirik megapolisi"),
        ("Andijon", "~450,000", "Aholi zichligi eng yuqori bo'lgan faol shahar"),
        ("Buxoro", "~300,000", "Madaniy markaz, park va ochiq hududlar ko'pligi"),
        ("Farg'ona", "~350,000", "Yoshlar ulushi yuqori va rivojlangan infratuzilma"),
    ]
    for name, pop, desc in cities_uz:
        p = tf1.add_paragraph() if tf1.paragraphs[0].text else tf1.paragraphs[0]
        p.text = f"• {name} ({pop} aholi): {desc}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.space_before = Pt(6)

    # Column 2
    add_card(s8, Inches(6.75), Inches(2.2), Inches(5.75), Inches(4.5), "🌏 Markaziy Osiyo Megapolislari (2-Bosqich)", "", C_CARD, C_CYAN)
    tb2 = s8.shapes.add_textbox(Inches(6.95), Inches(2.8), Inches(5.35), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    cities_ca = [
        ("Astana (Qozog'iston)", "~1,400,000", "Poytaxt, yirik marafonlar va parklar markazi"),
        ("Shymkent (Qozog'iston)", "~1,200,000", "Janubiy megapolis, yosh va sportsevar aholi"),
        ("Bishkek (Qirg'iziston)", "~1,150,000", "Faol yugurish madaniyati va ochiq shahar"),
        ("Dushanbe (Tojikiston)", "~1,000,000", "Tez o'sayotgan poytaxt va yoshlar qatlami"),
    ]
    for name, pop, desc in cities_ca:
        p = tf2.add_paragraph() if tf2.paragraphs[0].text else tf2.paragraphs[0]
        p.text = f"• {name} ({pop} aholi): {desc}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.space_before = Pt(6)

    # Why note
    p_why = tf2.add_paragraph()
    p_why.text = "🎯 Nega bu shaharlar? Aholi zichligi yuqori, 60%+ aholisi 30 yoshgacha bo'lgan yoshlar va internet qamrovi 90%+."
    p_why.font.size = Pt(11)
    p_why.font.bold = True
    p_why.font.color.rgb = C_GOLD
    p_why.space_before = Pt(12)

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 9: TARGET MARKET & TAM / SAM / SOM (BOZOR HAJMI)
    # ══════════════════════════════════════════════════════════════════════
    s9 = prs.slides.add_slide(blank_layout)
    add_bg(s9)
    add_header(s9, "Bozor Hajmi", "Target Market: TAM, SAM, SOM Tahlili", "Fitness ilovalari va geymifikatsiya bozorining tez o'sish sur'atlari")

    market_data = [
        ("TAM: $35.7 Mld", "Total Addressable Market",
         "Global miqyosdagi Fitness va M-Health (mobil sog'liqni saqlash) hamda geymifikatsiya bozori. Yillik o'sish (CAGR) 17.6%.", C_WHITE),
        ("SAM: $140 Mln", "Serviceable Addressable Market",
         "Markaziy Osiyo, MDH va Turkiya mintaqasidagi 16–35 yoshli smartfon foydalanuvchilari va faol sport ixlosmandlari bozori.", C_CYAN),
        ("SOM: $15 Mln", "Serviceable Obtainable Market",
         "Dastlabki 3 yilda O'zbekiston va Qozog'istonda erishilishi maqsad qilingan 1.5M+ foydalanuvchi va B2B hamkorliklar ulushi.", C_MINT),
    ]
    for i, (mtitle, msub, mdesc, mcol) in enumerate(market_data):
        mx = Inches(0.8 + i * 3.9)
        add_card(s9, mx, Inches(2.2), Inches(3.7), Inches(4.5), "", "", C_CARD, mcol)

        tx = s9.shapes.add_textbox(mx + Inches(0.2), Inches(2.5), Inches(3.3), Inches(3.9))
        tf = tx.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = mtitle
        p1.font.size = Pt(20)
        p1.font.bold = True
        p1.font.color.rgb = mcol

        p2 = tf.add_paragraph()
        p2.text = msub
        p2.font.size = Pt(12)
        p2.font.color.rgb = C_GOLD
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = mdesc
        p3.font.size = Pt(12)
        p3.font.color.rgb = C_MUTED
        p3.space_before = Pt(12)
        p3.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 10: BUSINESS MODEL & MONETIZATION (BIZNES MODELI)
    # ══════════════════════════════════════════════════════════════════════
    s10 = prs.slides.add_slide(blank_layout)
    add_bg(s10)
    add_header(s10, "Biznes Modeli", "Monetizatsiya va Daromad Olish Mexanizmlari", "Freemium, B2B korporativ reklama va in-game xaridlar balansi")

    revenue_streams = [
        ("01. Freemium & Battle Pass",
         "• Baza bepul: har kim yugurib hudud egallashi mumkin\n• Battle Pass ($2.99 / oy): Maxsus mavsumiy kvestlar\n• Premium obuna ($4.99 / oy): Chuqur analitika va cheksiz maxfiylik zonalari",
         C_MINT),
        ("02. In-App Xaridlar (Klan & Skin)",
         "• Eksklyuziv Vektor Gerblar va maxsus klan ranglari\n• Bayroq dizaynlari va shaxsiy avatar modifikatsiyalari\n• Hududni 2x tezroq qaytarib olish uchun o'yin buyumlari",
         C_CYAN),
        ("03. B2B Geo-Reklama & Homiylik",
         "• Mahalliy kafelar, sport do'konlari uchun «Homiylik Hududlari»\n• Brend egallangan hududda yugurganlarga maxsus chegirmalar beradi\n• RedBull, Nike kabi sport brendlari bilan korporativ turnirlar",
         C_GOLD),
        ("04. Korporativ Wellness Ligalari",
         "• Kompaniyalar xodimlari salomatligi uchun ichki jamoaviy chellenjlar\n• B2B obuna modeli: korporativ lidlar va kompaniyalar o'rtasidagi shahar ligasi",
         C_WHITE),
    ]
    for i, (rtitle, rdesc, rcol) in enumerate(revenue_streams):
        row = i // 2
        col = i % 2
        rx = Inches(0.8 + col * 5.95)
        ry = Inches(2.2 + row * 2.35)
        add_card(s10, rx, ry, Inches(5.75), Inches(2.15), rtitle, "", C_CARD, rcol)
        
        tb = s10.shapes.add_textbox(rx + Inches(0.25), ry + Inches(0.65), Inches(5.25), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = rdesc
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 11: COMPETITIVE ADVANTAGE (RAQOBATCHILAR TAHLILI)
    # ══════════════════════════════════════════════════════════════════════
    s11 = prs.slides.add_slide(blank_layout)
    add_bg(s11)
    add_header(s11, "Raqobat Tahlili", "Nega Don't Stop Raqobatchilardan Ustun?", "Mavjud bozor ishtirokchilari bilan solishtirma tahlil")

    # Table layout
    table_shape = s11.shapes.add_table(5, 5, Inches(0.8), Inches(2.2), Inches(11.733), Inches(4.5))
    table = table_shape.table
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(2.1)
    table.columns[2].width = Inches(2.1)
    table.columns[3].width = Inches(2.1)
    table.columns[4].width = Inches(2.2)

    headers = ["Xususiyat / Funksiya", "Don't Stop", "Strava", "Nike Run Club", "Pokemon GO"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_CARD_LIGHT if j != 1 else C_MINT
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = C_WHITE if j != 1 else C_BG
        p.alignment = PP_ALIGN.CENTER if j > 0 else PP_ALIGN.LEFT

    rows_data = [
        ("Real Hudud Egallash (m²)", "✅ Bor (Real-Time)", "❌ Yo'q", "❌ Yo'q", "⚠️ Faqat nuqtalar"),
        ("10-Kishilik Klan Janglari", "✅ Bor (Gerblar)", "❌ Faqat guruhlar", "❌ Yo'q", "⚠️ 3 ta fraksiya"),
        ("Anti-Chit & Fake GPS Himoya", "✅ Ko'p bosqichli", "⚠️ Qisman", "❌ Oddiy", "✅ Bor"),
        ("Lokal Til & Narxlar (UZ/RU)", "✅ 100% Moslashgan", "❌ Faqat RU/EN", "❌ Faqat EN", "❌ Moslashmagan"),
    ]
    for i, row in enumerate(rows_data):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = C_CARD if j != 1 else C_CARD_LIGHT
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11)
            p.font.color.rgb = C_WHITE if j == 1 else (C_MINT if "✅" in val else C_MUTED)
            p.alignment = PP_ALIGN.CENTER if j > 0 else PP_ALIGN.LEFT

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 12: GROWTH & SCALING ROADMAP (3 OY, 9 OY, 1 YIL, 3 YIL, 5 YIL)
    # ══════════════════════════════════════════════════════════════════════
    s12 = prs.slides.add_slide(blank_layout)
    add_bg(s12)
    add_header(s12, "Rivojlanish Rejasi", "O'sish va Masshtablash Xaritasi (Roadmap)", "3 oydan 5 yilgacha bo'lgan bosqichma-bosqich o'sish traektoriyasi")

    roadmap = [
        ("3 OY", "MVP & Test", 
         "• O'zbekistonda beta-test (5,000 foydalanuvchi)\n• Google Play va App Store relizi\n• Samarqand va Namangan shaharlarini ochish\n• Dastlabki klan chempionatlari", C_CYAN),
        ("9 OY", "Monetizatsiya", 
         "• 50,000 faol foydalanuvchi (MAU)\n• O'zbekistonning 8 ta yirik shahrini qamrash\n• Battle Pass va in-app to'lovlarni ishga tushirish\n• Dastlabki 10 ta B2B brend hamkorligi ($5k MRR)", C_MINT),
        ("1 YIL", "Markaziy Osiyo", 
         "• 150,000 foydalanuvchi\n• Qozog'iston (Ostona, Chimkent) va Qirg'iziston (Bishkek)\n• Birinchi Xalqaro Don't Stop Liga Turniri\n• $25,000 oylik daromad (MRR)", C_GOLD),
        ("3 YIL", "MDH & Turkiya", 
         "• 1,000,000+ faol o'yinchi\n• Turkiya, Ozarbayjon va Sharqiy Yevropa bozorlari\n• Sun'iy intellekt (AI) shaxsiy murabbiy moduli\n• $250,000 oylik daromad (MRR)", C_WHITE),
        ("5 YIL", "Global Ekotizim", 
         "• 5,000,000+ global foydalanuvchi\n• Yaqin Sharq va Janubi-Sharqiy Osiyoga kengayish\n• Dunyo bo'ylab korporativ kiber-sport fitnes ligasi\n• $1,500,000+ oylik daromad (MRR)", C_MINT),
    ]
    for i, (period, stage, rdesc, rcol) in enumerate(roadmap):
        rx = Inches(0.8 + i * 2.35)
        add_card(s12, rx, Inches(2.2), Inches(2.25), Inches(4.5), "", "", C_CARD, rcol)

        # Period Badge
        rp = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, rx + Inches(0.15), Inches(2.4), Inches(1.95), Inches(0.45))
        rp.fill.solid()
        rp.fill.fore_color.rgb = C_CARD_LIGHT
        rp.line.color.rgb = rcol
        p_rp = rp.text_frame.paragraphs[0]
        p_rp.alignment = PP_ALIGN.CENTER
        p_rp.text = period
        p_rp.font.size = Pt(12)
        p_rp.font.bold = True
        p_rp.font.color.rgb = rcol

        # Stage and Description
        rtx = s12.shapes.add_textbox(rx + Inches(0.1), Inches(3.0), Inches(2.05), Inches(3.5))
        tf = rtx.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = stage
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = C_WHITE

        p2 = tf.add_paragraph()
        p2.text = rdesc
        p2.font.size = Pt(10)
        p2.font.color.rgb = C_MUTED
        p2.space_before = Pt(8)
        p2.line_spacing = 1.25

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 13: FINANCIAL PLAN & INVESTMENT ASK ($25,000 - $50,000 PRE-SEED)
    # ══════════════════════════════════════════════════════════════════════
    s13 = prs.slides.add_slide(blank_layout)
    add_bg(s13)
    add_header(s13, "Moliyaviy Reja", "Investitsiya Ehtiyoji va Mablag'lar Taqsimoti", "Pre-Seed raundda $25,000 – $50,000 jalb qilish rejasi")

    allocations = [
        ("40%", "Mahsulot va R&D", "• iOS (Swift/Capacitor) ilovasini to'liq chiqarish\n• AI marshrut generatori va anti-chit modellarini o'rgatish\n• Bulutli serverlar va PostGIS quvvatini kengaytirish", C_MINT),
        ("35%", "Marketing va Foydalanuvchilar", "• Universitetlar va yugurish klublari bilan hamkorlik\n• Shaxsiy blogerlar va marafonchilar orqali promo\n• Ilk shahar turnirlari uchun mukofot jamg'armasi", C_CYAN),
        ("15%", "Jamoani Kengaytirish", "• Qo'shimcha Mobile (iOS/Android) dasturchi jalb qilish\n• UI/UX dizayner va Community Manager yollash", C_GOLD),
        ("10%", "Operatsion & Yuridik", "• Yuridik ro'yxatdan o'tkazish, intellektual mulk himoyasi\n• Xaritalar (MapLibre/OpenMapTiles) litsenziyalari", C_WHITE),
    ]
    for i, (perc, atitle, adesc, acol) in enumerate(allocations):
        ax = Inches(0.8 + i * 2.95)
        add_card(s13, ax, Inches(2.2), Inches(2.8), Inches(4.5), "", "", C_CARD, acol)

        tx = s13.shapes.add_textbox(ax + Inches(0.15), Inches(2.4), Inches(2.5), Inches(4.1))
        tf = tx.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = perc
        p1.font.size = Pt(32)
        p1.font.bold = True
        p1.font.color.rgb = acol

        p2 = tf.add_paragraph()
        p2.text = atitle
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = C_WHITE
        p2.space_before = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = adesc
        p3.font.size = Pt(11)
        p3.font.color.rgb = C_MUTED
        p3.space_before = Pt(10)
        p3.line_spacing = 1.25

    # ══════════════════════════════════════════════════════════════════════
    # SLIDE 14: TEAM & CONTACTS (JAMOA VA BOG'LANISH)
    # ══════════════════════════════════════════════════════════════════════
    s14 = prs.slides.add_slide(blank_layout)
    add_bg(s14)
    add_header(s14, "Xulosa", "Biz Bilan Birga Shaharlarni Harakatga Keltiring!", "Biz sog'lom jamiyat va yangi avlod sport o'yinini yaratmoqdamiz")

    # Left card: Key summary
    add_card(s14, Inches(0.8), Inches(2.2), Inches(6.5), Inches(4.5), "🚀 Nega Hozir Eng To'g'ri Vaqt?", "", C_CARD, C_MINT)
    tb_l = s14.shapes.add_textbox(Inches(1.1), Inches(2.8), Inches(5.9), Inches(3.7))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    reasons_now = [
        "✅ Ishlaydigan MVP tayyor: Web va Android APK hoziroq qo'lingizda",
        "✅ O'zbekistonda yugurish va sog'lom turmush tarzi ommalashmoqda",
        "✅ Yoshlar ulushi 60%+ — mobil o'yinlar va raqobatga kuchli qiziqish",
        "✅ B2B bozorida geolokatsion brendingga katta talab mavjud",
        "✅ Xalqaro bozorlarga (Qozog'iston, Turkiya) kengayish oson va tez",
    ]
    for r in reasons_now:
        p = tf_l.add_paragraph() if tf_l.paragraphs[0].text else tf_l.paragraphs[0]
        p.text = r
        p.font.size = Pt(13)
        p.font.color.rgb = C_WHITE
        p.space_before = Pt(10)

    # Right card: Links & Contacts
    add_card(s14, Inches(7.6), Inches(2.2), Inches(4.933), Inches(4.5), "📱 Aloqa va Havolalar", "", C_CARD, C_GOLD)
    tb_r = s14.shapes.add_textbox(Inches(7.85), Inches(2.8), Inches(4.4), Inches(3.7))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    contacts = [
        "🌐 Veb-sayt (Landing):",
        "https://hylgidra-cmd.github.io/dont-stop-landing/",
        "",
        "🗺️ Jonli Xarita (Live Demo):",
        "https://qalarun-web.onrender.com",
        "",
        "📱 Android APK (Yuklab olish):",
        "dontstop-debug.apk (Loyiha papkasida va GitHub'da)",
        "",
        "💬 Biz bilan bog'lanish: Aloqa va hamkorlik uchun ochiqmiz!",
    ]
    for c in contacts:
        p = tf_r.add_paragraph() if tf_r.paragraphs[0].text else tf_r.paragraphs[0]
        p.text = c
        if c.startswith("http"):
            p.font.size = Pt(11)
            p.font.color.rgb = C_CYAN
            p.font.bold = True
        elif c.startswith("🌐") or c.startswith("🗺️") or c.startswith("📱"):
            p.font.size = Pt(12)
            p.font.bold = True
            p.font.color.rgb = C_GOLD
        else:
            p.font.size = Pt(11)
            p.font.color.rgb = C_WHITE
        p.space_before = Pt(2)

    # Save to all requested paths
    for pth in output_paths:
        os.makedirs(os.path.dirname(pth), exist_ok=True)
        prs.save(pth)
        print(f"Saved PPTX to: {pth} (Size: {os.path.getsize(pth)} bytes)")

if __name__ == "__main__":
    paths = [
        r"C:\Users\hylgi\OneDrive\Desktop\dont_stop_pitch_deck.pptx",
        r"C:\Users\hylgi\OneDrive\Desktop\qala-run-main\dont_stop_pitch_deck.pptx",
        r"C:\Users\hylgi\OneDrive\Desktop\dont-stop-landing\public\presentations\dont_stop_pitch_deck_uz.pptx"
    ]
    create_deck(paths)
