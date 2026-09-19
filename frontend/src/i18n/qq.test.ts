import { describe, expect, it } from 'vitest';
import { EXCLUSION_KINDS } from '../map/exclusions';
import { t } from './qq';

/** app/geo/reasons.py. A reason with no text would reach a player as an enum. */
const SERVER_REJECTION_REASONS = [
  'LOOP_NOT_CLOSED',
  'TOO_SHORT',
  'AREA_TOO_SMALL',
  'BAD_SHAPE',
  'ACTIVITY_NOT_ALLOWED',
  'TELEPORT_DETECTED',
  'LOW_GPS_QUALITY',
  'OUTSIDE_REGION',
  'NO_AWARDABLE_AREA',
  'DUPLICATE_RUN',
  'NOT_IN_CLAN',
];

/** app/signal/activity.py. */
const SERVER_ACTIVITIES = ['walk', 'run', 'bike', 'vehicle'];

/** The clan roles the server stores. */
const SERVER_ROLES = ['owner', 'officer', 'member'];

function everyString(value: unknown, path: string[] = []): [string, string][] {
  if (typeof value === 'string') {
    return [[path.join('.'), value]];
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => everyString(child, [...path, key]));
  }

  return [];
}

describe('Karakalpak strings', () => {
  it('covers every rejection reason the server can send', () => {
    for (const reason of SERVER_REJECTION_REASONS) {
      expect(t.reasons[reason], reason).toBeTruthy();
    }
  });

  it('covers every activity the classifier can return', () => {
    for (const activity of SERVER_ACTIVITIES) {
      expect(t.activity[activity], activity).toBeTruthy();
    }
  });

  it('covers every exclusion kind and clan role', () => {
    for (const kind of EXCLUSION_KINDS) {
      expect(t.legend.kinds[kind], kind).toBeTruthy();
    }
    for (const role of SERVER_ROLES) {
      expect(t.clan.roles[role], role).toBeTruthy();
    }
  });

  it('is written in the Latin alphabet, never Cyrillic', () => {
    const cyrillic = everyString(t).filter(([, value]) => /[Ѐ-ӿ]/.test(value));

    expect(cyrillic).toEqual([]);
  });

  it('leaves no empty string behind', () => {
    const empty = everyString(t).filter(([, value]) => value.trim() === '');

    expect(empty).toEqual([]);
  });
});
