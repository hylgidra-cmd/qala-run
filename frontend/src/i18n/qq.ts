import { getActiveDict } from './state';

export interface TranslationDictionary {
  brand: {
    name: string;
    home: string;
  };
  mode: {
    label: string;
    solo: string;
    clan: string;
    clanNeeded: string;
  };
  map: {
    label: string;
    eyebrow: string;
    headline: string;
    lead: string;
    ready: string;
    offline: string;
    dismiss: string;
  };
  geo: {
    outOfBounds: string;
    outsideCity: (city: string) => string;
    denied: string;
    unavailable: string;
    timeout: string;
    unknown: string;
  };
  cities: {
    label: string;
    select: string;
    change: string;
  };
  run: {
    start: string;
    finish: string;
    checking: string;
    close: string;
    release: string;
    captured: string;
    rejected: string;
    excluded: (area: string) => string;
    closedGap: (distance: string) => string;
    takenFrom: (owners: string) => string;
    tracking: (count: number) => string;
    noApi: string;
    couldNotStart: string;
    couldNotFinish: string;
    couldNotUpload: string;
    couldNotRelease: string;
    noGeolocation: string;
  };
  activity: Record<string, string>;
  reasons: Record<string, string>;
  legend: {
    title: string;
    hide: string;
    show: string;
    kinds: Record<string, string>;
    count: (count: number) => string;
    truncated: string;
  };
  qr: {
    title: string;
    label: string;
    hide: string;
    reopen: string;
    preparing: string;
    hint: string;
    localhost: string;
  };
  profile: {
    open: string;
    title: string;
    close: string;
    playerId: string;
    copy: string;
    copied: string;
    name: string;
    save: string;
    saving: string;
    nameTooShort: string;
    nameTooLong: string;
    runs: string;
    soloArea: string;
    clanArea: string;
    joined: string;
    loading: string;
    unavailable: string;
    logout: string;
    privacyZone: string;
    privacyActive: string;
  };
  events: {
    banner: string;
    daysLeft: (days: number) => string;
  };
  friends: {
    add: string;
    sent: string;
    received: (name: string) => string;
    alreadySent: string;
  };
  clan: {
    title: string;
    none: string;
    create: string;
    creating: string;
    join: string;
    joining: string;
    nameField: string;
    tagField: string;
    tagHint: string;
    colorField: string;
    emblemField: string;
    codeField: string;
    codeHint: string;
    inviteCode: string;
    members: (count: number) => string;
    area: string;
    leave: string;
    leaving: string;
    remove: string;
    roles: Record<string, string>;
    errors: {
      alreadyInClan: string;
      tagTaken: string;
      full: string;
      codeNotFound: string;
      invalid: string;
      generic: string;
    };
  };
  notifications: {
    territoryInvaded: (invader: string, area: number) => string;
    dismiss: string;
  };
}

/**
 * Every word the site says, in Karakalpak (Latin script).
 */
export const qq: TranslationDictionary = {
  brand: {
    name: "Don't Stop",
    home: 'Bas bet',
  },

  mode: {
    label: 'Aymaq rejimi',
    solo: 'Jeke',
    clan: 'Gildiya',
    clanNeeded: 'Gildiya rejimi ushın aldın gildiyaǵa kiriw kerek.',
  },

  map: {
    label: 'Nókis aymaq kartası',
    eyebrow: 'NÓKIS PILOTI',
    headline: 'Jolıńdı iyele.',
    lead: 'Aymaqtı iyelew ushın jabıq shenber sızıp júriń yaki juwırıń.',
    ready: 'Juwırıw tayın',
    offline: 'Tek karta — bul jerde API joq',
    dismiss: 'Jabıw',
  },

  geo: {
    outOfBounds: 'Siz saylaǵan qala aymaǵınan tısqarıdasız, sonlıqtan karta sizdi izley almaydı.',
    outsideCity: (city: string) => `Siz saylaǵan qalada (${city}) emessiz! Karta sizdi izley almaydı.`,
    denied:
      'Bul sayt ushın jaylasıw bloklanǵan. Brauzerdiń mánzil qatarındaǵı sazlawlarda ruxsat beriń hám jaylasıw dúgmesin qayta basıń.',
    unavailable:
      'Jaylasıw anıqlanbadı. GPS i joq noutbuk Wi-Fi arqalı anıqlaydı, ol úy ishinde islemewi múmkin.',
    timeout: 'Jaylasıw sorawınıń waqtı tamam boldı. Dúgmeni qayta basıń.',
    unknown: 'Jaylasıw házirshe qoljetimsiz.',
  },

  cities: {
    label: 'Qala',
    select: 'Qalanı saylań',
    change: 'Qalanı ózgertiw',
  },

  run: {
    start: 'Juwırıwdı baslaw',
    finish: 'Juwmaqlaw',
    checking: 'Tekserilmekte…',
    close: 'Jabıw',
    release: 'Bosatıw',
    captured: 'AYMAQ IYELENDI',
    rejected: 'JUWIRIW BIYKARLANDI',
    excluded: (area: string) => `${area} imaratlar hám jabıq aymaqlar ushın alıp taslandı`,
    closedGap: (distance: string) => `Baslawǵa shekem ${distance} aralıq server tárepinen jabıldı`,
    takenFrom: (owners: string) => `${owners} den alındı`,
    tracking: (count: number) =>
      `${count} noqat jazıldı. Baslaǵan jerińizge qaytıp barıń, soń juwmaqlań.`,
    noApi: 'Bul mánzilde API joq, sonlıqtan juwırıwdı jazıp bolmaydı.',
    couldNotStart: 'Juwırıwdı baslaw múmkin bolmadı.',
    couldNotFinish: 'Juwırıwdı juwmaqlaw múmkin bolmadı.',
    couldNotUpload: 'Noqatlardı jiberiw múmkin bolmadı.',
    couldNotRelease: 'Juwırıwdı bosatıw múmkin bolmadı.',
    noGeolocation: 'Bul brauzerde Geolocation API joq.',
  },

  activity: {
    walk: 'júriw',
    run: 'juwırıw',
    bike: 'velosiped',
    vehicle: 'transport',
  },

  reasons: {
    LOOP_NOT_CLOSED: 'Shenber baslanǵan jerge qaytpadı. Baslaǵan jerińizde juwmaqlań.',
    TOO_SHORT: 'Shenber bul server ruxsat etken eń kishi uzınlıqtan qısqa.',
    AREA_TOO_SMALL: 'Qorshalǵan maydan ruxsat etilgen eń kishi muǵdardan kishi.',
    BAD_SHAPE: 'Trek hesh qanday maydandı qorshamaydı, sonlıqtan beretuǵın jer joq.',
    ACTIVITY_NOT_ALLOWED: 'Tek júriw hám juwırıw esaplanadı. Bul tezlik júdá joqarı.',
    TELEPORT_DETECTED: 'Trekte adam háreketlene almaytuǵın sekiriw bar.',
    LOW_GPS_QUALITY: 'GPS signalı isenim artarlıqtay emes edi.',
    OUTSIDE_REGION: 'Shenber Nókis pilot aymaǵınan tısqarıda.',
    NO_AWARDABLE_AREA: 'Qadaǵan aymaqlar alıp taslanǵannan keyin hesh nárse qalmadı.',
    DUPLICATE_RUN: 'Bul juwırıw aldın jiberilgen.',
    NOT_IN_CLAN: 'Gildiya ushın juwırıw ushın aldın gildiyaǵa kiriwińiz kerek.',
  },

  legend: {
    title: 'Esaplanbaytuǵın jer',
    hide: 'Jasırıw',
    show: 'Kórsetiw',
    kinds: {
      building: 'Imaratlar',
      private: 'Jeke múlk',
      school: 'Mektepler',
      hospital: 'Emlewxanalar',
      military: 'Áskeriy aymaq',
      water: 'Suw',
      industrial: 'Sanaat aymaǵı',
      other: 'Basqa',
    },
    count: (count: number) =>
      `Kóriniste ${count} aymaq. Bul jer iyelengen maydannan alıp taslanadı.`,
    truncated: 'Bul jerde aymaq júdá kóp — bárin kóriw ushın jaqınlastırıń.',
  },

  qr: {
    title: 'TELEFONDA ASHIW',
    label: 'Bul demonı telefonda ashıw',
    hide: 'Telefon siltemesin jasırıw',
    reopen: 'Telefon siltemesi',
    preparing: 'Kod tayarlanbaqta…',
    hint: 'Skanerlep, kartadaǵı jaylasıw dúgmesin basıń. Telefonda haqıyqıy GPS bar, bul noutbukta joq.',
    localhost:
      'Bul bet localhost ta ashılǵan, onı telefon asha almaydı. Deploy etilgen mánzildi yaki HTTPS tunneldi isletiń, sonda bul kartada skanerlenetuǵın kod payda boladı.',
  },

  profile: {
    open: 'Profildi ashıw',
    title: 'Profil',
    close: 'Jabıw',
    playerId: 'Oyınshı ID',
    copy: 'Kóshiriw',
    copied: 'Kóshirildi',
    name: 'At',
    save: 'Saqlaw',
    saving: 'Saqlanbaqta…',
    nameTooShort: 'At keminde 2 belgiden turıwı kerek.',
    nameTooLong: 'At eń kóbi 24 belgi.',
    runs: 'Juwırıwlar',
    soloArea: 'Jeke aymaq',
    clanArea: 'Gildiya aymaǵı',
    joined: 'Qosılǵan',
    loading: 'Júklenbekte…',
    unavailable: 'Profil házirshe qoljetimsiz.',
    logout: 'Akkaunttan shıǵıw',
    privacyZone: 'Maxfiylik zonası (200m radius)',
    privacyActive: 'Maxfiylik zonası belsendi: Uy kórsetkishleri jasırıldı',
  },

  events: {
    banner: '🔥 Nókis eventı: 2x Maydon boyınsha bonus!',
    daysLeft: (days: number) => `60-kunlik muddat: ${days} kún qaldı`,
  },

  friends: {
    add: 'Dostlıqqa qosıw',
    sent: 'Dostlıq usınısı jiberildi!',
    received: (name: string) => `${name} saǵan dostlıq usınısın jibermekte`,
    alreadySent: 'Usınıs aldın jiberilgen',
  },

  clan: {
    title: 'Gildiya',
    none: 'Gildiyaǵa qosılmaǵansız',
    create: 'Gildiya dúziw',
    creating: 'Dúzilmekte…',
    join: 'Gildiyaǵa qosılıw',
    joining: 'Qosılmaqta…',
    nameField: 'Gildiya atı',
    tagField: 'Teg',
    tagHint: '2–5 belgi: A–Z, 0–9',
    colorField: 'Reń',
    emblemField: 'Gildiya gerbi',
    codeField: 'Shaqırıw kodı',
    codeHint: '6 belgili kod',
    inviteCode: 'Shaqırıw kodı',
    members: (count: number) => `Aǵzalar ${count}/10`,
    area: 'Gildiya aymaǵı',
    leave: 'Gildiyadan shıǵıw',
    leaving: 'Shıǵılmaqta…',
    remove: 'Shıǵarıw',
    roles: {
      owner: 'Basshı',
      officer: 'Járdemshi',
      member: 'Aǵza',
    },
    errors: {
      alreadyInClan: 'Siz allaqashan gildiyadasız.',
      tagTaken: 'Bul teg bánt, basqasın saylań.',
      full: 'Gildiya tolı — 10 aǵza.',
      codeNotFound: 'Bunday kod menen gildiya tabılmadı.',
      invalid: 'Maǵlıwmatlar durıs emes. At 3–48 belgi, teg 2–5 belgi bolıwı kerek.',
      generic: 'Ámeldi orınlaw múmkin bolmadı.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} seniń ${area} m² aymaqıńa kirdi!`,
    dismiss: 'Jabıw',
  },
};

// Proxy fallback export to ensure `import { t } from './qq'` continues to work seamlessly
export const t: TranslationDictionary = new Proxy(qq, {
  get(_target, prop: keyof TranslationDictionary) {
    const active = getActiveDict();
    return active ? (active[prop] ?? qq[prop]) : qq[prop];
  },
});
