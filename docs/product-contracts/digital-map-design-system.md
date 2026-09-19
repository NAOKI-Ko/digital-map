# Digital Map Design System v1

Status: WU-50 canonical contract  
Base: `a762e254c5fdc7ea60d2e997b8a517b5897955f4`

## Product principles

Digital Map is map-first, quiet, direct, contextual, accessible, and consistent. The map or illustration is the primary content. Controls support the task without overpowering that content. Persistent edits keep explicit Save/Cancel semantics; routine success never requires a modal.

The frontend may reorganize presentation and interaction, but it must preserve every existing field, capability, permission, route, validation rule, and persistence contract.

## WU-49 mental model

- The user-facing top-level context is a **ワークスペース**; the domain object remains `Tenant`.
- A workspace has at most one standard map.
- Spots, categories, and media are shared workspace data.
- Illustration and Real are views of the same map, not separate map products.
- Illustration Map is the active implemented view. Real Map is visible only as disabled `準備中` navigation.
- Illustration position (`floorId`, x/y) and real-world position (`lat`, `lng`) are separate concepts.

## Foundations

### Color

| Role | Token |
| --- | --- |
| Canvas | `stone-50` |
| Primary surface | white |
| Subtle surface | `stone-100` |
| Primary / secondary / muted text | `stone-950` / `stone-600` / `stone-500` |
| Default / strong border | `stone-200` / `stone-300` |
| Primary action | `terracotta-600` (`#c7401f`) |
| Hover / pressed | `terracotta-700` |
| Selection | `terracotta-50` |
| Success / warning / danger | emerald / amber / red |

Terracotta is reserved for brand, selection, and primary action. It is not decorative fill. Global gradients and glassmorphism are prohibited.

### Type, space, shape, elevation

- Cross-platform system sans; titles 24px bold, sections 18–20px bold, body 14–16px, UI labels 14px semibold, metadata 12px.
- Spacing follows 4px rhythm: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Controls use about 8px radius, cards/panels 12px, dialogs/sheets 16–24px. Pills are limited to icons, chips, badges, and floating map controls.
- Admin surfaces prefer borders and contrast. Map overlays may use a subtle shadow. Dialogs and sheets use the strongest elevation.
- Primary interactive targets are 44px-class (`min-h-11`) where practical.

### Motion and focus

- Default transition duration is 150–200ms and communicates state or spatial relationship.
- Decorative motion is prohibited; `prefers-reduced-motion` is respected.
- All keyboard-operable controls have visible focus, accessible names, and non-color-only state.

## Canonical primitives

- `UiButton`: primary, secondary, ghost, destructive, and icon variants.
- `UiFormActions`: Save/Cancel action region; mobile may be sticky and safe-area aware.
- `UiField`: label, hint, required state, and error shell.
- `UiSelect`, `UiSwitch`: existing accessible field primitives.
- `UiDialog`, `UiSheet`: common modal and map-overlay structures with focus management.
- `UiCard`, `UiBadge`, `UiInlineFeedback`: quiet grouping and contextual status.
- `UiInspector`: independently scrolling editor panel with stable footer actions.
- Existing confirmation dialog remains the destructive confirmation path.

Wrappers must add semantics, accessibility, or consistency; empty wrappers are not permitted.

## Actions and feedback

- Full-page forms: Cancel then Save, with Save visually primary and rightmost on desktop.
- Inspector editors: Save/Cancel remains in the inspector footer; feedback sits next to the action region.
- Dialogs: secondary Cancel precedes primary action; destructive confirmation is red and separated.
- Immediate controls such as filters, navigation, locale, and floor selection do not gain Save/Cancel.
- Saving disables duplicate submission and exposes progress. Success is non-blocking. Errors are visible near the action or field.
- Existing dirty guards and exact cancel restoration remain authoritative.

## Responsive patterns

- Public mobile map remains `100dvh`, safe-area aware, and headerless. Floor control appears only for multiple floors; locale/info is top-right; categories are a horizontally scrollable bottom row.
- Smartphone/coarse-pointer public maps do not show visible +/- zoom controls. Pinch, pan, geolocation, and WU-47 camera behavior remain unchanged.
- Canvas editors target 65–70% canvas and 30–35% inspector (about 360–420px) on desktop. Narrow screens use a deliberate stacked or sheet workflow, never compressed two-column controls.
- Mobile drawers and sheets trap focus, close with Escape where appropriate, return focus, and prevent background scroll.

## Language

- `Spot` → `スポット`
- `Map` → `マップ` except brand `Digital Map`
- User-facing `Tenant`/context switching → `ワークスペース`
- Legal and permission copy may retain `組織` where that meaning is required.
- `Media` → `メディア`; `PIN` remains `PIN`.

## Prohibited drift

Do not add a UI framework/icon library, change route/API/RBAC/persistence semantics, expose raw illustration x/y, present a second map entity, advertise a working Real Map viewer, or change camera/geolocation behavior.
