const PALETTE = [
  "bg-orange-100 text-orange-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

export function Avatar({ seed, initials, size = "md" }: { seed: string; initials: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full font-brand font-semibold ${colorFor(seed)}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
