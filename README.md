# Aether Field

A cinematic React website experiment. The page has no product job; the image, motion, and interface atmosphere are the product.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Checks

```bash
npm run lint
npm test
npm run build
```

The hero uses a generated obsidian-monolith still, a responsive 1920px mobile derivative, and a single continuous 4-second forward camera leg generated with Higgsfield Seedance 1.5 Pro. The original Higgsfield renders, prompt, and generation metadata live in `design-assets/`; deploy-ready MP4 and WebM fallbacks live in `public/media/`.

The camera leg is integrated as a Scroll World proof: scroll position scrubs the paused video timeline, media is fetched into a seekable blob URL, in-flight seeks are coalesced, and the still stays visible until the first requested frame paints. Reduced-motion visitors stay on the still and do not download the video. Scene choices continue to change crop, light, atmosphere, and telemetry. The generated leg cost 1.2 Higgsfield credits; no connector or mobile-beta render was needed for this one-scene proof.

Node.js `^20.19.0` or `>=22.12.0` is required by the Vite toolchain.
