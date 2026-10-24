import type { CSSProperties } from 'react';

const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  sites: 'M3 5h18v14H3z M3 9h18 M7 7h.01 M10 7h.01',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  activity: 'M8 4h12v17H4V4h4 M8 2h8v4H8z M8 11l2 2 5-5 M8 17h8',
  connections: 'M8 3v5 M16 3v5 M5 8h14v3a7 7 0 0 1-14 0V8z M12 18v4',
  guides: 'M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1z M12 5v16',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  up: 'M5 16l6-6 4 4 6-9 M15 5h6v6',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
  target: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M12 12h.01',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M6 6l12 12 M18 6 6 18',
  chevron: 'm9 5 7 7-7 7',
  sparkle: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3z',
  github:
    'M9 19c-4 1-4-2-6-2 M15 22v-4c0-1 .1-2-1-3 4-.5 7-2 7-6 0-2-.5-3-2-4 .3-1 .3-2 0-3-2 0-3 1-4 2a12 12 0 0 0-6 0C8 3 7 2 5 2c-.3 1-.3 2 0 3-1.5 1-2 2-2 4 0 4 3 5.5 7 6-1 1-1 2-1 3v4',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M20 7v22H8L20 7Z" fill="white" />
      <path d="m24 13 9 16H24V13Z" fill="white" opacity=".55" />
      <path d="M8 33h24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
