# Reading Log

iPhone向けの個人用読書ログMVPです。

## 主な機能
- 文献登録
- カテゴリ・タグ
- 読書開始 / 終了
- 開始日時・終了日時・所要時間の自動記録
- ページ進捗
- MEMO / QUOTE / TODO
- 文献・著者・タグ・メモ横断検索
- JSON完全バックアップ
- CSV書き出し
- Markdown書き出し
- JSON復元
- localStorage保存
- PWA用manifest / Service Worker

## iPhoneで使う
PWAとしてホーム画面に追加する場合、HTTP(S)経由で配置してください。
GitHub Pages、Cloudflare Pages、Netlifyなどの静的ホスティングにこのフォルダを置けば動きます。

SafariでURLを開く → 共有 → 「ホーム画面に追加」。

## 注意
localStorageはそのブラウザ/サイト単位の保存です。
定期的にJSONバックアップを書き出してください。
