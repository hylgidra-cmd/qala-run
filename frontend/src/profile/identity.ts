/** Small helpers that turn a player's own data into their avatar. */

/** Two letters: initials if the name has two words, else its first two. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return (words[0] ?? '??').slice(0, 2).toUpperCase();
}

/** A stable colour per player, taken from the id the server gave them. */
export function avatarHue(playerId: string): number {
  const digits = playerId.replace(/\D/g, '');

  return Number(digits.slice(-3) || 0) % 360;
}
