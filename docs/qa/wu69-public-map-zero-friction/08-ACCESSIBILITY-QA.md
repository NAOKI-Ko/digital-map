# Accessibility candidate QA

| Check | Result / observation |
| --- | --- |
| Category Tab order | Info→clear/all→Category chips→next→Map。画面外chipがfocus時にスクロールして可視になる。selectedはaria-pressed。 |
| Map keyboard | 修正前は外側regionとcanvasに2回停止（F19）。visitorのみcanvas1回へ修正。実TabでCANVASへ入り、ArrowRight/＋でPan/Zoom。 |
| PIN | Spot固有名、group件数、aria-expanded。coincident/near spiderfyをEnterで選択。 |
| Detail focus | openで名称headingにfocus。Escapeでcloseし可視元PINへ。元PINがhiddenの場合は操作可能なMap canvasへ復帰。 |
| Info | keyboard Enter→open→Escape→Info triggerへfocus復帰。 |
| Floor | 2Floorの選択と復帰はpointerで確認。Floor modalの完全keyboard-only経路の実測は最終Windows QAへ残す。 |
| Targets | Category、Info、Close、expand、既存現在地44×44以上。PINは60×60。Overviewは60px以上幅/44px高。 |
| Reduced motion | Chrome DevToolsでreduceを設定、matchMedia=trueを確認。near group maxZoom/spread3→Enter Spot02→Detail→Escapeを実行。Sheet transition0s、--sheet-motion-duration0ms。Category/controls camera duration0。設定は復元。 |
| Resize/focus | 同一frame内observer再計測のwarningを修正し、Category/390↔768で再発なし。 |

`interaction-results.json` のtab-walkはF19発見時のbeforeを含む。修正後は同じ入口から直接CANVASへ移ることを実測。前後を取り違えない。

screen reader実機、touch gesture、safe-area実値、Windowsでの完全S11は未検証。AC17は主要candidateフローPASS、最終提供環境ではPARTIAL。全a11y適合を主張しない。
