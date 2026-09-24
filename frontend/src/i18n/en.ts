import type { TranslationDictionary } from './qq';

export const en: TranslationDictionary = {
  brand: {
    name: "Don't Stop",
    home: 'Home',
  },

  mode: {
    label: 'Territory Mode',
    solo: 'Solo',
    clan: 'Guild',
    clanNeeded: 'Must join a guild first for Guild mode.',
  },

  map: {
    label: 'Territory Map',
    eyebrow: 'NUKUS PILOT',
    headline: 'Claim your track.',
    lead: 'Walk or run in a closed loop to capture territory.',
    ready: 'Ready to run',
    offline: 'Map only — no API here',
    dismiss: 'Close',
  },

  geo: {
    outOfBounds: 'You are outside the selected city boundary.',
    outsideCity: (city: string) => `You are not in ${city}!`,
    denied: 'Location permission denied in browser.',
    unavailable: 'Location unavailable.',
    timeout: 'Location request timed out.',
    unknown: 'Location currently unavailable.',
  },

  cities: {
    label: 'City',
    select: 'Select City',
    change: 'Change City',
  },

  run: {
    start: 'Start Run',
    finish: 'Finish',
    checking: 'Checking…',
    close: 'Close',
    release: 'Release',
    captured: 'TERRITORY CAPTURED',
    rejected: 'RUN REJECTED',
    excluded: (area: string) => `${area} excluded for buildings and restricted zones`,
    closedGap: (distance: string) => `${distance} gap closed to start by server`,
    takenFrom: (owners: string) => `Taken from ${owners}`,
    tracking: (count: number) =>
      `${count} points recorded. Return to starting point to finish.`,
    noApi: 'No API available',
    couldNotStart: 'Could not start run.',
    couldNotFinish: 'Could not finish run.',
    couldNotUpload: 'Could not upload points.',
    couldNotRelease: 'Could not release run.',
    noGeolocation: 'No Geolocation API in browser.',
  },

  activity: {
    walk: 'walk',
    run: 'run',
    bike: 'cycling',
    vehicle: 'vehicle',
  },

  reasons: {
    LOOP_NOT_CLOSED: 'Loop did not return to starting point.',
    TOO_SHORT: 'Loop is shorter than minimum allowed distance.',
    AREA_TOO_SMALL: 'Enclosed area is smaller than minimum required.',
    BAD_SHAPE: 'Track does not enclose valid territory.',
    ACTIVITY_NOT_ALLOWED: 'Only walking and running are allowed.',
    TELEPORT_DETECTED: 'Unrealistic speed burst detected.',
    LOW_GPS_QUALITY: 'GPS quality is too low.',
    OUTSIDE_REGION: 'Outside pilot territory.',
    NO_AWARDABLE_AREA: 'No claimable ground remained after exclusions.',
    DUPLICATE_RUN: 'This run was already submitted.',
    NOT_IN_CLAN: 'Must join a guild before submitting a guild run.',
  },

  legend: {
    title: 'Excluded Ground',
    hide: 'Hide',
    show: 'Show',
    kinds: {
      building: 'Buildings',
      private: 'Private Property',
      school: 'Schools',
      hospital: 'Hospitals',
      military: 'Military Base',
      water: 'Water',
      industrial: 'Industrial',
      other: 'Other',
    },
    count: (count: number) => `${count} excluded zones in view.`,
    truncated: 'Zoom in to view all zones.',
  },

  qr: {
    title: 'OPEN ON PHONE',
    label: 'Open demo on phone',
    hide: 'Hide phone link',
    reopen: 'Phone link',
    preparing: 'Preparing QR…',
    hint: 'Scan and press location button.',
    localhost: 'Localhost URL.',
  },

  profile: {
    open: 'Open Profile',
    title: 'Profile',
    close: 'Close',
    playerId: 'Player ID',
    copy: 'Copy',
    copied: 'Copied',
    name: 'Name',
    save: 'Save',
    saving: 'Saving…',
    nameTooShort: 'Name must be at least 2 characters.',
    nameTooLong: 'Name can be at most 24 characters.',
    runs: 'Runs',
    soloArea: 'Solo Area',
    clanArea: 'Guild Area',
    joined: 'Joined',
    loading: 'Loading…',
    unavailable: 'Profile unavailable.',
    logout: 'Log out',
    privacyZone: 'Privacy Zone (200m radius)',
    privacyActive: 'Privacy zone active: Home markers hidden',
  },

  events: {
    banner: '🔥 Event: 2x Territory Bonus!',
    daysLeft: (days: number) => `${days} days remaining`,
  },

  friends: {
    add: 'Add Friend',
    sent: 'Friend Request Sent!',
    received: (name: string) => `${name} sent you a friend request`,
    alreadySent: 'Request already sent',
  },

  clan: {
    title: 'Guild',
    none: 'You are not in a guild',
    create: 'Create Guild',
    creating: 'Creating…',
    join: 'Join Guild',
    joining: 'Joining…',
    nameField: 'Guild Name',
    tagField: 'Tag',
    tagHint: '2–5 characters: A–Z, 0–9',
    colorField: 'Color',
    emblemField: 'Guild Emblem',
    codeField: 'Invite Code',
    codeHint: '6-character code',
    inviteCode: 'Invite Code',
    members: (count: number) => `Members ${count}/10`,
    area: 'Guild Area',
    leave: 'Leave Guild',
    leaving: 'Leaving…',
    remove: 'Remove',
    roles: {
      owner: 'Leader',
      officer: 'Officer',
      member: 'Member',
    },
    errors: {
      alreadyInClan: 'You are already in a guild.',
      tagTaken: 'This tag is already taken.',
      full: 'Guild is full — 10 members.',
      codeNotFound: 'Guild not found.',
      invalid: 'Invalid data provided.',
      generic: 'Operation failed.',
    },
  },

  notifications: {
    territoryInvaded: (invader: string, area: number) =>
      `⚔️ ${invader} invaded ${area} m² of your territory!`,
    dismiss: 'Close',
  },
};

