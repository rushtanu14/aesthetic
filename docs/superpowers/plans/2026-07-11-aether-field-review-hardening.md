# Aether Field Review Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Preserve Aether Field's approved visual direction while making every interaction claim true, accessible, efficient, responsive, and regression-tested.

**Architecture:** Keep the single-page React/CSS structure. Drive the hero from one event-based, hero-local progress timeline; model each recording as scene presentation plus telemetry data; keep media playback synchronized with real browser state; and cover the public interaction contract with Playwright.

**Tech Stack:** React 19, TypeScript 5, Vite 7, CSS, Playwright.

## Global Constraints

- Preserve the clear 3840x2160 monolith subject and the Barlow Condensed, Archivo, and JetBrains Mono typography direction.
- Keep this a visual-first cinematic site; do not add product framing, backend work, routing, Three.js, shadcn, or speculative architecture.
- Motion must use a hero-local timeline, honor `prefers-reduced-motion`, avoid perpetual idle work, and avoid animated layout properties.
- Scene choices must visibly affect crop, scale, color treatment, light, fog, and telemetry rather than only changing labels.
- Mobile and 200% text resize must remain readable without overlaps or horizontal overflow.

---

### Task 1: Add the Regression Harness

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/aether-field.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the current DOM labels and section IDs in `src/App.tsx`.
- Produces: `npm test`, a Playwright suite, and a repeatable local web server on port 4173.

- [x] **Step 1: Add failing interaction tests**

  Cover event-driven idle behavior, real scene variables/telemetry, visible phase progression, reduced-motion playback, media failure state, APG tab keyboard behavior, desktop overlay separation, mobile overflow, and 200% text resize.

- [x] **Step 2: Run the suite and verify RED**

  Run: `npm test`

  Expected: failures for missing scene state, continuous RAF polling, autoplay under reduced motion, incomplete tabs, desktop overlap, and zoom collisions.

- [x] **Step 3: Keep the test harness isolated**

  Configure Chromium only, `baseURL: http://127.0.0.1:4173`, trace/screenshot on failure, and a Vite web server. Do not add a second test framework.

### Task 2: Make Hero Progress and Scene Selection Honest

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/data.ts`
- Modify: `src/styles.css`
- Test: `tests/aether-field.spec.ts`

**Interfaces:**
- Consumes: `heroRef`, `recordings`, `phases`, and CSS custom properties.
- Produces: `useHeroProgress(ref)`, `FieldRecording.scene`, `FieldRecording.telemetry`, `data-scene`, and synchronized hero variables.

- [x] **Step 1: Replace the perpetual RAF loop**

  Use passive `scroll` plus `resize` listeners that schedule at most one animation frame. Normalize progress against the hero's own travel distance and derive phase, exit, visibility, and scan progress from that same `0..1` value.

- [x] **Step 2: Add real scene presentation data**

  Give each recording stable transform, filter, light, fog, and telemetry values. Apply them through typed CSS custom properties and remove the unused `pulseKey` / `data-pulse` path.

- [x] **Step 3: Fix phase and entrance motion**

  Derive the active phase from `phases.length`, keep Approach/Expose/Lock visible during their active ranges, remove the animated `width`, and prevent the hero-copy reveal from overwriting its resting transform.

- [x] **Step 4: Run focused tests and verify GREEN**

  Run: `npm test -- --grep "scene|phase|idle|motion"`

  Expected: all matching tests pass.

### Task 3: Synchronize Media and Complete Accessibility

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `tests/aether-field.spec.ts`

**Interfaces:**
- Consumes: `HTMLVideoElement` events, `matchMedia`, and the recording selection state.
- Produces: truthful play/pause/error UI, a still-only reduced-motion mode, a complete tab/tabpanel contract, and focus handoff after Enter Field.

- [x] **Step 1: Make playback state truthful**

  Initialize from `prefers-reduced-motion`, respond to preference changes, remove unconditional autoplay, catch rejected `play()` promises, synchronize from `play`/`pause`/`error`, and retain the 4K still as fallback.

- [x] **Step 2: Implement the APG tab pattern**

  Add stable tab IDs, one tabpanel, `aria-controls`, `aria-labelledby`, roving `tabIndex`, and ArrowLeft/ArrowRight/Home/End behavior with focus following selection.

- [x] **Step 3: Remove hidden hero content from the accessibility tree**

  Keep disabled controls unfocusable and apply `aria-hidden` to faded previews/telemetry/phase UI. Move focus to the sequence heading when Enter Field starts its handoff.

- [x] **Step 4: Run focused tests and verify GREEN**

  Run: `npm test -- --grep "reduced motion|media|tabs|Enter Field|hidden"`

  Expected: all matching tests pass with no browser errors.

### Task 4: Fix Responsive Composition, Motion Cost, and Packaging

**Files:**
- Modify: `src/styles.css`
- Modify: `src/main.tsx`
- Modify: `index.html`
- Create: `public/favicon.svg`
- Move: `public/media/aether-monolith-source.png` to `design-assets/aether-monolith-source.png`
- Move: `public/media/aether-monolith-poster.jpg` to `design-assets/aether-monolith-poster.jpg`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Test: `tests/aether-field.spec.ts`

**Interfaces:**
- Consumes: existing responsive breakpoints and the 4K still/video fallback pair.
- Produces: non-overlapping desktop controls, flow-based mobile/zoom layout, lighter public media output, correct tooling metadata, and a clean favicon request.

- [x] **Step 1: Fix desktop and mobile layout**

  Separate the control island from recording previews at 1280x720. At mobile widths, place topline, coordinates, copy, actions, and telemetry into normal grid flow so 200% text resize grows the hero instead of clipping or overlapping it.

- [x] **Step 2: Tighten motion CSS**

  Remove filter from the reveal animation, keep stagger gaps within 30-80ms, replace width animation with opacity/transform, retain hover gating, and make reduced motion still and color-led rather than movement-led.

- [x] **Step 3: Remove deploy-only waste**

  Remove the redundant video poster reference, move source/poster artifacts out of `public`, add `preload="metadata"`, and keep WebM plus MP4 browser fallbacks.

- [x] **Step 4: Correct project metadata**

  Move Vite, its React plugin, and TypeScript to `devDependencies`; declare Node `^20.19.0 || >=22.12.0`; document `npm test`; and add a local SVG favicon.

- [x] **Step 5: Run responsive tests and verify GREEN**

  Run: `npm test -- --grep "desktop|mobile|text resize|favicon"`

  Expected: all matching tests pass with zero horizontal overflow and no overlap.

### Task 5: Full Review and Verification Gate

**Files:**
- Modify: this plan checklist after verification.
- Review: every changed file and the final Git diff.

**Interfaces:**
- Consumes: all implementation tasks.
- Produces: fresh evidence that code, browser behavior, accessibility, packaging, and visuals are ready.

- [x] **Step 1: Run the complete gate**

  Run: `npm run lint && npm test && npm run build && npm audit --audit-level=high && git diff --check`

  Expected: zero failures, zero high-severity audit findings, and a clean diff check.

- [x] **Step 2: Perform final browser visual QA**

  Inspect 1280x720, 390x844, 320x568, reduced-motion, and 200% text-resize states. Verify the monolith remains the focal subject and scene changes remain visually distinct without overlap.

- [x] **Step 3: Review the final diff**

  Confirm every changed line maps to a review finding or verification requirement and that no source assets, browser artifacts, secrets, or unrelated edits are included.

## Execution Note

- Higgsfield's hosted MCP endpoint was discovered at `https://mcp.higgsfield.ai/mcp`, but it returned OAuth `401` and this environment has neither a registered Higgsfield tool nor `HF_KEY`. Composio offered only a text-only Gemini Veo substitute, which was rejected because it could not preserve the approved monolith subject. The existing loop was retained and its camera, exposure, light, fog, scene-selection, reduced-motion, and fallback choreography were hardened locally.
