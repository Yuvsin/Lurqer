import type { CSSProperties } from "react";
import { Link } from "react-router";
import { LandingHeader } from "./LandingHeader";
import ghostLogo from "@/assets/ghostLogo.png";
import "./Landing.css";

const particles = [
  ["7vw", "22%", "6px"],
  ["15vw", "68%", "4px"],
  ["22vw", "38%", "7px"],
  ["31vw", "58%", "5px"],
  ["39vw", "18%", "4px"],
  ["47vw", "74%", "7px"],
  ["55vw", "42%", "5px"],
  ["63vw", "30%", "6px"],
  ["70vw", "64%", "4px"],
  ["76vw", "24%", "7px"],
  ["82vw", "52%", "5px"],
  ["88vw", "76%", "6px"],
  ["93vw", "36%", "4px"],
  ["97vw", "58%", "5px"],
  ["44vw", "12%", "4px"],
  ["12vw", "48%", "5px"],
];

const speedStreaks = [
  ["12vw", "24%", "12vw", "0.22"],
  ["28vw", "36%", "9vw", "0.18"],
  ["44vw", "28%", "15vw", "0.24"],
  ["61vw", "48%", "11vw", "0.16"],
  ["76vw", "34%", "14vw", "0.2"],
  ["18vw", "68%", "16vw", "0.16"],
  ["52vw", "72%", "10vw", "0.2"],
  ["84vw", "64%", "13vw", "0.14"],
];

const hills = [
  ["-5vw", "22vw", "8rem", "#2d184f"],
  ["12vw", "28vw", "10.5rem", "#321b56"],
  ["36vw", "24vw", "8.4rem", "#2d184f"],
  ["55vw", "30vw", "11.2rem", "#321b56"],
  ["78vw", "24vw", "8.8rem", "#2d184f"],
  ["94vw", "20vw", "7.6rem", "#321b56"],
];

const groundStreaks = [
  ["6vw", "4rem", "15vw", "0.32"],
  ["26vw", "6rem", "19vw", "0.24"],
  ["49vw", "3.2rem", "14vw", "0.3"],
  ["68vw", "5.4rem", "21vw", "0.22"],
  ["88vw", "2.8rem", "13vw", "0.28"],
];

type CssVars = CSSProperties & Record<`--${string}`, string>;

function ParticleField() {
  return (
    <div className="animation-piece">
      {particles.map(([x, y, size], index) => (
        <span
          key={index}
          className="particle"
          style={{ "--x": x, "--y": y, "--size": size } as CssVars}
        />
      ))}
    </div>
  );
}

function SpeedField() {
  return (
    <div className="animation-piece">
      {speedStreaks.map(([x, y, width, opacity], index) => (
        <span
          key={index}
          className="speed-streak"
          style={
            {
              "--x": x,
              "--y": y,
              "--width": width,
              "--opacity": opacity,
            } as CssVars
          }
        />
      ))}
    </div>
  );
}

function LandscapePiece() {
  return (
    <div className="animation-piece">
      {hills.map(([x, width, height, color], index) => (
        <div
          key={index}
          className="hill"
          style={
            {
              "--x": x,
              "--width": width,
              "--height": height,
              "--color": color,
            } as CssVars
          }
        />
      ))}

      {groundStreaks.map(([x, bottom, width, opacity], index) => (
        <div
          key={index}
          className="ground-streak"
          style={
            {
              "--x": x,
              "--bottom": bottom,
              "--width": width,
              "--opacity": opacity,
            } as CssVars
          }
        />
      ))}
    </div>
  );
}

export function Landing() {
  return (
    <main className="landing-page">
      <LandingHeader />

      <section aria-hidden="true" className="landing-animation-band">
        <div className="landing-band-glow" />

        <div className="animation-track particle-track">
          <ParticleField />
          <ParticleField />
        </div>

        <div className="animation-track speed-track">
          <SpeedField />
          <SpeedField />
        </div>

        <div className="animation-track landscape-track">
          <LandscapePiece />
          <LandscapePiece />
        </div>
      </section>

      <section className="landing-content">
        <div className="landing-ghost-wrap">
          <img
            src={ghostLogo}
            alt="Lurqer ghost"
            className="landing-ghost animate-ghost-float drop-shadow-2xl"
          />
        </div>

        <div className="landing-copy">
          <h1 className="landing-title">
            <span className="landing-brand">Lurqer</span>
            <br/>
            <span className="landing-tagline">Apply safely.</span>
          </h1>

          <p className="landing-description">
            Lurqer scans job postings for phishing links, fake recruiters, and
            scam signals, so you know what you're applying to before you hand
            over your info.
          </p>

          <div className="landing-actions">
            <Link to="/home" className="landing-primary-button">
              Open dashboard
            </Link>

            <Link to="/scan" className="landing-secondary-button">
              Scan a posting
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}