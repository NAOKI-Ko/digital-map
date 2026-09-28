export function mapVisibilityLabel(isPublished: boolean) {
  return isPublished ? '公開中' : '非公開'
}

export function releaseSourceLabel(isPublished: boolean) {
  return isPublished ? '公開中の内容' : '前回公開した内容'
}

export function paperSourceLabel(mode: 'LIVE' | 'PUBLISHED', isPublished: boolean) {
  return mode === 'LIVE' ? '編集中の内容' : releaseSourceLabel(isPublished)
}

export function paperSourceExplanation(mode: 'LIVE' | 'PUBLISHED', isPublished: boolean) {
  if (mode === 'LIVE') return '編集中の情報を使います。公開中の内容とは異なる場合があります。'
  return isPublished
    ? '今、閲覧者に表示されている内容を使います。'
    : '現在マップは非公開です。以前公開した内容を紙面に使います。'
}
