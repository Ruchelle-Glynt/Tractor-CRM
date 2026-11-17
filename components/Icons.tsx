// Small line icons (24x24, stroke) used across the app shell and list pages.
type P = { className?: string };
const base = (className?: string) => ({
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const HomeIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>
);
export const BuildingIcon = ({ className }: P) => (
  <svg {...base(className)}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" /></svg>
);
export const BriefcaseIcon = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" /></svg>
);
export const UsersIcon = ({ className }: P) => (
  <svg {...base(className)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2" /></svg>
);
export const PulseIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
);
export const GiftIcon = ({ className }: P) => (
  <svg {...base(className)}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8c-1.5-3-5-4-5.5-2S9 8 12 8Zm0 0c1.5-3 5-4 5.5-2S15 8 12 8Z" /></svg>
);
export const TargetIcon = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>
);
export const ChartIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M3 21h18" /><rect x="5" y="11" width="3" height="7" /><rect x="10.5" y="6" width="3" height="12" /><rect x="16" y="13" width="3" height="5" /></svg>
);
export const CogIcon = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
);
export const LogoutIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const DownloadIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 4v11M7 10l5 5 5-5M4 20h16" /></svg>
);
export const UploadIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 15V4M7 9l5-5 5 5M4 20h16" /></svg>
);
export const ChevronRightIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="m9 6 6 6-6 6" /></svg>
);
export const ListIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);
export const UserIcon = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" /></svg>
);
export const SnowIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5M9 4l3 2 3-2M9 20l3-2 3 2" /></svg>
);
export const ClockIcon = ({ className }: P) => (
  <svg {...base(className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const StarIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9Z" /></svg>
);
export const CakeIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7ZM4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0M12 12V8M12 5.5c-.8-.8-.8-1.7 0-2.5.8.8.8 1.7 0 2.5Z" /></svg>
);
export const MenuIcon = ({ className }: P) => (
  <svg {...base(className)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
