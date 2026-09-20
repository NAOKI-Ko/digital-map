# Feedback Toast and Select contract

## Toast

`UiToastHost` is mounted once in `app.vue`. `useToast` provides success, info, and error messages, a small three-item maximum queue, keyed replacement, accessible dismissal, and 4-second success timing (6 seconds for errors). Success/info uses a polite status region; error uses an assertive alert. Hover and focus pause dismissal.

Transient successful completion uses Toast. Blocking load, validation, conflict, and actionable operation failures remain inline. Busy state remains on the initiating control. Destructive decisions remain in Dialog/AlertDialog. `SaveFeedback` now routes its success state to Toast while retaining saving and error output inline.

## Select

`UiSelect` is the canonical Admin single-select. It uses Reka UI, the Terracotta focus ring, a 44-pixel minimum trigger, keyboard navigation, disabled state, portal positioning, and a selected indicator.

All Admin native single-selects present at WU-52 were migrated: Spot filters and bulk category, Spot form Floor, Media Picker usage, PDF options, Map editor assignment, and Spot assignee. Public locale controls remain native because they are public-map controls, not Admin form controls. No Admin native `<select>` exception remains.
