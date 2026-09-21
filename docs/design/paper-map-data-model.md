# Paper Map v1 data model

## PaperMap

`Map 1:N PaperMap`。nameと`configVersion=1`を列で持ち、presentation設定はversioned JSONとする。`createdById`はnullable User FK (`SetNull`)。Map削除時はcascadeするが、Spot/Category削除ではPaperMapを削除しない。

Configはshared Zod schemaでのみparseし、`parsePaperMapConfig(version, json)`を境界とする。unknown future versionはread/update/renderで安全に拒否し、raw castを散在させない。

## PaperDesignRequest

Mapに属し、PaperMapは任意参照。requester User削除時は履歴を保持するためrequired requester IDは文字列として保持し、related PaperMap削除時は`SetNull`。statusはv1で`REQUESTED`を生成し、将来のCONTACTED/IN_PROGRESS/DELIVERED/CANCELLEDをenumで予約する。要件はbounded JSON schemaで検証する。

## Reference integrity

create/update/PDFでCategoryが同一Map/Tenant、SpotがFloor経由で同一Map/Tenantであることを一括queryで検証する。stale IDはread時warning、save時は明示draftに従う。cross-Tenant IDは404/400で拒否する。

## Migration

追加table/enum/index/FKのみ。既存ownership、PublicRelease immutability、Tenant-Map invariantへ変更を加えない。fresh DBとcurrent dev schemaからのupgradeを使い捨てDBで検証する。rollbackは旧appが追加tableを無視するapplication rollbackを基本とする。

