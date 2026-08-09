export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Rounded square background */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#cmhash-gradient)" />
      <rect x="2" y="2" width="44" height="44" rx="14" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />

      {/* Decorative highlights */}
      <circle cx="36" cy="10" r="12" fill="rgba(255,255,255,0.10)" />
      <circle cx="10" cy="38" r="10" fill="rgba(255,255,255,0.06)" />

      {/* Hash symbol # */}
      <g stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round">
        {/* Left vertical */}
        <line x1="18" y1="12" x2="15.5" y2="34" />
        {/* Right vertical */}
        <line x1="27" y1="12" x2="24.5" y2="34" />
        {/* Top horizontal */}
        <line x1="12" y1="20" x2="32" y2="20" />
        {/* Bottom horizontal */}
        <line x1="15" y1="28" x2="35" y2="28" />
      </g>

      {/* Bolt accent */}
      <path
        d="M33 18 L26 22 L29 25 L23 30 L31 26 L28 23 L34 19 Z"
        fill="#7bb9ff"
        opacity="0.9"
      />

      <defs>
        <linearGradient id="cmhash-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea1ff" />
          <stop offset="0.5" stopColor="#0087f7" />
          <stop offset="1" stopColor="#006bd4" />
        </linearGradient>
      </defs>
    </svg>
  );
}