import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject, SyntheticEvent } from "react";

export type MediaState = "loading" | "scrubbing" | "paused" | "error";

type ScrollScrubVideoOptions = {
  enabled: boolean;
  prefersReducedMotion: boolean;
  progress: number;
  sources: readonly string[];
  videoRef: RefObject<HTMLVideoElement | null>;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function useScrollScrubVideo({
  enabled,
  prefersReducedMotion,
  progress,
  sources,
  videoRef,
}: ScrollScrubVideoOptions) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [blobSource, setBlobSource] = useState<string>();
  const [frameReady, setFrameReady] = useState(false);
  const [mediaState, setMediaState] = useState<MediaState>(() =>
    prefersReducedMotion ? "paused" : "loading",
  );
  const animationFrameRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  const failedSourceRef = useRef(false);
  const metadataReadyRef = useRef(false);
  const progressRef = useRef(progress);
  const reducedMotionRef = useRef(prefersReducedMotion);
  const activeSource = sources[sourceIndex];

  const scheduleSeek = useCallback(() => {
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      const video = videoRef.current;
      if (
        !video ||
        !metadataReadyRef.current ||
        !enabledRef.current ||
        reducedMotionRef.current ||
        video.seeking ||
        !Number.isFinite(video.duration)
      ) {
        return;
      }

      const targetTime = clamp(progressRef.current) * Math.max(video.duration - 0.04, 0);
      if (Math.abs(video.currentTime - targetTime) < 0.016) return;

      try {
        video.currentTime = targetTime;
      } catch {
        // A later metadata/seek event retries the latest coalesced target.
      }
    });
  }, [videoRef]);

  const failActiveSource = useCallback(() => {
    if (failedSourceRef.current) return;
    failedSourceRef.current = true;
    metadataReadyRef.current = false;
    setFrameReady(false);

    setSourceIndex((currentIndex) => {
      if (currentIndex < sources.length - 1) {
        setMediaState("loading");
        return currentIndex + 1;
      }

      setMediaState("error");
      return currentIndex;
    });
  }, [sources.length]);

  useEffect(() => {
    enabledRef.current = enabled;
    progressRef.current = progress;
    reducedMotionRef.current = prefersReducedMotion;

    if (metadataReadyRef.current) {
      setMediaState(enabled && !prefersReducedMotion ? "scrubbing" : "paused");
      scheduleSeek();
    }
  }, [enabled, prefersReducedMotion, progress, scheduleSeek]);

  useEffect(() => {
    failedSourceRef.current = false;
    metadataReadyRef.current = false;
    setBlobSource(undefined);
    setFrameReady(false);

    if (prefersReducedMotion || !activeSource) {
      setMediaState(prefersReducedMotion ? "paused" : "error");
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | undefined;
    let cancelled = false;
    setMediaState("loading");

    void fetch(activeSource, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Media request failed: ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlobSource(objectUrl);
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        failActiveSource();
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeSource, failActiveSource, prefersReducedMotion]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!blobSource || prefersReducedMotion) return;

    const primeOnTouch = () => {
      const video = videoRef.current;
      const isCoarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
      if (!video || !isCoarsePointer) return;

      void video
        .play()
        .then(() => video.pause())
        .catch(() => undefined);
    };

    window.addEventListener("pointerdown", primeOnTouch, { once: true, passive: true });
    window.addEventListener("touchstart", primeOnTouch, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", primeOnTouch);
      window.removeEventListener("touchstart", primeOnTouch);
    };
  }, [blobSource, prefersReducedMotion, videoRef]);

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      event.currentTarget.pause();
      metadataReadyRef.current = true;
      setMediaState(
        enabledRef.current && !reducedMotionRef.current ? "scrubbing" : "paused",
      );
      scheduleSeek();
    },
    [scheduleSeek],
  );

  const handleFrameReady = useCallback(() => {
    setFrameReady(true);
    scheduleSeek();
  }, [scheduleSeek]);

  return {
    activeSource,
    blobSource,
    frameReady,
    handleFrameReady,
    handleLoadedMetadata,
    handleMediaError: failActiveSource,
    mediaState,
  };
}
