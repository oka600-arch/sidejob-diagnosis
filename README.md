# 副業適性診断システム MVP+

## 実装範囲
- RIASEC 15問 + 副業条件5問
- スマホファースト、1問1画面、戻る、回答保持、進捗バー
- RIASEC 70% + 条件30% の副業推薦TOP5
- メイン/サブタイプ、タイプカラー、結果ロック
- LINE Login OAuth（環境変数設定後）
- 永続JSONストア（開発用）
- SNSシェア文章、Web Share、1080x1350 SVGシェア画像
- イベント分析API
- 管理者向けKPIダッシュボード `/admin.html`
- 広告マスタAPI（ON/OFF・優先度）
- エラーコード/ログ

## 起動
Node.js 18+ で:
```bash
npm start
```
`http://localhost:3000`

管理画面: `http://localhost:3000/admin.html`

## 本番前に必須
1. `NODE_ENV=production`
2. 強固な `ADMIN_TOKEN` を設定
3. LINE_CHANNEL_ID / LINE_CHANNEL_SECRET / LINE_REDIRECT_URI / PUBLIC_URL を設定
4. JSONストアをPostgreSQL等へ移行
5. 開発用LINE確認エンドポイントが本番で無効になっていることを確認
6. HTTPS、Cookie/セッション、レート制限、CSRF対策、監査ログを本番構成に追加
7. AdSense等の広告審査・広告ID設定

## エラー時
画面にエラーコードが表示されます。コードとスクショを開発者へ共有してください。
- DIAG-001: 診断セッションなし
- DIAG-003: 不正/未回答
- DIAG-004: スコア計算
- DIAG-005: 予期せぬサーバーエラー
- DIAG-008: 結果取得
- LINE-001: LINE連携
- LINE-002: LINE認証確認
- AD-001/002: 広告
- AUTH-001: 管理者認証
