# Shared component system AS-IS

| Primitive | Good reuse | Divergence / impact |
|---|---|---|
| `AdminNavigation`, `AdminSubnavigation` | Shared sidebar and two route-backed subnav families | Paper/detail headers do not use a shared child-page breadcrumb contract |
| `AdminPageHeader` | Dashboard, Workspaces, Analytics and several standard pages | Visual editors and many management pages use custom headings/eyebrows; hierarchy varies |
| `UiInspector` | PIN Editor long controls | Paper and Decoration use custom aside cards; a shared visual shell is absent |
| `UiFormActions` | SpotForm and PIN actions | Paper Edit hand-builds a fixed mobile bar; Georeference hand-builds bottom actions |
| `UiButton` | Map New, PIN, SpotForm | Paper, Decoration, Georeference, Categories, Settings use repeated custom button classes |
| `UiSelect`, `UiSwitch` | Paper settings and some forms | Settings and management pages also use native/custom controls; differences affect sizing/focus |
| `SaveFeedback` | New Map, Spot, Settings, Floors, Categories, Fields, Organization | Paper uses inline error, Decoration/Publish use toast, Georeference toast+inline; no common status placement |
| `UnsavedChangesGuard` | Map New, SpotForm, PIN, Paper Edit | No shared guard on Georeference/Settings/Organization; Fields uses separate in-page dialog |
| `ConfirmDialog`, `UiAlertDialog` | Shared confirmation treatment in destructive flows | Navigation guard uses ConfirmDialog; some page-specific modal structures differ |
| `MediaPicker` | Floor, Decoration, Map branding/SEO | Reuse is strong; selected asset persistence depends on parent section save or immediate add |
| `PaperMapPreview`, `PinDesignEditor`, `GeoReferenceWizard` | Focused domain components | Their outer shell, sticky and save behavior are page-specific |

### Repetition that affects product consistency

1. Sticky logic occurs in PIN, Paper New/Edit and Settings with different breakpoints (`lg` vs `md`), offsets (`top-5`, `top-6`, `top-28`) and orientations. Some variation is task-specific; the editor shell has no documented rule.
2. Primary/secondary buttons are hand-styled in most newer feature pages, producing different corners, heights and disabled appearance. This is a P3 consistency/maintenance issue, not a mandate to wrap every button.
3. Save status is split between `SaveFeedback`, `useToast`, inline alerts and button state. A common feedback contract has more user value than a broad component rewrite.
4. `SpotForm` centralizes validation, actions and dirty guard. Paper Edit likewise centralizes paper preview in `PaperMapPreview`, but its shell is custom. These are good domain boundaries to preserve.

Source inspection: `rg` of component references across all 32 admin route files, `app/components/admin`, and `app/components/ui`. No code was changed.
