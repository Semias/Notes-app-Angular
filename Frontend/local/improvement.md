# Improvement Review — Notes App (Angular)

> Review of the codebase as of 2026-08-17, covering the uncommitted standalone migration and the
> committed history behind it. Architecture context: [architecture.md](./architecture.md).
>
> **Verified locally:** `npx ng build` succeeds (2 warnings) · `npx tsc -p tsconfig.spec.json
> --noEmit` fails (1 error) · `git log -p` traced the port regression to commit `0d55b21`.

---

## Summary

| # | Priority | Issue | Location |
|---|---|---|---|
| 1 | P0 | API port points at 3000, server runs on 5000 — every request fails | [note.service.ts:16](../src/app/services/note.service.ts#L16) |
| 2 | P0 | Spec suite does not compile (`app.title` does not exist) | [app.component.spec.ts:20](../src/app/app.component.spec.ts#L20) |
| 3 | P0 | All 5 specs use `declarations` for standalone components | all `*.spec.ts` |
| 4 | P0 | Standalone migration unfinished: `main.ts` + `app.module.ts` untouched | [main.ts:5](../src/main.ts#L5) |
| 5 | P1 | New notes never appear until reload | [app.component.ts:33](../src/app/app.component.ts#L33) |
| 6 | P1 | Deleting a note also selects it (click bubbles to host) | [note.component.html:21](../src/app/components/note/note.component.html#L21) |
| 7 | P1 | Delete while filtering leaves a ghost row → 404 on second click | [note-list.component.ts:51](../src/app/components/note-list/note-list.component.ts#L51) |
| 8 | P1 | Popup stays open after submitting a note | [popup-note.component.ts:78](../src/app/components/popup-note/popup-note.component.ts#L78) |
| 9 | P1 | `content` can be posted as `undefined` despite `content!: string` | [popup-note.component.ts:76](../src/app/components/popup-note/popup-note.component.ts#L76) |
| 10 | P1 | `@if (!notes)` can never be true — empty state unreachable | [note-list.component.html:9](../src/app/components/note-list/note-list.component.html#L9) |
| 11 | P1 | Lifecycle `implements` clauses dropped; hooks now unverified | [note-list.component.ts:14](../src/app/components/note-list/note-list.component.ts#L14) |
| 12 | P1 | Deleted note can remain in the detail pane | [note-list.component.ts:51](../src/app/components/note-list/note-list.component.ts#L51) |
| 13 | P2 | Note state duplicated across two components | §3.1 |
| 14 | P2 | No error handling or loading state on any HTTP call | [note.service.ts](../src/app/services/note.service.ts) |
| 15 | P2 | API URL hardcoded; no environment files | [note.service.ts:16](../src/app/services/note.service.ts#L16) |
| 16 | P2 | `selectNote.emit()` called with no argument, typed `EventEmitter<Note>` | [note-list.component.ts:38](../src/app/components/note-list/note-list.component.ts#L38) |
| 17 | P3 | `<mat-chip>` inside `<mat-chip-listbox>` — broken a11y contract | note + detail-view templates |
| 18 | P3 | Hidden popup stays keyboard-focusable | [popup-note.component.scss:12](../src/app/components/popup-note/popup-note.component.scss#L12) |
| 19 | P3 | Note rows and delete icon are not keyboard-operable | note-list + note templates |
| 20 | P3 | Layout is desktop-only (fixed heights, `w-1/2` split) | [app.component.html:7](../src/app/app.component.html#L7) |
| 21 | P4 | 4 unused React/MUI deps; bundle 59 kB over budget | [package.json:24-27](../package.json#L24-L27) |
| 22 | P4 | `index.html` links a stylesheet the build never emits | [index.html:9](../src/index.html#L9) |
| 23 | P4 | Circular import: `Note.ts` ← → `popup-note.component.ts` | [Note.ts:1](../src/app/Note.ts#L1) |
| 24 | P4 | Test junk committed to `db.json` | [db.json:20-27](../db.json#L20-L27) |
| 25 | P4 | Two render-blocking external font requests | [styles.scss:6](../src/styles.scss#L6), [index.html:10](../src/index.html#L10) |
| 26 | P4 | No linter, no CI, stale README | repo root |

---

## 1. P0 — Broken right now

### 1.1 The API port is wrong

[`note.service.ts:16`](../src/app/services/note.service.ts#L16) requests
`http://localhost:3000/notes`. [`package.json:10`](../package.json#L10) starts json-server on
`5000`. Nothing loads, nothing saves.

This is a **regression introduced by a formatting commit**. `git log -p` on the service shows:

```diff
commit 0d55b21  "Formatting Code"
-	private apiUrl = "http://localhost:5000/notes";
+  private apiUrl = 'http://localhost:3000/notes';
```

The value changed in the same hunk as a quote-style and indentation change, which is exactly how a
behavioural change slips through review unnoticed. Worth an explicit habit: run formatters as
their own commit, with `--stat`-only review.

**Fix** — restore 5000 and stop hardcoding it (see §3.3):

```ts
private apiUrl = `${environment.apiUrl}/notes`;
```

Interim one-liner: change `3000` back to `5000`.

---

### 1.2 The test suite does not compile

Verified:

```
$ npx tsc -p tsconfig.spec.json --noEmit
src/app/app.component.spec.ts(20,16): error TS2339:
  Property 'title' does not exist on type 'AppComponent'.
```

`AppComponent` has never had a `title` property — these are untouched Angular CLI scaffolding
assertions. Because spec compilation is all-or-nothing, this single error blocks `npm test`
entirely; no test in the repo can run.

**Fix** — delete the two scaffolding tests (`should have as title` and `should render title`).
They assert against a default template that no longer exists.

---

### 1.3 Every spec uses `declarations` for standalone components

All five specs do this:

```ts
await TestBed.configureTestingModule({
  declarations: [NoteListComponent],   // ❌ component is standalone: true
}).compileComponents();
```

Angular throws at `beforeEach` for every suite. Standalone components must be imported.
`NoteListComponent` additionally injects `NoteService`, so it needs the HTTP testing provider.

**Fix:**

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

await TestBed.configureTestingModule({
  imports: [NoteListComponent],
  providers: [provideHttpClient(), provideHttpClientTesting()],
}).compileComponents();
```

`app.component.spec.ts`, `note-list.component.spec.ts`, and `note.service.spec.ts` need the
providers; `note`, `detail-view`, and `popup-note` need only the `imports` swap.

---

### 1.4 The standalone migration is half-done

The working tree converted all five components to `standalone: true`, but
[`main.ts`](../src/main.ts) still bootstraps via `platformBrowserDynamic().bootstrapModule()`, and
[`app.module.ts`](../src/app/app.module.ts) survives as a provider bag holding only
`provideHttpClient` and `bootstrap: [AppComponent]`.

The build passes, which is the trap — nothing signals the incomplete state except the test suite,
which is itself broken. Leaving it here means carrying two bootstrap concepts indefinitely.

**Fix** — finish it:

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
}).catch((err) => console.error(err));
```

Then delete `app.module.ts` and drop `@angular/platform-browser-dynamic` from `package.json`.
(`withInterceptorsFromDi()` is only needed for class-based interceptors registered via DI — there
are none, so it can go.)

---

## 2. P1 — Correctness bugs

### 2.1 Newly created notes never appear

`AppComponent.addNote` pushes the server response into `AppComponent.notes`
([app.component.ts:33](../src/app/app.component.ts#L33)) — an array that
[`app.component.html`](../src/app/app.component.html) never binds. The rendered list lives in
`NoteListComponent.notes`, filled independently by `getNotes()`.

Create a note → it saves correctly → the UI shows nothing until reload.

**Fix** — the structural answer is a shared store (§3.1). Minimal patch: pass the created note
down, or have the list expose an `addNote` method invoked via `viewChild`. Do not add a second
`getNotes()` refetch; that hides the design problem behind a round-trip.

---

### 2.2 Clicking delete also selects the note

[`note.component.html:21`](../src/app/components/note/note.component.html#L21) puts the click
handler on a `<mat-icon>` nested inside `<app-note>`, whose host carries
`(click)="showDetail(note)"` in
[note-list.component.html:3](../src/app/components/note-list/note-list.component.html#L3).

The event fires on the icon, then **bubbles to the host**. So one click on the trash icon:
1. emits `onDeleteNote` → fires the DELETE request, then
2. runs `showDetail(note)` → sets the just-deleted note as `selectedNote` and emits it upward.

The detail pane ends up displaying a note that no longer exists on the server.

**Fix:**

```html
<mat-icon (click)="deleteNote(note); $event.stopPropagation()">delete</mat-icon>
```

Better still, combine with §4.3 and make it a real `<button>` — the stop-propagation stays
necessary either way.

---

### 2.3 Deleting under an active filter leaves a ghost row

`filteredNotes` is only recomputed in `ngOnChanges`, i.e. when `filterValue` changes.
`deleteNote` ([note-list.component.ts:51](../src/app/components/note-list/note-list.component.ts#L51))
reassigns `this.notes` and never touches `filteredNotes`, but with a filter active
`notesToDisplay` returns `filteredNotes`.

Result: the row stays on screen after a successful delete, and clicking it again sends a DELETE
for an id the server no longer has — a 404 that nothing handles.

**Fix (tactical):**

```ts
deleteNote(note: Note) {
  this.noteService.deleteNote(note).subscribe(() => {
    this.notes = this.notes.filter((n) => n.id !== note.id);
    this.filterNotes();          // keep the derived cache in step
  });
}
```

**Fix (structural):** delete `filteredNotes` and `notesToDisplay` entirely and derive with a
`computed()` — see §3.1. Every bug in this section is a symptom of hand-maintaining derived state.

---

### 2.4 The popup never closes after submitting

`onSubmit` ([popup-note.component.ts:78](../src/app/components/popup-note/popup-note.component.ts#L78))
emits the note and clears the form but never emits `close`. The overlay stays up, showing an empty
form, and the user has to hit the ✕ manually.

**Fix** — emit `close` after a successful submit:

```ts
this.onAddNote.emit(newNote);
this.title = '';
this.tags = [];
this.content = '';
this.closePopup();
```

Note also that `closePopup()` writes `this.close.emit((this.isPopUpOpen = false))` — an assignment
buried inside the emit argument, mutating an `@Input` the parent owns. Split it, or drop the local
write and let the parent's binding flow back down.

---

### 2.5 `content` is typed non-nullable but can be `undefined`

[`popup-note.component.ts:76`](../src/app/components/popup-note/popup-note.component.ts#L76)
declares `content!: string`. The definite-assignment assertion tells the compiler to trust that
something assigns it — but if the user never focuses the textarea, `ngModel` never writes and
`content` stays `undefined`.

`onSubmit` guards `title` only, so a note is POSTed with `content: undefined`. json-server stores
it without the key, and the list renders an empty body.

**Fix** — initialise instead of asserting, and validate:

```ts
title = '';
content = '';
```

The `!` operator here is being used to silence `strict` rather than to state a real invariant;
that pattern is worth avoiding project-wide.

---

### 2.6 The "No Notes found" empty state is unreachable

[`note-list.component.html:9`](../src/app/components/note-list/note-list.component.html#L9) reads
`@if (!notes)`. `notes` is initialised to `[]` and only ever reassigned to another array — never
null. An empty array is truthy, so the branch is dead code.

**Fix** — check the rendered collection's length, and distinguish "no notes at all" from "no
matches for this filter":

```html
@empty {
  <div>{{ filterValue ? 'No notes match your filter' : 'No notes yet' }}</div>
}
```

`@empty` is the idiomatic Angular 17+ companion to `@for` and removes the separate `@if` entirely.

---

### 2.7 Lifecycle `implements` clauses were dropped

The migration changed `export class NoteListComponent implements OnInit, OnChanges` to a bare
class declaration ([note-list.component.ts:14](../src/app/components/note-list/note-list.component.ts#L14))
while keeping both hook bodies. Angular calls hooks by name, so this still works today.

What is lost is the compiler check. Rename `ngOnInit` to `ngOnint` and the app silently stops
loading data — no error, no test failure, a blank list. The `implements` clause exists exactly to
turn that into a compile error.

**Fix** — restore it:

```ts
export class NoteListComponent implements OnInit, OnChanges {
```

---

### 2.8 A deleted note can stay in the detail pane

`NoteListComponent.deleteNote` never notifies the parent, so `AppComponent.selectedNote` keeps
pointing at the removed object. Combined with §2.2, deleting the currently-viewed note leaves its
content on screen indefinitely.

**Fix** — clear selection on delete:

```ts
if (this.selectedNote?.id === note.id) {
  this.selectedNote = null;
  this.selectNote.emit(undefined);
}
```

…or let it fall out of a shared store, where selection is derived from the note list.

---

## 3. P2 — Architecture

### 3.1 Collapse the duplicated state into a Signals store

This is the highest-leverage change in the review: bugs 2.1, 2.3, 2.6, and 2.8 are all the same
bug — derived state maintained by hand. Today `notes` exists in two components, `filteredNotes` is
a manually invalidated cache, and `notesToDisplay` is a getter that picks between them.

```ts
// src/app/services/note-state.service.ts
@Injectable({ providedIn: 'root' })
export class NoteStateService {
  private readonly noteService = inject(NoteService);

  readonly notes = signal<Note[]>([]);
  readonly filter = signal('');
  readonly selectedId = signal<number | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly visibleNotes = computed(() => {
    const q = this.filter().toLowerCase();
    return q ? this.notes().filter((n) => n.title.toLowerCase().includes(q)) : this.notes();
  });

  readonly selectedNote = computed(() =>
    this.notes().find((n) => n.id === this.selectedId())
  );

  load(): void { /* getNotes → notes.set(...) */ }
  add(note: Note): void { /* addNote → notes.update((ns) => [...ns, created]) */ }
  remove(note: Note): void { /* deleteNote → notes.update(filter); clear selectedId if matching */ }
}
```

`visibleNotes` cannot go stale — it recomputes from `notes` and `filter` by construction. Keying
`selectedNote` off `selectedId` rather than an object reference makes §2.8 impossible: delete the
note and the computed yields `undefined` on its own.

Components then drop nearly all their `@Input`/`@Output` plumbing and read the store directly.
This matches Phase 2 of [`implementation_plan.md`](../implementation_plan.md), and it is worth
doing **before** the v2.0 features (edit, pinning, sorting), because each of those adds another
piece of derived state to the pile.

---

### 3.2 Add error and loading handling

No HTTP call in the app has a failure path. With the API on the wrong port (§1.1), the current
user-visible behaviour of a total backend outage is: an empty list and no message. That is also
what "you have no notes" looks like.

**Fix** — handle errors at the store boundary and surface them:

```ts
this.noteService.getNotes().pipe(
  catchError((err: HttpErrorResponse) => {
    this.error.set('Could not load notes. Is the server running?');
    return EMPTY;
  }),
  finalize(() => this.isLoading.set(false)),
).subscribe((notes) => this.notes.set(notes));
```

Pair with a `MatSnackBar` for transient failures and a spinner bound to `isLoading()`. If retry
or auth headers are ever needed, a functional `HttpInterceptorFn` registered through
`provideHttpClient(withInterceptors([...]))` is the place for cross-cutting concerns.

---

### 3.3 Introduce environment configuration

`apiUrl` is a hardcoded private field. There is no `src/environments/` directory, so the endpoint
cannot differ between dev and a deployed build — and §1.1 shows how easily a raw literal drifts.

```ts
// src/environments/environment.ts
export const environment = { apiUrl: 'http://localhost:5000' };
```

Wire `fileReplacements` in the production configuration of [`angular.json`](../angular.json), or
provide the value as an `InjectionToken` if you prefer DI over build-time replacement. Also
consider a `proxy.conf.json` for `ng serve` so the browser stops making cross-origin calls in
development.

---

### 3.4 Tighten the emit contract

[`note-list.component.ts:38`](../src/app/components/note-list/note-list.component.ts#L38) calls
`this.selectNote.emit()` with no argument on `EventEmitter<Note>`. TypeScript permits it because
`emit(value?: T)`, so `undefined` flows into `AppComponent.selectedNote` — which is typed `Note |
undefined` and therefore accidentally correct. The type system is not describing what actually
travels this channel.

**Fix** — say so explicitly: `new EventEmitter<Note | undefined>()`. Better, adopt the Angular 20
signal-based APIs (`input()` / `output()`), which give precise inference and drop the
`@Input`/`@Output` decorators entirely. If §3.1 lands, most of these channels disappear anyway.

---

## 4. P3 — Accessibility and UX

### 4.1 Chips use the wrong Material container

Both [`note.component.html:8`](../src/app/components/note/note.component.html#L8) and
[`detail-view.component.html:6`](../src/app/components/detail-view/detail-view.component.html#L6)
put plain `<mat-chip>` elements inside `<mat-chip-listbox>`. A listbox announces itself as a
selection widget with `role="listbox"` and expects `<mat-chip-option>` children — with plain chips
it exposes zero options, so screen readers announce an empty listbox and arrow-key navigation goes
nowhere.

These tags are decorative labels, not selectable options.

**Fix** — use the presentational container:

```html
<mat-chip-set class="flex flex-wrap gap-2 mb-2">
  @for (tag of note.tags; track tag) {
    <mat-chip>{{ tag }}</mat-chip>
  }
</mat-chip-set>
```

(If tag-click-to-filter from `plan.md` gets built, *then* `mat-chip-listbox` +
`mat-chip-option` becomes the right choice.)

---

### 4.2 The closed popup is still focusable

[`popup-note.component.scss:12`](../src/app/components/popup-note/popup-note.component.scss#L12)
hides the popup with `opacity: 0; pointer-events: none`. Neither removes elements from the
accessibility tree or the tab order: a keyboard user tabbing through the page falls into an
invisible form with a title field, a tag input, a textarea, and a submit button.

**Fix** — add `visibility: hidden` to the closed state (it is animatable alongside `opacity` and
does remove focusability), or better, render the popup conditionally with `@if (isPopUpOpen)`.
Conditional rendering also resets the form between openings for free. If the popup becomes a real
modal, `MatDialog` gives focus trapping, `Esc`-to-close, and `aria-modal` without hand-rolling.

---

### 4.3 Note rows and the delete control are not keyboard-operable

`<app-note (click)="showDetail(note)">` is a custom element with no `role`, no `tabindex`, and no
keyboard handler. The delete affordance is a bare `<mat-icon>` — a `<span>` in the DOM. Neither
can be reached or triggered without a mouse.

**Fix** — make the row a real interactive element (`<button>` wrapper, or `role="button"` +
`tabindex="0"` + `(keydown.enter)` / `(keydown.space)`), and make delete an actual
`<button type="button" aria-label="Delete note">` wrapping the icon.

---

### 4.4 The layout is desktop-only

[`app.component.html:7`](../src/app/app.component.html#L7) fixes the main panel at
`min-h-[550px] max-h-[550px]` and splits it `w-1/2` / `w-full`, inside an `<app-root>` pinned to
`w-3/4`. Below roughly 768 px the two panes crush each other; content taller than 550 px is cut off
regardless of viewport.

**Fix** — the responsive plan in [`plan.md`](../plan.md) §3 is the right shape: a
`grid-cols-1 md:grid-cols-3` layout, viewport-relative heights instead of fixed pixels, and on
mobile a list that swaps to the detail view with a "back" affordance.

---

## 5. P4 — Hygiene, performance, tooling

### 5.1 Remove the React dependencies

`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
([package.json:24-27](../package.json#L24-L27)) are React libraries in an Angular app. A search
across `src/` finds zero imports.

```bash
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled
```

They do not reach the bundle (nothing imports them), but they bloat `node_modules`, slow installs,
and add a phantom security surface to every audit.

### 5.2 The bundle is over budget

Verified: **559.30 kB initial against a 500 kB budget**. Main contributors are the full
`pink-bluegrey` prebuilt Material theme in [`styles.scss:7`](../src/styles.scss#L7) (styles alone
are 110.88 kB) and the zone.js polyfill (34.58 kB) for four Material modules' worth of UI.

Options, roughly by payoff: define a custom theme with only the palettes in use instead of the
prebuilt bundle; adopt `provideZonelessChangeDetection()` and drop zone.js — Angular 20 supports
it and this app has no zone-dependent third-party code; audit whether `@angular/router` and
`@angular/animations` (both unused) can leave `package.json`.

### 5.3 Dead stylesheet link in `index.html`

[`index.html:9`](../src/index.html#L9) links `/dist/output.css`, which no build target emits —
leftover from a standalone Tailwind CLI workflow before Tailwind moved into the Angular build. The
build warns `Unable to locate stylesheet: C:\dist\output.css` and browsers take a 404 on every
page load. Delete the line.

### 5.4 Circular import in the domain model

[`Note.ts:1`](../src/app/Note.ts#L1) imports `Tag` from `popup-note.component.ts`, which itself
imports `Note`. The import is unused — the interface uses `tags: string[]`.

Delete the line. The deeper point: a domain model should never import from a component. If `Tag`
becomes a real domain concept, it belongs beside `Note`, not inside the popup. Consider a
`src/app/models/` folder as the app grows.

### 5.5 Test data committed to `db.json`

[`db.json:20-27`](../db.json#L20-L27) contains a manual-test record with title `"§$RTQWE`, tag
`WDFG`, content `WDSRFGWERG`. Since `db.json` is both the seed data and the live database, every
clone starts with this row. Remove it, and consider committing a clean `db.seed.json` while
git-ignoring the working `db.json`.

### 5.6 Two render-blocking external font requests

Material Icons is pulled via `@import "https://fonts.googleapis.com/..."` inside
[`styles.scss:6`](../src/styles.scss#L6) — a Sass pass-through that becomes a runtime CSS
`@import`, the most render-blocking way to load a font. Inter comes separately from rsms.me in
[`index.html:10`](../src/index.html#L10).

Self-host both (`@fontsource/inter`, `material-icons` npm packages) or at minimum move the icons
font to a `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`. Self-hosting also
removes two third-party requests carrying user IP addresses.

### 5.7 Missing tooling

No linter (`ng lint` unconfigured — `ng add @angular-eslint/schematics` sets it up), no formatter
config beyond `.editorconfig` (Prettier would have prevented §1.1 from being buried in whitespace
noise), no e2e tests, no CI workflow. A GitHub Actions job running `npm ci && npm run build &&
npm test -- --watch=false --browsers=ChromeHeadless` would have caught findings 1.1 through 1.4
before they landed.

### 5.8 Stale documentation

[`README.md`](../README.md) claims "Filter and search through all notes" — filtering matches
titles only, not content. It also cites Angular CLI 15.2.5 for an Angular 20 project, and omits
that the json-server port must match `apiUrl`. `plan.md` and `implementation_plan.md` sit
untracked in the repo root; either commit them or move them under `local/` alongside this review.

---

## 6. Suggested sequencing

**Step 1 — make the app run and the tests execute.** Findings 1.1–1.4. Small, mechanical,
and until they are done nothing else can be verified. Finish the standalone migration in the same
pass so the working tree stops being half-migrated.

**Step 2 — fix the user-visible bugs.** Findings 2.2, 2.4, 2.5, 2.7 are independent one-to-five
line fixes. Leave 2.1, 2.3, 2.6, 2.8 for step 3 — patching them individually means writing code
you are about to delete.

**Step 3 — introduce the Signals store (§3.1).** This dissolves the remaining bugs rather than
patching them, and it is the prerequisite for v2.0 features. Add error and loading state (§3.2)
in the same refactor, since both live at the store boundary.

**Step 4 — accessibility and responsive layout.** §4.1–4.4. Independent of the above; can proceed
in parallel with step 3 if someone else is working on it.

**Step 5 — hygiene.** §5. Cheap, uncoupled, good filler work. Do 5.7 (lint + CI) early enough
that it guards steps 3 and 4.

Only then start on the v2.0 feature list in [`plan.md`](../plan.md) — edit support, Markdown,
pinning, sorting. Each of those adds derived state, so they land far more cleanly on top of §3.1
than beside it.
