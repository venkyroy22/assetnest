# 🧠 BrainFlow: Infinite Workspace Roadmap

## 🎯 Vision
A premium, local-first infinite canvas tool for **AssetNest**. Designed for individual thinkers to organize ideas, map out logic, and brainstorm without boundaries.

- **Philosophy:** Privacy-focused, local-first, high-performance, and visually stunning.
- **Target User:** Individual developers, designers, and project managers.

---

## 🛠️ Feature Specification

### 1. The Canvas
- **Infinite Space:** Seamless panning and zooming.
- **Backgrounds:** Customizable patterns (Grid, Dots, Blueprint).
- **Navigation:** Mini-map and "Fit to Screen" functionality.

### 2. Elements
- **Sticky Notes:** Draggable, resizable, rich-text support, color palettes.
- **Shapes:** Rectangles, Circles, Diamonds (for flowcharts).
- **Text:** Independent text labels.
- **Media:** Local image uploads and link previews.

### 3. Connections
- **Smart Connectors:** Arrows that snap to element edges.
- **Routing:** Curved and straight line options.
- **Styles:** Solid, dashed, and dotted lines.

### 4. Logic & Tools
- **Freehand Drawing:** Brush and eraser tools.
- **Grouping:** Frames to organize related elements.
- **Pinning:** Lock elements in place to prevent accidental moves.
- **Layers:** Z-index control (Bring to Front / Send to Back).

### 5. Utilities
- **Local Storage:** Automated persistence using IndexedDB.
- **Snapshots:** JSON Import/Export for manual backups.
- **Image Export:** High-quality PNG/SVG exports.

---

## 📅 7-Day Implementation Plan

### Day 1: The Infinite Foundation
- [ ] Set up tool directory and basic React structure.
- [ ] Implement Canvas Engine (Pan & Zoom).
- [ ] Render background grid/patterns.
- [ ] Create UI Shell (Floating Toolbar & Sidebar).

### Day 2: Sticky Note Core
- [ ] Implementation of the `StickyNote` component.
- [ ] Drag-and-drop system.
- [ ] Inline text editing and font controls.
- [ ] Color picker for notes.

### Day 3: Logic & Mapping (Connectors)
- [ ] Line drawing engine.
- [ ] Anchor points logic for snapping to notes.
- [ ] Connection path calculation (Bezier curves).

### Day 4: Freedom of Expression (Drawing & Shapes)
- [ ] Pen tool with variable pressure/smoothing.
- [ ] Shape tool for geometric diagrams.
- [ ] Basic eraser functionality.

### Day 5: Organization Mastery
- [ ] Selection box (multi-select).
- [ ] Grouping/Frames logic.
- [ ] Locking/Pinning mechanism.
- [ ] Keyboard shortcuts foundation.

### Day 6: Persistence & Utility
- [ ] IndexedDB integration for auto-save.
- [ ] JSON Save/Load system.
- [ ] PNG/SVG screenshot capture.

### Day 7: The Premium Polish
- [ ] UI Animations (Smooth transitions, hover effects).
- [ ] Template library (Project Kickoff, Logic Flow, etc.).
- [ ] Final bug audit and performance optimization.

---

## 🚀 Tech Stack (Proposed)
- **Framework:** React / Next.js (Existing)
- **Canvas Library:** `tldraw` or `React Flow` (To be finalized Day 1)
- **Icons:** `lucide-react`
- **State Management:** `zustand` (Local-first, lightweight)
- **Persistence:** `idb-keyval` (IndexedDB wrapper)
