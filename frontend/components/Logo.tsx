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
      <path d="M4 10 L14 5 L24 20 L34 5 L44 10 L34 41 L24 27 L14 41 Z" fill="url(#cmhash-gradient)" />
      <path d="M14 5 L24 20 L24 27 L14 41 Z" fill="#0b77e8" opacity="0.88" />
      <path d="M34 5 L24 20 L24 27 L34 41 Z" fill="#1fc7ff" opacity="0.92" />
      <path d="M7 12 L14 8 L14 34 L7 27 Z" fill="#0582ff" />
      <path d="M41 12 L34 8 L34 34 L41 27 Z" fill="#0098ff" />
      <path d="M14 5 L24 20 L34 5 L24 12 Z" fill="#8ee7ff" opacity="0.85" />

      <defs>
        <linearGradient id="cmhash-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#36d9ff" />
          <stop offset="0.52" stopColor="#008cff" />
          <stop offset="1" stopColor="#005ed2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
