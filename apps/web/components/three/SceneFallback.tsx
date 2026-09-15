/** Same conceptual composition as the canvas; no external assets or filters. */
export function SceneFallback() {
  return (
    <svg viewBox="0 0 400 320" className="h-full w-full" aria-hidden="true">
      <ellipse cx="200" cy="160" rx="150" ry="108" fill="none" stroke="#293047" />
      <path d="M200 160 90 88 M200 160 314 106 M200 160 310 239 M200 160 90 235" stroke="#526074" />
      <circle cx="200" cy="160" r="61" fill="#17152b" stroke="#6D5DFB" strokeWidth="2" />
      <circle cx="200" cy="160" r="43" fill="#6D5DFB" />
      <path d="m180 164 14 14 28-35" fill="none" stroke="#f1efff" strokeWidth="3" />
      {[[90, 88], [314, 106], [310, 239], [90, 235]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="23" fill="#172033" stroke={i === 3 ? "#0F9F8F" : "#ada1fc"} />
          <circle cx={x} cy={y} r="6" fill={i === 3 ? "#0F9F8F" : "#6D5DFB"} />
        </g>
      ))}
    </svg>
  );
}
