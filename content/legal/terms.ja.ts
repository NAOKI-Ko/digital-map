import { LEGAL_EFFECTIVE_DATE, TERMS_VERSION, type LegalDocument } from './config'

export const termsJa: LegalDocument = {
  title: '利用規約', version: TERMS_VERSION, effectiveDate: LEGAL_EFFECTIVE_DATE,
  introduction: 'この利用規約は、Digital Map Platform（以下「本サービス」）の利用条件を定めるプロダクト・法務確認用の初版ドラフトです。',
  sections: [
    { heading: '1. 適用と同意', paragraphs: ['利用者は、本規約とプライバシーポリシーに同意したうえで本サービスを利用します。組織の管理者は、所属利用者に本規約を遵守させる責任を負います。'] },
    { heading: '2. アカウントと権限', paragraphs: ['利用者は正確な登録情報を使用し、認証情報を適切に管理してください。OWNER、Map Editor、Spot担当者には、サービス上で表示される範囲の権限だけが付与されます。'] },
    { heading: '3. 投稿コンテンツ', paragraphs: ['利用者は、地図、Spot情報、画像その他の登録内容について必要な権利を有するものとします。違法、第三者の権利を侵害する、または安全な運用を妨げる内容を登録してはなりません。'] },
    { heading: '4. 公開とバックアップ', paragraphs: ['公開操作により、承認済みの公開対象情報が公開Snapshotとして配信されます。利用者は重要な原資料を自身でも保管してください。本サービスは運用上のバックアップを行いますが、あらゆる状況での完全な復旧を保証するものではありません。'] },
    { heading: '5. 禁止事項', paragraphs: ['不正アクセス、過度な自動アクセス、他組織へのアクセス試行、サービスや第三者に損害を与える利用を禁止します。'] },
    { heading: '6. 変更・停止・免責', paragraphs: ['保守、安全確保、障害その他合理的な理由により、サービスの一部を変更または停止する場合があります。法令上認められない範囲を除き、間接損害や不可抗力による損害について責任を負いません。'] },
    { heading: '7. 規約の変更', paragraphs: ['重要な変更は、適用日と新しい版をサービス上で示します。変更後の利用には、必要に応じて改めて同意を求めます。'] },
    { heading: '8. お問い合わせ', paragraphs: ['本規約に関するお問い合わせは、ページ末尾の連絡先へお願いします。'] },
  ],
}
