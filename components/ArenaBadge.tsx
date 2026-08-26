import Image from "next/image";

/**
 * Persistent Arena logo shown on every screen (host, jugador, unirse,
 * pantalla compartida). Rendered once here in the root layout so every
 * route picks it up automatically.
 */
export default function ArenaBadge() {
  return (
    <div
      className="fixed bottom-3 right-3 z-50 pointer-events-none select-none"
      aria-hidden="true"
    >
      <Image
        src="/arena-logo.png"
        alt=""
        width={300}
        height={71}
        className="h-8 w-auto opacity-90"
        priority={false}
      />
    </div>
  );
}
