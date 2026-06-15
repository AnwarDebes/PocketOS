# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-15

First public release. PocketOS is a desktop environment that runs entirely in a
phone's browser and installs as an offline PWA.

### Added

- Shell: boot animation, lock screen (swipe or tap to unlock), desktop with
  wallpaper and icons, a dock, a searchable launcher, and a status bar with a
  live clock, battery (Battery API), and online state.
- Window manager: draggable, eight-way resizable, snapping (left and right
  halves, drag to top to maximize) windows with z-order and minimize. A mobile
  mode where apps run full screen and you switch with gestures and an app
  switcher, plus an optional two-app split view. The two modes swap live as the
  viewport changes.
- Virtual filesystem backed by IndexedDB, with create, rename, move, copy, and
  delete, plus a seeded starter set of files.
- Nine built-in apps: Files, Text Editor, Terminal (a real command interpreter),
  Code Editor (Monaco), Browser, Calculator, Notes, Image Viewer, and Settings.
- Persistence for files, notes, and settings. Upload files from the device by
  button or drag-and-drop, and export or import the whole filesystem as a JSON
  backup.
- Theming with light and dark modes and an accent color, a wallpaper picker with
  custom upload, a custom install prompt, reduced-motion support, and keyboard
  focus rings.

[0.1.0]: https://github.com/AnwarDebes/PocketOS/releases/tag/v0.1.0
