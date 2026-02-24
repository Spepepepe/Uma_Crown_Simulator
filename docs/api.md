# API エンドポイント

ベースパス: `/api/v1`

## 認証 (`/auth/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| POST | `/auth/login` | 不要 | ログイン |
| POST | `/auth/signup` | 不要 | ユーザー登録 |

## ウマ娘 (`/umamusumes/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/umamusumes` | 必要 | 全ウマ娘一覧 |
| GET | `/umamusumes/unregistered` | 必要 | 未登録ウマ娘一覧 |
| GET | `/umamusumes/registered` | 必要 | 登録済みウマ娘一覧 |
| POST | `/umamusumes/registrations` | 必要 | ウマ娘登録 + 初期レース登録 |

## レース (`/races/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/races` | 不要 | レース一覧（フィルタ対応） |
| GET | `/races/registration-targets` | 必要 | 登録用レース一覧 |
| GET | `/races/remaining` | 必要 | 全ウマ娘の残レース集計 |
| GET | `/races/remaining/:id/:season/:month/:half` | 必要 | 月別残レース取得 |
| POST | `/races/run` | 必要 | レース出走登録 |
| POST | `/races/pattern/:id` | 必要 | パターン一括登録 |

## ヘルスチェック

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/health` | 不要 | ECS ヘルスチェック用 |

## 認証フロー

認証が必要なエンドポイントは、リクエストヘッダに Cognito 発行の ID トークンを付与します。

```
Authorization: Bearer <cognito-id-token>
```

フロントエンドの `AuthInterceptor` が全リクエストに自動付与します。
バックエンドは Cognito の公開鍵で JWT を検証し、`sub`（ユーザー ID）を抽出します。
