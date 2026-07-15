/** Splash animada exibida na abertura do jogo. */
export function SplashScreen() {
  return (
    <div className="splash-screen">
      <img className="splash-logo" src="/logo.png" alt="Claude Royale" />
      <div className="splash-bar">
        <div className="splash-bar-fill" />
      </div>
      <p className="splash-hint">Afiando as espadas…</p>
    </div>
  );
}
