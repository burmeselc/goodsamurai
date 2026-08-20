# KANA6 Web Typewriter v0.1

単一HTMLで動く KANA-6 エディタです。

## 主な機能

- `.k6t` (K6T2) を開く
- 6-bit KANA-6 符号列として編集
- `.k6t` として再保存
- 仮想かなキーボード
- 濁点・半濁点
- 改行
- 見出し開始／終了
- 強調開始／終了
- DARK 表示
- ドラッグ＆ドロップで `.k6t` を開く
- PC / iPhone Safari / Chrome 等で動作
- サーバー不要

## 使い方

`index.html` をブラウザで開くだけです。

GitHub Pages に置く場合も `index.html` 一個で動きます。

## ファイル互換

K6T2:
- magic `K6T2`
- 4-byte big endian sign count
- packed 6-bit KANA-6 stream

KANA6 Typewriter v0.2 の `.k6t` と互換です。

## 注意

Web v0.1 は起動時にホスト側の日本語フォントを一度だけビットマップ化します。
文書本文は Unicode 文字列として保持せず、その後の描画は固定ビットマップ glyph slot から行ひます。

完全に同一字形を全端末で保証したい場合は、次版で 64 glyph のビットマップデータ自体を HTML に埋め込みます。
