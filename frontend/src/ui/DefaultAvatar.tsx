import type { CSSProperties } from 'react';

interface Props {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Standard user avatar silhouette (gray circle with clean head & shoulders).
 * Displayed when user hasn't uploaded a custom photo.
 */
export function DefaultAvatar({ size = 48, className = '', style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`default-avatar ${className}`}
      style={{ borderRadius: '50%', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#B0B3B8" />
      {/* Head */}
      <circle cx="50" cy="38" r="17" fill="#FFFFFF" />
      {/* Shoulders / Torso */}
      <path
        d="M20 86C20 69 33 60 50 60C67 60 80 69 80 86C80 92 74 96 50 96C26 96 20 92 20 86Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

