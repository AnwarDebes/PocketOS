# PocketOS build progress

Living status of the build. Updated at the end of every phase.

## Current status

**All phases complete (0 to 7).** The OS boots, shows a lock screen, and unlocks to a working desktop with a wallpaper, desktop icons, a status bar (clock, battery, online state), a dock, and a searchable launcher. The window manager works in both desktop mode (drag, resize, snap, maximize, z-order) and mobile mode (maximized apps with a recent-apps switcher), transitioning live as the viewport changes. There is a real IndexedDB filesystem with a starter set of files, and all nine built-in apps are implemented and functional. Files, notes, and settings persist across reloads; you can upload files from the device into the filesystem (button or drag-and-drop), and export or import the entire filesystem as a backup. Themes, accent, and wallpaper apply live; the app installs as a PWA through a custom prompt; and the production build is verified to serve its service worker and manifest for offline use.

## Phase checklist

- [x] **Phase 0: scaffold and tooling.** Vite, React 18, TypeScript strict, Tailwind tokens, ESLint, Prettier, vite-plugin-pwa, icons, clean build.
- [x] **Phase 1: shell.** Boot splash, lock screen (swipe or tap to unlock), desktop with wallpaper and icons, dock with running indicators, launcher with search, status bar (clock, battery via Battery API, online state).
- [x] **Phase 2: window manager.** Open/close/focus/minimize/maximize, z-order, pointer drag, eight-way resize, edge snap (left/right halves, drag-to-top maximize) with a live snap preview, single-instance handling, per-window error boundary, lazy-loaded app bodies. Desktop and mobile modes with a smooth runtime transition; mobile app switcher with swipe-to-close cards.
- [x] **Phase 3: virtual filesystem and core apps.** Dexie VFS with full CRUD, move, copy, and re-pathing. File Manager (browse, create, rename, delete, duplicate, cut/copy/paste, drag-to-move, open with). Text Editor (open/edit/save/save-as, Ctrl+S). Terminal (xterm with a real interpreter: help, ls, cd, pwd, cat, mkdir, touch, rm, mv, cp, echo with redirection, open, whoami, date, clear, history). Settings (theme, accent, wallpaper picker and upload, profile, storage usage, reset).
- [x] **Phase 4: more apps.** Code Editor (Monaco, lazy-loaded with local offline workers, syntax highlighting, save). Browser (iframe with an X-Frame-Options fallback and a curated start page). Calculator (buttons plus full keyboard support). Notes (VFS-backed with autosave). Image Viewer (zoom, rotate, gallery paging through a folder).
- [x] **Phase 5: persistence and import/export.** Everything (files, notes, settings, wallpaper) persists in IndexedDB across reloads. Device upload into the VFS via a button or drag-and-drop from the host. Full filesystem export to a JSON archive and import/restore (binary files inlined as data URLs).
- [x] **Phase 6: mobile polish.** A home-indicator gesture bar (swipe up for the app switcher, swipe sideways to switch apps, swipe down or tap for home), split view (two apps stacked, toggled from the switcher), safe-area insets throughout the shell, and live orientation/viewport handling. On mobile the dock gives way to the home screen plus gestures.
- [x] **Phase 7: theming and finishing.** Light/dark themes and accent color, wallpaper picker and upload, settings that change the OS live, a custom PWA install prompt (banner and a Settings action), a verified offline production build, code-split heavy apps, reduced-motion support, and keyboard focus rings.

## Architecture notes

- **Window model.** Windows are the unit of "process". Each keeps a floating rect (`x,y,width,height`) at all times; `state` (normal/maximized/minimized) and `snap` only change how it renders, so maximizing or snapping never loses the floating geometry. Minimized windows stay mounted but hidden, so app state survives minimize and restore.
- **Adaptive windowing.** The window store holds the current `mode`. A single resize/orientation listener keeps it in sync. In desktop mode windows float; in mobile mode every window renders full screen and the dock plus app switcher handle switching. Because geometry is preserved, rotating the phone or attaching a display flips modes without losing window layout.
- **Work area.** The window layer measures itself (ResizeObserver) and exposes its pixel rect through context, which the drag, clamp, and snap math use.
- **Persistence.** All persistent state lives in one IndexedDB database (Dexie). Settings persist through a Dexie-backed Zustand storage adapter; the shell waits for a `hydrated` flag before rendering so there is no theme flash. Open windows are intentionally session-only.

## Decisions and trade-offs

- Stay on Vite 5 (dev-only esbuild advisory; the breaking fix forces Vite 8). Tailwind 3.4 for the token-in-config flow.
- App icons and bodies are code split: each app is its own chunk, loaded on demand. Monaco and xterm are added in their phases to keep the initial bundle small.
- The main chunk is around 131 KB gzipped today (React, Framer Motion, Dexie, lucide). A performance pass in Phase 7 will trim it further.
- Service worker stays off in `vite dev`; offline is verified against the production build with `npm run preview`.
- Monaco is large. The core OS (about 940 KB of assets) is precached for instant offline, while Monaco's editor core, its language packs, and the typescript worker are runtime-cached on first use rather than bloating the install. The code editor is therefore available offline after it has been opened once.

## Definition of done

- [x] Boots to a lock screen, unlocks to a working desktop.
- [x] Windowing works in desktop and mobile modes, with a smooth transition between them.
- [x] File Manager, Terminal, Text Editor, Code Editor, Browser, Settings, Calculator, Notes, and Image Viewer all open and do something real.
- [x] The filesystem persists across reloads; files upload from the device; the whole filesystem exports and imports.
- [x] Installs to the home screen and runs offline (custom install prompt; the service worker precaches the core OS).
- [x] Builds clean and deploys to Vercel as a static site with no config changes.

## Notes and possible next steps

- iOS does not fire the install-prompt event, so the custom banner does not show there; users install via Share, then Add to Home Screen. The manifest and Apple meta tags are set up for that.
- File and folder listings render directly. That is fine for normal use; list virtualisation could be added for folders with thousands of entries.
- Monaco's core is runtime-cached, so the code editor needs one online open before it works offline.

## How to verify

```bash
npm install
npm run dev       # boot -> lock screen -> unlock -> desktop; open apps from the dock or launcher
npm run build     # typecheck + production build
npm run preview   # production build with the service worker for the offline check
```
