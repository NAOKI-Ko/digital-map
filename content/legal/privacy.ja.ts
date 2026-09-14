import { LEGAL_EFFECTIVE_DATE, PRIVACY_VERSION, type LegalDocument } from './config'

export const privacyJa: LegalDocument = {
  title: 'プライバシーポリシー', version: PRIVACY_VERSION, effectiveDate: LEGAL_EFFECTIVE_DATE,
  introduction: '本ポリシーは、本サービスが実際に取り扱う情報と、その目的を説明するプロダクト・法務確認用の初版ドラフトです。',
  sections: [
    { heading: '1. 取り扱う情報', paragraphs: ['アカウントのメールアドレス、表示名、組織名と所属・権限、利用者が登録した地図・Spot・カスタム項目・画像を取り扱います。パスワードそのものは保存せず、ハッシュを保存します。'] },
    { heading: '2. 認証とメール', paragraphs: ['ログイン用セッションCookieを使用します。招待、パスワードリセット、メール確認ではメールアドレスと一回限りのURLを配信します。DBにはトークンのハッシュだけを保存し、メール本文やトークン付きURLを配送履歴・監査ログへ保存しません。'] },
    { heading: '3. セキュリティ・運用ログ', paragraphs: ['安全な運用、障害調査、不正利用防止のため、request ID、処理経路、認可済みの組織・Map識別子、サニタイズ済みエラー情報を記録することがあります。パスワード、Cookie、APIキー、認証トークン、任意のリクエスト本文はログへ記録しません。'] },
    { heading: '4. 公開Analytics', paragraphs: ['公開MapではMAP_VIEWとSPOT_VIEWの日次集計だけを行います。広告追跡、プロファイリング、フィンガープリンティング、永続的な閲覧者ID、IPアドレスの保存、クロスサイトCookieは使用しません。Map viewの軽量な重複抑制にはブラウザのsessionStorageを使用します。'] },
    { heading: '5. 公開情報と委託先', paragraphs: ['公開操作を行うと、公開中・位置設定済みのSpotと公開指定情報、必要な画像が公開Snapshotへ複製されます。メール配送やオブジェクト配信を設定した場合、必要な範囲で配送・ストレージ事業者へ情報を送信します。'] },
    { heading: '6. 保持と削除', paragraphs: ['アカウント・組織・登録コンテンツは提供と安全な運用に必要な期間保持します。未参照Mediaには猶予期間を設けた削除処理があります。公開済みの不変releaseと運用バックアップは、復旧・rollback方針に従い一定期間残る場合があります。'] },
    { heading: '7. 利用者の選択', paragraphs: ['組織の権限管理者は、サービス上でメンバー、公開状態、登録コンテンツを管理できます。法令に基づく開示、訂正、削除等のご相談はページ末尾の連絡先へお願いします。'] },
    { heading: '8. 変更', paragraphs: ['取り扱いが変わる場合は本ポリシーを更新し、版と適用日を示します。'] },
  ],
}
