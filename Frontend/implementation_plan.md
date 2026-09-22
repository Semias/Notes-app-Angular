# Version 2.0 Implementation Plan

This section outlines the step-by-step technical implementation to bring the Notes app to Version 2.0.

### Phase 1: Foundation & Cleanup

**Step 1: Fix Dependency & Port Configuration**
- [ ] Open `package.json` and change the `"server"` script to match the API port: `"server": "json-server --watch db.json --port 3000"`.
- [ ] Remove React dependencies from `package.json`: `npm uninstall @mui/material @emotion/react @emotion/styled @mui/icons-material`.
- [ ] Run `npm install` to ensure the `package-lock.json` is synced.

**Step 2: Migrate to Standalone Components**
- [ ] Update `main.ts` to use `bootstrapApplication` instead of `platformBrowserDynamic().bootstrapModule()`.
- [ ] Convert `AppComponent`, `NoteListComponent`, `DetailViewComponent`, `NoteComponent`, and `PopupNoteComponent` to standalone components by adding `standalone: true` and importing necessary modules directly into each component's `imports` array.
- [ ] Delete `app.module.ts`.

### Phase 2: State Management & Architecture

**Step 3: Implement Signal-based State Management**
- [ ] Create a new service `NoteStateService` (`src/app/services/note-state.service.ts`).
- [ ] Define writable signals: `notes`, `selectedNote`, `searchQuery`, `isLoading`, and `error`.
- [ ] Define computed signals: `filteredNotes` (combining `notes` and `searchQuery`).
- [ ] Move HTTP subscription logic from `AppComponent` into `NoteStateService`.

**Step 4: Refactor Component Communication**
- [ ] Remove `@Input()` and `@Output()` properties from components that pass data solely for orchestration.
- [ ] Inject `NoteStateService` into the components and bind the template directly to the signals (e.g., `noteState.filteredNotes()`).

### Phase 3: Core Functionality (Full CRUD & Features)

**Step 5: Implement Note Editing**
- [ ] Extend the `NoteService` to include an `updateNote(note: Note)` method performing a `PUT` request.
- [ ] Modify `PopupNoteComponent` to accept a note to edit. If passed, populate the form.
- [ ] Add an "Edit" button to the `DetailViewComponent` that opens the popup in edit mode.

**Step 6: Rich Text / Markdown Support**
- [ ] Install a markdown parser: `npm install marked` and `@types/marked`.
- [ ] Create an Angular Pipe `MarkdownPipe` that transforms plain text note content into HTML.
- [ ] Update `DetailViewComponent` to render the content using `[innerHTML]="note.content | markdown"`.

**Step 7: Advanced Filtering & Pinning**
- [ ] Add an `isPinned` boolean property to the `Note` interface.
- [ ] Implement a "Pin" toggle button in `DetailViewComponent`.
- [ ] Update the `filteredNotes` computed signal to sort pinned notes to the top before filtering by the search query.

### Phase 4: UI/UX & Responsive Design

**Step 8: Responsive Layout**
- [ ] Refactor `app.component.html`. Remove fixed heights (`max-h-[550px]`).
- [ ] Use a CSS Grid layout that collapses into a single column on mobile screens (`grid-cols-1 md:grid-cols-3`).
- [ ] On mobile, hide the note list when a note is selected, and show a "Back to list" button in the detail view.

**Step 9: Aesthetics & Polish**
- [ ] Define Tailwind theme colors in `tailwind.config.js` for primary, secondary, and accent colors to standardize the glassmorphism.
- [ ] Implement a theme toggle service to switch between Dark and Light mode.
- [ ] Enhance tag display: Map different tags to specific pastel background colors in the `NoteComponent`.

### Phase 5: Cross-Platform Preparations

**Step 10: Desktop App Initialization**
- [ ] Install Tauri CLI: `npm install -D @tauri-apps/cli`.
- [ ] Initialize Tauri: `npx tauri init` (configure the build command as `npm run build` and dev path as `http://localhost:4200`).

**Step 11: Mobile App Initialization**
- [ ] Install Capacitor: `npm i @capacitor/core` and `npm i -D @capacitor/cli`.
- [ ] Initialize Capacitor: `npx cap init "NotesApp" "com.notesapp.app"`.
- [ ] Add iOS and Android platforms: `npm i @capacitor/ios @capacitor/android` and run `npx cap add ios` / `npx cap add android`.
