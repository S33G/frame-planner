# Frame Planner — React SPA for Wall Art Arrangement

## TL;DR

> **Quick Summary**: Build a mobile-first React SPA that lets users set wall dimensions, add picture frames with rich properties (dimensions, color, mat, artwork, label), arrange them via drag-and-drop on a 2D Konva canvas with snapping and alignment tools, and preview the result in a realistic 3D view using React Three Fiber.
> 
> **Deliverables**:
> - 2D interactive canvas with drag, snap, zoom/pan, selection, and alignment
> - 3D realistic preview with extruded frames, artwork textures, and orbit camera
> - Frame CRUD with 6 configurable properties per frame (rect + circle shapes)
> - Responsive layout: mobile bottom sheet + desktop sidebar
> - Full undo/redo, localStorage persistence, JSON export/import
> - Playful/warm UI design with interior-design app aesthetic
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 7 waves, up to 3 parallel tasks per wave
> **Critical Path**: Scaffold → Store → 2D Canvas → Selection/Zoom → Snapping/Alignment → App Shell → Integration

---

## Context

### Original Request
Build a React SPA for planning hanging picture frames on a wall. Users add paintings with dimensions and optional artwork images, set wall dimensions, and get help with hanging positions. Alignment by center/top/bottom. Toggleable snapping. Frame editing on click. Mobile first with desktop support. 3D mode. Wall color customization. Future AR visualization.

### Interview Summary
**Key Discussions**:
- **Units**: User-selectable toggle between inches and centimeters
- **Persistence**: Both localStorage auto-save AND export/import JSON for sharing
- **UI Style**: Playful/Warm — friendly colors, rounded corners, interior-design vibe
- **3D Fidelity**: Realistic frames with extruded borders, depth, artwork textures, shadows on wall
- **Alignment**: Select frames via click → toolbar buttons for align top/center/bottom/distribute
- **Frame Properties**: All 6 — dimensions (WxH), frame color/style, mat/passepartout, artwork image, label, hanging height marker
- **Frame Shapes**: Rectangles + circles/ovals
- **Wall**: Single wall at a time
- **Undo/Redo**: Yes, with Ctrl+Z/Y and toolbar buttons
- **Tech Stack**: Vite + React + TypeScript + Tailwind CSS
- **Tests**: TDD — vitest with tests written before implementation
- **Mobile Layout**: Canvas + bottom sheet (floating toolbar, swipe-to-dismiss editing sheet)

**Research Findings**:
- **Konva.js**: Has exact primitives for snapping (dragmove events + guide lines), Transformer for resize, touch support, boundary containment. Snapping requires ~200 LOC of custom implementation using documented patterns (NOT built-in). react-konva provides declarative React bindings. (Source: Context7, 5493 snippets, benchmark 89.2)
- **React Three Fiber + drei**: Canvas auto-setup, planeGeometry for wall, extruded geometry for frames, useTexture for artwork, OrbitControls for camera, ContactShadows. Mobile-viable with pixel ratio limiting. (Source: Context7, R3F 413 snippets / drei 573 snippets)
- **Zustand**: Lightweight hook-based state, perfect for cross-view sharing (2D/3D). Supports immer + persist + zundo middleware chaining. (Source: Context7, 691 snippets)
- **Zundo**: Temporal middleware for undo/redo. Supports `handleSet` throttling, `partialize` for excluding data, `limit` for memory. Middleware order: `temporal(persist(immer(...)))`. (Source: Context7, benchmark 84.3)

### Metis Review
**Identified Gaps** (all addressed):
- **localStorage will fail for artwork images** → Resolved: use IndexedDB (idb-keyval) for images, localStorage for metadata only
- **Konva snapping is NOT built-in** → Resolved: budget ~200 LOC custom implementation as dedicated task
- **Canvas zoom/pan missing from requirements** → Resolved: added as core feature (pinch-to-zoom mobile, scroll-wheel desktop)
- **Undo history explosion during drag** → Resolved: capture on dragEnd only, zundo handleSet throttle at 1000ms
- **Multi-select mechanism unspecified** → Resolved: shift+click desktop, long-press toggle on mobile
- **Circle/oval sizing UX unclear** → Resolved: diameter for circles (locked ratio), WxH bounding box for ovals
- **Export content scope undefined** → Resolved: self-contained JSON with base64 images
- **Middleware chaining order critical** → Resolved: enforce `temporal(persist(immer(...)))` — temporal outermost
- **Unit conversion drift risk** → Resolved: store ALL dimensions in centimeters internally, convert at display layer only

---

## Work Objectives

### Core Objective
Build a complete, polished frame planner SPA that enables users to visually arrange picture frames on a wall in 2D (with snap/align tools) and preview the result in realistic 3D — all with a playful, warm interior-design aesthetic that works beautifully on both mobile and desktop.

### Concrete Deliverables
- Working Vite + React + TS app with Tailwind styling
- 2D Konva canvas with wall rendering, frame drag-and-drop, zoom/pan
- Snapping engine with visual guide lines (toggleable)
- Multi-select + alignment toolbar (align top/center/bottom, distribute)
- 3D Three.js view with realistic extruded frames, artwork textures, orbit camera
- Frame editor: dimensions, frame color, mat, artwork upload, label, nail height
- Responsive layout: mobile (canvas + bottom sheet) / desktop (canvas + sidebar)
- Undo/redo (Ctrl+Z/Y + buttons)
- localStorage auto-save + JSON export/import (includes artwork images)
- User-selectable unit toggle (cm ↔ inches)

### Definition of Done
- [ ] `bun test --run` — all vitest tests pass (store, utils, services)
- [ ] `bun run build` — production build succeeds with zero errors
- [ ] Playwright E2E suite passes (frame CRUD, drag, align, 3D toggle, export/import, persistence)
- [ ] Mobile viewport (375px) — bottom sheet works, canvas is usable with touch
- [ ] Desktop viewport (1440px) — sidebar visible, canvas fills remaining space

### Must Have
- Store all dimensions in centimeters internally; convert at display layer only
- IndexedDB (idb-keyval) for artwork image storage; Zustand store holds `imageId` string references only
- 3D mode is VIEW-ONLY — orbit camera only, no frame editing/creation in 3D
- Middleware chain: `create(temporal(persist(immer((set) => ...))))` — temporal outermost
- Zundo `partialize` excludes image references and functions from undo diffs
- Zundo `handleSet` throttle at 1000ms to prevent drag-flooding undo history
- Konva Transformer with `boundBoxFunc` for circle aspect-ratio locking
- Konva `dragBoundFunc` for wall boundary containment
- Frames constrained to wall boundaries
- Canvas zoom: 0.25x to 4x range
- Playful/warm design: rounded-2xl corners, warm color palette (soft whites, wood tones, terracotta/coral accents), friendly sans-serif font (Inter)
- Maximum 50 frames per wall

### Must NOT Have (Guardrails)
- No base64 image data in Zustand state or localStorage — images go in IndexedDB only
- No React Router — use conditional rendering for 2D/3D view switching
- No custom component library — use Tailwind utility classes directly
- No measurement annotations between frames (defer to v2)
- No print/PDF export
- No image cropping/editing/filters within the app
- No animations between 2D/3D view transitions (instant toggle)
- No ornamental/textured frame borders — solid color frames only
- No keyboard shortcuts beyond basics (Delete, Ctrl+Z/Y, Ctrl+A, Escape)
- No frame rotation (simplify UX — frames hang straight)
- No room/corner/ceiling support — single flat wall only
- No backend, accounts, or sharing features

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **Automated tests**: TDD (write failing tests first, then implement)
- **Framework**: vitest + happy-dom + @testing-library/react
- **TDD Flow**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR
- **Test infrastructure setup**: Task 1 includes vitest configuration

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Store/Utils**: Use Bash (bun test) — Run vitest tests, assert pass counts
- **3D View**: Use Playwright — Toggle view, assert canvas renders, check console for errors
- **Services**: Use Bash (bun test) — Run service tests with mock IDB

### What NOT to Test
- Konva canvas rendering internals (canvas pixel output isn't testable in jsdom)
- Three.js WebGL rendering (test state derivation only, not visual output)
- Instead: test the LOGIC (snapping math, alignment calculations, store mutations) as pure functions, and use Playwright for visual integration verification

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.

```
Wave 1 (Start Immediately — scaffolding):
├── Task 1: Project scaffold + toolchain setup [quick]
└── Task 2: TypeScript types + constants + unit utils [quick]

Wave 2 (After Wave 1 — core infrastructure, PARALLEL):
├── Task 3: Zustand store with undo/redo + persist [unspecified-high]
├── Task 4: IndexedDB image storage service [quick]
└── Task 5: Snapping + alignment pure logic [quick]

Wave 3 (After Wave 2 — canvas + services, PARALLEL):
├── Task 6: 2D canvas: wall + frame rendering [unspecified-high]
├── Task 7: Export/import JSON service [quick]
└── Task 8: 3D visualization view [deep]

Wave 4 (After Wave 3 — canvas interaction, PARALLEL):
├── Task 9: Selection + transformer + zoom/pan [unspecified-high]
└── Task 10: Snapping integration + alignment toolbar [unspecified-high]

Wave 5 (After Wave 4 — app shell):
└── Task 11: App shell + responsive layout + frame editor UI [visual-engineering]

Wave 6 (After Wave 5 — final verification):
└── Task 12: Integration testing + E2E + polish [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 → Task 6 → Task 9 → Task 10 → Task 11 → Task 12 → F1-F4
Parallel Speedup: ~55% faster than sequential
Max Concurrent: 3 (Waves 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| 1. Scaffold | — | ALL | 1 |
| 2. Types + Utils | — | 3, 4, 5, 6, 7, 8, 9, 10, 11 | 1 |
| 3. Zustand Store | 1, 2 | 6, 7, 8, 9, 10, 11 | 2 |
| 4. Image Storage | 1 | 7, 8, 11 | 2 |
| 5. Snap/Align Logic | 1, 2 | 10 | 2 |
| 6. 2D Canvas Basic | 3 | 9, 10, 11 | 3 |
| 7. Export/Import | 3, 4 | 11 | 3 |
| 8. 3D View | 3, 4 | 11 | 3 |
| 9. Selection/Zoom | 6 | 10, 11 | 4 |
| 10. Snap Integration + Align Toolbar | 5, 6, 9 | 11 | 4 |
| 11. App Shell + UI | 3-10 | 12 | 5 |
| 12. Integration Tests | 11 | F1-F4 | 6 |
| F1-F4. Final Verification | 12 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: **2 parallel** — T1 → `quick`, T2 → `quick`
- **Wave 2**: **3 parallel** — T3 → `unspecified-high`, T4 → `quick`, T5 → `quick`
- **Wave 3**: **3 parallel** — T6 → `unspecified-high` + `frontend-ui-ux`, T7 → `quick`, T8 → `deep`
- **Wave 4**: **2 parallel** — T9 → `unspecified-high` + `frontend-ui-ux`, T10 → `unspecified-high`
- **Wave 5**: **1** — T11 → `visual-engineering` + `frontend-ui-ux`
- **Wave 6**: **1** — T12 → `unspecified-high` + `playwright`
- **FINAL**: **4 parallel** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high` + `playwright`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**
> **TDD: Every task writes failing tests FIRST, then implements to make them pass.**

- [ ] 1. Project Scaffold + Toolchain Setup

  **What to do**:
  - RED: Create a vitest test file `src/app.test.ts` that imports from the app — it should fail because nothing exists yet
  - GREEN: Run `npm create vite@latest . -- --template react-ts` (or `bunx create-vite . --template react-ts`) to scaffold
  - Install ALL dependencies in one command:
    - Core: `react-konva konva @react-three/fiber @react-three/drei three zustand immer`
    - Undo: `zundo`
    - Storage: `idb-keyval`
    - Styling: `tailwindcss @tailwindcss/vite`
    - Dev/Test: `vitest happy-dom @testing-library/react @testing-library/jest-dom @types/three`
    - E2E: `@playwright/test` (dev dep)
  - Configure Tailwind v4: add `@tailwindcss/vite` plugin to `vite.config.ts`, create `src/index.css` with `@import "tailwindcss"`
  - Configure vitest in `vite.config.ts`: `test: { environment: 'happy-dom', globals: true, setupFiles: ['./src/test-setup.ts'] }`
  - Create `src/test-setup.ts` with `import '@testing-library/jest-dom'`
  - Create folder structure:
    ```
    src/
    ├── components/
    │   ├── canvas/    (Konva 2D components)
    │   ├── three/     (R3F 3D components)
    │   └── ui/        (UI controls, toolbar, sidebar, bottom sheet)
    ├── hooks/         (custom React hooks)
    ├── services/      (imageStorage, exportImport)
    ├── store/         (Zustand store)
    ├── types/         (TypeScript interfaces)
    └── utils/         (pure functions: units, snapping, alignment, constants)
    ```
  - Add placeholder `.gitkeep` or `index.ts` barrel files in each directory
  - Configure `tsconfig.json` path aliases: `@/*` → `src/*`
  - REFACTOR: Verify `bun test --run` exits 0 and `bun run build` exits 0

  **Must NOT do**:
  - Do NOT write any application code beyond folder structure
  - Do NOT install React Router
  - Do NOT create a custom component library or design system config
  - Do NOT install any CSS-in-JS library (styled-components, emotion, etc.)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffold/config task, no complex logic, just setup commands and config files
  - **Skills**: []
    - No domain-specific skills needed for project initialization
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not relevant for scaffold — no UI work yet

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: ALL subsequent tasks (3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - None (greenfield project)

  **API/Type References**:
  - None yet

  **External References**:
  - Vite React-TS template: `npm create vite@latest . -- --template react-ts`
  - Tailwind v4 Vite plugin: `@tailwindcss/vite` — add as Vite plugin, import `tailwindcss` in CSS
  - Vitest config: add `test` block to `vite.config.ts` with `environment: 'happy-dom'`

  **WHY Each Reference Matters**:
  - Vite template gives us React 18+, TypeScript 5+, and a working dev server out of the box
  - Tailwind v4 uses the Vite plugin approach (not PostCSS config) — this is the new standard
  - happy-dom is faster than jsdom for vitest and handles most DOM APIs

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `bun test --run` exits with code 0 (vitest configured and runnable)
  - [ ] `bun run build` exits with code 0 (Vite builds successfully)
  - [ ] `bun run dev` starts dev server without errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Project builds and serves
    Tool: Bash
    Preconditions: Fresh project after scaffold
    Steps:
      1. Run `bun run build` — expect exit code 0
      2. Run `bun test --run` — expect exit code 0
      3. Run `ls src/components/canvas src/components/three src/components/ui src/hooks src/services src/store src/types src/utils` — expect all directories exist
      4. Run `bunx tsc --noEmit` — expect exit code 0 (no type errors)
    Expected Result: All 4 commands exit 0, all directories listed
    Failure Indicators: Any command exits non-zero, missing directories
    Evidence: .sisyphus/evidence/task-1-scaffold-build.txt

  Scenario: Dependencies installed correctly
    Tool: Bash
    Preconditions: After npm/bun install
    Steps:
      1. Run `node -e "require('react-konva')"` — expect no error
      2. Run `node -e "require('@react-three/fiber')"` — expect no error
      3. Run `node -e "require('zustand')"` — expect no error
      4. Run `node -e "require('idb-keyval')"` — expect no error
      5. Run `node -e "require('zundo')"` — expect no error
    Expected Result: All imports resolve without error
    Failure Indicators: Any require throws MODULE_NOT_FOUND
    Evidence: .sisyphus/evidence/task-1-deps-check.txt
  ```

  **Commit**: YES
  - Message: `chore(scaffold): initialize vite+react+ts project with tooling`
  - Files: package.json, vite.config.ts, tsconfig.json, tailwind files, src/test-setup.ts, folder structure
  - Pre-commit: `bun run build && bun test --run`

- [ ] 2. TypeScript Types + Constants + Unit Conversion Utils

  **What to do**:
  - RED: Write tests FIRST in `src/types/__tests__/types.test.ts` and `src/utils/__tests__/units.test.ts`:
    - Test that Frame interface has all required fields
    - Test `cmToInches(2.54)` → `1`
    - Test `inchesToCm(1)` → `2.54`
    - Test `formatDimension(60, 'cm')` → `"60 cm"`
    - Test `formatDimension(60, 'in')` → `"23.6\""`
    - Test `convertDimension(100, 'cm', 'in')` → `39.37` (within 0.01)
    - Test `convertDimension(39.37, 'in', 'cm')` → `100` (within 0.01)
  - GREEN: Create `src/types/frame.ts`:
    ```typescript
    interface Frame {
      id: string
      x: number           // cm from left edge of wall
      y: number           // cm from top edge of wall
      width: number       // cm (outer frame dimension)
      height: number      // cm (outer frame dimension)
      shape: 'rect' | 'ellipse'
      frameColor: string  // hex color
      frameWidth: number  // cm (border thickness)
      matEnabled: boolean
      matWidth: number    // cm
      matColor: string    // hex color
      imageId: string | null  // reference to IndexedDB image
      label: string
      hangingOffset: number  // cm from top of frame to nail/hook
    }
    ```
  - Create `src/types/wall.ts`:
    ```typescript
    interface Wall { width: number; height: number; color: string }
    ```
  - Create `src/types/units.ts`:
    ```typescript
    type Unit = 'cm' | 'in'
    type ViewMode = '2d' | '3d'
    ```
  - Create `src/types/index.ts` — barrel export all types
  - Create `src/utils/units.ts` — pure conversion functions:
    - `cmToInches(cm: number): number`
    - `inchesToCm(inches: number): number`
    - `formatDimension(valueCm: number, unit: Unit): string`
    - `convertDimension(value: number, from: Unit, to: Unit): number`
    - `parseDimensionInput(input: string, unit: Unit): number` — parses user input string to cm
  - Create `src/utils/constants.ts`:
    ```typescript
    export const CM_PER_INCH = 2.54
    export const SNAP_THRESHOLD = 5 // pixels
    export const MAX_FRAMES = 50
    export const ZOOM_MIN = 0.25
    export const ZOOM_MAX = 4
    export const UNDO_LIMIT = 50
    export const DEFAULT_FRAME: Omit<Frame, 'id' | 'x' | 'y'> = {
      width: 40, height: 30, shape: 'rect',
      frameColor: '#2C2C2C', frameWidth: 2,
      matEnabled: false, matWidth: 5, matColor: '#FFFEF2',
      imageId: null, label: '', hangingOffset: 3
    }
    export const DEFAULT_WALL: Wall = { width: 300, height: 250, color: '#F5F0EB' }
    ```
  - REFACTOR: Ensure all tests pass, types export cleanly

  **Must NOT do**:
  - Do NOT implement any React components
  - Do NOT import from store (store doesn't exist yet)
  - Do NOT use `any` type anywhere

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure TypeScript definitions and simple math functions — no UI, no complexity
  - **Skills**: []
    - No domain-specific skills needed for type definitions
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4, 5, 6, 7, 8, 9, 10, 11
  - **Blocked By**: None (types can be defined independently; tests run after Task 1 provides vitest)

  **References**:

  **External References**:
  - Inch/cm conversion: 1 inch = 2.54 cm (exact)
  - Standard US frame sizes: 8x10, 11x14, 16x20, 18x24, 24x36 (inches) — use for default suggestions
  - Common mat widths: 2-3 inches (5-7.5 cm)
  - Hanging offset (nail to top): typically 1-3 inches (2.5-7.5 cm) depending on hanging hardware

  **WHY Each Reference Matters**:
  - CM_PER_INCH is the foundation of the unit system — all stored values are in cm, display converts
  - Default frame/wall values should feel realistic to users who hang actual pictures
  - Hanging offset defaults should match common D-ring and wire hardware

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file `src/utils/__tests__/units.test.ts` created BEFORE implementation
  - [ ] `bun test --run src/utils/` → PASS (minimum 8 test cases for conversion functions)
  - [ ] `bunx tsc --noEmit` → 0 errors (all types compile)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Unit conversion accuracy
    Tool: Bash (bun test)
    Preconditions: vitest configured, test file exists
    Steps:
      1. Run `bun test --run src/utils/__tests__/units.test.ts`
      2. Verify test count ≥ 8
      3. Verify all pass
    Expected Result: 8+ tests, 0 failures
    Failure Indicators: Any test fails, fewer than 8 tests
    Evidence: .sisyphus/evidence/task-2-unit-tests.txt

  Scenario: Types compile without errors
    Tool: Bash
    Preconditions: All type files created
    Steps:
      1. Run `bunx tsc --noEmit`
      2. Create a temporary test file that imports all types and creates instances
    Expected Result: Zero type errors
    Failure Indicators: tsc reports errors
    Evidence: .sisyphus/evidence/task-2-type-check.txt

  Scenario: Edge case — zero and negative dimension handling
    Tool: Bash (bun test)
    Preconditions: Conversion functions implemented
    Steps:
      1. Test `cmToInches(0)` → `0`
      2. Test `formatDimension(0, 'cm')` → `"0 cm"`
      3. Test `parseDimensionInput("", 'cm')` → `0` or throws
    Expected Result: Edge cases handled gracefully (no NaN, no Infinity)
    Failure Indicators: NaN or Infinity in output
    Evidence: .sisyphus/evidence/task-2-edge-cases.txt
  ```

  **Commit**: YES
  - Message: `feat(types): define frame, wall, unit types and conversion utils`
  - Files: src/types/frame.ts, src/types/wall.ts, src/types/units.ts, src/types/index.ts, src/utils/units.ts, src/utils/constants.ts, tests
  - Pre-commit: `bun test --run src/utils/`

- [ ] 3. Zustand Store: Wall + Frames + Undo/Redo + Persist

  **What to do**:
  - RED: Write comprehensive tests FIRST in `src/store/__tests__/useAppStore.test.ts`:
    - `addFrame()` — adds frame with generated ID, correct defaults
    - `removeFrame(id)` — removes frame, deselects if selected
    - `updateFrame(id, partial)` — merges partial update into existing frame
    - `duplicateFrame(id)` — creates copy with new ID, offset position (+2cm, +2cm)
    - `selectFrame(id, multi)` — single select replaces, multi appends
    - `deselectAll()` — clears selection array
    - `setWall(partial)` — updates wall dimensions/color
    - `setUnit(unit)` — stores unit preference (display only — does NOT change stored cm values)
    - `toggleSnap()` — flips snapEnabled boolean
    - `setViewMode(mode)` — switches '2d' ↔ '3d'
    - `undo()` / `redo()` — reverts/replays last state change
    - Undo after addFrame removes the frame
    - Undo after updateFrame restores previous values
    - Persist: state survives simulated "reload" (re-create store from localStorage)
    - Frame limit: addFrame when at MAX_FRAMES (50) does nothing / throws
  - GREEN: Create `src/store/useAppStore.ts`:
    ```typescript
    import { create } from 'zustand'
    import { temporal } from 'zundo'
    import { persist } from 'zustand/middleware'
    import { immer } from 'zustand/middleware/immer'

    // Middleware chain: temporal(persist(immer(...))) — temporal outermost
    export const useAppStore = create(
      temporal(
        persist(
          immer((set, get) => ({
            // State
            wall: DEFAULT_WALL,
            frames: [] as Frame[],
            selectedFrameIds: [] as string[],
            unit: 'cm' as Unit,
            snapEnabled: true,
            viewMode: '2d' as ViewMode,
            // Actions
            addFrame: (shape: 'rect' | 'ellipse') => set(state => { ... }),
            removeFrame: (id: string) => set(state => { ... }),
            updateFrame: (id: string, updates: Partial<Frame>) => set(state => { ... }),
            duplicateFrame: (id: string) => set(state => { ... }),
            selectFrame: (id: string, multi?: boolean) => set(state => { ... }),
            deselectAll: () => set(state => { ... }),
            setWall: (updates: Partial<Wall>) => set(state => { ... }),
            setUnit: (unit: Unit) => set(state => { ... }),
            toggleSnap: () => set(state => { ... }),
            setViewMode: (mode: ViewMode) => set(state => { ... }),
          })),
          {
            name: 'frame-planner-storage',
            partialize: (state) => ({
              wall: state.wall,
              frames: state.frames,
              unit: state.unit,
              snapEnabled: state.snapEnabled,
              // Exclude: selectedFrameIds, viewMode, functions
            }),
          }
        ),
        {
          limit: UNDO_LIMIT,
          handleSet: (handleSet) => throttle(handleSet, 1000),
          partialize: (state) => {
            // Exclude imageId from undo diffs to prevent memory bloat
            const { selectedFrameIds, ...rest } = state
            return rest
          },
        }
      )
    )
    ```
  - Create a `throttle` utility in `src/utils/throttle.ts` (simple, no lodash dependency)
  - REFACTOR: Ensure all 15+ tests pass

  **Must NOT do**:
  - Do NOT store base64 image data in the store — only `imageId` string references
  - Do NOT store undo history in localStorage (only current state persists)
  - Do NOT use `any` type
  - Do NOT add React Router or view routing logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core state management with complex middleware chaining — needs careful implementation
  - **Skills**: []
    - Zustand/zundo patterns are well-documented; no specialized skill needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI — pure state logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5)
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 9, 10, 11
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/types/frame.ts` (from Task 2) — Frame interface defines store state shape
  - `src/types/wall.ts` (from Task 2) — Wall interface
  - `src/utils/constants.ts` (from Task 2) — DEFAULT_FRAME, DEFAULT_WALL, UNDO_LIMIT, MAX_FRAMES

  **API/Type References**:
  - Zustand `create` with middleware: `create(temporal(persist(immer((set, get) => ...))))`
  - Zundo temporal options: `{ limit, handleSet, partialize }`
  - Zustand persist options: `{ name, partialize }`
  - Immer: use `set(state => { state.frames.push(newFrame) })` — mutative syntax

  **External References**:
  - Zundo docs: temporal middleware setup, `handleSet` for throttling — https://github.com/charkour/zundo
  - Zustand persist middleware: https://zustand.docs.pmnd.rs/middlewares/persist
  - Zustand immer middleware: https://zustand.docs.pmnd.rs/middlewares/immer

  **WHY Each Reference Matters**:
  - Types from Task 2 define the exact shape of Frame/Wall — store must match precisely
  - Middleware chaining ORDER is critical: temporal wraps persist wraps immer. Wrong order = bugs
  - `handleSet` throttle prevents undo history flooding during rapid drag operations
  - `partialize` on persist controls what survives page reload (exclude functions, selection, view mode)
  - `partialize` on temporal controls what goes into undo diffs (exclude images to save memory)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file `src/store/__tests__/useAppStore.test.ts` created BEFORE store implementation
  - [ ] `bun test --run src/store/` → PASS (minimum 15 test cases)
  - [ ] Tests cover: add, remove, update, duplicate, select, deselect, wall, unit, snap, viewMode, undo, redo, persist, frame limit

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Store CRUD operations
    Tool: Bash (bun test)
    Preconditions: vitest configured, store implemented
    Steps:
      1. Run `bun test --run src/store/__tests__/useAppStore.test.ts`
      2. Verify minimum 15 tests
      3. Verify 0 failures
    Expected Result: 15+ tests pass, 0 failures
    Failure Indicators: Any test failure, fewer than 15 tests
    Evidence: .sisyphus/evidence/task-3-store-tests.txt

  Scenario: Undo/redo integration
    Tool: Bash (bun test)
    Preconditions: Store with zundo middleware
    Steps:
      1. Test: addFrame → undo → frames.length === 0
      2. Test: addFrame → undo → redo → frames.length === 1
      3. Test: updateFrame position → undo → position restored to previous
    Expected Result: All undo/redo tests pass
    Failure Indicators: State not properly restored after undo
    Evidence: .sisyphus/evidence/task-3-undo-redo.txt

  Scenario: Persistence survives reload
    Tool: Bash (bun test)
    Preconditions: Store with persist middleware
    Steps:
      1. Create store instance, add 2 frames, set wall color
      2. Read from mock localStorage — verify serialized state present
      3. Create NEW store instance (simulating reload)
      4. Verify 2 frames present with correct data
      5. Verify selectedFrameIds is EMPTY (not persisted)
    Expected Result: Frames and wall persist, selection and viewMode do not
    Failure Indicators: Data not found in localStorage, or excluded fields persist
    Evidence: .sisyphus/evidence/task-3-persist.txt
  ```

  **Commit**: YES
  - Message: `feat(store): zustand store with undo/redo and localStorage persist`
  - Files: src/store/useAppStore.ts, src/utils/throttle.ts, src/store/__tests__/useAppStore.test.ts
  - Pre-commit: `bun test --run src/store/`

- [ ] 4. IndexedDB Image Storage Service

  **What to do**:
  - RED: Write tests FIRST in `src/services/__tests__/imageStorage.test.ts`:
    - `saveImage(id, blob)` stores image and can be retrieved
    - `getImage(id)` returns null for non-existent ID
    - `deleteImage(id)` removes image, subsequent get returns null
    - `getImageUrl(id)` returns a valid blob URL string
    - `getImageUrl(nonExistentId)` returns null
    - `exportAllImages()` returns `Record<string, string>` with base64 data
    - `importImages(map)` stores all images from base64 map
    - Round-trip: save as blob → export as base64 → clear → import from base64 → get returns equivalent blob
  - GREEN: Create `src/services/imageStorage.ts` using `idb-keyval`:
    ```typescript
    import { get, set, del, entries, clear } from 'idb-keyval'

    export async function saveImage(id: string, blob: Blob): Promise<void>
    export async function getImage(id: string): Promise<Blob | null>
    export async function deleteImage(id: string): Promise<void>
    export async function getImageUrl(id: string): Promise<string | null> // creates ObjectURL
    export async function exportAllImages(): Promise<Record<string, string>> // id → base64
    export async function importImages(map: Record<string, string>): Promise<void> // base64 → blobs
    export async function clearAllImages(): Promise<void>
    ```
  - For base64 conversion, use `FileReader` / `atob` / `btoa` or `Blob.arrayBuffer()` + `btoa`
  - Handle errors gracefully: if IndexedDB unavailable (private browsing), log warning and return null
  - REFACTOR: Ensure all tests pass with mock IDB (use `fake-indexeddb` or manual mock)

  **Must NOT do**:
  - Do NOT store images in localStorage
  - Do NOT compress or resize images (store as-uploaded)
  - Do NOT add image format validation (accept any image/* blob)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single service file with straightforward async CRUD — well-understood patterns
  - **Skills**: []
    - idb-keyval has a minimal API; no specialized skill needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 5)
  - **Parallel Group**: Wave 2 (with Tasks 3, 5)
  - **Blocks**: Tasks 7, 8, 11
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - idb-keyval API: `get(key)`, `set(key, value)`, `del(key)`, `entries()`, `clear()` — https://github.com/nicferrier/idb-keyval
  - Blob ↔ Base64 conversion: `new Response(blob).arrayBuffer()` then `btoa(String.fromCharCode(...))` for export
  - Base64 → Blob: `fetch(\`data:image/*;base64,\${b64}\`).then(r => r.blob())` for import
  - `fake-indexeddb` package for testing: provides a complete IndexedDB implementation in memory

  **WHY Each Reference Matters**:
  - idb-keyval is intentionally chosen for its tiny size (~600 bytes) — we don't need a full IndexedDB wrapper
  - The base64 conversion pattern is needed for JSON export (images embedded in export file)
  - `fake-indexeddb` enables testing without a real browser — critical for vitest in happy-dom

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created BEFORE implementation
  - [ ] `bun test --run src/services/__tests__/imageStorage.test.ts` → PASS (minimum 8 test cases)
  - [ ] Tests mock IndexedDB appropriately

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Image CRUD operations
    Tool: Bash (bun test)
    Preconditions: vitest + fake-indexeddb configured
    Steps:
      1. Run `bun test --run src/services/__tests__/imageStorage.test.ts`
      2. Verify minimum 8 tests
      3. Verify 0 failures
    Expected Result: All CRUD tests pass
    Failure Indicators: Any test failure
    Evidence: .sisyphus/evidence/task-4-image-storage-tests.txt

  Scenario: Export/import roundtrip
    Tool: Bash (bun test)
    Preconditions: Image storage service implemented
    Steps:
      1. Save 3 images with known IDs
      2. Call exportAllImages() — verify 3 entries in result
      3. Call clearAllImages()
      4. Call importImages(exported) — import the exported data
      5. Call getImage for each ID — verify blobs are equivalent (same size)
    Expected Result: All 3 images survive export → clear → import cycle
    Failure Indicators: Missing images after import, size mismatch
    Evidence: .sisyphus/evidence/task-4-roundtrip.txt

  Scenario: Graceful handling of missing images
    Tool: Bash (bun test)
    Preconditions: Empty IndexedDB
    Steps:
      1. Call getImage('nonexistent') — expect null
      2. Call getImageUrl('nonexistent') — expect null
      3. Call deleteImage('nonexistent') — expect no error
    Expected Result: No errors thrown, null returns for missing IDs
    Failure Indicators: Thrown exceptions, undefined instead of null
    Evidence: .sisyphus/evidence/task-4-missing-images.txt
  ```

  **Commit**: YES
  - Message: `feat(storage): indexeddb image storage service`
  - Files: src/services/imageStorage.ts, src/services/__tests__/imageStorage.test.ts
  - Pre-commit: `bun test --run src/services/`

- [ ] 5. Snapping + Alignment Pure Logic (No Canvas Dependency)

  **What to do**:
  - RED: Write tests FIRST in `src/utils/__tests__/snapping.test.ts` and `src/utils/__tests__/alignment.test.ts`:
    - Snapping tests:
      - `getSnapTargets(frames, wallWidth, wallHeight, skipId)` — returns all snap lines (wall edges, wall center, frame edges, frame centers) excluding the frame being dragged
      - `getObjectEdges(frame)` — returns vertical/horizontal snap points for a frame (left, center-x, right, top, center-y, bottom)
      - `findSnapGuides(snapTargets, objectEdges, threshold)` — returns matching guides within threshold, sorted by distance
      - Frame near wall center snaps horizontally
      - Frame near another frame's edge snaps vertically
      - No snaps returned when nothing is within threshold
      - Threshold respects the SNAP_THRESHOLD constant (5px equivalent)
    - Alignment tests:
      - `alignFrames(frames, selectedIds, alignment)` — returns updated positions
      - `alignTop(frames)` — all selected frames get y = min(y of selected)
      - `alignBottom(frames)` — all selected frames get y = max(y + height of selected) - their height
      - `alignCenterV(frames)` — all selected frames centered vertically on average center-y
      - `alignLeft(frames)` — all selected frames get x = min(x of selected)
      - `alignRight(frames)` — all selected frames get x = max(x + width of selected) - their width
      - `alignCenterH(frames)` — all selected frames centered horizontally
      - `distributeH(frames)` — evenly space selected frames horizontally
      - `distributeV(frames)` — evenly space selected frames vertically
      - With 1 frame selected — no change (need ≥2 for alignment)
      - Ellipse frames use bounding box for alignment calculations
  - GREEN: Create `src/utils/snapping.ts`:
    - Pure functions that take frame positions/dimensions and return snap guide data
    - `SnapGuide = { orientation: 'V' | 'H'; position: number; type: 'edge' | 'center' }`
    - Based on Konva sandbox pattern but as pure functions (no Konva dependency)
  - Create `src/utils/alignment.ts`:
    - Pure functions that take array of frames + selected IDs + alignment type → return new positions
    - All calculations in cm (matching store's internal units)
  - REFACTOR: Ensure all tests pass, functions are well-typed

  **Must NOT do**:
  - Do NOT import Konva or react-konva — these are PURE math functions
  - Do NOT import from the store — accept frames as parameters
  - Do NOT handle pixel-to-cm conversion here — that's the canvas layer's job

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure math/geometry functions with no UI or framework dependencies
  - **Skills**: []
    - Simple geometry calculations — no specialized skill needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work — pure algorithms

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4)
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `src/types/frame.ts` (from Task 2) — Frame interface with x, y, width, height, shape fields
  - `src/utils/constants.ts` (from Task 2) — SNAP_THRESHOLD constant

  **External References**:
  - Konva snapping sandbox: `getLineGuideStops()`, `getObjectSnappingEdges()`, `getGuides()` pattern — adapt to pure functions. Source: Context7 konvajs/site Objects_Snapping example
  - The key insight: snap targets = wall edges + wall center + all other frames' edges + centers. Object edges = current frame's left/center/right + top/center/bottom. Match within threshold.

  **WHY Each Reference Matters**:
  - The Konva sandbox gives us the exact algorithm (snap source points → target points → find closest within threshold) — we extract this as pure logic so it's testable without canvas
  - Frame type defines the coordinate system: x/y from wall top-left, width/height in cm
  - Separating pure logic from canvas integration means Task 5 can be tested in isolation and Task 10 only does the wiring

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test files created BEFORE implementation
  - [ ] `bun test --run src/utils/__tests__/snapping.test.ts` → PASS (minimum 6 test cases)
  - [ ] `bun test --run src/utils/__tests__/alignment.test.ts` → PASS (minimum 10 test cases)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Snapping logic correctness
    Tool: Bash (bun test)
    Preconditions: Snapping utils implemented
    Steps:
      1. Run `bun test --run src/utils/__tests__/snapping.test.ts`
      2. Verify ≥ 6 tests, 0 failures
      3. Verify tests cover: wall edge snap, frame-to-frame snap, center snap, no-snap-outside-threshold
    Expected Result: All snapping tests pass
    Failure Indicators: Incorrect snap positions, snapping outside threshold, missing snap targets
    Evidence: .sisyphus/evidence/task-5-snapping-tests.txt

  Scenario: Alignment calculations correctness
    Tool: Bash (bun test)
    Preconditions: Alignment utils implemented
    Steps:
      1. Run `bun test --run src/utils/__tests__/alignment.test.ts`
      2. Verify ≥ 10 tests, 0 failures
      3. Specifically verify: 3 frames at y=10,30,50 → alignTop → all y=10
      4. Verify distribute: 3 frames → evenly spaced with equal gaps
    Expected Result: All alignment tests pass with correct math
    Failure Indicators: Wrong alignment positions, distribute produces unequal gaps
    Evidence: .sisyphus/evidence/task-5-alignment-tests.txt

  Scenario: Edge case — single frame alignment
    Tool: Bash (bun test)
    Preconditions: Alignment utils
    Steps:
      1. Call alignTop with only 1 frame selected
      2. Verify position unchanged
    Expected Result: No-op for single frame alignment
    Failure Indicators: Error thrown, or position changed
    Evidence: .sisyphus/evidence/task-5-single-frame-edge.txt
  ```

  **Commit**: YES
  - Message: `feat(snap): pure snapping and alignment calculation logic`
  - Files: src/utils/snapping.ts, src/utils/alignment.ts, tests
  - Pre-commit: `bun test --run src/utils/`

- [ ] 6. 2D Canvas: Basic Wall + Frame Rendering

  **What to do**:
  - RED: Write tests for the scale/coordinate utility in `src/hooks/__tests__/useCanvasScale.test.ts`:
    - `calculateScale(wallWidthCm, wallHeightCm, containerWidthPx, containerHeightPx, padding)` — returns scale factor (cm → px) that fits wall within container with padding
    - `cmToPx(cm, scale)` → pixel value
    - `pxToCm(px, scale)` → cm value
    - Test: 300cm wall in 600px container → scale = 2 px/cm (with 0 padding)
    - Test: 300cm wall in 600px container with 40px padding → scale = (600-80)/300
  - GREEN: Create `src/hooks/useCanvasScale.ts`:
    - Custom hook that observes container size (ResizeObserver) and calculates scale factor
    - Returns `{ scale, stageWidth, stageHeight, wallOffsetX, wallOffsetY }` — wall is centered in stage
  - Create `src/components/canvas/WallCanvas.tsx`:
    - Konva `<Stage>` that fills its container (responsive)
    - `<Layer>` with:
      - Wall background `<Rect>` — positioned at (wallOffsetX, wallOffsetY), sized wallWidth*scale × wallHeight*scale, fill from `wall.color`, rounded corners (4px)
      - For each frame in store: render `<FrameShape>` component
    - Click on empty space → `deselectAll()`
  - Create `src/components/canvas/FrameShape.tsx`:
    - For `shape === 'rect'`: Konva `<Group>` containing:
      - Outer `<Rect>` (frame border) — position, size, fill: frameColor
      - Inner `<Rect>` (mat area, if matEnabled) — inset by frameWidth, fill: matColor
      - Inner `<Rect>` (artwork area) — inset by frameWidth + matWidth
      - If imageId: Konva `<Image>` loaded from `getImageUrl(imageId)` — use `useEffect` to load async
    - For `shape === 'ellipse'`: Konva `<Group>` containing:
      - Outer `<Ellipse>` (frame border) — radiusX/Y from width/height
      - Inner `<Ellipse>` (mat) — reduced radius by frameWidth
      - Inner `<Ellipse>` (artwork) — reduced radius by frameWidth + matWidth
      - If imageId: clip artwork to ellipse shape
    - `draggable={true}` on the Group
    - `onDragEnd` → `updateFrame(id, { x: newX, y: newY })` (convert px back to cm)
    - `dragBoundFunc` → constrain within wall boundaries
    - Visual feedback: selected frames show a subtle highlight/border

  **Must NOT do**:
  - Do NOT implement selection/Transformer (Task 9)
  - Do NOT implement snapping (Task 10)
  - Do NOT implement zoom/pan (Task 9)
  - Do NOT add any UI controls — canvas only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Core canvas rendering with coordinate system, Konva integration, image loading — medium complexity
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Konva canvas rendering involves visual component composition and responsive sizing
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed yet — no E2E tests in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8)
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Tasks 9, 10, 11
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `src/store/useAppStore.ts` (from Task 3) — `frames`, `wall`, `selectedFrameIds`, `updateFrame()`, `deselectAll()` — the store API this component consumes
  - `src/services/imageStorage.ts` (from Task 4) — `getImageUrl(id)` — for loading artwork images
  - `src/types/frame.ts` (from Task 2) — Frame interface shape, all properties to render

  **API/Type References**:
  - react-konva: `<Stage>`, `<Layer>`, `<Rect>`, `<Ellipse>`, `<Group>`, `<Image>` components
  - Konva `Rect` props: `x, y, width, height, fill, cornerRadius, stroke, strokeWidth`
  - Konva `Ellipse` props: `x, y, radiusX, radiusY, fill, stroke, strokeWidth`
  - Konva `Image` props: `image` (HTMLImageElement), `x, y, width, height`
  - Konva `Stage` props: `width, height, onMouseDown, onTouchStart`
  - Konva draggable: `draggable={true}`, `dragBoundFunc`, `onDragStart`, `onDragEnd`

  **External References**:
  - react-konva: Stage/Layer/Rect/Ellipse declarative API — Context7 konvajs/react-konva
  - Konva Image loading: create `new window.Image()`, set `src`, use `onload` callback — use `useImage` from react-konva or manual useEffect
  - Konva `dragBoundFunc`: `(pos) => ({ x: clamp(pos.x, minX, maxX), y: clamp(pos.y, minY, maxY) })`

  **WHY Each Reference Matters**:
  - Store API defines exactly which state to read and which actions to call — canvas is a pure consumer
  - Frame type defines ALL visual properties (color, mat, dimensions) — canvas must render every property
  - `dragBoundFunc` is how we constrain frames to stay within the wall — returns clamped position
  - Image loading is async (from IndexedDB) — need useEffect with cleanup to avoid memory leaks from ObjectURLs

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Scale utility tests pass: `bun test --run src/hooks/`
  - [ ] `bun run build` succeeds with canvas components

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Wall renders with correct color and dimensions
    Tool: Playwright
    Preconditions: App running with default wall (300x250cm, color #F5F0EB)
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for canvas element to appear: `canvas` tag inside Stage container
      3. Take screenshot — verify visually that a light warm rectangle (wall) is visible
      4. Check no console errors
    Expected Result: Canvas renders without errors, wall rectangle visible
    Failure Indicators: Blank canvas, console errors, missing canvas element
    Evidence: .sisyphus/evidence/task-6-wall-renders.png

  Scenario: Frame renders and is draggable
    Tool: Playwright
    Preconditions: App running, store has 1 frame pre-added (can be added via store directly in test setup)
    Steps:
      1. Navigate to app
      2. Verify canvas contains rendered elements (Konva stage is present)
      3. Programmatically add a frame via store: `window.__store.addFrame('rect')`
      4. Take screenshot — frame rectangle should be visible on wall
      5. Use mouse drag on the frame position → frame moves
      6. Take screenshot after drag
    Expected Result: Frame visible on wall, draggable to new position
    Failure Indicators: Frame not visible, drag doesn't work, frame moves outside wall
    Evidence: .sisyphus/evidence/task-6-frame-drag.png

  Scenario: Frame stays within wall boundaries
    Tool: Playwright
    Preconditions: App with 1 frame
    Steps:
      1. Drag frame toward bottom-right corner of wall aggressively
      2. Release — verify frame position is clamped to wall bounds
      3. Take screenshot
    Expected Result: Frame cannot be dragged outside wall boundaries
    Failure Indicators: Frame overlaps wall edge, frame disappears outside wall
    Evidence: .sisyphus/evidence/task-6-boundary-clamp.png
  ```

  **Commit**: YES
  - Message: `feat(canvas): 2d konva canvas with wall and frame rendering`
  - Files: src/components/canvas/WallCanvas.tsx, src/components/canvas/FrameShape.tsx, src/hooks/useCanvasScale.ts, tests
  - Pre-commit: `bun test --run && bun run build`

- [ ] 7. Export/Import JSON Service

  **What to do**:
  - RED: Write tests FIRST in `src/services/__tests__/exportImport.test.ts`:
    - `exportProject(store, images)` → valid JSON string with version, wall, frames, images fields
    - `importProject(json)` → returns parsed { wall, frames, images } ready for store + imageStorage
    - Round-trip: create state with 3 frames (2 with images) → export → clear all → import → deep compare
    - Import validates schema: missing required fields → throws descriptive error
    - Import handles version: current version passes, unknown future version warns but proceeds
    - Import with no images field → works (backward compat)
    - Export with 0 frames → valid JSON with empty frames array
    - Import malformed JSON → throws clear error
  - GREEN: Create `src/services/exportImport.ts`:
    ```typescript
    interface ProjectExport {
      version: 1
      exportedAt: string  // ISO date
      wall: Wall
      frames: Frame[]
      images: Record<string, string>  // imageId → base64
    }

    export async function exportProject(): Promise<string> {
      // Read store state + call imageStorage.exportAllImages()
      // Combine into ProjectExport
      // Return JSON.stringify with 2-space indent
    }

    export async function importProject(json: string): Promise<void> {
      // Parse JSON, validate schema
      // Call imageStorage.importImages(data.images)
      // Set store state: wall, frames
    }

    export function validateExport(data: unknown): data is ProjectExport {
      // Type guard with runtime checks
    }
    ```
  - REFACTOR: Ensure roundtrip test proves export→import produces identical state

  **Must NOT do**:
  - Do NOT compress images (store raw base64)
  - Do NOT add encryption or password protection
  - Do NOT implement auto-export or scheduled export

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Service with JSON serialization/parsing — straightforward async operations
  - **Skills**: []
    - Standard JSON/async patterns — no specialized skill needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI — pure service logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 8)
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/store/useAppStore.ts` (from Task 3) — read wall/frames state, set state on import
  - `src/services/imageStorage.ts` (from Task 4) — `exportAllImages()`, `importImages()`, `clearAllImages()`
  - `src/types/frame.ts` (from Task 2) — Frame interface for schema validation
  - `src/types/wall.ts` (from Task 2) — Wall interface

  **WHY Each Reference Matters**:
  - Store provides the state to export and receives imported state — must match exact types
  - Image storage handles the heavy lifting of image serialization — export service orchestrates
  - Schema validation ensures imported JSON matches our Frame/Wall types — prevents runtime errors

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Tests created BEFORE implementation
  - [ ] `bun test --run src/services/__tests__/exportImport.test.ts` → PASS (minimum 8 test cases)
  - [ ] Roundtrip test proves export→clear→import produces identical state

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Export/import roundtrip fidelity
    Tool: Bash (bun test)
    Preconditions: Store and image storage services implemented
    Steps:
      1. Run `bun test --run src/services/__tests__/exportImport.test.ts`
      2. Verify roundtrip test: 3 frames → export → clear → import → compare
      3. Verify 0 failures
    Expected Result: All export/import tests pass, roundtrip is lossless
    Failure Indicators: Data loss after import, schema validation failures
    Evidence: .sisyphus/evidence/task-7-export-import-tests.txt

  Scenario: Invalid JSON handling
    Tool: Bash (bun test)
    Preconditions: Import service implemented
    Steps:
      1. Call importProject("not json") — expect thrown error with message containing "invalid"
      2. Call importProject('{"version":1}') — expect thrown error about missing fields
    Expected Result: Clear, descriptive errors for invalid input
    Failure Indicators: Generic errors, silent failures, uncaught exceptions
    Evidence: .sisyphus/evidence/task-7-invalid-json.txt
  ```

  **Commit**: YES
  - Message: `feat(export): json export/import with artwork images`
  - Files: src/services/exportImport.ts, src/services/__tests__/exportImport.test.ts
  - Pre-commit: `bun test --run src/services/`

- [ ] 8. 3D Realistic Visualization View

  **What to do**:
  - RED: Write tests for 3D state derivation in `src/components/three/__tests__/wallScene.test.ts`:
    - `frameToMesh(frame, wallHeight)` — converts Frame (2D coordinates, cm) to 3D mesh props (x/y/z position, width/height/depth)
    - Test coordinate mapping: 2D y-from-top → 3D y-from-bottom (Three.js Y is up)
    - Test frame depth calculation from frameWidth
    - Test mat dimensions derivation
  - GREEN: Create `src/components/three/WallScene.tsx`:
    - R3F `<Canvas>` with:
      - Camera: perspective, positioned in front of wall, looking at center
      - Lighting: `<ambientLight intensity={0.6} />` + `<directionalLight position={[5, 5, 10]} intensity={0.8} castShadow />`
      - Wall: `<mesh>` with `<planeGeometry args={[wallWidth/100, wallHeight/100]} />` + `<meshStandardMaterial color={wall.color} />`
      - For each frame: `<FrameMesh3D>` component
    - `<OrbitControls>` with constraints:
      - `minDistance={1}` `maxDistance={10}`
      - `minPolarAngle={Math.PI/6}` `maxPolarAngle={Math.PI/2}` (can't look from behind)
      - `enablePan={true}` `enableZoom={true}`
      - Touch support is built-in
    - `<ContactShadows>` on wall plane for realistic depth
  - Create `src/components/three/FrameMesh3D.tsx`:
    - For rectangular frames:
      - Frame border: 4 box meshes (top, bottom, left, right) forming the border — depth ~2cm, color from frameColor
      - Mat (if enabled): plane slightly inset, matColor
      - Artwork (if imageId): `useTexture` from ObjectURL → textured plane inside mat area
      - All positioned relative to wall surface (z slightly forward from wall)
    - For ellipse frames:
      - Frame border: `<RingGeometry>` extruded or torus geometry
      - Artwork: circular clipping with `useTexture`
    - Use `useMemo` for geometry calculations to avoid re-renders
  - Read ALL state from the same Zustand store (wall, frames)
  - Load artwork images via imageStorage.getImageUrl()
  - This is VIEW-ONLY — no click handlers, no drag, no editing

  **Must NOT do**:
  - Do NOT add any editing/interaction beyond orbit camera
  - Do NOT add frame click handlers or hover effects in 3D
  - Do NOT add transition animations between 2D and 3D
  - Do NOT over-optimize (no LOD, no instancing) — 50 frames max is well within budget
  - Do NOT import Konva into this component

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 3D geometry, coordinate mapping, texture loading, realistic rendering — requires careful spatial reasoning
  - **Skills**: []
    - R3F/drei patterns are documented; deep category provides the thoroughness needed for 3D math
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 3D rendering is more about geometry than UI/UX design

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7)
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/store/useAppStore.ts` (from Task 3) — read `wall`, `frames` state
  - `src/services/imageStorage.ts` (from Task 4) — `getImageUrl(imageId)` for texture loading
  - `src/types/frame.ts` (from Task 2) — Frame interface with all visual properties

  **API/Type References**:
  - R3F `<Canvas>`: auto-manages scene, camera, renderer — responsive to parent size
  - R3F `<mesh>`: Three.js mesh wrapper — children are geometry + material
  - `<planeGeometry args={[width, height]} />`: flat rectangle (wall surface)
  - `<boxGeometry args={[width, height, depth]} />`: 3D box (frame border pieces)
  - `<meshStandardMaterial color={hex} />`: physically-based material
  - drei `<OrbitControls>`: camera orbit with mouse/touch — minDistance, maxDistance, polar angle limits
  - drei `useTexture(url)`: loads texture from URL, returns Three.js Texture — works with blob URLs
  - drei `<ContactShadows>`: soft shadows cast onto a surface — position, opacity, scale, blur

  **External References**:
  - R3F Canvas setup: Context7 pmndrs/react-three-fiber — basic scene with mesh + lights
  - drei OrbitControls: Context7 pmndrs/drei — configuration with distance/angle limits
  - drei useTexture: Context7 pmndrs/drei — single texture and object map loading patterns
  - drei ContactShadows: Context7 pmndrs/drei — soft shadow rendering beneath objects
  - Three.js coordinate system: Y is up, Z comes toward camera. Wall is on XY plane at z=0.

  **WHY Each Reference Matters**:
  - R3F Canvas is the 3D equivalent of Konva Stage — it manages the render loop and resize
  - OrbitControls must be constrained so user can't orbit behind the wall (polar angle limits)
  - useTexture creates Three.js textures from URLs including blob URLs from IndexedDB
  - ContactShadows adds realism — frames appear to cast shadows on the wall surface
  - Coordinate mapping from 2D (y-down, cm) to 3D (y-up, meters) is the trickiest part

  **Acceptance Criteria**:

  **TDD:**
  - [ ] State derivation tests pass: `bun test --run src/components/three/`
  - [ ] `bun run build` succeeds with 3D components

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 3D view renders wall and frames
    Tool: Playwright
    Preconditions: App running, store has 2 frames (1 rect, 1 ellipse), wall color set to #E8D5C4
    Steps:
      1. Navigate to app
      2. Add frames to store programmatically
      3. Toggle to 3D view (this will be wired in Task 11, but component should render if mounted directly)
      4. Wait 2 seconds for WebGL initialization
      5. Check for canvas element (R3F renders to canvas)
      6. Check console for zero WebGL errors
      7. Take screenshot
    Expected Result: 3D canvas renders with wall plane and frame meshes visible
    Failure Indicators: Black screen, WebGL errors, missing frames, crash
    Evidence: .sisyphus/evidence/task-8-3d-renders.png

  Scenario: 3D view is read-only
    Tool: Playwright
    Preconditions: 3D view rendered with frames
    Steps:
      1. Click on a frame mesh in the 3D view
      2. Verify no selection change in store
      3. Try to drag — only camera orbits, frames don't move
    Expected Result: No frame interaction — orbit camera is the only interaction
    Failure Indicators: Frame selection changes, frame positions change
    Evidence: .sisyphus/evidence/task-8-3d-readonly.png

  Scenario: WebGL fallback
    Tool: Playwright
    Preconditions: Attempt to render 3D view
    Steps:
      1. Toggle to 3D view
      2. If WebGL unavailable, check for graceful fallback message
      3. If WebGL available, verify smooth rendering (no console errors)
    Expected Result: Either renders correctly or shows fallback message
    Failure Indicators: Unhandled error, white screen with no message
    Evidence: .sisyphus/evidence/task-8-3d-fallback.png
  ```

  **Commit**: YES
  - Message: `feat(3d): realistic 3d visualization with r3f and drei`
  - Files: src/components/three/WallScene.tsx, src/components/three/FrameMesh3D.tsx, src/components/three/__tests__/wallScene.test.ts
  - Pre-commit: `bun test --run && bun run build`

- [ ] 9. 2D Canvas: Selection + Transformer + Zoom/Pan

  **What to do**:
  - RED: Write tests in `src/hooks/__tests__/useZoom.test.ts`:
    - `clampZoom(scale, min, max)` — clamps between ZOOM_MIN (0.25) and ZOOM_MAX (4)
    - `calculateZoomToPoint(oldScale, newScale, pointerX, pointerY, stageX, stageY)` — returns new stage position to zoom toward pointer
    - Zoom at min boundary → no change
    - Zoom at max boundary → no change
  - GREEN:
  - **Selection**: Update `src/components/canvas/FrameShape.tsx`:
    - `onClick` → `selectFrame(id, e.evt.shiftKey)` — shift+click for multi-select on desktop
    - Long-press detection (500ms touchstart → touchend) → toggle multi-select mode on mobile
    - Selected frames: visual indicator (blue border or highlight ring)
  - **Transformer**: Update `src/components/canvas/WallCanvas.tsx`:
    - Add Konva `<Transformer>` component, ref it
    - On selection change: `transformer.nodes(selectedFrameNodes)`
    - For ellipse frames: `boundBoxFunc` constrains to maintain circle aspect ratio (when shape is ellipse and width === height at creation, lock to circle; otherwise allow oval)
    - `onTransformEnd` → read new width/height from node, update store via `updateFrame()`
    - Transformer anchors: 8 corner/edge handles for resize, NO rotation anchor
    - Transformer props: `rotateEnabled={false}`, `keepRatio={false}` for rects, `keepRatio={true}` for circles
  - **Zoom/Pan**: Create `src/hooks/useZoom.ts`:
    - Desktop: `onWheel` event on Stage → adjust Stage `scaleX/scaleY` (zoom toward pointer)
    - Mobile: pinch-to-zoom using Konva's touch events — track two-finger distance changes
    - Pan: drag on empty canvas area (not on frames) → move Stage position
    - Zoom range: ZOOM_MIN (0.25x) to ZOOM_MAX (4x)
    - Initial zoom: fit wall within container (from Task 6's scale calculation)
    - Hook returns: `{ onWheel, onTouchMove, onTouchEnd, stageScale, stagePosition }`
  - **Keyboard shortcuts**: Add `useEffect` in WallCanvas for:
    - `Delete` / `Backspace` → remove all selected frames
    - `Ctrl+A` / `Cmd+A` → select all frames
    - `Escape` → deselect all

  **Must NOT do**:
  - Do NOT add rotation to frames — frames hang straight
  - Do NOT implement snapping in this task (Task 10)
  - Do NOT implement rubber-band/marquee selection (keep it simple: click + shift-click)
  - Do NOT add zoom controls UI (buttons) — that's in Task 11

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex canvas interaction with Transformer, multi-touch zoom, keyboard handling — multiple interacting behaviors
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Selection UX, transformer behavior, zoom/pan feel — these need good interaction design sense
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not doing E2E in this task — testing interaction through Playwright happens later

  **Parallelization**:
  - **Can Run In Parallel**: YES (can start as soon as Task 6 completes, parallel with Task 10 if it only needs Task 5's snapping logic, but Task 10 depends on Task 9)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Task 6

  **References**:

  **Pattern References**:
  - `src/components/canvas/WallCanvas.tsx` (from Task 6) — existing canvas to extend with selection, transformer, zoom
  - `src/components/canvas/FrameShape.tsx` (from Task 6) — existing frame component to add click/selection handlers
  - `src/store/useAppStore.ts` (from Task 3) — `selectFrame(id, multi)`, `deselectAll()`, `removeFrame()`, `updateFrame()`, `selectedFrameIds`
  - `src/utils/constants.ts` (from Task 2) — ZOOM_MIN, ZOOM_MAX

  **API/Type References**:
  - Konva `Transformer`: `ref`, `nodes()` method to set controlled nodes, `boundBoxFunc`, `keepRatio`, `rotateEnabled`, `onTransformEnd`
  - Konva `Stage` wheel event: `e.evt.deltaY` for scroll direction, `e.evt` for pointer position
  - Konva touch events: `onTouchMove`, `onTouchEnd` — `e.evt.touches` array for multi-touch

  **External References**:
  - Konva Resize Snaps example: Context7 konvajs/site — Transformer with `anchorDragBoundFunc` for circle constraint
  - Konva Limited Drag And Resize: Context7 konvajs/site — `boundBoxFunc` for keeping transforms within bounds
  - Konva Multi-touch Scale: Context7 konvajs/site — `getDistance()` function for pinch-to-zoom
  - Konva Stage zoom pattern: scale Stage + adjust position to zoom toward pointer

  **WHY Each Reference Matters**:
  - Transformer is the core resize interaction — it shows handles and updates dimensions
  - `boundBoxFunc` on Transformer constrains resize behavior — essential for circle frames (lock aspect ratio)
  - The multi-touch scale pattern from Konva sandbox gives exact implementation for pinch-to-zoom
  - Stage scale + position adjustment is how Konva does zoom — not CSS transform, but Konva's own scale

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Zoom utility tests pass: `bun test --run src/hooks/`
  - [ ] `bun run build` succeeds

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Click to select, shift+click for multi-select
    Tool: Playwright
    Preconditions: App with 3 frames rendered on canvas
    Steps:
      1. Click on frame 1 — verify store.selectedFrameIds has 1 entry
      2. Shift+click on frame 2 — verify store.selectedFrameIds has 2 entries
      3. Click on frame 3 (without shift) — verify store.selectedFrameIds has only frame 3
      4. Click empty canvas — verify store.selectedFrameIds is empty
    Expected Result: Single click selects exclusively, shift+click adds, empty click deselects
    Failure Indicators: Wrong selection behavior, shift not detected
    Evidence: .sisyphus/evidence/task-9-selection.png

  Scenario: Transformer resize updates frame dimensions
    Tool: Playwright
    Preconditions: App with 1 frame selected
    Steps:
      1. Select a frame — transformer handles appear
      2. Drag a corner handle outward
      3. Release — verify frame dimensions in store changed
      4. Take screenshot showing resized frame
    Expected Result: Frame resizes, store updated with new dimensions
    Failure Indicators: Dimensions unchanged, transformer not showing, visual glitch
    Evidence: .sisyphus/evidence/task-9-transformer-resize.png

  Scenario: Scroll wheel zoom on desktop
    Tool: Playwright
    Preconditions: App rendered at default zoom
    Steps:
      1. Fire wheel event with deltaY=-100 (zoom in) at canvas center
      2. Verify stage scale increased
      3. Fire wheel event with deltaY=100 (zoom out)
      4. Verify stage scale decreased
      5. Zoom in repeatedly until hitting ZOOM_MAX — verify it stops
    Expected Result: Smooth zoom in/out, clamped at boundaries
    Failure Indicators: No zoom response, zoom beyond limits, jerky behavior
    Evidence: .sisyphus/evidence/task-9-zoom.png

  Scenario: Delete key removes selected frames
    Tool: Playwright
    Preconditions: App with 2 frames, frame 1 selected
    Steps:
      1. Press Delete key
      2. Verify store.frames.length decreased by 1
      3. Verify the selected frame was removed
    Expected Result: Selected frame deleted, other frame remains
    Failure Indicators: Wrong frame deleted, all frames deleted, no response
    Evidence: .sisyphus/evidence/task-9-delete-key.txt
  ```

  **Commit**: YES
  - Message: `feat(canvas): selection, transformer, zoom/pan interaction`
  - Files: src/components/canvas/WallCanvas.tsx (modified), src/components/canvas/FrameShape.tsx (modified), src/hooks/useZoom.ts, tests
  - Pre-commit: `bun test --run && bun run build`

- [ ] 10. Snapping Integration + Alignment Toolbar UI

  **What to do**:
  - RED: Tests already written in Task 5 for pure logic. Write integration-level tests in `src/components/ui/__tests__/AlignmentToolbar.test.tsx`:
    - Toolbar renders alignment buttons
    - Toolbar disabled when < 2 frames selected
    - Click "Align Top" with 3 frames → store updated with aligned positions
    - Click "Distribute Horizontal" with 3 frames → store updated with evenly spaced x positions
  - GREEN:
  - **Snapping Integration**: Update `src/components/canvas/FrameShape.tsx`:
    - On `dragmove`: if `snapEnabled`, call snapping functions from `src/utils/snapping.ts`
    - Convert frame positions from px to cm, calculate snap guides, convert back to px
    - Apply snap position override (force frame to snapped position)
    - Render guide lines as `<Line>` components on a dedicated snap guides layer
    - On `dragend`: clear guide lines
    - The snap threshold needs to account for current zoom level: `SNAP_THRESHOLD / stageScale`
  - **Guide Line Rendering**: Create `src/components/canvas/SnapGuides.tsx`:
    - Renders `<Line>` for each active snap guide
    - Style: dashed line, `rgb(0, 161, 255)` color, 1px width
    - Lines extend full wall width (vertical) or height (horizontal)
    - Guides stored in local state (not in store — ephemeral visual only)
  - **Alignment Toolbar**: Create `src/components/ui/AlignmentToolbar.tsx`:
    - Horizontal row of icon buttons:
      - Align Left, Align Center-H, Align Right
      - Align Top, Align Center-V, Align Bottom
      - Distribute Horizontal, Distribute Vertical
    - Each button: reads `selectedFrameIds` + `frames` from store → calls alignment function from `src/utils/alignment.ts` → batch-updates frame positions via `updateFrame()`
    - Buttons disabled when < 2 frames selected (show tooltip explaining why)
    - Style: small icon buttons in a floating toolbar, warm colors, rounded
    - Use SVG icons (inline, no icon library dependency) or simple Unicode arrows
  - REFACTOR: Verify snap guides appear during drag, alignment buttons produce correct positions

  **Must NOT do**:
  - Do NOT rewrite the snapping pure logic (it's in Task 5)
  - Do NOT add snap-to-grid (only snap to objects + wall edges/center)
  - Do NOT add animation to alignment (instant position change)
  - Do NOT make alignment toolbar a separate panel — it's part of the main toolbar

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Canvas integration with guide line rendering + UI toolbar with store interaction — medium-high complexity
  - **Skills**: []
    - Integration of existing pure functions into canvas — no specialized skill beyond what the category provides
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: The toolbar is simple icon buttons; the complex UX is in the snapping feel which is algorithmic

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 9 (needs Transformer/selection working)
  - **Parallel Group**: Wave 4 (starts after Task 9 in same wave)
  - **Blocks**: Task 11
  - **Blocked By**: Tasks 5, 6, 9

  **References**:

  **Pattern References**:
  - `src/utils/snapping.ts` (from Task 5) — `getSnapTargets()`, `getObjectEdges()`, `findSnapGuides()` — the pure snapping logic to integrate
  - `src/utils/alignment.ts` (from Task 5) — `alignTop()`, `alignBottom()`, `alignCenterV()`, `alignLeft()`, `alignRight()`, `alignCenterH()`, `distributeH()`, `distributeV()` — the alignment functions to wire to buttons
  - `src/components/canvas/WallCanvas.tsx` (from Task 6, modified in Task 9) — canvas to add snap guide layer
  - `src/components/canvas/FrameShape.tsx` (from Task 6, modified in Task 9) — frame to add dragmove snap handler
  - `src/store/useAppStore.ts` (from Task 3) — `snapEnabled`, `selectedFrameIds`, `frames`, `updateFrame()`

  **API/Type References**:
  - Konva `<Line>`: `points` array, `stroke`, `strokeWidth`, `dash` — for rendering guide lines
  - Konva `dragmove` event: `e.target.absolutePosition()` for current position during drag

  **External References**:
  - Konva snapping sandbox: Context7 konvajs/site Objects_Snapping — exact `dragmove` handler pattern with guide line rendering and position forcing

  **WHY Each Reference Matters**:
  - Task 5's pure functions do the math — this task wires them to Konva events and renders the results
  - The Konva sandbox pattern shows exactly how to: listen to dragmove → calculate guides → draw lines → force position
  - Guide lines are ephemeral (not in store) — they only exist during active drag and are destroyed on dragend
  - Alignment toolbar is a direct consumer of Task 5's alignment functions — each button = one function call

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Toolbar component tests pass: `bun test --run src/components/ui/__tests__/AlignmentToolbar.test.tsx`
  - [ ] `bun run build` succeeds

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Snap guides appear during drag near another frame
    Tool: Playwright
    Preconditions: App with 2 frames, snapping enabled
    Steps:
      1. Add 2 frames at different positions
      2. Drag frame 1 slowly toward frame 2's center alignment
      3. Take screenshot when snap guide line appears (blue dashed line)
      4. Release — verify frame snapped to aligned position
    Expected Result: Blue guide line appears when within threshold, frame snaps on release
    Failure Indicators: No guide lines, snap to wrong position, guides persist after release
    Evidence: .sisyphus/evidence/task-10-snap-guides.png

  Scenario: Snap toggle disables snapping
    Tool: Playwright
    Preconditions: App with 2 frames, snapping enabled
    Steps:
      1. Disable snapping (toggle snap off in store)
      2. Drag frame near another frame's alignment
      3. Verify NO guide lines appear
      4. Verify frame stops exactly where released (no position snapping)
    Expected Result: No snapping behavior when disabled
    Failure Indicators: Guide lines still appear, position still snaps
    Evidence: .sisyphus/evidence/task-10-snap-disabled.png

  Scenario: Alignment toolbar aligns 3 frames to top
    Tool: Playwright
    Preconditions: 3 frames at y positions 10cm, 30cm, 50cm; all 3 selected
    Steps:
      1. Select all 3 frames (Ctrl+A or shift+click)
      2. Click "Align Top" button
      3. Verify all 3 frames now have y = 10 (minimum y of the group)
      4. Take screenshot
    Expected Result: All frames aligned to top-most frame's y position
    Failure Indicators: Wrong alignment, only some frames moved, error thrown
    Evidence: .sisyphus/evidence/task-10-align-top.png

  Scenario: Alignment disabled with < 2 frames selected
    Tool: Playwright
    Preconditions: 1 frame selected
    Steps:
      1. Select only 1 frame
      2. Check alignment toolbar buttons — all should be disabled/grayed
      3. Select a second frame (shift+click)
      4. Check alignment toolbar buttons — should now be enabled
    Expected Result: Buttons disabled for 0-1 selection, enabled for 2+
    Failure Indicators: Buttons clickable with single selection, no visual disabled state
    Evidence: .sisyphus/evidence/task-10-align-disabled.png
  ```

  **Commit**: YES
  - Message: `feat(canvas): snapping integration and alignment toolbar`
  - Files: src/components/canvas/FrameShape.tsx (modified), src/components/canvas/SnapGuides.tsx, src/components/ui/AlignmentToolbar.tsx, tests
  - Pre-commit: `bun test --run && bun run build`

- [ ] 11. App Shell + Responsive Layout + Frame Editor UI + Styling

  **What to do**:
  - RED: Write tests in `src/components/ui/__tests__/FrameEditor.test.tsx`:
    - FrameEditor renders with current frame properties
    - Changing width input calls `updateFrame` with new width (converted from display unit to cm)
    - Color picker change updates frameColor
    - Mat toggle enables/disables mat fields
    - Image upload button triggers file input
  - GREEN:
  - **App Shell** (`src/App.tsx`):
    - Responsive layout using Tailwind breakpoints:
      - Mobile (<768px): full-screen canvas + floating top toolbar + bottom sheet
      - Desktop (≥768px): left sidebar (320px) + canvas (flex-1) + top toolbar
    - View toggle: conditional render between `<WallCanvas>` and `<WallScene>` (3D) based on `viewMode`
    - Global keyboard listener for shortcuts (Delete, Ctrl+Z/Y, Ctrl+A, Escape)
    - Error boundary around 3D view (fallback to "3D not available" message)
  - **Sidebar** (`src/components/ui/Sidebar.tsx` — desktop only):
    - **Wall Config Section**:
      - Width/height inputs (number, in current display unit)
      - Wall color picker (presets: white, cream, light gray, sage, terracotta + custom)
    - **Frame List Section**:
      - Scrollable list of frames with label, dimensions, small color swatch
      - Click frame in list → select on canvas
      - "Add Rectangular Frame" button + "Add Circular Frame" button
    - **Settings Section**:
      - Unit toggle: cm ↔ inches (segmented control)
      - Snap toggle (switch)
      - 2D/3D toggle (segmented control)
      - Undo/Redo buttons
      - Export/Import buttons
  - **Bottom Sheet** (`src/components/ui/BottomSheet.tsx` — mobile only):
    - Slides up from bottom when a frame is selected
    - Swipe-down to dismiss (touch gesture: track deltaY on touchmove)
    - Shows frame editor content
    - Has a drag handle indicator (small pill shape at top)
    - Semi-transparent backdrop (click to dismiss)
    - Max height: 70vh, scrollable content
  - **Frame Editor** (`src/components/ui/FrameEditor.tsx` — shared between sidebar and bottom sheet):
    - **Dimensions**: Width + Height number inputs (with unit label). Changing value → convert from display unit to cm → `updateFrame()`
    - **Frame Color**: Color picker with presets (Black #2C2C2C, Dark Brown #4A3728, Gold #C5A55A, White #FFFFFF, Natural Wood #B8956A) + custom hex input
    - **Frame Width**: Slider (0.5cm to 8cm range) with number display
    - **Mat/Passepartout**: Toggle switch. When enabled: mat width slider (1-10cm) + mat color picker (presets: Off-White #FFFEF2, Ivory #FFFFF0, Black #1A1A1A, Light Gray #D9D9D9)
    - **Artwork Image**: Upload button that opens file picker (accept="image/*"). On upload → call `imageStorage.saveImage(id, blob)` → `updateFrame(id, { imageId })`. Show image thumbnail if loaded. "Remove image" button to clear.
    - **Label**: Text input (placeholder "Frame name...")
    - **Hanging Height**: Number input — distance from top of frame to nail/hook position. Visual indicator showing nail position.
    - **Delete Frame**: Danger button at bottom "Remove Frame"
  - **Toolbar** (`src/components/ui/Toolbar.tsx`):
    - Floating horizontal bar at top of canvas area
    - Contains: Add frame dropdown (rect/circle), alignment buttons (from Task 10's AlignmentToolbar), undo/redo, snap toggle indicator, zoom controls (+/- buttons + zoom level percentage)
    - On mobile: condensed (some items in overflow menu)
  - **Styling — Playful/Warm Aesthetic**:
    - Font: Inter (import from Google Fonts) or system-ui fallback
    - Colors:
      - Background: `#FBF8F4` (warm off-white)
      - Surface: `#FFFFFF` with subtle warm shadow
      - Primary: `#D4836B` (terracotta/coral)
      - Primary hover: `#C47260`
      - Secondary: `#8B9E8B` (sage green)
      - Text: `#2C2C2C` (warm dark)
      - Text muted: `#8C7E73` (warm gray)
      - Border: `#E8DDD4` (warm light border)
      - Canvas background (outside wall): `#F0EBE3`
    - Borders: `rounded-2xl` for panels/cards, `rounded-xl` for buttons, `rounded-lg` for inputs
    - Shadows: `shadow-sm` for cards with warm tint: `0 1px 3px rgba(139, 109, 80, 0.08)`
    - Transitions: `transition-all duration-200 ease-out` for interactive elements
    - Buttons: solid fill for primary actions, ghost/outline for secondary. Generous padding `px-4 py-2.5`
    - Inputs: warm border, focus ring in primary color
    - Overall feel: friendly, approachable, like a premium interior-design app. Think Havenly or Modsy.

  **Must NOT do**:
  - Do NOT install a component library (MUI, Chakra, etc.)
  - Do NOT create a separate design system file — use Tailwind utilities + CSS custom properties
  - Do NOT add React Router
  - Do NOT add page transitions or route animations
  - Do NOT implement AR features
  - Do NOT add measurement annotations between frames
  - Do NOT over-engineer the bottom sheet (no spring physics — simple CSS transform is fine)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: This is the UI/UX integration task — layout, responsiveness, styling, interaction design, color system. Visual-engineering is exactly for this.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Responsive layout, component composition, color system, interaction patterns — this is the core UI task
  - **Skills Evaluated but Omitted**:
    - `playwright`: No E2E testing in this task — testing happens in Task 12

  **Parallelization**:
  - **Can Run In Parallel**: NO — integrates all previous tasks
  - **Parallel Group**: Wave 5 (solo)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 3, 4, 5, 6, 7, 8, 9, 10

  **References**:

  **Pattern References**:
  - `src/components/canvas/WallCanvas.tsx` (from Tasks 6/9) — 2D canvas component to embed in layout
  - `src/components/three/WallScene.tsx` (from Task 8) — 3D view component to embed in layout
  - `src/components/ui/AlignmentToolbar.tsx` (from Task 10) — alignment buttons to include in main toolbar
  - `src/store/useAppStore.ts` (from Task 3) — all state and actions consumed by UI
  - `src/services/imageStorage.ts` (from Task 4) — `saveImage()` for artwork upload
  - `src/services/exportImport.ts` (from Task 7) — `exportProject()`, `importProject()` for buttons
  - `src/utils/units.ts` (from Task 2) — `formatDimension()`, `parseDimensionInput()` for display/input conversion

  **API/Type References**:
  - Tailwind responsive: `md:` prefix for ≥768px breakpoint
  - Tailwind `@apply` in CSS custom properties for reusable warm color values
  - `<input type="color">` for native color picker
  - `<input type="file" accept="image/*">` for image upload
  - `URL.createObjectURL(file)` for image preview (revoke on cleanup)
  - CSS `transform: translateY()` for bottom sheet slide animation
  - `touch-action: none` on canvas to prevent browser scroll interference

  **External References**:
  - Google Fonts Inter: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">`
  - Tailwind v4 custom themes: use CSS custom properties `--color-primary` etc. in `@theme` block
  - Bottom sheet pattern: translate-y-full when hidden, translate-y-0 when visible, transition-transform

  **WHY Each Reference Matters**:
  - All previous components are assembled here — this task is the integration point where everything comes together
  - Unit conversion functions ensure display values match user's selected unit while store stays in cm
  - Export/import services are wired to buttons — user clicks "Export" → download JSON, "Import" → file picker → load
  - Bottom sheet is the mobile editing experience — needs to feel native (swipe dismiss, smooth slide)
  - Color system defines the app's personality — warm, friendly, premium feel

  **Acceptance Criteria**:

  **TDD:**
  - [ ] FrameEditor tests pass: `bun test --run src/components/ui/`
  - [ ] `bun run build` succeeds
  - [ ] All previous tests still pass: `bun test --run`

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Desktop layout with sidebar
    Tool: Playwright
    Preconditions: App running, viewport 1440x900
    Steps:
      1. Navigate to app at 1440x900 viewport
      2. Verify sidebar is visible on the left (width ~320px)
      3. Verify canvas fills remaining space
      4. Verify toolbar is above canvas
      5. Take full-page screenshot
    Expected Result: Sidebar + canvas + toolbar layout on desktop
    Failure Indicators: Sidebar missing, canvas not filling space, layout overlap
    Evidence: .sisyphus/evidence/task-11-desktop-layout.png

  Scenario: Mobile layout with bottom sheet
    Tool: Playwright
    Preconditions: App running, viewport 375x812 (iPhone)
    Steps:
      1. Set viewport to 375x812
      2. Navigate to app
      3. Verify sidebar is NOT visible
      4. Verify canvas fills full width
      5. Add a frame and tap it
      6. Verify bottom sheet slides up with frame editor
      7. Take screenshot showing bottom sheet
    Expected Result: Full-width canvas on mobile, bottom sheet appears on frame select
    Failure Indicators: Sidebar showing on mobile, bottom sheet not appearing, layout broken
    Evidence: .sisyphus/evidence/task-11-mobile-layout.png

  Scenario: Frame editing updates canvas in real-time
    Tool: Playwright
    Preconditions: App with 1 frame selected, frame editor visible
    Steps:
      1. Change frame width from 40 to 60 in editor input
      2. Verify canvas immediately shows wider frame
      3. Change frame color to gold (#C5A55A)
      4. Verify canvas frame color updates
      5. Toggle mat on, set mat width to 5cm
      6. Verify mat visible inside frame on canvas
    Expected Result: Every editor change immediately reflected on canvas
    Failure Indicators: Canvas doesn't update, values don't sync, visual glitch
    Evidence: .sisyphus/evidence/task-11-edit-updates.png

  Scenario: 2D/3D view toggle
    Tool: Playwright
    Preconditions: App with 2 frames
    Steps:
      1. Verify 2D Konva canvas is showing
      2. Click 3D toggle button
      3. Wait 2 seconds for WebGL init
      4. Verify 3D canvas is rendering (R3F canvas element present)
      5. Click 2D toggle button
      6. Verify 2D Konva canvas is back
    Expected Result: Smooth toggle between 2D and 3D views
    Failure Indicators: Blank screen on toggle, state lost, console errors
    Evidence: .sisyphus/evidence/task-11-view-toggle.png

  Scenario: Export and import workflow
    Tool: Playwright
    Preconditions: App with 3 frames arranged on wall
    Steps:
      1. Click "Export" button
      2. Verify JSON file downloaded (or blob URL created)
      3. Read the exported JSON — verify it contains 3 frames + wall data
      4. Clear all frames from store
      5. Click "Import" button, select the exported file
      6. Verify 3 frames restored with correct positions
    Expected Result: Full export → clear → import roundtrip works
    Failure Indicators: Download fails, import doesn't restore frames, data loss
    Evidence: .sisyphus/evidence/task-11-export-import.png

  Scenario: Warm/playful design consistency check
    Tool: Playwright
    Preconditions: App fully rendered on desktop
    Steps:
      1. Take screenshot of full app
      2. Verify: rounded corners on panels (≥ rounded-xl)
      3. Verify: warm background color (not cold white/gray)
      4. Verify: primary buttons use terracotta/coral color
      5. Verify: text is warm dark (#2C2C2C area), not pure black
      6. Verify: no sharp edges or cold colors
    Expected Result: Consistent warm, playful aesthetic throughout
    Failure Indicators: Cold colors, sharp rectangles, inconsistent styling
    Evidence: .sisyphus/evidence/task-11-design-check.png
  ```

  **Commit**: YES
  - Message: `feat(ui): app shell, responsive layout, frame editor, styling`
  - Files: src/App.tsx, src/components/ui/Sidebar.tsx, src/components/ui/BottomSheet.tsx, src/components/ui/FrameEditor.tsx, src/components/ui/Toolbar.tsx, src/index.css (updated), tests
  - Pre-commit: `bun test --run && bun run build`

- [ ] 12. Integration Testing + E2E + Polish

  **What to do**:
  - Set up Playwright: `npx playwright install --with-deps chromium` (Chromium only for speed)
  - Create `playwright.config.ts`:
    - Base URL: `http://localhost:5173`
    - Web server: `bun run dev`
    - Projects: desktop (1440x900) + mobile (375x812)
    - Screenshots: on failure
    - Timeout: 30s per test
  - Create `e2e/` directory with test files:
  - **Full workflow test** (`e2e/workflow.spec.ts`):
    1. Navigate to app
    2. Set wall dimensions: 400cm × 300cm
    3. Set wall color to light sage (#D4E4D4)
    4. Add 3 rectangular frames with different sizes
    5. Label each frame ("Large Print", "Small Photo", "Medium Art")
    6. Position frames by dragging
    7. Select 2 frames → click "Align Top"
    8. Toggle snapping off → drag a frame freely
    9. Toggle snapping on → drag near alignment → verify snap
    10. Switch to 3D view → orbit camera → take screenshot
    11. Switch back to 2D view → verify state unchanged
    12. Undo alignment → verify frames returned to pre-alignment positions
    13. Redo → verify alignment restored
    14. Export project → save JSON
    15. Clear all frames
    16. Import saved JSON → verify all 3 frames restored with labels and positions
  - **Persistence test** (`e2e/persistence.spec.ts`):
    1. Add 2 frames, position them
    2. Reload page
    3. Verify 2 frames present at saved positions
    4. Verify wall settings persisted
  - **Mobile test** (`e2e/mobile.spec.ts`):
    1. Set viewport to 375×812
    2. Verify no sidebar
    3. Add a frame → tap it → verify bottom sheet opens
    4. Edit frame name in bottom sheet
    5. Swipe down → verify bottom sheet closes
    6. Pinch-to-zoom (simulate with Playwright touchscreen API)
  - **Edge cases test** (`e2e/edge-cases.spec.ts`):
    1. Add frame → delete immediately → verify removed
    2. Try to add frame #51 (beyond MAX_FRAMES) → verify refused or capped
    3. Import invalid JSON → verify error message shown (not crash)
    4. Toggle to 3D with zero frames → verify no crash
    5. Select all (Ctrl+A) with zero frames → no error
    6. Rapid undo/redo → no state corruption
  - **Fix any bugs** discovered during E2E testing
  - Run `bun run build && bun run preview` to verify production build works
  - Run `bun test --run` to ensure all unit tests still pass after any fixes

  **Must NOT do**:
  - Do NOT add new features during polish — only fix bugs
  - Do NOT install additional dependencies
  - Do NOT change the visual design (only fix obvious bugs)
  - Do NOT add Firefox/Safari Playwright browsers (Chromium only for now)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E testing, bug fixing, integration verification — needs broad understanding of the full app
  - **Skills**: [`playwright`]
    - `playwright`: Core skill for writing and running E2E browser tests
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not doing UI changes — only testing and fixing bugs

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on complete app
  - **Parallel Group**: Wave 6 (solo)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: Task 11

  **References**:

  **Pattern References**:
  - All previous components — this task tests the integrated system
  - `src/store/useAppStore.ts` — for programmatic state setup in tests
  - `src/services/exportImport.ts` — for testing export/import flow

  **External References**:
  - Playwright test API: `page.goto()`, `page.click()`, `page.fill()`, `page.waitForSelector()`, `page.screenshot()`
  - Playwright touch: `page.touchscreen.tap()`, touchscreen gesture simulation
  - Playwright viewport: `page.setViewportSize({ width: 375, height: 812 })`

  **WHY Each Reference Matters**:
  - Playwright is the agent-executed QA tool — it replaces manual testing
  - All store/service code is the subject of testing — E2E proves the full stack works
  - Mobile viewport simulation verifies responsive design without a physical device

  **Acceptance Criteria**:

  **TDD:**
  - [ ] `bun test --run` → ALL unit tests pass (regression check)
  - [ ] `bunx playwright test` → ALL E2E tests pass
  - [ ] `bun run build` → production build succeeds
  - [ ] `bun run preview` → app serves and works

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full E2E test suite passes
    Tool: Bash
    Preconditions: All app code complete, Playwright installed
    Steps:
      1. Run `bun run build` — verify exit 0
      2. Run `bun test --run` — verify all unit tests pass
      3. Run `bunx playwright test --reporter=list` — verify all E2E tests pass
      4. Count total E2E tests — verify ≥ 10 test cases across all spec files
    Expected Result: Build succeeds, all unit tests pass, all E2E tests pass (≥10)
    Failure Indicators: Any test failure, build error, fewer than 10 E2E tests
    Evidence: .sisyphus/evidence/task-12-e2e-results.txt

  Scenario: Production build serves correctly
    Tool: Playwright
    Preconditions: Production build created
    Steps:
      1. Run `bun run preview` in background
      2. Navigate to preview URL
      3. Verify app loads, canvas renders, frame can be added
      4. Kill preview server
    Expected Result: Production build is fully functional
    Failure Indicators: Blank page, missing assets, broken functionality
    Evidence: .sisyphus/evidence/task-12-production-build.png

  Scenario: Mobile E2E passes
    Tool: Bash (playwright)
    Preconditions: Playwright configured with mobile project
    Steps:
      1. Run `bunx playwright test e2e/mobile.spec.ts --reporter=list`
      2. Verify all mobile tests pass
    Expected Result: Mobile-specific tests pass (bottom sheet, no sidebar, touch)
    Failure Indicators: Mobile layout broken, touch interactions fail
    Evidence: .sisyphus/evidence/task-12-mobile-e2e.txt
  ```

  **Commit**: YES
  - Message: `test(e2e): integration tests, playwright e2e, polish fixes`
  - Files: playwright.config.ts, e2e/*.spec.ts, any bug fixes
  - Pre-commit: `bun test --run && bun run build`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bunx tsc --noEmit` + `bun run build` + `bun test --run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify Tailwind classes follow playful/warm design (rounded corners, warm palette, no cold grays).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (clear localStorage + IndexedDB). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration: add 3 frames → align them → toggle 3D → toggle back → undo alignment → export → clear → import → verify identical. Test mobile viewport (375px): bottom sheet, touch drag, pinch zoom. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance (no React Router, no image editing, no measurement annotations, no frame rotation). Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `chore(scaffold): initialize vite+react+ts project with tooling` — package.json, tsconfig, tailwind, vitest config, folder structure
- **Task 2**: `feat(types): define frame, wall, unit types and conversion utils` — src/types/*, src/utils/units.ts, src/utils/constants.ts, tests
- **Task 3**: `feat(store): zustand store with undo/redo and localStorage persist` — src/store/*, tests
- **Task 4**: `feat(storage): indexeddb image storage service` — src/services/imageStorage.ts, tests
- **Task 5**: `feat(snap): pure snapping and alignment calculation logic` — src/utils/snapping.ts, src/utils/alignment.ts, tests
- **Task 6**: `feat(canvas): 2d konva canvas with wall and frame rendering` — src/components/canvas/*, tests
- **Task 7**: `feat(export): json export/import with artwork images` — src/services/exportImport.ts, tests
- **Task 8**: `feat(3d): realistic 3d visualization with r3f and drei` — src/components/three/*, tests
- **Task 9**: `feat(canvas): selection, transformer, zoom/pan interaction` — src/components/canvas/*, tests
- **Task 10**: `feat(canvas): snapping integration and alignment toolbar` — src/components/canvas/*, src/components/ui/AlignmentToolbar.tsx, tests
- **Task 11**: `feat(ui): app shell, responsive layout, frame editor, styling` — src/App.tsx, src/components/ui/*, tests
- **Task 12**: `test(e2e): integration tests, playwright e2e, polish fixes` — e2e/*, fixes

---

## Success Criteria

### Verification Commands
```bash
bun test --run                    # Expected: ALL tests pass (store, utils, services)
bun run build                     # Expected: Production build succeeds, 0 errors
bunx playwright test              # Expected: ALL E2E tests pass
bun run preview                   # Expected: App serves and is fully functional
```

### Final Checklist
- [ ] All "Must Have" items verified present
- [ ] All "Must NOT Have" items verified absent
- [ ] All vitest tests pass
- [ ] All Playwright E2E tests pass
- [ ] Production build succeeds
- [ ] Mobile viewport (375px) fully functional
- [ ] Desktop viewport (1440px) fully functional
- [ ] localStorage persistence works across page reload
- [ ] Export → import produces identical state
- [ ] 3D view renders all frames with correct positions and artwork
- [ ] Playful/warm design aesthetic consistent throughout
