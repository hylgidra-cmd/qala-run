import type { TranslationDictionary } from './qq';

export const tr: TranslationDictionary = {
  brand: {
    name: "Don't Stop",
    home: 'Ana Sayfa',
  },

  mode: {
    label: 'Bölge Modu',
    solo: 'Bireysel',
    clan: 'Lonca',
    clanNeeded: 'Lonca modu için önce bir loncaya katılmalısınız.',
  },

  map: {
    label: 'Nukus bölge haritası',
    eyebrow: 'NUKUS PİLOTU',
    headline: 'Yolunu fethet.',
    lead: 'Bölgeyi ele geçirmek için kapalı bir döngü çizin.',
    ready: 'Koşu Hazır',
    offline: 'Sadece harita — API yok',
    dismiss: 'Kapat',
  },

  geo: {
    outOfBounds: 'Seçilen şehir bölgesinin dışındasınız.',
    outsideCity: (city: string) => `Seçilen şehirde (${city}) değilsiniz!`,
    denied: 'Konum erişimi reddedildi. Brauzer ayarlarından izin verin.',
    unavailable: 'Konum tespit edilemedi.',
    timeout: 'Konum isteği zaman aşımına uğradı.',
    unknown: 'Konum şu an kullanılamıyor.',
  },

  cities: {
    label: 'Şehir',
    select: 'Şehir Seçin',
    change: 'Şehri Değiştir',
  },

  run: {
    start: 'Koşuyu Başlat',
    finish: 'Bitir',
    checking: 'Kontrol ediliyor…',
    close: 'Kapat',
    release: 'Bırak',
    captured: 'BÖLGE ELE GEÇİRİLDİ',
    rejected: 'KOŞU REDDEDİLDİ',
    excluded: (area: string) => `${area} binalar için çıkarıldı`,
    closedGap: (distance: string) => `${distance} mesafe kapatıldı`,
    takenFrom: (owners: string) => `${owners} kişisinden alındı`,
    tracking: (count: number) => `${count} nokta kaydedildi. Başlangıca dönün.`,
    noApi: 'API yok.',
    couldNotStart: 'Koşu başlatılamadı.',
    couldNotFinish: 'Koşu bitirilemedi.',
    couldNotUpload: 'Yüklenemedi.',
    couldNotRelease: 'Serbest bırakılamadı.',
    noGeolocation: 'Geolocation API yok.',
  },

  activity: {
    walk: 'yürüyüş',
    run: 'koşu',
    bike: 'bisiklet',
    vehicle: 'taşıt',
  },

  reasons: {
    LOOP_NOT_CLOSED: 'Döngü başlangıç noktasına dönmedi.',
    TOO_SHORT: 'Döngü çok kısa.',
    AREA_TOO_SMALL: 'Alan çok küçük.',
    BAD_SHAPE: 'İz alan kaplamıyor.',
    ACTIVITY_NOT_ALLOWED: 'Sadece yürüyüş ve koşu geçerli.',
    TELEPORT_DETECTED: 'Işınlanma algılandı.',
    LOW_GPS_QUALITY: 'Düşük GPS kalitesi.',
    OUTSIDE_REGION: 'Bölge dışında.',
    NO_AWARDABLE_AREA: 'Kazanılacak alan kalmadı.',
    DUPLICATE_RUN: 'Bu koşu daha önce gönderildi.',
    NOT_IN_CLAN: 'Lonca koşusu için loncaya katılmalısınız.',
  },

  legend: {
    title: 'Muaf Alanlar',
    hide: 'Gizle',
    show: 'Göster',
    kinds: {
      building: 'Binalar',
      private: 'Özel Mülk',
      school: 'Okullar',
      hospital: 'Hastaneler',
      military: 'Askeri Bölge',
      water: 'Su',
      industrial: 'Sanayi',
      other: 'Diğer',
    },
    count: (count: number) => `Görünümde ${count} bölge var.`,
    truncated: 'Yakınlaştırın.',
  },

  qr: {
    title: 'TELEFONDA AÇ',
    label: 'Telefonda Aç',
    hide: 'Gizle',
    reopen: 'Telefon Bağlantısı',
    preparing: 'Kod hazırlanıyor…',
    hint: 'Tara ve GPS butonuna bas.',
    localhost: 'Localhost bağlantısı.',
  },

  profile: {
    open: 'Profili Aç',
    title: 'Profil',
    close: 'Kapat',
    playerId: 'Oyuncu ID',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    name: 'İsim',
    save: 'Kaydet',
    saving: 'Kaydediliyor…',
    nameTooShort: 'İsim en az 2 karakter olmalı.',
    nameTooLong: 'İsim en fazla 24 karakter.',
    runs: 'Koşular',
    soloArea: 'Bireysel Alan',
    clanArea: 'Lonca Alanı',
    joined: 'Katıldı',
    loading: 'Yükleniyor…',
    unavailable: 'Kullanılamıyor.',
    logout: 'Çıkış Yap',
    privacyZone: 'Gizlilik Bölgesi (200m yarıçap)',
    privacyActive: 'Gizlilik bölgesi aktif: Ev göstergeleri gizlendi',
  },

  events: {
    banner: '🔥 Etkinlik: 2x Alan Bonusu!',
    daysLeft: (days: number) => `${days} gün kaldı`,
  },

  friends: {
    add: 'Arkadaş Ekle',
    sent: 'İstek Gönderildi!',
    received: (name: string) => `${name} arkadaşlık isteği gönderdi`,
    alreadySent: 'İstek zaten gönderildi',
  },

  clan: {
    title: 'Lonca',
    none: 'Bir loncaya katılmadınız',
    create: 'Lonca Oluştur',
    creating: 'Oluşturuluyor…',
    join: 'Loncaya Katıl',
    joining: 'Katılınıyor…',
    nameField: 'Lonca Adı',
    tagField: 'Etiket',
    tagHint: '2–5 karakter: A–Z, 0–9',
    colorField: 'Renk',
    emblemField: 'Lonca Amblemi',
    codeField: 'Davet Kodu',
    codeHint: '6 karakterli kod',
    inviteCode: 'Davet Kodu',
    members: (count: number) => `Üyeler ${count}/10`,
    area: 'Lonca Alanı',
    leave: 'Loncadan Ayrıl',
    leaving: 'Ayrılınıyor…',
    remove: 'Çıkar',
    roles: {
      owner: 'Lider',
      officer: 'Subay',
      member: 'Üye',
    },
    errors: {
      alreadyInClan: 'Zaten bir loncadasınız.',
      tagTaken: 'Bu etiket alınmış.',
      full: 'Lonca dolu — 10 üye.',
      codeNotFound: 'Lonca bulunamadı.',
      invalid: 'Geçersiz veriler.',
      generic: 'İşlem başarısız oldu.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} senin ${area} m² alanına girdi!`,
    dismiss: 'Kapat',
  },
};

