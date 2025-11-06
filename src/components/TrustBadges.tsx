export default function TrustBadges() {
  return (
    <div className="mt-3 flex flex-wrap gap-6 text-sm justify-center md:justify-start">
      <div className="flex items-center gap-2 text-green-700">
        <span>🔒</span> Privacy-first
      </div>
      <div className="flex items-center gap-2 text-purple-700">
        <span>⚡</span> Instant result
      </div>
      <div className="flex items-center gap-2 text-pink-600">
        <span>🎯</span> For fun only
      </div>
    </div>
  );
}
