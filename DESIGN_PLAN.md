# Design & Implementation Plan: Link Canvas

## 1. Design Direction: "Digital Blueprint"

**Aesthetic:** Industrial Utilitarian / Swiss Style
**DFII Score:** 12 (High Impact, High Fit, High Feasibility)

**Concept:**
A "CAD for bookmarks." The interface feels like a precision instrument. It avoids the "colorful blobs" trend of modern SaaS in favor of stark lines, visible grids, and raw data exposure. It treats links not just as preview cards, but as *objects* in a workspace.

**Visual Language:**
*   **Typography:**
    *   *Display:* `Space Grotesk` or `Uncut Sans` (Geometric, technical).
    *   *Data/Labels:* `JetBrains Mono` or `Geist Mono` (Legible, code-like).
*   **Color Palette:**
    *   *Background:* `#F0F0F0` (Light Gray - like technical paper) or `#0A0A0A` (Dark Drafting Table).
    *   *Surface:* White (with subtle borders, no soft shadows - use hard shadows or thick strokes).
    *   *Accent:* `#FF4F00` (Safety Orange) or `#0047AB` (Cobalt Blue) - used *only* for active states and connections.
    *   *Text:* `#111111` (Near Black).
*   **Shapes:** Sharp corners. Visible borders (1px solid). No rounded heavy radii (max 2px-4px).
*   **Motion:** Instant, snappy. No "spring" physics. Things move where you put them.

**Differentiation Anchor:**
If screenshotted, it looks like an architectural diagram or an engineering schematic, not a Pinterest board.

## 2. Technical Stack & Performance Strategy (React Best Practices)

**Core Framework:** Next.js 14+ (App Router)
**State Management:** Zustand (Transient updates for canvas performance).
**Canvas Engine:** React Flow (@xyflow/react).

**Performance Optimizations:**
1.  **Interaction Responsiveness:**
    *   `rerender-memo`: All Canvas Nodes (`LinkNode`) will be strictly memoized. Metadata updates won't trigger canvas layout recalcs.
    *   `rerender-transient-updates`: Mouse movements and viewport transforms will bypass React render cycle where possible (using direct DOM manipulation or transient state via Zustand).

2.  **Bundle Size:**
    *   `bundle-dynamic-imports`: The heavy `ReactFlow` component and heavy UI modals will be lazy-loaded using `next/dynamic`.
    *   `bundle-barrel-imports`: Direct imports for icons (`lucide-react/dist/esm/icons/...`) to avoid tree-shaking misses.

3.  **Data Persistence:**
    *   `async-parallel`: Metadata fetching for multiple dropped links will happen in parallel (`Promise.all`).
    *   `idb-keyval`: Lightweight, non-blocking storage to keep the main thread free.

## 3. Revised Implementation Steps

### Phase 1: Foundation (The Rig)
*   **Step 1:** Initialize Next.js with strict TypeScript and Tailwind.
*   **Step 2:** Configure the "Digital Blueprint" design system (CSS variables, fonts).
*   **Step 3:** Setup Zustand store with `idb-keyval` persistence logic.

### Phase 2: The Canvas (The Workspace)
*   **Step 4:** Implement `InfiniteCanvas` with `next/dynamic` loading.
*   **Step 5:** Create the `LinkNode` component.
    *   *Design:* Brutalist card. Exposed URL. Monospace metadata.
    *   *Perf:* Memoized.
*   **Step 6:** Implement `ConnectionEdge`.
    *   *Design:* Orthogonal or straight lines. No bezier curves (matches the "Blueprint" vibe).

### Phase 3: Logic & Input (The Tools)
*   **Step 7:** Implement Metadata API (Server Action or Route Handler).
*   **Step 8:** Drag-and-drop logic for URLs.
*   **Step 9:** UI Shell (Toolbar, Mini-map).
    *   *Design:* Floating tool palette, fixed position, high contrast.

## 4. User Interaction Model
*   **Adding Links:** Drag URL from browser bar -> Drop on Canvas -> Instant placeholder -> Background metadata fetch.
*   **Connecting:** Click "Port" on Card A -> Drag to Card B. Snap to anchor.
*   **Organizing:** Select multiple -> "Group" command -> Wraps in a labeled dashed border.

---
**Do you approve this Design & Implementation Plan?**
