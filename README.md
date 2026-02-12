# Link Canvas

A lightweight infinite canvas for organizing links visually - like a "CAD for bookmarks".

## Features

- **Infinite Canvas**: Pan and zoom freely using React Flow.
- **Drag & Drop**: Drop URLs directly onto the canvas.
- **Auto-Metadata**: Automatically fetches title, description, and image for dropped links.
- **Local Storage**: All data is stored locally in your browser (IndexedDB). No account required.
- **Digital Blueprint Aesthetic**: Industrial, utilitarian design with a focus on data and structure.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Canvas**: @xyflow/react
- **State**: Zustand
- **Storage**: idb-keyval

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `src/app`: App Router pages and API routes
- `src/components/canvas`: Core canvas components (InfiniteCanvas, LinkNode, ConnectionEdge)
- `src/store`: Zustand store for canvas state
- `src/lib`: Utilities for storage and metadata fetching
