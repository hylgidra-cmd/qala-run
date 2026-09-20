/**
 * Every word the site says, in Karakalpak (Latin script).
 *
 * The demo is played in Nukus, so Karakalpak is the language of the product,
 * not a translation of it: there is no language switch and no English
 * fallback. Keeping the strings in one file is what makes the wording
 * reviewable by someone who speaks it - code elsewhere only ever reads `t`.
 */
export const t = {
  brand: {
    name: "Don't Stop",
    home: 'Bas bet',
  },

  mode: {
    label: 'Aymaq rejimi',
    solo: 'Jeke',
    clan: 'Klan',
    clanNeeded: 'Klan rejimi ushın aldın klanǵa kiriw kerek.',
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
    outOfBounds: 'Siz Nókis pilot aymaǵınan tısqarıdasız, sonlıqtan karta sizdi izley almaydı.',
    denied:
      'Bul sayt ushın jaylasıw bloklanǵan. Brauzerdiń mánzil qatarındaǵı sazlawlarda ruxsat beriń hám jaylasıw dúgmesin qayta basıń.',
    unavailable:
      'Jaylasıw anıqlanbadı. GPS i joq noutbuk Wi-Fi arqalı anıqlaydı, ol úy ishinde islemewi múmkin.',
    timeout: 'Jaylasıw sorawınıń waqtı tamam boldı. Dúgmeni qayta basıń.',
    unknown: 'Jaylasıw házirshe qoljetimsiz.',
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

  /** What the server decided the runner was doing (TZ section 20.4). */
  activity: {
    walk: 'júriw',
    run: 'juwırıw',
    bike: 'velosiped',
    vehicle: 'transport',
  } as Record<string, string>,

  /** The rejection reasons are a stable server enum (TZ section 19). */
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
    NOT_IN_CLAN: 'Klan ushın juwırıw ushın aldın klanǵa kiriwińiz kerek.',
  } as Record<string, string>,

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
    clanArea: 'Klan aymaǵı',
    joined: 'Qosılǵan',
    loading: 'Júklenbekte…',
    unavailable: 'Profil házirshe qoljetimsiz.',
    logout: 'Akkaunttan shıǵıw',
  },

    clan: {
    title: 'Klan',
    none: 'Klanǵa qosılmaǵansız',
    create: 'Klan dúziw',
    creating: 'Dúzilmekte…',
    join: 'Klanǵa qosılıw',
    joining: 'Qosılmaqta…',
    nameField: 'Klan atı',
    tagField: 'Teg',
    tagHint: '2–5 belgi: A–Z, 0–9',
    colorField: 'Reń',
    codeField: 'Shaqırıw kodı',
    codeHint: '6 belgili kod',
    inviteCode: 'Shaqırıw kodı',
    members: (count: number) => `Aǵzalar ${count}/10`,
    area: 'Klan aymaǵı',
    leave: 'Klannan shıǵıw',
    leaving: 'Shıǵılmaqta…',
    remove: 'Shıǵarıw',
    roles: {
      owner: 'Basshı',
      officer: 'Járdemshi',
      member: 'Aǵza',
    } as Record<string, string>,
    errors: {
      alreadyInClan: 'Siz allaqashan klandasız.',
      tagTaken: 'Bul teg bánt, basqasın saylań.',
      full: 'Klan tolı — 10 aǵza.',
      codeNotFound: 'Bunday kod menen klan tabılmadı.',
      invalid: 'Maǵlıwmatlar durıs emes. At 3–48 belgi, teg 2–5 belgi bolıwı kerek.',
      generic: 'Ámeldi orınlaw múmkin bolmadı.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} seniń ${area} m² aymaqıńa kirdi!`,
    dismiss: 'Jabıw',
  },
} as const;
