# WU-74 source contract

Source: https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219141276934902

設計日: 2026-10-04
種別: 実装WUの設計正本。今回の登録操作では実装・deployを開始しない。
依存: WU-73 (1219129733130073) COMPLETE。WU-71 Accepted D / WU-72 Phase 1を維持。
参照: WU-38 (1218436345672865)、WU-23/26/35、WU-63〜65、WU-68〜70、WU-72/73。
Repository: NAOKI-Ko/digital-map
設計時の確認dev: 91bfe21fd09207da5d4e3b228e1f4ee4e5ffd30e。実行時は最新dev、PR、Windows実稼働SHA、適用migrationを再取得し、別作業の結果を上書きしない。

目的
初めて使う施設・地域の担当者が、通常ホームから登録し、WorkspaceとMapの違いを理解し、素材とSpotを登録し、未公開確認・公開・再編集まで進める。認証/Onboarding/Map作成/Planを新規開発するWUではなく、既存機能を横断して導線と復旧を検証・改善するWU。

確認済みの前提
- WU-38のsignup、初回OWNER、同意、確認メール、招待との整合は既存機能。重複実装しない。
- WU-72はWorkspace 0..N Map、Spot/Category consumer Map 0..1、複数FloorのPlacementを提供。跨Map共有は未解放。
- WU-73はStandard/Tourism/Enterpriseのstatic catalog、Workspace contract provider、entitlement resolver、実DB Usage、非永続simulationを提供。現在Standard/beta、課金なし、新quota enforcementなし。Map作成は公開Map数の消費ではない。
- 現行Map作成はOwner操作で既定Spot fieldを準備する。既存API・認可・公開版分離を再利用する。

TARGET JOURNEY
J1 通常ホーム→Signup→既存のTerms/Privacy同意→メール確認→通常Login。
J2 初回Workspace作成/所属→0 Mapの案内→最初のMap作成。今どのWorkspace/Mapを操作しているか常に分かる。
J3 β/課金なしと3商品の位置付けを必要な時に確認。プランMockの操作や相談を初回Map作成の必須条件にしない。試行は保存されずreloadで戻ることを明示。
J4 用意された権利確認済み下地をupload→Floor→Category→Spot→PIN配置→公開対象の確認。
J5 Authenticated LIVE Preview→公開→表示されたURLを匿名ブラウザで開く→名称/Spot/写真が期待どおり。QR出力は実画像をdecodeして同一URLを確認。
J6 途中logout/再訪→既存Mapを再開→文章更新→Preview→明示再公開。保存だけで公開版が変わらない。
J7 同一Workspaceの2枚目のMap作成/切替。先のMapの内容・権限・公開・Usageを壊さない。
J8 既存ユーザー/招待済みユーザー/複数Workspace所属/Map未割当ユーザーは既存状態を尊重し、不要なWorkspace・新アカウントを作らせない。

UI CONTRACT
- 既存画面と短い次アクション案内を基本とし、別の巨大Wizardや二重保存経路を作らない。
- 案内の完了状態は実データから判定。onboardingState=ACTIVEや過去チェックだけで公開準備完了としない。
- 必須と任意を分離。写真なし設備・任意項目・課金Mock未操作で止まらない。任意スキップ可能。
- 保存/下書き/公開、未配置/配置済み、準備不足を既存語彙で説明し、解決対象画面へ導く。
- Backendのsteward/consumer/Placement等は必要な説明に翻訳し、初見ユーザーへ構造理解を強要しない。
- モバイル390x844、768x1024、1024x768、1440x900、短高画面を確認。管理の複雑操作を機械的にスマホ最優先とせず、どの画面で誰が使うか明示。

EDGE/RECOVERY
期限切れ確認link、再送、使用済みlink、既存emailとの重複、logout・session期限、safe return先、招待受諾・期限切れ、連続submit、保存失敗、画像upload失敗/再試行、0/1/複数Map、Map切替時のdirty guard、権限取消/Map archive後の古いtabを確認。
匿名が管理APIを読めないこと、他Workspace/Map IDに置換してアクセスできないことをHTTPでも確認。guardを緩めて導線を通さない。

代表データ
専用QAアカウント/Workspaceを作り、2 Floor・10 Spot・3 Category・写真あり/なし・任意項目未入力を含める。権利確認済みのサンプル下地を検証用ファイルとして用意し、公式施設地図を模倣したり新しい地図制作機能を作らない。既存Aquarium/Arimatsu等はread-only回帰対象。
主経路は通常UIで投入する。SQL/API直接投入やfake-mail補助で短縮した部分は別試験として明示し、無支援完遂とは扱わない。

既知のProduct制約
Categoryはconsumer Map 0..1かつtenantId+name unique。2枚目のMapで同じ名称（例: 飲食）が必要になるケースを必ず評価する。共有を勝手に解放せず、別名へ誘導して問題を隠さず、他Mapの存在/名称を権限外ユーザーに漏らさない。現行制約・回避策・利用上の負担を記録し、独立同名Categoryが必須なら新規Product Decision候補にする。このWU内でADRやuniqueを変更しない。

AC
01 通常入口からJ1〜J6をテストアカウントで完遂でき、コード参照・URL書換え・DB投入を主経路に要求しない。
02 新規登録、既存Login、招待受諾、複数Workspaceの分岐でアカウント/所属の意図しない重複がない。
03 確認link期限/再送/使用済み/session失効からUIで復旧できる。外部mail未検証は別記。
04 0/1/2+ Mapで次操作と対象が明確。初回Owner付与以外の権限を勝手に増やさない。
05 再訪・中断復旧で保存済み作業を失わず、未保存処理はdirty保護/明示説明がある。
06 J4の10 Spotが配置・プレビュー・公開で保持される。optional photo等を必須にしない。
07 LIVE保存が既存公開snapshotへ漏れず、公開/停止/再公開/rollbackを回帰確認。
08 配布URLを匿名別sessionで開け、QR画像のdecode結果も同じdestination。旧host等なら環境問題として記録・修正。
09 2枚目MapとWorkspace切替で先のデータ/権限/公開を変えない。同名Category制約の評価と説明を残す。
10 Plan & BillingはWU-73への統合に留め、価格/有料機能/自動Trial終了を新設しない。非永続Mockを契約変更と誤認させない。
11 Owner/Map Editor/未割当Member/匿名/別Workspaceの認可をUIとAPIで確認。
12 Keyboard/focus/Escape/通知/主要target/横overflow/短高表示を指定viewportで確認。実touchとemulationは別記。
13 WU-68〜73のconsumer制約/CSV/revision/公開/visitor camera・collision・motionを回帰させない。
14 新規/既存利用者のcritical journeyに未解決P0/P1/P2なし。合理的なP3を回収し、対象外/未実施は明示。
15 tests/typecheck/build/Prisma/既存security gate/Verify/review、Windows candidateとpost-merge QAをexact SHAで確認。
16 WU完了はENGINEERING-ACCEPTED。AIの初見ロールプレイは実利用者UATの証明ではなく、実利用者評価は後続WU-76に分離。

実行方式
実行開始を指示されたら、Asana正本・関連契約取得→通常UI AS-IS→不足のみ修正→tests/review/Verify→Windows fresh inventory/backup/isolated restore確認→candidate deploy→QA/修正反復→blocking AC PASSで通常merge→post-merge Verify→Windows exact merge SHA→証跡→Asana Closeまで自律実行。backupは変更前に取得。main/Production操作禁止。承認済み2 GHSA例外の追加/延長/無断撤去、別repo公開、未指定secret探索は禁止。
最新devに競合する変更が入った場合は統合して全影響gateを再試験。SHAが違う場合、古い固定値へ巻き戻さない。
Hard stop: 新商品判断、契約矛盾、不可逆data loss、安全なmigration/rollback不能、security緩和、未承認credential/外部公開・外部メール/実料金/Productionが必要な場合。既存範囲のテスト失敗・バグは修正継続。
非blocking実機未検証はPASSと書かず、後続試験IDへ引継いでClose可。未知の不具合はクローズ後の事後レビューで新規WU化。

成果物
docs/qa/wu74-self-service-journey/ にAS-IS、journey/state matrix、既存機能対照表、friction台帳、権限/再開/2nd Map検証、before/after、全AC、Windows evidence、最終判定。ログにtoken/password/customer情報を含めない。

Out of Scope
認証/Onboardingの全面再実装、役割追加（Admin/Viewer/Guest）、招待による新しい委任能力、跨Map共有、Category所有契約変更、Layer/Venue/Event、実課金/価格/quota enforcement、Search/Routing、Paper品質、下地制作機能、Productionリリース、営業連絡。

## Parent comments

実行順の正本: WU-73 → WU-74 → WU-75 → WU-76。
前提WU-73: https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219129733130073
次WU-75: https://app.asana.com/1/1217082051589915/project/1217511165231924/task/1219141260184353
Asana標準Dependenciesは現在の契約で設定できないため、親本文とこの参照を実行gateとする。着手時にWU-73の完了証跡と最新dev/Windowsを再確認。今回のロードマップ設計・登録はコード実装開始を意味しない。
WU-74は既存機能の導線統合に限定。新RoleやEvent/保護コピー/実課金は直近ロードマップに追加しない。

## 74-02｜登録・確認メール・招待・中断復旧の改善

74-01の確認済みfrictionだけを改善。Signup/Login/メール確認・再送/期限切れ/招待受諾/既存email/session失効/安全なreturn先を既存contractの範囲で整える。未保存guardと保存済み再開を区別。通常経路にDB編集やホスト手修正を要求しない。fake-mail補助は無支援E2Eと分け、実メール送信・新secret探索は無断で行わない。

## 74-03｜初回Map制作→Preview→公開→再編集の一貫化

2 Floor・10 Spot・3 Categoryの専用合成データで、下地upload→Spot/配置→公開対象→LIVE Preview→公開URL/QR→再訪修正/再公開を通常UIで通す。既存画面に短い次アクションを設ける方式を優先し、独立した巨大Wizardは作らない。任意写真/項目はスキップ可。checklistは実状態に追従。公開URLを匿名別sessionで開き、QR画像もdecode。素材制作の出来とCMS操作を混同しない。

## 74-04｜複数Map・既存権限・Plan Mock連携の回帰

0/1/2+ Map、複数Workspace、Owner/Map Editor/未割当Member/匿名/他Workspaceを確認。既存Map内容・公開版を変えずに切替/2枚目作成できること。WU-73の非永続Mockを初回利用の必須操作にしない。独立同名Categoryがtenant/name uniqueに当たるケースを実測・記録し、共有解放や無断schema変更で隠さない。既存ロールを増設しない。

## 74-05｜Windows E2E・レビュー・merge・工程受入Close

親ACを全件判定。tests/typecheck/build/Prisma/audit/Verify/review→変更前backup/isolated restore確認→Windows candidate QA→修正反復→通常dev merge→post-merge Verify→exact merge SHA反映→再QA→Asana証跡/Close。既存データは隔離fixture以外変更しない。実機未検証とAIシミュレーションは明示。ENGINEERING-ACCEPTEDでありHuman UATはWU-76へ。Production/mainとsecurity例外を変更しない。

## 74-01｜既存導線のAS-IS・状態遷移・差分設計

親WU-74を正本とする。WU-38/63/65/72/73を読んで既存機能と不足を分ける。通常UIでJ1〜J8を試し、入口・新規/既存/招待・0/1/複数Map・中断再訪のstate matrixとfriction台帳を作る。現devとWindowsのexact SHAを固定。既存の認証/Onboarding/プラン機構を再実装しない。成果: AS-IS、状態図、要求→既存実装→変更必要箇所の対照表。
