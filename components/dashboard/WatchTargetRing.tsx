const TARGET_MINUTES = 120;
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function WatchTargetRing({ minutes }: { minutes: number }) {
  const pct = Math.min(1, minutes / TARGET_MINUTES);

  return (
    <section className="flex flex-col items-center rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h2 className="self-start text-sm font-semibold uppercase tracking-wide text-gray-400">
        Daily watch target
      </h2>
      <svg viewBox="0 0 120 120" className="mt-3 h-36 w-36">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#1f2937"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="#10b981"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="58"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="20"
          fontWeight="700"
        >
          {minutes}m
        </text>
        <text x="60" y="76" textAnchor="middle" fill="#6b7280" fontSize="11">
          of {TARGET_MINUTES}m
        </text>
      </svg>
      <p className="mt-2 text-xs text-gray-500">
        {Math.round(pct * 100)}% of today&apos;s target
      </p>
    </section>
  );
}
