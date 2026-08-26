/**
 * Persistent Arena wordmark shown on every screen (host, jugador, unirse,
 * pantalla compartida). Placeholder text lockup until the official Arena
 * logo asset is dropped into `public/arena-logo.svg` — see README note.
 */
export default function ArenaBadge() {
  return (
    <div
      className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-950/60 backdrop-blur-sm pointer-events-none select-none"
      aria-hidden="true"
    >
      <span className="text-[11px] font-semibold tracking-wide text-primary-100/90 uppercase">
        arena
      </span>
    </div>
  );
}
