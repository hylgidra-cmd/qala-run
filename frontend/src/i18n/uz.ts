import type { TranslationDictionary } from './qq';

export const uz: TranslationDictionary = {
  brand: {
    name: "Don't Stop",
    home: 'Bosh sahifa',
  },

  mode: {
    label: 'Hudud rejimi',
    solo: 'Yakka',
    clan: 'Gildiya',
    clanNeeded: 'Gildiya rejimi uchun avval gildiyaga kirish kerak.',
  },

  map: {
    label: 'Nukus hudud xaritasi',
    eyebrow: 'NUKUS PILOTI',
    headline: "Yo'lingni egalla.",
    lead: 'Hududni egallash uchun yopiq aylana chizib yuguring yoki yuring.',
    ready: 'Yugurish tayyor',
    offline: "Faqat xarita — bu yerda API yo'q",
    dismiss: 'Yopish',
  },

  geo: {
    outOfBounds: 'Siz tanlagan shahar hududidan tashqaridasiz, xarita sizni kuzata olmaydi.',
    outsideCity: (city: string) => `Siz tanlagan shaharda (${city}) emassiz! Xarita sizni kuzata olmaydi.`,
    denied:
      "Ushbu sayt uchun joylashuv bloklangan. Brauzer sozlamalarida ruxsat bering va joylashuv tugmasini qayta bosing.",
    unavailable:
      "Joylashuv aniqlanmadi. GPS'i yo'q noutbuk Wi-Fi orqali aniqlaydi, u bino ichida ishlamasligi mumkin.",
    timeout: "Joylashuv so'rovining vaqti tugadi. Tugmani qayta bosing.",
    unknown: 'Joylashuv hozircha mavjud emas.',
  },

  cities: {
    label: 'Shahar',
    select: 'Shaharni tanlang',
    change: "Shaharni o'zgartirish",
  },

  run: {
    start: 'Yugurishni boshlash',
    finish: 'Yakunlash',
    checking: 'Tekshirilmoqda…',
    close: 'Yopish',
    release: "Bo'shatish",
    captured: 'HUDUD EGALLANDI',
    rejected: 'YUGURISH BEKOR QILINDI',
    excluded: (area: string) => `${area} bino va yopiq hududlar uchun olib tashlandi`,
    closedGap: (distance: string) => `Boshlashga qadar ${distance} masofa server tomonidan yopildi`,
    takenFrom: (owners: string) => `${owners} dan olindi`,
    tracking: (count: number) =>
      `${count} nuqta yozildi. Boshlagan joyingizga qaytib boring, so'ng yakunlang.`,
    noApi: "Bu manzilda API yo'q, shuning uchun yugurishni yozib bo'lmaydi.",
    couldNotStart: "Yugurishni boshlab bo'lmadi.",
    couldNotFinish: "Yugurishni yakunlab bo'lmadi.",
    couldNotUpload: "Nuqtalarni yuborib bo'lmadi.",
    couldNotRelease: "Yugurishni bo'shatib bo'lmadi.",
    noGeolocation: "Ushbu brauzerda Geolocation API yo'q.",
  },

  activity: {
    walk: 'yurish',
    run: 'yugurish',
    bike: 'velosiped',
    vehicle: 'transport',
  },

  reasons: {
    LOOP_NOT_CLOSED: "Aylana boshlangan joyga qaytmadi. Boshlagan joyingizda yakunlang.",
    TOO_SHORT: "Aylana ruxsat etilgan eng kichik uzunlikdan qisqa.",
    AREA_TOO_SMALL: "Qorshalgan maydon ruxsat etilgan eng kichik miqdordan kichik.",
    BAD_SHAPE: "Trek hech qanday maydonni qamramaydi.",
    ACTIVITY_NOT_ALLOWED: "Faqat yurish va yugurish hisoblanadi. Bu tezlik juda yuqori.",
    TELEPORT_DETECTED: "Trekda tezlik sakrashi aniqlandi.",
    LOW_GPS_QUALITY: "GPS signali past sifatli.",
    OUTSIDE_REGION: "Aylana pilot hududidan tashqarida.",
    NO_AWARDABLE_AREA: "Taqiqlangan hududlar olib tashlangach hech narsa qolmadi.",
    DUPLICATE_RUN: "Bu yugurish ilgari yuborilgan.",
    NOT_IN_CLAN: "Gildiya uchun yugurish uchun avval gildiyaga kirishingiz kerak.",
  },

  legend: {
    title: 'Hisoblanmaydigan joylar',
    hide: 'Yashirish',
    show: "Ko'rsatish",
    kinds: {
      building: 'Binolar',
      private: 'Xususiy mulk',
      school: 'Maktablar',
      hospital: 'Kasalxonalar',
      military: 'Harbiy hudud',
      water: 'Suv',
      industrial: 'Sanoat hududi',
      other: 'Boshqa',
    },
    count: (count: number) =>
      `Ko'rinishda ${count} hudud bor. Bu yerlar egallangan maydondan chiqariladi.`,
    truncated: "Bu yerda hududlar juda ko'p — hammasini ko'rish uchun yaqinlashtiring.",
  },

  qr: {
    title: 'TELEFONDA OCHISH',
    label: 'Demoni telefonda ochish',
    hide: 'Telefon havolasini yashirish',
    reopen: 'Telefon havolasi',
    preparing: 'Kod tayyorlanmoqda…',
    hint: "Skanerlang va xaritadagi joylashuv tugmasini bosing.",
    localhost: "Localhost joylashuvi.",
  },

  profile: {
    open: 'Profilni ochish',
    title: 'Profil',
    close: 'Yopish',
    playerId: "O'yinchi ID",
    copy: 'Nusxalash',
    copied: 'Nusxalandi',
    name: 'Ism',
    save: 'Saqlash',
    saving: 'Saqlanmoqda…',
    nameTooShort: "Ism kamida 2 ta belgidan iborat bo'lishi kerak.",
    nameTooLong: "Ism ko'pi bilan 24 ta belgi.",
    runs: 'Yugurishlar',
    soloArea: 'Yakka hudud',
    clanArea: 'Gildiya hududi',
    joined: "Qo'shilgan",
    loading: 'Yuklanmoqda…',
    unavailable: 'Profil hozircha mavjud emas.',
    logout: 'Akkauntdan chiqish',
    privacyZone: 'Maxfiylik zonasi (200m radius)',
    privacyActive: "Maxfiylik zonasi faol: Uy ko'rsatkichlari yashirildi",
  },

  events: {
    banner: '🔥 Nukus event: 2x Maydon bonusi!',
    daysLeft: (days: number) => `60 kunlik muddat: ${days} kun qoldi`,
  },

  friends: {
    add: "Do'stlikka qo'shish",
    sent: "Do'stlik taklifi yuborildi!",
    received: (name: string) => `${name} sizga do'stlik taklifini yubormoqda`,
    alreadySent: 'Taklif ilgari yuborilgan',
  },

  clan: {
    title: 'Gildiya',
    none: "Gildiyaga qo'shilmagansiz",
    create: 'Gildiya tuzish',
    creating: 'Tuzilmoqda…',
    join: "Gildiyaga qo'shilish",
    joining: "Qo'shilmoqda…",
    nameField: 'Gildiya nomi',
    tagField: 'Teg',
    tagHint: '2–5 belgi: A–Z, 0–9',
    colorField: 'Rang',
    emblemField: 'Gildiya gerbi',
    codeField: 'Taklif kodi',
    codeHint: '6 belgili kod',
    inviteCode: 'Taklif kodi',
    members: (count: number) => `A'zolar ${count}/10`,
    area: 'Gildiya hududi',
    leave: 'Gildiyadan chiqish',
    leaving: 'Chiqilmoqda…',
    remove: 'Chetlatish',
    roles: {
      owner: 'Sardor',
      officer: 'Yordamchi',
      member: "A'zo",
    },
    errors: {
      alreadyInClan: 'Siz allaqachon gildiyadasiz.',
      tagTaken: "Bu teg band, boshqasini tanlang.",
      full: "Gildiya to'la — 10 a'zo.",
      codeNotFound: 'Bunday kod bilan gildiya topilmadi.',
      invalid: "Ma'lumotlar noto'g'ri. Nomi 3–48 belgi, teg 2–5 belgi bo'lishi kerak.",
      generic: 'Amalni bajarib bo\'lmadi.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} sizning ${area} m² hududingizga kirdi!`,
    dismiss: 'Yopish',
  },
};
