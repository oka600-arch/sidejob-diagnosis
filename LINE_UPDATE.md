# LINE友だち追加オプション更新

この版では、LINE Loginの認可URLに `bot_prompt=normal` を追加しています。

LINE LoginチャンネルにリンクしたLINE公式アカウントを、LINE Loginの同意画面で友だち追加できるようにする設定です。

## 変更点
- `server.js` の `/auth/line` に `bot_prompt=normal` を追加
- LINE LoginとLINE公式アカウントのリンク設定はLINE Developers側で完了済みであることが前提

## 注意
- LINE Messaging APIのChannel secretは秘密情報です。スクリーンショットや公開リポジトリに載せないでください。
- 今回の版ではChannel secret自体はコードに記載していません。Renderの環境変数から読み込みます。


## 診断後のLINE自動メッセージ
LINEログイン完了後、設定した `LINE_MESSAGING_ACCESS_TOKEN` がある場合は、Messaging APIのプッシュメッセージで診断結果ページへの案内を自動送信します。LINE公式アカウントを友だち追加しているユーザーが対象です。

RenderのEnvironmentに `LINE_MESSAGING_ACCESS_TOKEN` を追加してください。トークンはチャットに貼らず、Renderへ直接入力してください。
