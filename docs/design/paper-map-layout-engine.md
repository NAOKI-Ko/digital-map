# Paper Map v1 shared layout engine

`resolvePaperLayout(config, contentMetrics)` をpure functionとし、PreviewとPDFが同じpage/header/map/source-image/legend/QR/logo/card rectanglesとwarningsを消費する。座標単位は300 DPI pixel geometry、Previewは同比率でCSS scaleする。

## Contain and viewport

`resolveContainedRect(sourceWidth, sourceHeight, frameRect)` はletterbox後の実画像rectを返す。SpotとDecorationは必ずこのrectへ投影する。

```text
paperX = sourceImageRect.x + viewportRelativeX * sourceImageRect.width
paperY = sourceImageRect.y + viewportRelativeY * sourceImageRect.height
```

custom viewportでは `(point - viewport origin) / viewport size` を先に計算する。frame外はclipする。Spot、Decoration、backgroundで別々の計算を持たない。

## Layout semantics

- MAP_FOCUS: map 75%前後、compact legend。
- GUIDE: map 60%前後、読みやすい情報list。
- PHOTO_GUIDE: map 50%前後、写真/情報cards。写真不足時はblank placeholderを作らず通常cardへ縮退。
- `mapSize` は割合sliderではなく、上記比率へのsemantic modifier。

Paper physical sizesはA4/A3のpointと300 DPI pixelを固定する。overflow legendは追加pageへ送る。rendererはJapanese-capable SVG text、Sharp image composition、pdf-lib page assembly、qrcodeを再利用する。

## Correctness matrix

同一/wide/tall source、A4 portrait、A3 landscape、full/fit/custom viewport、0/0・0.5/0.5・1/1、Decoration一致、finite/clampをunit testする。従来rendererのouter frameへのPIN投影は明示的なregression testで失敗条件を固定する。

