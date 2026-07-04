// Small inline SVG icons, consistent 1.6 stroke, currentColor.

type P = { className?: string };
const base = "inline-block";

export const IconPlan = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
  </svg>
);
export const IconList = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
    <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSearch = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" strokeLinecap="round" />
  </svg>
);
export const IconTool = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <path d="M14.5 5.5a3.5 3.5 0 0 0-4.9 4.4L4 15.5 8.5 20l5.6-5.6a3.5 3.5 0 0 0 4.4-4.9l-2.3 2.3-2-2 2.3-2.3z" strokeLinejoin="round" />
  </svg>
);
export const IconScale = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <path d="M12 3v18M7 21h10M5 7h14l-3 6H8L5 7zM12 7 5 7M12 7l7 0" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconTarget = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);
export const IconClock = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconCheck = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`}>
    <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconX = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${base} ${className}`}>
    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
  </svg>
);
export const IconQuestion = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
    <path d="M9 9a3 3 0 1 1 4 2.8c-.8.4-1 .9-1 1.7V14" strokeLinecap="round" />
    <circle cx="12" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconArrowRight = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${base} ${className}`}>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconDownload = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={`${base} ${className}`}>
    <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconPlay = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${base} ${className}`}>
    <path d="M8 5.5v13l11-6.5-11-6.5z" />
  </svg>
);
export const IconGrid = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);
export const IconInbox = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <path d="M3.5 13.5 6 5.5h12l2.5 8v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4z" strokeLinejoin="round" />
    <path d="M3.5 13.5H8l1.5 2.5h5L16 13.5h4.5" strokeLinejoin="round" />
  </svg>
);
export const IconDoc = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    <path d="M13.5 3.5V8H18M8.5 12h7M8.5 15.5h7" strokeLinecap="round" />
  </svg>
);
export const IconGear = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" strokeLinecap="round" />
  </svg>
);
export const IconHelp = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-.9.8-.9 1.5v.3" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);
export const IconBell = ({ className = "" }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={`${base} ${className}`}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5h-14S6.5 14 6.5 10z" strokeLinejoin="round" />
    <path d="M10 18.5a2 2 0 0 0 4 0" strokeLinecap="round" />
  </svg>
);
