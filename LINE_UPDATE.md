# LINE友だち追加オプション更新

この版では、LINE Loginの認可URLに `bot_prompt=normal` を追加しています。

LINE LoginチャンネルにリンクしたLINE公式アカウントを、LINE Loginの同意画面で友だち追加できるようにする設定です。

## 変更点
- `server.js` の `/auth/line` に `bot_prompt=normal` を追加
- LINE LoginとLINE公式アカウントのリンク設定はLINE Developers側で完了済みであることが前提

## 注意
- LINE Messaging APIのChannel secretは秘密情報です。スクリーンショットや公開リポジトリに載せないでください。
- 今回の版ではChannel secret自体はコードに記載していません。Renderの環境変数から読み込みます。
