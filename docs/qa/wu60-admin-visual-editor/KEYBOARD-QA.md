# Keyboard QA

Decoration buttons retain accessible labels for move, resize, and rotate and the existing visible `dm-field-focus` focus treatment. With the selected decoration focused, arrow keys changed local `x/y`, width, and rotation respectively. Shift-modified rotate was exercised. The canvas style changed continuously; Save/Discard became enabled. The temporary request log showed no geometry PATCH for these keypresses. Explicit Save caused one PATCH; a simulated failed Save kept the keyboard candidate and allowed retry.

Pressing an arrow key on a different decoration while the current geometry was dirty opened the three-choice target transition dialog. The dialog and the separate delete confirmation were keyboard accessible through their labeled buttons. The WU-59 route guard appeared when leaving to Floors with a dirty draft.

Paper preview region buttons and A4 multi-page navigation were operable by labeled controls. At 1440 × 900, the sticky preview top remained at least 108 px below the viewport top, at or below the sticky header bottom; at 1440 × 700 sticky was disabled. At 390 and 768 px, preview and inspector were in document flow and the fixed mobile action bar did not cover the observed page navigation.
