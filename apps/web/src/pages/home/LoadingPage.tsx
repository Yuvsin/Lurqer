import ghostLogo from "@/assets/ghostLogo.png";
import "./LoadingPage.css";

export function LoadingPage() {
  return (
    <main className="loading-page">
      <div className="loading-background" aria-hidden="true">
        <div className="loading-glow loading-glow--one" />
        <div className="loading-glow loading-glow--two" />
        <span className="loading-streak loading-streak--one" />
        <span className="loading-streak loading-streak--two" />
        <span className="loading-streak loading-streak--three" />
        <span className="loading-streak loading-streak--four" />
        <span className="loading-particle loading-particle-one" />
        <span className="loading-particle loading-particle-two" />
        <span className="loading-particle loading-particle-three" />
      </div>

      <section className="loading-card" role="status" aria-live="polite">
        <img src={ghostLogo} alt="" className="loading-card-ghost" />
        <h1 className="loading-card-title">Loading your jobs...</h1>

        <div className="loading-data-rows" aria-hidden="true">
          <div className="loading-data-row loading-data-row-one">
            <span className="loading-status-dot loading-status-dot-high" />
            <span className="loading-data-bar loading-data-bar-short" />
          </div>
          <div className="loading-data-row loading-data-row-two">
            <span className="loading-status-dot loading-status-dot-medium" />
            <span className="loading-data-bar loading-data-bar-long" />
          </div>
          <div className="loading-data-row loading-data-row-three">
            <span className="loading-status-dot loading-status-dot-low" />
            <span className="loading-data-bar loading-data-bar-medium" />
          </div>
        </div>
      </section>
    </main>
  );
}
