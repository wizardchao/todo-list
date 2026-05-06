# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build          # Production build → dist/
npm run build:dev      # Development build (no minification)
npm run watch          # Production build with --watch
npm run watch:dev      # Development build with HMR (auto-reloads extension in Chrome)
npm run build-zip      # Create dist/todo-list-v{version}.zip for publishing
npm run prettier:write # Format source files
```

After `npm run build`, load `dist/` as an unpacked Chrome extension for local testing.

## Architecture

This is a **Chrome Extension (Manifest V3)** built with **Vue 2.6** and **Element UI**, using **Webpack 4** for bundling. It is a popup-based todo list — click the extension icon to open the task panel.

**Entry points** (configured in `webpack.config.js`):
- `src/background.js` → `dist/background.js` (service worker, currently minimal)
- `src/popup/popup.js` → `dist/popup/popup.js` (Vue app entry)

**Data persistence** (`src/utils/index.js`): All task data is stored via `chrome.storage.sync`, keyed by date string (`YYYY-MM-DD`). Each date has its own independent task list. The date picker in the UI switches between them. No backend, no login — everything is local to the browser.

**Key components** (`src/popup/`):
- `App.vue` — Main component: date picker, task list with drag-and-drop (vuedraggable), add/edit/delete/clear operations
- `components/clear-dialog.vue` — Clear confirmation dialog with option to only delete completed tasks
- `components/author-dialog.vue` — Author contact/reward dialog (mostly commented out in UI)

**Behavioral notes**:
- Max 50 tasks enforced in `handlerAddTask`
- Completed (checked) tasks auto-sort to bottom of the list
- Double-click a task label to edit; blur saves or deletes if empty
- Badge text on the extension icon shows the count of undone tasks for the current date
- Drag-and-drop persist is saved on `@end` event via `updateTasksListLocalstory`
