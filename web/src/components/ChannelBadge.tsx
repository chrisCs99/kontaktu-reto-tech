const CHANNEL_STYLES: Record<string, string> = {
  voice: "bg-sky-50 text-sky-700 ring-sky-600/20",
  whatsapp: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  web: "bg-violet-50 text-violet-700 ring-violet-600/20",
  meta: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  import: "bg-gray-100 text-gray-700 ring-gray-500/20",
  email: "bg-amber-50 text-amber-700 ring-amber-600/20",
  unknown: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export function ChannelBadge({ channelKey, label }: { channelKey: string; label: string }) {
  const style = CHANNEL_STYLES[channelKey] ?? CHANNEL_STYLES.unknown;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
}
