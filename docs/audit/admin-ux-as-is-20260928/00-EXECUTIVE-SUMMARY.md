# Admin UI/UX AS-IS audit — executive summary

**Verdict: SYSTEMIC-UX-DRIFT.** Audited detached `origin/dev` at `8980521550625e724fcc0b2bda9c46d93eeb0023` on 2026-09-28. `git fetch origin --prune` advanced the local remote-tracking ref from `abddcb4` to `8980521`; it **did not** advance beyond the expected SHA. Source checkout was clean. The pre-existing experiment checkout was clean at `8354d48` and left untouched. Recent `dev` history includes PR #8 public-map parity and PR #7 Paper Map adoption.

This is a source-based AS-IS audit of all **32** `app/pages/admin` routes, their shared components, and historical QA. A fresh authenticated browser session was unavailable: this detached checkout has no dependencies, environment file, or running Nuxt server. No DB, fixture, API, or product code was changed. Existing WU-56 and Paper Map QA screenshots/results at 390, 1024, and 1440 px are **historical evidence**, not a claim of fresh verification. Other routes and 768 px remain unverified in a browser.

## Overall assessment

The WU-41 navigation spine remains coherent: a route-aware Map context, role-aware sidebar, Map/Spot subnavigation, a responsive drawer, and Map Home. The application now contains multiple mature, but different, editing models. The largest risk is that an admin cannot predict whether an action remains a draft, saves a section, or commits immediately. Visual workspaces also use three layouts with no visible product-level contract. These are product-consistency risks, not proof of a broken backend.

**Top five inconsistencies:**

1. **Save predictability:** PIN/Paper hold drafts, Decoration commits each gesture, and Georeference saves explicitly without a route-leave guard (UX-001, UX-002).
2. **Visual workspace orientation:** PIN uses sticky left Map; Paper New uses left Preview with sticky right choice panel; Paper Edit uses sticky right Preview; Decoration has nonsticky left canvas (UX-003).
3. **Local editing protection:** SpotForm and Paper Edit use `UnsavedChangesGuard`; Settings and Georeference do not; Fields protects in-page selection but not route exit (UX-004).
4. **Feedback language and presentation:** `SaveFeedback`, toast, inline status, and button-label feedback coexist across comparable editors (UX-005).
5. **IA vocabulary:** Settings owns Map basics and links to Editors, while Categories is first class and Fields/Floors/PIN are under Illustration Map; contextual routes use different back targets and titles (UX-006, UX-007).

## Strengths and areas to preserve

- Preserve WU-41 URL-authoritative Map context and permission-aware navigation; audit found drift at feature edges, not a reason to replace the spine.
- Preserve the PIN Editor's document-scroll, left sticky Map behavior for long live-preview inspectors where geometry supports it. WU-56 browser QA measured `top:24px` at 1024/1440 and normal flow at 390.
- Preserve Paper Map's explicit source-versus-paper-only override language and PDF-from-current-draft disclosure.
- Preserve Georeference's two-point task flow, which is a justified specialized workspace; it should not be forced into a generic single-preview shell.
- Preserve keyboard controls already present for Decoration transform and Paper viewport/reorder, and the role-aware mobile drawer.

**Decision before implementation:** agree on persistence/dirty semantics, visual-editor applicability, and publication vocabulary. A focused WU can then follow; do not start a wholesale redesign from this audit.

See [findings](08-FINDINGS.md), [hypothesis results](03-VISUAL-EDITOR-AUDIT.md), and [browser coverage](02-UX-PATTERN-MATRIX.md).
