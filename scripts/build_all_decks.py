import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(lang="uz"):
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
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(8), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = C_MINT

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

    def add_card(slide, left, top, width, height, title="", subtitle="", bg_color=C_CARD, border_color=None):
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

    # ──────────────────────────────────────────────────────────────────
    # TRANSLATION DICTIONARY
    # ──────────────────────────────────────────────────────────────────
    T = {
        "uz": {
            "deck_badge": "⚡ PRE-SEED PITCH DECK • 2026",
            "tagline": "Shahar sen bilan o'ynaydi: Real Geolocation Territory Capture Game",
            "desc": "Yugurish, yurish va jamoaviy raqobatni birlashtiruvchi real-vaqtdagi strategik platforma",
            "pills": [("📍 4 ta Shaharda Faol", C_CYAN), ("🛡️ 10 kishilik Gildiyalar", C_MINT), ("📱 Android APK + Web Live", C_GOLD), ("🚀 Pre-Seed Bosqichi", C_WHITE)],
            "s2_tag": "Umumiy Ko'rinish",
            "s2_title": "Loyihaning Asosiy Mohiyati va Noyob Qiymati (UVP)",
            "s2_sub": "Sport va geymifikatsiyaning kesishmasidagi yangi avlod mobil o'yini",
            "s2_c1_t": "🎯 Missiya",
            "s2_c1_d": "Yugurish va sog'lom turmush tarzini qiziqarli shahar kiber-sportiga aylantirish. Yoshlarni xonada video o'yin o'ynash o'rniga, ko'chada haqiqiy hududlar uchun bellashishga ilhomlantirish.",
            "s2_c2_t": "⭐ Noyob Qiymat Taklifi (UVP)",
            "s2_c2_d": "Faqat quruq statistika ko'rsatuvchi odatiy ilovalardan (Strava, Nike) farqli ravishda, Don't Stop har bir yugurilgan metrni xaritadagi m² hududga va jamoaviy g'alabaga aylantiradi.",
            "s2_c3_t": "🔥 Hozirgi Holat & Tayyorgarlik",
            "s2_c3_d": "Loyiha to'liq ishlaydigan MVP holatida: PostGIS fazoviy arxitekturasi, Render serverlari, Live Web xaritasi va 5.1 MB hajmli Android ilovasi (APK) tayyor va sinovdan o'tgan.",
            "s3_tag": "Bozor Muammosi",
            "s3_title": "Biz Qaysi Og'riqli Muammolarni Hal Qilamiz?",
            "s3_sub": "Zamonaviy shahar aholisi va yoshlar oldidagi 3 ta asosiy to'siq",
            "s3_p1_t": "Motivatsiya Yetishmasligi va Zerikarlilik",
            "s3_p1_d": "Odamlarning 78%i yugurishni boshlagach, 2-3 haftada tashlab ketadi. Yolg'iz yugurish zerikarli va uzoq muddatli qiziqish uyg'otmaydi.",
            "s3_p2_t": "Mavjud Ilovalarning Bir Xilligi",
            "s3_p2_d": "Strava, Nike Run Club kabi gigantlar faqat quruq raqamlar (tezlik, kilometr, yurak urishi) ko'rsatadi. Ularda raqobat va o'yin mexanikasi yo'q.",
            "s3_p3_t": "Yoshlar Kamharakatligi (Gipodinamiya)",
            "s3_p3_d": "Yosh avlod kuniga 4-6 soatini video o'yinlar qarshisida o'tkazmoqda. Ular real hayotda harakatlanish uchun yetarli rag'bat topa olmayapti.",
            "s4_tag": "Bizning Yechimimiz",
            "s4_title": "Don't Stop — Shahar Ko'chalaridagi Haqiqiy Strategiya",
            "s4_sub": "O'yin hayajoni + Jismoniy faollik + Jamoaviy g'urur",
            "s4_f1_t": "🗺️ Loop Capture (Hudud Egallash)",
            "s4_f1_d": "GPS orqali yopiq halqa chizib yugurasiz. Ichidagi butun maydon (m²) bir zumda sizniki yoki gildiyangizniki bo'ladi.",
            "s4_f2_t": "🛡️ 10 Kishilik Gildiyalar",
            "s4_f2_d": "Har bir gildiyada maksimal 10 o'yinchi, unikal [TAG] va 10 ta vektor gerb. Katta jamoalar emas, faol guruhlar g'olib bo'ladi.",
            "s4_f3_t": "🚩 Bayroq Qadash (Anchor Flag)",
            "s4_f3_d": "Yugurish boshida strategik joyga bayroq qadab, keyin aylanib kelsangiz, tizim boshlang'ich yo'lni saqlab halqani aniq yopadi.",
            "s4_f4_t": "🎨 GPS-Art & Iz Ko'rish",
            "s4_f4_d": "Yugurgan yo'lingiz shahar xaritasida san'at asariga aylanadi. Tarix modalida bosib o'tilgan izlarni qayta tomosha qilish imkoniyati.",
            "s5_tag": "O'yin Jarayoni",
            "s5_title": "Hududni Egallashning 4 Ta Oddiy Qadami",
            "s5_sub": "O'yinchi uchun qulay, orqa fonda esa qat'iy geodezik hisob-kitoblar",
            "s5_steps": [
                ("QADAM 1", "Marshrutni Tanlang", "Ilovada xaritani ochasiz, shahringizdagi o'zingiz egallamoqchi bo'lgan kvartal yoki ko'chalarni belgilaysiz.", C_CYAN),
                ("QADAM 2", "Yugurishni Boshlang", "Start tugmasini bosib harakatlanasiz. GPS koordinatalari real vaqtda orqa fonda ekranni o'chirgan holda ham yoziladi.", C_MINT),
                ("QADAM 3", "Halqani Yoping", "Boshlagan nuqtangizga qaytib kelasiz yoki Lollipop algoritmi orqali yopiq halqa hosil qilib, Finish tugmasini bosasiz.", C_GOLD),
                ("QADAM 4", "Hudud Sizniki!", "Tizim binolar va xususiy joylarni avtomatik chiqarib tashlab, toza yer maydonini (m²) hisoblaydi va reytingga qo'shadi.", C_WHITE),
            ],
            "s6_tag": "Texnik Ustunlik",
            "s6_title": "Mustahkam Texnologik Arxitektura va Anti-Chit Tizimi",
            "s6_sub": "Aldovlarsiz, xavfsiz va aniq geolokatsion hisob-kitoblar",
            "s6_t1_t": "🛡️ Ko'p Bosqichli Anti-Chit",
            "s6_t1_d": "• Fake GPS va emulyatorlarni avtomatik aniqlash\n• Teleport tezligini cheklash (>15 m/s bloklanadi)\n• Kalman filtri va EMA orqali GPS sakrashlarini silliqlash\n• Harakat turini aniqlash (avtomobil yoki velosipedda yurishni cheklash)",
            "s6_t2_t": "🗺️ PostGIS Fazoviy Matematika",
            "s6_t2_d": "• ST_Difference orqali binolar, maktablar va harbiy zonalarni chegirish\n• Lollipop loop ekstraktori: dastlabki yo'lni saqlab, aylana qismini maydon qilish\n• ST_Area orqali millisekundlarda aniq kvadrat metr (m²) hisoblash",
            "s6_t3_t": "🔒 200m Maxfiylik Zonasi (Privacy)",
            "s6_t3_d": "• O'yinchining uy yoki ish joyi atrofida 200 metrli shaxsiy zona belgilanadi\n• Mazkur zonadagi yugurish koordinatalari boshqa o'yinchilarga ko'rinmaydi\n• Foydalanuvchilar xavfsizligi va shaxsiy hayot daxlsizligi to'liq himoyalangan",
            "s6_t4_t": "⚡ Avtonom va Ofline Bufer",
            "s6_t4_d": "• Internet uzilib qolsa ham yugurish nuqtalari lokal xotirada saqlanadi\n• Internet qaytishi bilan avtomatik serverga sinxronizatsiya qilinadi\n• Android Foreground Service: Ekran o'chiq holatda ham batareyani tejab GPS yozish",
            "s7_tag": "Hozirgi Bosqich",
            "s7_title": "Don't Stop Bugun: 4 Ta Faol Shahar Xaritasi",
            "s7_sub": "Loyihamiz MVP darajasida quyidagi 4 ta strategik shaharda to'liq sozlangan",
            "s7_cities": [
                ("NÓKIS (Nukus)", "Qoraqalpog'iston • Pilot Hudud", "Aholi: ~350,000", "Boshlang'ich test maydoni. Shahar koordinatalari, binolar kesimi va exclusion zonalari 100% integratsiya qilingan.", C_MINT),
                ("TOSHKENT (Tashkent)", "O'zbekiston Poytaxti", "Aholi: ~3,000,000", "Eng yirik metropolitan bozor. Talabalar, yugurish klublari va IT-hamjamiyat uchun asosiy maydon.", C_CYAN),
                ("ALMATY (Olmaota)", "Qozog'iston Metropolisi", "Aholi: ~2,200,000", "Markaziy Osiyodagi eng faol sport shaharlaridan biri. Tog' va park yuguruvchilari uchun ulkan imkoniyat.", C_GOLD),
                ("ISTANBUL (Istanbul)", "Turkiya Megapolisi", "Aholi: ~16,000,000", "Yevropa va Osiyo chorrahasi. Global bozorga chiqish va kengaytirish uchun sinov platformasi.", C_WHITE),
            ],
            "s8_tag": "Geografik Ekspansiya",
            "s8_title": "Keyingi Bosqich: Aholisi Ko'p Strategik Shaharlar",
            "s8_sub": "O'zbekiston viloyat markazlari va Markaziy Osiyo poytaxtlariga kengayish tahlili",
            "s8_c1_t": "🇺🇿 O'zbekiston Yirik Shaharlari (1-Bosqich)",
            "s8_c1_items": [
                ("Samarqand", "~600,000", "Turizm va yoshlar markazi, faol yugurish jamoalari"),
                ("Namangan", "~700,000", "O'zbekistonning aholi soni bo'yicha 2-yirik megapolisi"),
                ("Andijon", "~450,000", "Aholi zichligi eng yuqori bo'lgan faol shahar"),
                ("Buxoro", "~300,000", "Madaniy markaz, park va ochiq hududlar ko'pligi"),
                ("Farg'ona", "~350,000", "Yoshlar ulushi yuqori va rivojlangan infratuzilma"),
            ],
            "s8_c2_t": "🌏 Markaziy Osiyo Megapolislari (2-Bosqich)",
            "s8_c2_items": [
                ("Astana (Qozog'iston)", "~1,400,000", "Poytaxt, yirik marafonlar va parklar markazi"),
                ("Shymkent (Qozog'iston)", "~1,200,000", "Janubiy megapolis, yosh va sportsevar aholi"),
                ("Bishkek (Qirg'iziston)", "~1,150,000", "Faol yugurish madaniyati va ochiq shahar"),
                ("Dushanbe (Tojikiston)", "~1,000,000", "Tez o'sayotgan poytaxt va yoshlar qatlami"),
            ],
            "s8_why": "🎯 Nega bu shaharlar? Aholi zichligi yuqori, 60%+ aholisi 30 yoshgacha bo'lgan yoshlar va internet qamrovi 90%+.",
            "s9_tag": "Bozor Hajmi",
            "s9_title": "Target Market: TAM, SAM, SOM Tahlili",
            "s9_sub": "Fitness ilovalari va geymifikatsiya bozorining tez o'sish sur'atlari",
            "s9_items": [
                ("TAM: $35.7 Mld", "Total Addressable Market", "Global miqyosdagi Fitness va M-Health (mobil sog'liqni saqlash) hamda geymifikatsiya bozori. Yillik o'sish (CAGR) 17.6%.", C_WHITE),
                ("SAM: $140 Mln", "Serviceable Addressable Market", "Markaziy Osiyo, MDH va Turkiya mintaqasidagi 16–35 yoshli smartfon foydalanuvchilari va faol sport ixlosmandlari bozori.", C_CYAN),
                ("SOM: $15 Mln", "Serviceable Obtainable Market", "Dastlabki 3 yilda O'zbekiston va Qozog'istonda erishilishi maqsad qilingan 1.5M+ foydalanuvchi va B2B hamkorliklar ulushi.", C_MINT),
            ],
            "s10_tag": "Biznes Modeli",
            "s10_title": "Monetizatsiya va Daromad Olish Mexanizmlari",
            "s10_sub": "Freemium, B2B korporativ reklama va in-game xaridlar balansi",
            "s10_items": [
                ("01. Freemium & Battle Pass", "• Baza bepul: har kim yugurib hudud egallashi mumkin\n• Battle Pass ($2.99 / oy): Maxsus mavsumiy kvestlar\n• Premium obuna ($4.99 / oy): Chuqur analitika va cheksiz maxfiylik zonalari", C_MINT),
                ("02. In-App Xaridlar (Klan & Skin)", "• Eksklyuziv Vektor Gerblar va maxsus klan ranglari\n• Bayroq dizaynlari va shaxsiy avatar modifikatsiyalari\n• Hududni 2x tezroq qaytarib olish uchun o'yin buyumlari", C_CYAN),
                ("03. B2B Geo-Reklama & Homiylik", "• Mahalliy kafelar, sport do'konlari uchun «Homiylik Hududlari»\n• Brend egallangan hududda yugurganlarga maxsus chegirmalar beradi\n• RedBull, Nike kabi sport brendlari bilan korporativ turnirlar", C_GOLD),
                ("04. Korporativ Wellness Ligalari", "• Kompaniyalar xodimlari salomatligi uchun ichki jamoaviy chellenjlar\n• B2B obuna modeli: korporativ lidlar va kompaniyalar o'rtasidagi shahar ligasi", C_WHITE),
            ],
            "s11_tag": "Raqobat Tahlili",
            "s11_title": "Nega Don't Stop Raqobatchilardan Ustun?",
            "s11_sub": "Mavjud bozor ishtirokchilari bilan solishtirma tahlil",
            "s12_tag": "Rivojlanish Rejasi",
            "s12_title": "O'sish va Masshtablash Xaritasi (Roadmap)",
            "s12_sub": "3 oydan 5 yilgacha bo'lgan bosqichma-bosqich o'sish traektoriyasi",
            "s12_roadmap": [
                ("3 OY", "MVP & Test", "• O'zbekistonda beta-test (5,000 foydalanuvchi)\n• Google Play va App Store relizi\n• Samarqand va Namangan shaharlarini ochish\n• Dastlabki klan chempionatlari", C_CYAN),
                ("9 OY", "Monetizatsiya", "• 50,000 faol foydalanuvchi (MAU)\n• O'zbekistonning 8 ta yirik shahrini qamrash\n• Battle Pass va in-app to'lovlarni ishga tushirish\n• Dastlabki 10 ta B2B brend hamkorligi ($5k MRR)", C_MINT),
                ("1 YIL", "Markaziy Osiyo", "• 150,000 foydalanuvchi\n• Qozog'iston (Ostona, Chimkent) va Qirg'iziston (Bishkek)\n• Birinchi Xalqaro Don't Stop Liga Turniri\n• $25,000 oylik daromad (MRR)", C_GOLD),
                ("3 YIL", "MDH & Turkiya", "• 1,000,000+ faol o'yinchi\n• Turkiya, Ozarbayjon va Sharqiy Yevropa bozorlari\n• Sun'iy intellekt (AI) shaxsiy murabbiy moduli\n• $250,000 oylik daromad (MRR)", C_WHITE),
                ("5 YIL", "Global Ekotizim", "• 5,000,000+ global foydalanuvchi\n• Yaqin Sharq va Janubi-Sharqiy Osiyoga kengayish\n• Dunyo bo'ylab korporativ kiber-sport fitnes ligasi\n• $1,500,000+ oylik daromad (MRR)", C_MINT),
            ],
            "s13_tag": "Moliyaviy Reja",
            "s13_title": "Investitsiya Ehtiyoji va Mablag'lar Taqsimoti",
            "s13_sub": "Pre-Seed raundda $25,000 – $50,000 jalb qilish rejasi",
            "s13_items": [
                ("40%", "Mahsulot va R&D", "• iOS (Swift/Capacitor) ilovasini to'liq chiqarish\n• AI marshrut generatori va anti-chit modellarini o'rgatish\n• Bulutli serverlar va PostGIS quvvatini kengaytirish", C_MINT),
                ("35%", "Marketing va Foydalanuvchilar", "• Universitetlar va yugurish klublari bilan hamkorlik\n• Shaxsiy blogerlar va marafonchilar orqali promo\n• Ilk shahar turnirlari uchun mukofot jamg'armasi", C_CYAN),
                ("15%", "Jamoani Kengaytirish", "• Qo'shimcha Mobile (iOS/Android) dasturchi jalb qilish\n• UI/UX dizayner va Community Manager yollash", C_GOLD),
                ("10%", "Operatsion & Yuridik", "• Yuridik ro'yxatdan o'tkazish, intellektual mulk himoyasi\n• Xaritalar (MapLibre/OpenMapTiles) litsenziyalari", C_WHITE),
            ],
            "s14_tag": "Xulosa",
            "s14_title": "Biz Bilan Birga Shaharlarni Harakatga Keltiring!",
            "s14_sub": "Biz sog'lom jamiyat va yangi avlod sport o'yinini yaratmoqdamiz",
            "s14_l_title": "🚀 Nega Hozir Eng To'g'ri Vaqt?",
            "s14_reasons": [
                "✅ Ishlaydigan MVP tayyor: Web va Android APK hoziroq qo'lingizda",
                "✅ O'zbekistonda yugurish va sog'lom turmush tarzi ommalashmoqda",
                "✅ Yoshlar ulushi 60%+ — mobil o'yinlar va raqobatga kuchli qiziqish",
                "✅ B2B bozorida geolokatsion brendingga katta talab mavjud",
                "✅ Xalqaro bozorlarga (Qozog'iston, Turkiya) kengayish oson va tez",
            ],
            "s14_r_title": "📱 Aloqa va Havolalar",
            "s14_contacts": [
                ("🌐 Veb-sayt (Landing):", "https://hylgidra-cmd.github.io/dont-stop-landing/"),
                ("🗺️ Jonli Xarita (Live Demo):", "https://qalarun-web.onrender.com"),
                ("📱 Android APK:", "dontstop-debug.apk (Loyiha papkasida va GitHub'da)"),
                ("💬 Hamkorlik:", "Aloqa va takliflar uchun doim ochiqmiz!"),
            ]
        },
        "ru": {
            "deck_badge": "⚡ PRE-SEED PITCH DECK • 2026",
            "tagline": "Город играет с тобой: Real Geolocation Territory Capture Game",
            "desc": "Стратегическая игра в реальном времени, объединяющая бег, ходьбу и командные битвы",
            "pills": [("📍 Активно в 4 городах", C_CYAN), ("🛡️ Гильдии до 10 человек", C_MINT), ("📱 Android APK + Web Live", C_GOLD), ("🚀 Раунд Pre-Seed", C_WHITE)],
            "s2_tag": "Обзор Проекта",
            "s2_title": "Суть Проекта и Уникальное Ценностное Предложение (UVP)",
            "s2_sub": "Мобильная игра нового поколения на стыке фитнеса и киберспорта",
            "s2_c1_t": "🎯 Миссия",
            "s2_c1_d": "Превратить бег и здоровый образ жизни в увлекательный городской киберспорт. Мотивировать молодежь выходить на улицы и сражаться за реальные территории вместо сидения за экранами.",
            "s2_c2_t": "⭐ Ценностное Предложение (UVP)",
            "s2_c2_d": "В отличие от традиционных трекеров (Strava, Nike), Don't Stop превращает каждый метр реальной пробежки в захваченные квадратные метры (м²) на живой карте и командную победу.",
            "s2_c3_t": "🔥 Текущая Стадия и Готовность",
            "s2_c3_d": "Проект находится на стадии полнофункционального MVP: развернута пространственная база PostGIS, серверы на Render, живая веб-карта и готовый Android APK (5.1 МБ).",
            "s3_tag": "Проблема Рынка",
            "s3_title": "Какие Проблемы Мы Решаем?",
            "s3_sub": "Три основных барьера современного городского жителя и молодежи",
            "s3_p1_t": "Нехватка Мотивации и Скука",
            "s3_p1_d": "78% людей бросают пробежки в первые 2-3 недели. Одиночный бег быстро приедается и не дает постоянного эмоционального стимула.",
            "s3_p2_t": "Однообразие Существующих Приложений",
            "s3_p2_d": "Strava и Nike Run Club отображают только сухую статистику (пульс, темп, километры). В них нет игрового азарта и социальной клановой динамики.",
            "s3_p3_t": "Малоподвижный Образ Жизни Молодежи",
            "s3_p3_d": "Молодое поколение проводит 4-6 часов в день за видеоиграми дома. Им необходима игровая мотивация, чтобы двигаться в реальном мире.",
            "s4_tag": "Наше Решение",
            "s4_title": "Don't Stop — Настоящая Стратегия на Улицах Города",
            "s4_sub": "Азарт видеоигр + Физическая активность + Командная гордость",
            "s4_f1_t": "🗺️ Захват Территорий (Loop Capture)",
            "s4_f1_d": "Вы бежите по замкнутому контуру. Вся площадь внутри кольца (м²) мгновенно окрашивается в цвет вашей гильдии.",
            "s4_f2_t": "🛡️ Гильдии из 10 Человек",
            "s4_f2_d": "Лимит в 10 участников, уникальный клан-тег [TAG] и 10 векторных гербов. Побеждает не толпа, а сыгранность и регулярность.",
            "s4_f3_t": "🚩 Флаг-Якорь (Anchor Flag)",
            "s4_f3_d": "Поставьте флаг в стратегической точке, сделайте круг и вернитесь: алгоритм сохранит стартовую тропу и замкнет идеальный полигон.",
            "s4_f4_t": "🎨 GPS-Арт и Просмотр Треков",
            "s4_f4_d": "Ваши маршруты превращаются в рисунки на карте города с возможностью пересмотра истории и анимации забегов.",
            "s5_tag": "Игровой Процесс",
            "s5_title": "4 Простых Шага к Захвату Района",
            "s5_sub": "Максимальная простота для бегуна, сложная геодезия под капотом",
            "s5_steps": [
                ("ШАГ 1", "Выберите Маршрут", "Откройте карту и наметьте квартал или парк, который хотите отвоевать у соперников.", C_CYAN),
                ("ШАГ 2", "Начните Забег", "Нажмите Старт и бегите. GPS пишет координаты в фоновом режиме даже при выключенном экране телефона.", C_MINT),
                ("ШАГ 3", "Замкните Кольцо", "Вернитесь к точке старта или замкните петлю: алгоритм Lollipop отсечет лишний хвост и зафиксирует контур.", C_GOLD),
                ("ШАГ 4", "Территория Ваша!", "PostGIS вычтет здания и запретные зоны, посчитает точную полезную площадь (м²) и внесет в рейтинг.", C_WHITE),
            ],
            "s6_tag": "Технологии",
            "s6_title": "Надежная Архитектура и Продвинутый Античит",
            "s6_sub": "Честный геймплей без накруток, эмуляторов и фальсификаций",
            "s6_t1_t": "🛡️ Многоуровневый Античит",
            "s6_t1_d": "• Определение Fake GPS и эмуляторов на уровне ОС\n• Контроль скорости (телепорт >15 м/с блокируется)\n• Фильтр Калмана и EMA-сглаживание GPS-дрейфа\n• Классификация движения (автомобили и велосипеды отсекаются)",
            "s6_t2_t": "🗺️ Пространственная Математика PostGIS",
            "s6_t2_d": "• ST_Difference вычитает здания, школы и режимные объекты\n• Алгоритм Lollipop: сохранение стебля и выделение замкнутого ядра\n• Расчет реальной геодезической площади в м² за миллисекунды",
            "s6_t3_t": "🔒 Приватная Зона (200 метров)",
            "s6_t3_d": "• Скрытие домашнего адреса и работы радиусом 200 метров\n• Треки внутри приватной зоны не публикуются в общем доступе\n• Полная конфиденциальность и безопасность личной жизни",
            "s6_t4_t": "⚡ Автономный Буфер и Фоновый GPS",
            "s6_t4_d": "• При сбое сети точки сохраняются в локальном буфере смартфона\n• Авто-синхронизация при появлении интернета\n• Фоновый Foreground Service Android экономит батарею",
            "s7_tag": "Текущий Статус",
            "s7_title": "Don't Stop Сегодня: 4 Активных Города",
            "s7_sub": "MVP уже настроен и функционирует в 4 ключевых локациях",
            "s7_cities": [
                ("НУКУС (Nukus)", "Каракалпакстан • Пилот", "Население: ~350,000", "Стартовый тестовый регион. Полная интеграция карты, зданий и зон исключений.", C_MINT),
                ("ТАШКЕНТ (Tashkent)", "Столица Узбекистана", "Население: ~3,000,000", "Крупнейший мегаполис региона. Огромная концентрация студентов, клубов и IT-сектора.", C_CYAN),
                ("АЛМАТЫ (Almaty)", "Мегаполис Казахстана", "Население: ~2,200,000", "Главный спортивный хаб Центральной Азии. Культура бега и развитая инфраструктура.", C_GOLD),
                ("СТАМБУЛ (Istanbul)", "Глобальный Мегаполис", "Население: ~16,000,000", "Мост между Европой и Азией. Плацдарм для выхода на международный рынок.", C_WHITE),
            ],
            "s8_tag": "Экспансия",
            "s8_title": "План Расширения: Крупнейшие Города Региона",
            "s8_sub": "Анализ городов с высокой численностью и плотностью населения",
            "s8_c1_t": "🇺🇿 Города Узбекистана (Этап 1)",
            "s8_c1_items": [
                ("Самарканд", "~600,000", "Центр туризма и молодежи, активные беговые сообщества"),
                ("Наманган", "~700,000", "Второй по численности населения мегаполис страны"),
                ("Андижан", "~450,000", "Самая высокая плотность населения в регионе"),
                ("Бухара", "~300,000", "Большое количество парков и открытых городских зон"),
                ("Фергана", "~350,000", "Высокая доля молодежи и спортивная культура"),
            ],
            "s8_c2_t": "🌏 Столицы Центральной Азии (Этап 2)",
            "s8_c2_items": [
                ("Астана (Казахстан)", "~1,400,000", "Столица, масштабные марафоны и открытые набережные"),
                ("Шымкент (Казахстан)", "~1,200,000", "Динамичный южный мегаполис с теплым климатом"),
                ("Бишкек (Кыргызстан)", "~1,150,000", "Развитое комьюнити любителей бега и аутдора"),
                ("Душанбе (Таджикистан)", "~1,000,000", "Быстрорастущая молодая столица"),
            ],
            "s8_why": "🎯 Почему эти города? Более 60% населения младше 30 лет, высокая урбанизация и покрытие 4G/5G более 90%.",
            "s9_tag": "Объем Рынка",
            "s9_title": "Целевой Рынок: Оценка TAM, SAM, SOM",
            "s9_sub": "Быстрорастущий сегмент фитнес-приложений и геолокационного гейминга",
            "s9_items": [
                ("TAM: $35.7 Млрд", "Total Addressable Market", "Мировой рынок мобильного фитнеса (M-Health) и геймификации спорта. Ежегодный рост (CAGR) 17.6%.", C_WHITE),
                ("SAM: $140 Млн", "Serviceable Addressable Market", "Рынок Центральной Азии, СНГ и Турции: активные пользователи смартфонов 16–35 лет.", C_CYAN),
                ("SOM: $15 Млн", "Serviceable Obtainable Market", "Доля рынка в Узбекистане и Казахстане за первые 3 года: 1.5M+ пользователей и B2B-контракты.", C_MINT),
            ],
            "s10_tag": "Бизнес-Модель",
            "s10_title": "Монетизация и Источники Дохода",
            "s10_sub": "Баланс модели Freemium, B2B-рекламы и корпоративных подписок",
            "s10_items": [
                ("01. Freemium & Battle Pass", "• Базовый функционал бесплатен для всех бегунов\n• Battle Pass ($2.99 / мес): Сезонные квесты и награды\n• Premium ($4.99 / мес): Аналитика и безлимитные приватные зоны", C_MINT),
                ("02. Внутриигровые Покупки", "• Эксклюзивные векторные гербы и цвета гильдий\n• Уникальные флаги и кастомизация аватаров\n• Игровые бустеры для ускоренного отвоевания районов", C_CYAN),
                ("03. B2B Гео-Реклама и Спонсорство", "• Спонсорские зоны для локальных сетей кофеен и брендов\n• Скидки и промокоды в захваченных локациях\n• Брендированные турниры от RedBull, Nike, местных ритейлеров", C_GOLD),
                ("04. Корпоративные Лиги (Wellness)", "• B2B-подписка для компаний: здоровые сотрудники и корпоративные битвы внутри города", C_WHITE),
            ],
            "s11_tag": "Конкуренция",
            "s11_title": "Конкурентные Преимущества Don't Stop",
            "s11_sub": "Сравнение с лидерами рынка фитнеса и гео-игр",
            "s12_tag": "Дорожная Карта",
            "s12_title": "План Роста и Масштабирования (Roadmap)",
            "s12_sub": "Поэтапная траектория развития от 3 месяцев до 5 лет",
            "s12_roadmap": [
                ("3 МЕС", "MVP и Тестирование", "• Бета-тест в Узбекистане (5 000 пользователей)\n• Релиз в Google Play и App Store\n• Подключение Самарканда и Намангана\n• Первые локальные клановые турниры", C_CYAN),
                ("9 МЕС", "Монетизация", "• 50 000 активных пользователей (MAU)\n• Охват 8 крупных городов Узбекистана\n• Запуск Battle Pass и микротранзакций\n• Первые 10 B2B-партнерств ($5k MRR)", C_MINT),
                ("1 ГОД", "Центральная Азия", "• 150 000 пользователей\n• Выход в Астану, Шымкент и Бишкек\n• Первый Международный турнир Don't Stop League\n• Выход на $25,000 ежемесячного дохода (MRR)", C_GOLD),
                ("3 ГОДА", "СНГ и Турция", "• 1 000 000+ активных игроков\n• Масштабирование в Турции и Азербайджане\n• Интеграция персонального AI-тренера\n• $250,000 ежемесячного дохода (MRR)", C_WHITE),
                ("5 ЛЕТ", "Глобальная Экосистема", "• 5 000 000+ пользователей по всему миру\n• Экспансия на Ближний Восток и в Европу\n• Мировая корпоративная фитнес-лига\n• $1,500,000+ ежемесячного дохода (MRR)", C_MINT),
            ],
            "s13_tag": "Инвестиции",
            "s13_title": "Потребность в Инвестициях и Распределение",
            "s13_sub": "План привлечения $25,000 – $50,000 на раунде Pre-Seed",
            "s13_items": [
                ("40%", "Продукт и R&D", "• Разработка нативного iOS приложения\n• Обучение AI-модели маршрутов и античита\n• Расширение серверных мощностей PostGIS", C_MINT),
                ("35%", "Маркетинг и Комьюнити", "• Коллаборации с беговыми клубами и вузами\n• Работа со спортивными блогерами и инфлюенсерами\n• Призовые фонды первых городских турниров", C_CYAN),
                ("15%", "Расширение Команды", "• Найм дополнительных Mobile-разработчиков\n• UI/UX дизайнер и Community Manager", C_GOLD),
                ("10%", "Операционные Расходы", "• Юридическая регистрация, защита IP\n• Лицензирование картографических тайлов", C_WHITE),
            ],
            "s14_tag": "Заключение",
            "s14_title": "Присоединяйтесь к Движению Don't Stop!",
            "s14_sub": "Мы строим здоровую нацию и фитнес-игру нового поколения",
            "s14_l_title": "🚀 Почему Сейчас — Лучшее Время?",
            "s14_reasons": [
                "✅ Готовый рабочий MVP: Web и Android APK уже на руках",
                "✅ Бурный рост бегового и здорового движения в регионе",
                "✅ Более 60% населения — активная молодежь, любящая игры",
                "✅ Высокий интерес B2B-сектора к гео-маркетингу и рекламе",
                "✅ Легкая масштабируемость на соседние страны Центральной Азии",
            ],
            "s14_r_title": "📱 Контакты и Демо",
            "s14_contacts": [
                ("🌐 Веб-сайт (Landing):", "https://hylgidra-cmd.github.io/dont-stop-landing/"),
                ("🗺️ Живая Карта (Live Demo):", "https://qalarun-web.onrender.com"),
                ("📱 Android APK:", "dontstop-debug.apk (В репозитории и на GitHub)"),
                ("💬 Сотрудничество:", "Всегда открыты к диалогу и инвестициям!"),
            ]
        },
        "en": {
            "deck_badge": "⚡ PRE-SEED PITCH DECK • 2026",
            "tagline": "The City Plays With You: Real Geolocation Territory Capture Game",
            "desc": "Real-time strategy platform merging cardio running, walking, and clan warfare",
            "pills": [("📍 Active in 4 Cities", C_CYAN), ("🛡️ 10-Member Guilds", C_MINT), ("📱 Android APK + Web Live", C_GOLD), ("🚀 Pre-Seed Stage", C_WHITE)],
            "s2_tag": "Executive Summary",
            "s2_title": "Project Vision and Unique Value Proposition (UVP)",
            "s2_sub": "Next-generation geo-gaming at the intersection of fitness and esports",
            "s2_c1_t": "🎯 Mission",
            "s2_c1_d": "To transform daily running and healthy habits into an addictive urban esport. Inspiring youth to step outdoors and battle for physical city blocks instead of indoor screen gaming.",
            "s2_c2_t": "⭐ Unique Value Proposition",
            "s2_c2_d": "Unlike dry trackers (Strava, Nike Run Club) showing only cold metrics, Don't Stop converts every meter run into captured m² territory on a live map and clan glory.",
            "s2_c3_t": "🔥 Current Status & Traction",
            "s2_c3_d": "Fully functioning MVP: PostGIS spatial backend, Render cloud deployment, live Web map, and a 5.1 MB native Android APK tested in real urban environments.",
            "s3_tag": "Market Problem",
            "s3_title": "Which Critical Problems Are We Solving?",
            "s3_sub": "Three major hurdles faced by modern urban runners and youth",
            "s3_p1_t": "Lack of Motivation and High Churn",
            "s3_p1_d": "78% of people quit running within 2-3 weeks. Solitary workouts quickly become repetitive without social excitement and gamification.",
            "s3_p2_t": "Boring Fitness Trackers",
            "s3_p2_d": "Strava and Nike only show pace, distance, and calories. They lack competitive real-world territory gaming and social clan mechanics.",
            "s3_p3_t": "Sedentary Youth Lifestyles",
            "s3_p3_d": "Young people spend 4-6 hours daily on indoor mobile games. They lack engaging incentives to exercise outdoors in the real world.",
            "s4_tag": "Our Solution",
            "s4_title": "Don't Stop — Real Strategy on City Streets",
            "s4_sub": "Gaming thrill + Physical fitness + Clan team pride",
            "s4_f1_t": "🗺️ Loop Capture (Territory Claim)",
            "s4_f1_d": "Run a closed loop on city streets. The entire enclosed area (m²) is instantly awarded to you or your guild.",
            "s4_f2_t": "🛡️ 10-Member Guilds & Vector Emblems",
            "s4_f2_d": "Strict 10-member limit, unique clan tags [TAG], and 10 vector emblems. Active teamwork always beats oversized clans.",
            "s4_f3_t": "🚩 Anchor Flag (Stem Preservation)",
            "s4_f3_d": "Drop a flag at your starting point, loop around, and close: the algorithm keeps your stem path while awarding the loop.",
            "s4_f4_t": "🎨 GPS-Art & Trail Viewer",
            "s4_f4_d": "Transform running routes into artistic map drawings. Replay past runs with interactive trail visualizations.",
            "s5_tag": "Gameplay",
            "s5_title": "4 Simple Steps to Conquer Your Neighborhood",
            "s5_sub": "Seamless user experience backed by strict spatial calculations",
            "s5_steps": [
                ("STEP 1", "Pick Your Target", "Open the map and target the district, park, or streets you want to conquer.", C_CYAN),
                ("STEP 2", "Start Running", "Press Start. Background GPS records your path even with your phone screen turned off.", C_MINT),
                ("STEP 3", "Close the Loop", "Return to your origin or form a closed loop: Lollipop algorithm cuts the stem and seals the ring.", C_GOLD),
                ("STEP 4", "Territory is Yours!", "PostGIS subtracts buildings and restricted zones, computes clean m², and updates rankings.", C_WHITE),
            ],
            "s6_tag": "Technology",
            "s6_title": "Robust Tech Architecture & Multi-Tier Anti-Cheat",
            "s6_sub": "Fair competition with zero tolerance for GPS spoofing and emulators",
            "s6_t1_t": "🛡️ Advanced Anti-Cheat",
            "s6_t1_d": "• OS-level Mock GPS & emulator detection\n• Teleport speed thresholds (>15 m/s blocked)\n• Kalman filter & EMA smoothing of GPS jitter\n• Transportation classifier (vehicles & bikes excluded)",
            "s6_t2_t": "🗺️ PostGIS Spatial Engine",
            "s6_t2_d": "• ST_Difference removes buildings, schools, and military zones\n• Lollipop loop extractor preserves stems while claiming loops\n• Sub-second geodetic polygon area calculation (m²)",
            "s6_t3_t": "🔒 200m Privacy Radius",
            "s6_t3_d": "• Configurable 200-meter safety zone around homes/offices\n• Track coordinates inside privacy zones are completely hidden\n• Uncompromising personal privacy and user security",
            "s6_t4_t": "⚡ Offline Buffer & Foreground Service",
            "s6_t4_d": "• Fixes buffered locally during network drops\n• Automatic sync upon reconnection\n• Battery-efficient Android foreground tracking service",
            "s7_tag": "Current Traction",
            "s7_title": "Don't Stop Today: 4 Active Cities",
            "s7_sub": "Fully configured MVP running in 4 strategic hubs",
            "s7_cities": [
                ("NUKUS", "Karakalpakstan • Pilot Hub", "Population: ~350,000", "Initial testing grounds. Complete boundary mapping, building exclusions, and clan testing.", C_MINT),
                ("TASHKENT", "Capital of Uzbekistan", "Population: ~3,000,000", "Primary metropolitan market. Massive concentration of universities, runners, and tech talent.", C_CYAN),
                ("ALMATY", "Major Kazakhstan Metropolis", "Population: ~2,200,000", "Top sporting hub in Central Asia with high outdoor culture and established marathon scenes.", C_GOLD),
                ("ISTANBUL", "Global Megacity", "Population: ~16,000,000", "Bridge between Europe and Asia. Gateway for future global expansion.", C_WHITE),
            ],
            "s8_tag": "Expansion",
            "s8_title": "Next Scale: High-Density Strategic Cities",
            "s8_sub": "Expansion roadmap across Uzbekistan and Central Asian capitals",
            "s8_c1_t": "🇺🇿 Key Cities in Uzbekistan (Phase 1)",
            "s8_c1_items": [
                ("Samarkand", "~600,000", "Major tourist and youth center with active running clubs"),
                ("Namangan", "~700,000", "Second largest city in Uzbekistan by population"),
                ("Andijan", "~450,000", "Highest population density in the region"),
                ("Bukhara", "~300,000", "Rich urban parks and high outdoor walking traffic"),
                ("Fergana", "~350,000", "Vibrant youth demographics and sport infrastructure"),
            ],
            "s8_c2_t": "🌏 Central Asian Capitals (Phase 2)",
            "s8_c2_items": [
                ("Astana (Kazakhstan)", "~1,400,000", "Capital city, wide boulevards, major marathon events"),
                ("Shymkent (Kazakhstan)", "~1,200,000", "Booming southern metropolis with mild running climate"),
                ("Bishkek (Kyrgyzstan)", "~1,150,000", "Strong outdoor and trail running community"),
                ("Dushanbe (Tajikistan)", "~1,000,000", "Rapidly growing capital with high youth ratio"),
            ],
            "s8_why": "🎯 Why these hubs? Over 60% of population is under 30, high urban density, and over 90% 4G/5G mobile penetration.",
            "s9_tag": "Market Size",
            "s9_title": "Target Market: TAM, SAM, SOM Breakdown",
            "s9_sub": "Riding the surge of fitness gamification and mobile health",
            "s9_items": [
                ("TAM: $35.7 Billion", "Total Addressable Market", "Global M-Health, mobile fitness apps, and gamified sport market growing at 17.6% CAGR.", C_WHITE),
                ("SAM: $140 Million", "Serviceable Addressable Market", "Active smartphone users aged 16–35 in Central Asia, CIS, and Turkey interested in fitness.", C_CYAN),
                ("SOM: $15 Million", "Serviceable Obtainable Market", "Target 1.5M+ active users and localized B2B sponsorships in Uzbekistan and Kazakhstan.", C_MINT),
            ],
            "s10_tag": "Business Model",
            "s10_title": "Monetization and Revenue Streams",
            "s10_sub": "A balanced mix of Freemium, B2B sponsorships, and corporate wellness",
            "s10_items": [
                ("01. Freemium & Battle Pass", "• Free core gameplay for all runners\n• Battle Pass ($2.99 / mo): Seasonal quests and rewards\n• Premium ($4.99 / mo): Advanced telemetry & unlimited privacy zones", C_MINT),
                ("02. In-App Purchases", "• Exclusive vector guild emblems and colors\n• Custom flags and runner avatar modifications\n• In-game tactical consumables for territory defense", C_CYAN),
                ("03. B2B Geo-Sponsorships", "• Sponsored territories for cafes, fitness shops, and brands\n• Location-based promo discounts for runners\n• Branded tournaments with RedBull, Nike, and local retailers", C_GOLD),
                ("04. Corporate Wellness Leagues", "• B2B wellness subscriptions for companies competing in inter-corporate city leagues", C_WHITE),
            ],
            "s11_tag": "Competition",
            "s11_title": "Don't Stop Competitive Advantages",
            "s11_sub": "Benchmarked against fitness and geo-gaming market leaders",
            "s12_tag": "Roadmap",
            "s12_title": "Growth and Scaling Roadmap",
            "s12_sub": "Phased development trajectory from 3 months to 5 years",
            "s12_roadmap": [
                ("3 MONTHS", "MVP & Beta", "• Beta launch in Uzbekistan (5,000 users)\n• Google Play & App Store official release\n• Samarkand & Namangan city launches\n• First community clan cups", C_CYAN),
                ("9 MONTHS", "Monetization", "• 50,000 Monthly Active Users (MAU)\n• Coverage across 8 major Uzbek cities\n• Launch Battle Pass & in-app purchases\n• First 10 B2B brand partnerships ($5k MRR)", C_MINT),
                ("1 YEAR", "Central Asia", "• 150,000 active runners\n• Expansion into Astana, Shymkent & Bishkek\n• First International Don't Stop Championship\n• $25,000 Monthly Recurring Revenue (MRR)", C_GOLD),
                ("3 YEARS", "CIS & Turkey", "• 1,000,000+ active players\n• Full expansion in Turkey & Azerbaijan\n• AI personal running coach module\n• $250,000 Monthly Recurring Revenue (MRR)", C_WHITE),
                ("5 YEARS", "Global Ecosystem", "• 5,000,000+ global runners\n• Expansion to Middle East & Southeast Asia\n• World corporate fitness esport league\n• $1,500,000+ Monthly Recurring Revenue (MRR)", C_MINT),
            ],
            "s13_tag": "Financials",
            "s13_title": "Funding Ask & Capital Allocation",
            "s13_sub": "Targeting $25,000 – $50,000 Pre-Seed investment",
            "s13_items": [
                ("40%", "Product & R&D", "• Native iOS application rollout\n• AI route generator & anti-cheat ML model\n• Cloud scalability & PostGIS cluster upgrades", C_MINT),
                ("35%", "Marketing & Growth", "• Partnerships with running clubs & universities\n• Influencer campaigns & marathon sponsorships\n• Prize pools for inaugural city tournaments", C_CYAN),
                ("15%", "Team Expansion", "• Additional mobile engineers (iOS/Android)\n• UI/UX designer & Community Growth Manager", C_GOLD),
                ("10%", "Operations & Legal", "• Legal incorporation, IP protection\n• Map tile & vector infrastructure licensing", C_WHITE),
            ],
            "s14_tag": "Conclusion",
            "s14_title": "Join the Movement — Move Your City With Us!",
            "s14_sub": "Building a healthier society through next-generation gaming",
            "s14_l_title": "🚀 Why Now is the Perfect Time?",
            "s14_reasons": [
                "✅ Live MVP ready: Web & Android APK in hand today",
                "✅ Booming running & fitness culture in the region",
                "✅ 60%+ youth demographics hungry for gamified competition",
                "✅ Strong B2B advertiser appetite for foot-traffic geo-marketing",
                "✅ Low friction for regional expansion across Central Asia",
            ],
            "s14_r_title": "📱 Contacts & Links",
            "s14_contacts": [
                ("🌐 Website (Landing):", "https://hylgidra-cmd.github.io/dont-stop-landing/"),
                ("🗺️ Live Map (Demo):", "https://qalarun-web.onrender.com"),
                ("📱 Android APK:", "dontstop-debug.apk (In repository & on GitHub)"),
                ("💬 Partnership:", "Always open for collaborations and investments!"),
            ]
        }
    }

    d = T.get(lang, T["uz"])

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 1: COVER
    # ══════════════════════════════════════════════════════════════════
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1)

    glow = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.2), Inches(10.333), Inches(5.1))
    glow.fill.solid()
    glow.fill.fore_color.rgb = C_CARD
    glow.line.color.rgb = C_MINT
    glow.line.width = Pt(2)

    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.6), Inches(3.7), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = C_CARD_LIGHT
    badge.line.color.rgb = C_GOLD
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = d["deck_badge"]
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = C_GOLD

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
    p_sub.text = d["tagline"]
    p_sub.font.size = Pt(20)
    p_sub.font.bold = True
    p_sub.font.color.rgb = C_WHITE
    p_sub.space_before = Pt(8)

    p_desc = tf.add_paragraph()
    p_desc.alignment = PP_ALIGN.CENTER
    p_desc.text = d["desc"]
    p_desc.font.size = Pt(14)
    p_desc.font.color.rgb = C_MUTED
    p_desc.space_before = Pt(10)

    for i, (text, col) in enumerate(d["pills"]):
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 2: EXECUTIVE SUMMARY & UVP
    # ══════════════════════════════════════════════════════════════════
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, d["s2_tag"], d["s2_title"], d["s2_sub"])

    c_s2 = [
        (d["s2_c1_t"], d["s2_c1_d"], C_MINT),
        (d["s2_c2_t"], d["s2_c2_d"], C_CYAN),
        (d["s2_c3_t"], d["s2_c3_d"], C_GOLD),
    ]
    for i, (ctitle, cdesc, ccolor) in enumerate(c_s2):
        cx = Inches(0.8 + i * 3.9)
        add_card(s2, cx, Inches(2.2), Inches(3.7), Inches(4.5), ctitle, "", C_CARD, ccolor)
        tb = s2.shapes.add_textbox(cx + Inches(0.25), Inches(3.0), Inches(3.2), Inches(3.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = cdesc
        p.font.size = Pt(13)
        p.font.color.rgb = C_WHITE
        p.line_spacing = 1.3

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 3: PROBLEM
    # ══════════════════════════════════════════════════════════════════
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, d["s3_tag"], d["s3_title"], d["s3_sub"])

    p_data = [
        ("01", d["s3_p1_t"], d["s3_p1_d"], C_RED),
        ("02", d["s3_p2_t"], d["s3_p2_d"], C_GOLD),
        ("03", d["s3_p3_t"], d["s3_p3_d"], C_CYAN),
    ]
    for i, (num, p_title, p_desc, col) in enumerate(p_data):
        py = Inches(2.2 + i * 1.55)
        add_card(s3, Inches(0.8), py, Inches(11.733), Inches(1.35), "", "", C_CARD, col)
        
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 4: SOLUTION & PRODUCT
    # ══════════════════════════════════════════════════════════════════
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, d["s4_tag"], d["s4_title"], d["s4_sub"])

    feat_data = [
        (d["s4_f1_t"], d["s4_f1_d"], C_MINT),
        (d["s4_f2_t"], d["s4_f2_d"], C_CYAN),
        (d["s4_f3_t"], d["s4_f3_d"], C_GOLD),
        (d["s4_f4_t"], d["s4_f4_d"], C_WHITE),
    ]
    for i, (ftitle, fdesc, fcol) in enumerate(feat_data):
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 5: GAMEPLAY LOGIC
    # ══════════════════════════════════════════════════════════════════
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, d["s5_tag"], d["s5_title"], d["s5_sub"])

    for i, (step_num, step_title, step_desc, col) in enumerate(d["s5_steps"]):
        sx = Inches(0.8 + i * 2.95)
        add_card(s5, sx, Inches(2.2), Inches(2.8), Inches(4.5), "", "", C_CARD, col)

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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 6: UNIQUE TECH & ANTI-CHEAT
    # ══════════════════════════════════════════════════════════════════
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6)
    add_header(s6, d["s6_tag"], d["s6_title"], d["s6_sub"])

    tech_items = [
        (d["s6_t1_t"], d["s6_t1_d"], C_RED),
        (d["s6_t2_t"], d["s6_t2_d"], C_MINT),
        (d["s6_t3_t"], d["s6_t3_d"], C_CYAN),
        (d["s6_t4_t"], d["s6_t4_d"], C_GOLD),
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 7: CURRENT STATUS - 4 ACTIVE CITIES
    # ══════════════════════════════════════════════════════════════════
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7)
    add_header(s7, d["s7_tag"], d["s7_title"], d["s7_sub"])

    for i, (cname, csub, cpop, cinfo, col) in enumerate(d["s7_cities"]):
        cx = Inches(0.8 + i * 2.95)
        add_card(s7, cx, Inches(2.2), Inches(2.8), Inches(4.5), "", "", C_CARD, col)

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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 8: EXPANSION PLAN & POPULATION
    # ══════════════════════════════════════════════════════════════════
    s8 = prs.slides.add_slide(blank_layout)
    add_bg(s8)
    add_header(s8, d["s8_tag"], d["s8_title"], d["s8_sub"])

    add_card(s8, Inches(0.8), Inches(2.2), Inches(5.75), Inches(4.5), d["s8_c1_t"], "", C_CARD, C_MINT)
    tb1 = s8.shapes.add_textbox(Inches(1.0), Inches(2.8), Inches(5.35), Inches(3.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    for name, pop, desc in d["s8_c1_items"]:
        p = tf1.add_paragraph() if tf1.paragraphs[0].text else tf1.paragraphs[0]
        p.text = f"• {name} ({pop}): {desc}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.space_before = Pt(6)

    add_card(s8, Inches(6.75), Inches(2.2), Inches(5.75), Inches(4.5), d["s8_c2_t"], "", C_CARD, C_CYAN)
    tb2 = s8.shapes.add_textbox(Inches(6.95), Inches(2.8), Inches(5.35), Inches(3.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    for name, pop, desc in d["s8_c2_items"]:
        p = tf2.add_paragraph() if tf2.paragraphs[0].text else tf2.paragraphs[0]
        p.text = f"• {name} ({pop}): {desc}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_MUTED
        p.space_before = Pt(6)

    p_why = tf2.add_paragraph()
    p_why.text = d["s8_why"]
    p_why.font.size = Pt(11)
    p_why.font.bold = True
    p_why.font.color.rgb = C_GOLD
    p_why.space_before = Pt(12)

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 9: TARGET MARKET & TAM / SAM / SOM
    # ══════════════════════════════════════════════════════════════════
    s9 = prs.slides.add_slide(blank_layout)
    add_bg(s9)
    add_header(s9, d["s9_tag"], d["s9_title"], d["s9_sub"])

    for i, (mtitle, msub, mdesc, mcol) in enumerate(d["s9_items"]):
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 10: BUSINESS MODEL
    # ══════════════════════════════════════════════════════════════════
    s10 = prs.slides.add_slide(blank_layout)
    add_bg(s10)
    add_header(s10, d["s10_tag"], d["s10_title"], d["s10_sub"])

    for i, (rtitle, rdesc, rcol) in enumerate(d["s10_items"]):
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 11: COMPETITIVE ADVANTAGE
    # ══════════════════════════════════════════════════════════════════
    s11 = prs.slides.add_slide(blank_layout)
    add_bg(s11)
    add_header(s11, d["s11_tag"], d["s11_title"], d["s11_sub"])

    table_shape = s11.shapes.add_table(5, 5, Inches(0.8), Inches(2.2), Inches(11.733), Inches(4.5))
    table = table_shape.table
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(2.1)
    table.columns[2].width = Inches(2.1)
    table.columns[3].width = Inches(2.1)
    table.columns[4].width = Inches(2.2)

    headers = [
        "Feature / Metric" if lang == "en" else ("Характеристика / Функция" if lang == "ru" else "Xususiyat / Funksiya"),
        "Don't Stop", "Strava", "Nike Run Club", "Pokemon GO"
    ]
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

    if lang == "en":
        rows_data = [
            ("Real Territory Claim (m²)", "✅ Yes (Real-Time)", "❌ No", "❌ No", "⚠️ Points only"),
            ("10-Member Clan Wars", "✅ Yes (Emblems)", "❌ Groups only", "❌ No", "⚠️ 3 Factions"),
            ("Anti-Cheat & Spoof Guard", "✅ Multi-Tiered", "⚠️ Partial", "❌ Basic", "✅ Yes"),
            ("Local Languages & Pricing", "✅ Full (UZ/RU/EN)", "❌ Western pricing", "❌ Global only", "❌ No local pricing"),
        ]
    elif lang == "ru":
        rows_data = [
            ("Захват территорий (м²)", "✅ Да (Real-Time)", "❌ Нет", "❌ Нет", "⚠️ Только точки"),
            ("Битвы кланов до 10 чел", "✅ Да (Гербы)", "❌ Только клубы", "❌ Нет", "⚠️ 3 фракции"),
            ("Античит и защита GPS", "✅ Многоуровневый", "⚠️ Частично", "❌ Базовый", "✅ Да"),
            ("Локализация и цены (UZ/RU)", "✅ 100% Адаптировано", "❌ Только валюта", "❌ Без адаптации", "❌ Дорогие цены"),
        ]
    else:
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 12: ROADMAP (3M, 9M, 1Y, 3Y, 5Y)
    # ══════════════════════════════════════════════════════════════════
    s12 = prs.slides.add_slide(blank_layout)
    add_bg(s12)
    add_header(s12, d["s12_tag"], d["s12_title"], d["s12_sub"])

    for i, (period, stage, rdesc, rcol) in enumerate(d["s12_roadmap"]):
        rx = Inches(0.8 + i * 2.35)
        add_card(s12, rx, Inches(2.2), Inches(2.25), Inches(4.5), "", "", C_CARD, rcol)

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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 13: FINANCIALS & FUNDING ASK
    # ══════════════════════════════════════════════════════════════════
    s13 = prs.slides.add_slide(blank_layout)
    add_bg(s13)
    add_header(s13, d["s13_tag"], d["s13_title"], d["s13_sub"])

    for i, (perc, atitle, adesc, acol) in enumerate(d["s13_items"]):
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

    # ══════════════════════════════════════════════════════════════════
    # SLIDE 14: TEAM & CONTACTS
    # ══════════════════════════════════════════════════════════════════
    s14 = prs.slides.add_slide(blank_layout)
    add_bg(s14)
    add_header(s14, d["s14_tag"], d["s14_title"], d["s14_sub"])

    add_card(s14, Inches(0.8), Inches(2.2), Inches(6.5), Inches(4.5), d["s14_l_title"], "", C_CARD, C_MINT)
    tb_l = s14.shapes.add_textbox(Inches(1.1), Inches(2.8), Inches(5.9), Inches(3.7))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True
    for r in d["s14_reasons"]:
        p = tf_l.add_paragraph() if tf_l.paragraphs[0].text else tf_l.paragraphs[0]
        p.text = r
        p.font.size = Pt(13)
        p.font.color.rgb = C_WHITE
        p.space_before = Pt(10)

    add_card(s14, Inches(7.6), Inches(2.2), Inches(4.933), Inches(4.5), d["s14_r_title"], "", C_CARD, C_GOLD)
    tb_r = s14.shapes.add_textbox(Inches(7.85), Inches(2.8), Inches(4.4), Inches(3.7))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    for label, val in d["s14_contacts"]:
        p1 = tf_r.add_paragraph() if tf_r.paragraphs[0].text else tf_r.paragraphs[0]
        p1.text = label
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = C_GOLD
        p1.space_before = Pt(6)

        p2 = tf_r.add_paragraph()
        p2.text = val
        if val.startswith("http"):
            p2.font.size = Pt(11)
            p2.font.color.rgb = C_CYAN
            p2.font.bold = True
        else:
            p2.font.size = Pt(11)
            p2.font.color.rgb = C_WHITE
        p2.space_before = Pt(1)

    return prs

def main():
    landing_pres = r"C:\Users\hylgi\OneDrive\Desktop\dont-stop-landing\public\presentations"
    desktop = r"C:\Users\hylgi\OneDrive\Desktop"
    qalarun = r"C:\Users\hylgi\OneDrive\Desktop\qala-run-main"

    tasks = [
        ("uz", [
            os.path.join(desktop, "dont_stop_pitch_deck.pptx"),
            os.path.join(desktop, "dont_stop_pitch_deck_uz.pptx"),
            os.path.join(qalarun, "dont_stop_pitch_deck.pptx"),
            os.path.join(landing_pres, "dont_stop_pitch_deck_uz.pptx")
        ]),
        ("ru", [
            os.path.join(desktop, "dont_stop_pitch_deck_ru.pptx"),
            os.path.join(landing_pres, "dont_stop_pitch_deck_ru.pptx")
        ]),
        ("en", [
            os.path.join(desktop, "dont_stop_pitch_deck_en.pptx"),
            os.path.join(landing_pres, "dont_stop_pitch_deck_en.pptx")
        ])
    ]

    for lang, destinations in tasks:
        prs = build_presentation(lang)
        for dest in destinations:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            prs.save(dest)
            print(f"[{lang.upper()}] Generated {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    main()
