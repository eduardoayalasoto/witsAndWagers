"use client";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-primary-950 flex items-center justify-center px-4 py-3">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block mb-1">
            {/* Reserved for the Wits & Waggers logo mark */}
            <h1 className="brand-gradient-text text-3xl sm:text-4xl font-black tracking-tight">
              WITS &amp; WAGGERS
            </h1>
          </div>
          <p className="text-base text-primary-100 font-medium">
            Adivina. Apuesta. Gana.
          </p>
          <p className="text-xs text-primary-300 max-w-xl mx-auto">
            El juego de trivia donde no necesitas saber la respuesta: solo
            adivina cerca y apuesta con inteligencia
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          {/* Host Card */}
          <a
            href="/host/create"
            className="group bg-primary-800 p-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-primary-600 hover:border-secondary-600 hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-secondary-700 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-0.5">
                Ser anfitrión
              </h2>
              <p className="text-primary-200 text-xs">
                Crea preguntas y dirige la partida
              </p>
            </div>
          </a>

          {/* Player Card */}
          <div className="bg-primary-800 p-4 rounded-xl shadow-xl border-2 border-primary-600">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-secondary-700 rounded-lg flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-0.5">
                Unirse a un juego
              </h2>
              <p className="text-primary-200 mb-2 text-xs">
                Ingresa el código del juego
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const code = formData.get("code") as string;
                  if (code) {
                    window.location.href = `/join/${code.toUpperCase()}`;
                  }
                }}
              >
                <input
                  type="text"
                  name="code"
                  placeholder="INGRESA EL CÓDIGO"
                  className="w-full px-3 py-1.5 border-2 border-primary-400 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 mb-1.5 text-center text-base font-mono uppercase tracking-wider bg-white/90"
                  maxLength={6}
                />
                <button
                  type="submit"
                  className="w-full bg-secondary-700 text-white py-1.5 px-4 rounded-lg hover:bg-secondary-800 active:bg-secondary-900 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  Unirse al juego
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-primary-900 rounded-xl p-3 border-2 border-primary-700 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-2 text-center">
            Cómo jugar
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-7 h-7 bg-white/10 rounded-lg mb-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-0.5 text-xs">
                1. Adivina
              </h4>
              <p className="text-primary-200 text-[10px] leading-tight hidden sm:block">
                Envía tu mejor estimación
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-7 h-7 bg-white/10 rounded-lg mb-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-0.5 text-xs">
                2. Apuesta
              </h4>
              <p className="text-primary-200 text-[10px] leading-tight hidden sm:block">
                A la estimación más cercana
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-7 h-7 bg-white/10 rounded-lg mb-1">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-0.5 text-xs">3. Gana</h4>
              <p className="text-primary-200 text-[10px] leading-tight hidden sm:block">
                Puntos por precisión
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
