# スマホ実機テスト公開手順（Render）

## 目的
このプロジェクトを無料のRender Web Serviceで一時公開し、iPhoneのSafariから17問診断→結果まで実機確認する。

## 1. GitHub
1. GitHubにログイン
2. New repository
3. Repository name: sidejob-diagnosis-test
4. Publicを選択（テスト用。機密情報は絶対に入れない）
5. このフォルダの中身をアップロードしてCommit

## 2. Render
1. https://render.com/ を開く
2. GitHubでSign up / Log in
3. New → Web Service
4. sidejob-diagnosis-testを選択
5. Runtime: Node
6. Build Command: npm install
7. Start Command: npm start
8. Plan: Free
9. Create Web Service

## 3. 公開URL
デプロイ完了後、Renderが `https://xxxxx.onrender.com` のURLを発行する。

## 4. スマホ確認
iPhone Safariで公開URLを開く。

確認項目:
- TOP表示
- 17問回答
- 戻る
- 進捗バー
- 回答保持
- 診断完了
- 結果ロック
- 開発用LINE確認を使わず、LINE未設定時の表示が適切か

## 5. LINE本番確認
LINE Loginを実際に確認するには、RenderのEnvironment Variablesに以下を設定する。
- PUBLIC_URL=https://xxxxx.onrender.com
- LINE_CHANNEL_ID=LINE DevelopersのChannel ID
- LINE_CHANNEL_SECRET=LINE DevelopersのChannel Secret
- LINE_REDIRECT_URI=https://xxxxx.onrender.com/auth/line/callback
- ADMIN_TOKEN=強いランダム文字列

LINE Developers側のCallback URLにも同じRedirect URIを登録する。

## 6. 画面をStatic Siteで配信する（黒い起動画面を出さない）
画面（public/）はスリープしない無料Static Siteで配信し、診断処理だけ今のWeb Service（https://sidejob-diagnosis-5.onrender.com）に残す。
画面を開いた瞬間にAPIの起動を始め、「診断をはじめる」を押したときにまだ起動中なら「診断を準備しています…」と表示して待つ。

1. Render → New → Static Site → このリポジトリを選択
2. Build Command: `node scripts/build-static.js`
3. Publish Directory: `dist`
4. Environment Variables: `API_BASE=https://sidejob-diagnosis-5.onrender.com`
5. Create Static Site → 発行されたURL（例 `https://sidejob-diagnosis-front.onrender.com`）を控える
6. 既存のWeb ServiceのEnvironmentに `FRONTEND_URL=<Static SiteのURL>` を追加して保存（CORS許可とLINEログイン後の戻り先に使う）
7. 今後お客さんに案内するのはStatic SiteのURL。LINE_REDIRECT_URIとLINE DevelopersのCallback URLはWeb ServiceのURLのままでよい

`FRONTEND_URL` 以外のドメイン（独自ドメインなど）からも使う場合は `ALLOWED_ORIGINS` にカンマ区切りで追加する。

## 注意
- Free Web Serviceは15分アクセスがないと停止し、次回アクセス時の起動に約1分かかる場合がある。
- ローカルJSONストレージはFree Web Serviceの再起動・再デプロイで永続保証されない。テスト用途として使い、本番ではPostgreSQL等へ移行する。
- LINEのChannel Secret等はGitHubへ絶対にアップロードしない。
