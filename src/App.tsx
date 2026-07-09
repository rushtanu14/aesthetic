import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowDown,
  Camera,
  Crosshair,
  CursorClick,
  DiamondsFour,
  Pause,
  Play,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { controls, phases, recordings } from "./data";

type HeroStyle = CSSProperties & {
  "--hero-exit": string;
  "--hero-exit-y": string;
  "--hero-visible": string;
  "--scroll-progress": string;
};

const sequenceItems = [
  { label: "Lens drop", value: "0.18", icon: Camera, preview: "72% 48%" },
  { label: "Shard drift", value: "23", icon: DiamondsFour, preview: "56% 42%" },
  { label: "Cursor light", value: "live", icon: CursorClick, preview: "84% 40%" },
];

function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    let previousProgress = -1;

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable > 0 ? window.scrollY / scrollable : 0;

      if (Math.abs(nextProgress - previousProgress) > 0.006) {
        previousProgress = nextProgress;
        setProgress(nextProgress);
      }

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeRecording, setActiveRecording] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const progress = useScrollProgress();
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activePhase = Math.min(phases.length - 1, Math.floor(progress * 3.2));
  const recording = recordings[activeRecording];
  const heroExit = Math.min(1, Math.max(0, progress * 3.4));
  const heroVisible = Math.max(0, 1 - heroExit / 0.72);
  const heroStyle: HeroStyle = {
    "--hero-exit": heroExit.toFixed(3),
    "--hero-exit-y": `${Math.round(heroExit * -52)}px`,
    "--hero-visible": heroVisible.toFixed(3),
    "--scroll-progress": progress.toFixed(4),
  };
  const heroControlsActive = heroVisible > 0.18;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      void video.play();
      return;
    }

    video.pause();
  }, [isPlaying]);

  const handleEnterField = () => {
    setPulseKey((value) => value + 1);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("sequence")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const setSceneMode = (index: number) => {
    setActiveRecording(index);
    setPulseKey((value) => value + 1);
  };

  return (
    <main className="site-shell">
      <section
        className={`hero ${heroExit > 0.82 ? "is-sequence" : ""}`}
        data-pulse={pulseKey}
        data-playing={isPlaying}
        ref={heroRef}
        style={heroStyle}
        aria-label="Aether Field"
      >
        <div className="hero-media" aria-hidden="true">
          <img
            className="hero-still"
            src="/media/aether-monolith-4k.jpg"
            alt=""
          />
          <video
            className="hero-video"
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster="/media/aether-monolith-poster.jpg"
          >
            <source src="/media/aether-monolith-loop.webm" type="video/webm" />
            <source src="/media/aether-monolith-loop.mp4" type="video/mp4" />
          </video>
          <div className="hero-light-sweep" />
          <div className="hero-depth-fog" />
        </div>

        <header className="topline" aria-label="Primary">
          <a className="brand-mark" href="#field">
            AETHER FIELD
          </a>
          <nav className="nav-links" aria-label="Scene navigation">
            <a href="#field">Field</a>
            <a href="#sequence">Sequence</a>
            <a href="#recordings">Recordings</a>
          </nav>
        </header>

        <div className="coordinate-rail" aria-hidden="true">
          <Crosshair size={18} weight="light" />
          <span>37.7749 N</span>
          <span>122.4194 W</span>
        </div>

        <div className="hero-copy" id="field">
          <span className="hero-kicker">FIELD STUDY 04</span>
          <h1>AETHER FIELD</h1>
          <p>A page that behaves like a camera moving through light.</p>
          <div
            className="hero-actions"
            aria-hidden={!heroControlsActive}
            aria-label="Scene controls"
          >
            <button
              className="primary-action"
              type="button"
              disabled={!heroControlsActive}
              onClick={handleEnterField}
            >
              <span>Enter Field</span>
              <span className="button-orbit">
                <ArrowDown size={18} weight="light" />
              </span>
            </button>
            <button
              className="icon-action"
              type="button"
              disabled={!heroControlsActive}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? "Pause scene motion" : "Play scene motion"}
              onClick={() => setIsPlaying((value) => !value)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        <aside className="phase-rail" aria-label="Scroll phase">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <div
                className={`phase-step ${index === activePhase ? "active" : ""}`}
                key={phase.label}
              >
                <Icon size={15} weight="light" />
                <span>{phase.label}</span>
              </div>
            );
          })}
        </aside>

        <section className="control-island" aria-label="Camera telemetry">
          <div className="control-globe" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="control-stack">
            {controls.map((control) => {
              const Icon = control.icon;
              return (
                <div className="control-row" key={control.label}>
                  <Icon size={16} weight="light" />
                  <span>{control.label}</span>
                  <strong>{control.value}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <div className="scan-progress" aria-hidden="true">
          <span />
        </div>

        <div className="recording-previews" aria-label="Field recording previews">
          {recordings.map((item, index) => (
            <button
              className={index === activeRecording ? "active" : ""}
              key={item.title}
              type="button"
              disabled={!heroControlsActive}
              aria-pressed={index === activeRecording}
              onClick={() => setSceneMode(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="sequence-band" id="sequence" aria-label="Camera sequence">
        <div className="sequence-copy">
          <h2>Scroll shifts the camera, not the page.</h2>
          <p>
            The scene changes distance, light, and density as you move through
            it. The interface stays sparse so the atmosphere carries the work.
          </p>
        </div>
        <div className="sequence-panels">
          {sequenceItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                className={`sequence-panel ${
                  activeRecording === index ? "active" : ""
                }`}
                key={item.label}
                type="button"
                style={{ "--preview-position": item.preview } as CSSProperties}
                aria-pressed={activeRecording === index}
                onClick={() => setSceneMode(index)}
              >
                <Icon size={24} weight="light" />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="recordings" id="recordings" aria-label="Field recordings">
        <div className="recording-display">
          <span>{recording.tone}</span>
          <h2>{recording.title}</h2>
          <p>{recording.description}</p>
        </div>
        <div className="recording-track" role="tablist" aria-label="Recordings">
          {recordings.map((item, index) => (
            <button
              className={index === activeRecording ? "selected" : ""}
              key={item.title}
              role="tab"
              type="button"
              aria-selected={index === activeRecording}
              onClick={() => setSceneMode(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </div>
        <div className="recording-console" aria-hidden="true">
          <SlidersHorizontal size={24} weight="light" />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

export default App;
