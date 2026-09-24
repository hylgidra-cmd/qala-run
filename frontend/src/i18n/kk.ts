import type { TranslationDictionary } from './qq';

export const kk: TranslationDictionary = {
  brand: {
    name: "Don't Stop",
    home: 'Basty bet',
  },

  mode: {
    label: 'Aumaq rejımi',
    solo: 'Jeke',
    clan: 'Gıldııa',
    clanNeeded: 'Gıldııa rejımi úshın aldymen gıldııaǵa kírý kerek.',
  },

  map: {
    label: 'Nókıs aumaq kartasy',
    eyebrow: 'NÓKÍS PILOTY',
    headline: 'Jolyńdy íele.',
    lead: 'Aumaqty íeleý úshın jabyq sheńber syzyp júrıńız nemese júgırıńız.',
    ready: 'Júgırý daıyn',
    offline: 'Tek karta — munda API joq',
    dismiss: 'Jabý',
  },

  geo: {
    outOfBounds: 'Sız tańdaǵan qala aumaǵynan tysqarysyz, karta sızdı baha almaydy.',
    outsideCity: (city: string) => `Sız tańdaǵan qalada (${city}) emessız!`,
    denied:
      'Bul sait úshın oryn bloktalǵan. Brauzer sazlaýlarynda ruqsat berıńız.',
    unavailable:
      'Oryn anyqtalmady.',
    timeout: 'Úaqyty aıaqtaldy.',
    unknown: 'Oryn qoljetımsız.',
  },

  cities: {
    label: 'Qala',
    select: 'Qalany tańdańyz',
    change: 'Qalany ózgertý',
  },

  run: {
    start: 'Júgırýdı bastaý',
    finish: 'Aıaqtaý',
    checking: 'Tekserylde…',
    close: 'Jabý',
    release: 'Bosatý',
    captured: 'AUMAQ ÍELENDÍ',
    rejected: 'JÚGÍRÝ BAZARLANDY',
    excluded: (area: string) => `${area} ǵımarattar úshın alyndy`,
    closedGap: (distance: string) => `${distance} araqashyqtyq jabyldy`,
    takenFrom: (owners: string) => `${owners} den alyndy`,
    tracking: (count: number) =>
      `${count} nükte jazyldy. Bastaǵan jerińızge qaityńyz.`,
    noApi: 'API joq.',
    couldNotStart: 'Bastaý múmkın bolmady.',
    couldNotFinish: 'Aıaqtaý múmkın bolmady.',
    couldNotUpload: 'Jiberý múmkın bolmady.',
    couldNotRelease: 'Bosatý múmkın bolmady.',
    noGeolocation: 'Geolocation API joq.',
  },

  activity: {
    walk: 'júrý',
    run: 'júgırý',
    bike: 'velosiped',
    vehicle: 'kólık',
  },

  reasons: {
    LOOP_NOT_CLOSED: 'Sheńber bastaǵan jerge qaıtmady.',
    TOO_SHORT: 'Sheńber qysqa.',
    AREA_TOO_SMALL: 'Aumaq kishi.',
    BAD_SHAPE: 'Trek aumaqty qorshamaıdy.',
    ACTIVITY_NOT_ALLOWED: 'Tek júrý hám júgırý esaptalady.',
    TELEPORT_DETECTED: 'Jyldam sekirý anıqtaldy.',
    LOW_GPS_QUALITY: 'GPS sapasy tómen.',
    OUTSIDE_REGION: 'Aumaqtan tıs.',
    NO_AWARDABLE_AREA: 'Jer qalmdy.',
    DUPLICATE_RUN: 'Bul júgırý jiberılgen.',
    NOT_IN_CLAN: 'Gıldııaǵa kırıńız.',
  },

  legend: {
    title: 'Esaptalmaytyn jerler',
    hide: 'Jasyrý',
    show: 'Kórsetý',
    kinds: {
      building: 'Ǵımarattar',
      private: 'Jeke mülk',
      school: 'Mektepter',
      hospital: 'Auraxanalar',
      military: 'Áskerıı aumaq',
      water: 'Suv',
      industrial: 'Ónerkásıp',
      other: 'Basqa',
    },
    count: (count: number) => `Kórınıste ${count} aumaq bar.`,
    truncated: 'Kartany jaqyndatyńyz.',
  },

  qr: {
    title: 'TELEFONDA ASHÝ',
    label: 'Telefonda ashý',
    hide: 'Jasyrý',
    reopen: 'Sılteme',
    preparing: 'Daıyndalýda…',
    hint: 'Skanerleńız hám GPS basyńyz.',
    localhost: 'Localhost sıltemesi.',
  },

  profile: {
    open: 'Profildi ashý',
    title: 'Profil',
    close: 'Jabý',
    playerId: 'Oıynshy ID',
    copy: 'Kóshırý',
    copied: 'Kóshırıldı',
    name: 'At',
    save: 'Saqtaý',
    saving: 'Saqtalýda…',
    nameTooShort: 'At keminde 2 belgi.',
    nameTooLong: 'At eń kóbi 24 belgi.',
    runs: 'Júgırýler',
    soloArea: 'Jeke aumaq',
    clanArea: 'Gıldııa aumaǵy',
    joined: 'Qosylǵan',
    loading: 'Júktelýde…',
    unavailable: 'Múmkın emes.',
    logout: 'Shyǵý',
    privacyZone: 'Qupııalyq zonasy (200m radius)',
    privacyActive: 'Qupııalyq zonasy belsenı: Úı kórsetkishterı jasyryldy',
  },

  events: {
    banner: '🔥 Nókıs event: 2x Maydon bonýsy!',
    daysLeft: (days: number) => `60 kúnlik muddat: ${days} kún qaldy`,
  },

  friends: {
    add: 'Dostyqqa qosý',
    sent: 'Usynyys jiberıldı!',
    received: (name: string) => `${name} dostyq usyndy`,
    alreadySent: 'Usynyys jiberılgen',
  },

  clan: {
    title: 'Gıldııa',
    none: 'Gıldııaǵa qosylmaǵansyz',
    create: 'Gıldııa qurý',
    creating: 'Qurylyp jatyr…',
    join: 'Gıldııaǵa qosylý',
    joining: 'Qosylýda…',
    nameField: 'Gıldııa aty',
    tagField: 'Teg',
    tagHint: '2–5 belgi: A–Z, 0–9',
    colorField: 'Tús',
    emblemField: 'Gıldııa gerbi',
    codeField: 'Shaqyryý kody',
    codeHint: '6 belgılı kod',
    inviteCode: 'Shaqyryý kody',
    members: (count: number) => `Músheler ${count}/10`,
    area: 'Gıldııa aumaǵy',
    leave: 'Gıldııadan shyǵý',
    leaving: 'Shyǵýda…',
    remove: 'Alyp tastau',
    roles: {
      owner: 'Bascshy',
      officer: 'Kómekshı',
      member: 'Múshe',
    },
    errors: {
      alreadyInClan: 'Sız gıldııadasyz.',
      tagTaken: 'Bul teg bós emes.',
      full: 'Gıldııa toly — 10 múshe.',
      codeNotFound: 'Gıldııa tabylmady.',
      invalid: 'Qate maǵlumattar.',
      generic: 'Qate paıda boldy.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} sızdıń ${area} m² aumaǵyńyzǵa kırdı!`,
    dismiss: 'Jabý',
  },
};

