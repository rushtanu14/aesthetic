import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, RefObject } from "react";
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
  "--scene-filter": string;
  "--scene-fog-opacity": string;
  "--scene-fog-transform": string;
  "--scene-light-opacity": string;
  "--scene-light-transform": string;
  "--scene-transform": string;
  "--scroll-progress": string;
};

type MediaState = "idle" | "playing" | "paused" | "error";

const sequenceItems = [
  { label: "Lens drop", value: "0.18", icon: Camera, preview: "72% 48%" },
  { label: "Shard drift", value: "23", icon: DiamondsFour, preview: "56% 42%" },
  { label: "Cursor light", value: "live", icon: CursorClick, preview: "84% 40%" },
];

const videoSources = [
  "/media/aether-monolith-loop.webm",
  "/media/aether-monolith-loop.mp4",
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const getReducedMotionPreference = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useHeroProgress(heroRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number | null = null;

    const update = () => {
      frame = null;
      const hero = heroRef.current;
      if (!hero) return;

      const heroTop = hero.parentElement
        ? hero.parentElement.getBoundingClientRect().top + window.scrollY
        : 0;
      const travel = Math.max(window.innerHeight * 0.95, 1);
      const nextProgress = clamp((window.scrollY - heroTop) / travel);

      setProgress((current) =>
        Math.abs(nextProgress - current) < 0.001 ? current : nextProgress,
      );
    };

    const scheduleUpdate = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [heroRef]);

  return progress;
}

function App() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getReducedMotionPreference,
  );
  const [isPlaying, setIsPlaying] = useState(() => !getReducedMotionPreference());
  const [mediaState, setMediaState] = useState<MediaState>(() =>
    getReducedMotionPreference() ? "paused" : "idle",
  );
  const [videoSourceIndex, setVideoSourceIndex] = useState(0);
  const [activeRecording, setActiveRecording] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const sequenceHeadingRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = useHeroProgress(heroRef);

  const activePhase = Math.min(phases.length - 1, Math.floor(progress * phases.length));
  const recording = recordings[activeRecording];
  const heroExit = clamp((progress - 0.32) / 0.68);
  const heroVisible = 1 - clamp((progress - 0.72) / 0.28);
  const heroStyle: HeroStyle = {
    "--hero-exit": heroExit.toFixed(3),
    "--hero-exit-y": `${Math.round(heroExit * -44)}px`,
    "--hero-visible": heroVisible.toFixed(3),
    "--scene-filter": recording.scene.filter,
    "--scene-fog-opacity": recording.scene.fogOpacity,
    "--scene-fog-transform": recording.scene.fogTransform,
    "--scene-light-opacity": recording.scene.lightOpacity,
    "--scene-light-transform": recording.scene.lightTransform,
    "--scene-transform": recording.scene.transform,
    "--scroll-progress": progress.toFixed(4),
  };
  const heroControlsActive = heroVisible > 0.18;

  const handleVideoFailure = useCallback(() => {
    if (videoSourceIndex < videoSources.length - 1) {
      setMediaState("idle");
      setVideoSourceIndex(videoSourceIndex + 1);
      return;
    }

    setIsPlaying(false);
    setMediaState("error");
  }, [videoSourceIndex]);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      if (event.matches) setIsPlaying(false);
    };

    motionPreference.addEventListener("change", handlePreferenceChange);
    return () => motionPreference.removeEventListener("change", handlePreferenceChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion || !isPlaying) {
      video.pause();
      return;
    }

    let cancelled = false;
    void video.play().catch((error: DOMException) => {
      if (cancelled || error.name === "AbortError") return;
      handleVideoFailure();
    });

    return () => {
      cancelled = true;
    };
  }, [handleVideoFailure, isPlaying, prefersReducedMotion]);

  const handleEnterField = () => {
    sequenceHeadingRef.current?.focus({ preventScroll: true });
    document.getElementById("sequence")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const setSceneMode = (index: number) => {
    setActiveRecording(index);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % recordings.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + recordings.length) % recordings.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = recordings.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    setSceneMode(nextIndex);
    document.getElementById(`recording-tab-${nextIndex}`)?.focus();
  };

  return (
    <main className="site-shell">
      <section
        className={`hero ${heroExit > 0.82 ? "is-sequence" : ""}`}
        data-media-state={mediaState}
        data-playing={isPlaying}
        data-scene={recording.id}
        ref={heroRef}
        style={heroStyle}
        aria-label="Aether Field"
      >
        <div className="hero-media" aria-hidden="true">
          <picture className="hero-still-frame">
            <source
              media="(max-width: 680px)"
              srcSet="/media/aether-monolith-1920.jpg"
            />
            <img
              className="hero-still"
              src="/media/aether-monolith-4k.jpg"
              alt=""
            />
          </picture>
          <video
            className="hero-video"
            key={videoSources[videoSourceIndex]}
            ref={videoRef}
            src={videoSources[videoSourceIndex]}
            muted
            loop
            playsInline
            preload="metadata"
            onError={handleVideoFailure}
            onPause={() => {
              if (mediaState === "playing") setIsPlaying(false);
              setMediaState((state) => (state === "error" ? state : "paused"));
            }}
            onPlay={() => {
              setIsPlaying(true);
              setMediaState("playing");
            }}
          />
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

        <div className="coordinate-rail" aria-hidden={!heroControlsActive}>
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
              <span className="button-orbit" aria-hidden="true">
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
              {isPlaying ? (
                <Pause aria-hidden="true" size={18} />
              ) : (
                <Play aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </div>

        <aside className="phase-rail" aria-hidden="true">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <div
                className={`phase-step ${index === activePhase ? "active" : ""}`}
                key={phase.label}
              >
                <Icon aria-hidden="true" size={15} weight="light" />
                <span>{phase.label}</span>
              </div>
            );
          })}
        </aside>

        <section
          className="control-island"
          aria-hidden={!heroControlsActive}
          aria-label="Camera telemetry"
        >
          <div className="control-globe" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="control-stack">
            {controls.map((control) => {
              const Icon = control.icon;
              return (
                <div className="control-row" key={control.label}>
                  <Icon aria-hidden="true" size={16} weight="light" />
                  <span>{control.label}</span>
                  <strong>{recording.telemetry[control.key]}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <div className="scan-progress" aria-hidden="true">
          <span />
        </div>

        <div
          className="recording-previews"
          aria-hidden={!heroControlsActive}
          aria-label="Field recording previews"
        >
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
          <h2 ref={sequenceHeadingRef} tabIndex={-1}>
            Scroll shifts the camera, not the page.
          </h2>
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
                <Icon aria-hidden="true" size={24} weight="light" />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="recordings" id="recordings" aria-label="Field recordings">
        <div
          className="recording-display"
          id="recording-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`recording-tab-${activeRecording}`}
        >
          <span>{recording.tone}</span>
          <h2>{recording.title}</h2>
          <p>{recording.description}</p>
        </div>
        <div className="recording-track" role="tablist" aria-label="Recordings">
          {recordings.map((item, index) => (
            <button
              className={index === activeRecording ? "selected" : ""}
              id={`recording-tab-${index}`}
              key={item.title}
              role="tab"
              type="button"
              aria-controls="recording-panel"
              aria-selected={index === activeRecording}
              tabIndex={index === activeRecording ? 0 : -1}
              onClick={() => setSceneMode(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </div>
        <div className="recording-console" aria-hidden="true">
          <SlidersHorizontal aria-hidden="true" size={24} weight="light" />
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

export default App;
