# 日録 — 正かな・略字対応メモ PWA v0.1

GitHub Pages で配布できる、完全ローカル保存の日記兼メモ PWA です。

## v0.1 の機能

- 一件づつ短文を記録
- 作成日時を自動保存
- 日付別表示
- 前日・翌日・今日へ移動
- 日付選択
- 編集
- 論理削除
- IndexedDB へのローカル保存
- 入力途中の下書きを localStorage に自動保存
- JSON 書出し / 復元
- Storage Persistence の状態確認・要求
- Service Worker によるオフライン利用
- iPhone のホーム画面追加を想定
- 明朝体中心の表示

## 重要

記録データは GitHub に保存されません。
GitHub Pages に置かれるのはアプリのコードだけです。

ブラウザーのローカルストレージは、端末故障・Safari データ削除・PWA 削除等で失はれる可能性があります。
定期的に「設定 → JSONを書き出す」でバックアップしてください。

## GitHub Pages への公開

1. GitHub で新しい repository を作る
2. このフォルダー内のファイルを repository 直下へ置く
3. GitHub の `Settings → Pages`
4. `Deploy from a branch`
5. branch を `main`、folder を `/ (root)` にして保存
6. 表示された GitHub Pages URL を iPhone の Safari で開く
7. 共有 → 「ホーム画面に追加」

## ローカルで確認する場合

Service Worker は `file://` では動かないため、ローカル HTTP サーバーを使ってください。

Python がある場合:

```bash
python -m http.server 8000
```

その後 PC のブラウザーで:

```text
http://localhost:8000
```

## 将来の略字フォント

将来は `fonts/ryakuji.woff2` 等を追加し、保存本文は標準 Unicode のまま、
表示のみ独自グリフへ差替へる設計を想定してゐます。
