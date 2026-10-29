// MyTA logo: "My" sits on a puzzle piece, "T" is plain, and the "A" is a tiny white monster. Simple on purpose.
export default function Logo() {
  return (
    <div className="logo" role="img" aria-label="MyTA">
      <svg width="64" height="48" viewBox="0 0 64 48" aria-hidden="true">
        <path d="M6 10h20a5 5 0 1 1 10 0h20a2 2 0 0 1 2 2v10a5 5 0 1 0 0 10v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z" fill="#cdbdf7" stroke="#2B2340" strokeWidth="3" strokeLinejoin="round" />
        <text x="30" y="36" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontWeight="800" fontSize="22" fill="#2B2340">My</text>
      </svg>
      <span className="logo-t">T</span>
      <svg width="46" height="52" viewBox="0 0 46 52" aria-hidden="true">
        <path d="M5 46 20 8q3-6 6 0l15 38q1 4-3 4h-4q-3 0-4-3l-1-3H17l-1 3q-1 3-4 3H8q-4 0-3-4z" fill="#fff" stroke="#2B2340" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="19" cy="27" r="2.600" fill="#2B2340" /><circle cx="28" cy="27" r="2.600" fill="#2B2340" />
        <path d="M19.500 33q3.500 3.500 7 0" fill="none" stroke="#2B2340" strokeWidth="2.200" strokeLinecap="round" />
        <circle cx="15" cy="31" r="2.200" fill="#f6b8b0" /><circle cx="32" cy="31" r="2.200" fill="#f6b8b0" />
      </svg>
    </div>
  );
}
