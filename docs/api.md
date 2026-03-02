# API エンドポイント

ベースパス: `/api/v1`

## 認証 (`/auth/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/auth/me` | 必要 | 認証済みユーザーデータ取得 |

> ログイン・ユーザー登録・パスワードリセットは Amazon Cognito SDK をフロントエンドから直接呼び出すため、バックエンド API は存在しません。

## ウマ娘 (`/umamusumes/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/umamusumes` | 不要 | 全ウマ娘一覧 |
| GET | `/umamusumes/unregistered` | 必要 | 未登録ウマ娘一覧 |
| GET | `/umamusumes/registered` | 必要 | 登録済みウマ娘一覧 |
| POST | `/umamusumes/registrations` | 必要 | ウマ娘登録 + 初期レース登録 |

## レース (`/races/`)

| Method | Path | 認証 | 概要 |
|--------|------|------|------|
| GET | `/races` | 不要 | レース一覧（`?state=`・`?distance=` フィルタ対応） |
| GET | `/races/registration-targets` | 必要 | 登録用レース一覧（G1〜G3） |
| GET | `/races/remaining` | 必要 | 全ウマ娘の残レース集計 |
| GET | `/races/remaining/search` | 必要 | 指定ウマ娘・月の残レース取得 |
| GET | `/races/patterns/:umamusumeId` | 必要 | 育成パターン候補一覧 |
| POST | `/races/run` | 必要 | レース出走登録（単発） |
| POST | `/races/results` | 必要 | レース結果登録（1件） |
| POST | `/races/results/batch` | 必要 | レース結果一括登録 |

### `GET /races/remaining/search` クエリパラメータ

| パラメータ | 型 | 概要 |
|-----------|-----|------|
| `umamusumeId` | number | 対象ウマ娘 ID |
| `season` | number | 時期（1=ジュニア / 2=クラシック / 3=シニア） |
| `month` | number | 月（1〜12） |
| `half` | boolean | 後半フラグ（`"true"` / `"false"`） |

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

> ログイン・ユーザー登録・パスワードリセットは `AuthService` が Cognito SDK を直接呼び出すため、バックエンド API を経由しません。
