# Uma Crown Simulator - 開発環境操作

---

## ローカルデプロイ（k8s）

```bash
bash k8s/deploy.sh
```

アクセス URL: `http://localhost:30080`

### 内部処理の流れ

1. **Docker ビルド**
   - `backend/Dockerfile --target prod`（NestJS + Prisma）
   - `frontend/Dockerfile --target prod`（Angular + nginx）
     - `environment.development.ts` から `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` を読み取り
       `--build-arg` で渡して `environment.ts` に注入してビルド

2. **k8s マニフェスト適用順**
   ```
   namespace.yaml           → uma-crown Namespace
   configmap.yaml           → backend-config（NODE_ENV, PORT, CORS_ORIGIN）
   secret.yaml              → backend-secret（DB認証情報・Cognito認証情報）
   postgres-deployment.yaml → PVC + Deployment + Service
   backend-deployment.yaml  → Deployment + Service（envFrom: configmap + secret）
   frontend-deployment.yaml → Deployment + NodePort Service（:30080）
   ingress.yaml             → Ingress（任意）
   ```

3. **Pod 再起動・待機**
   - `imagePullPolicy: Never` のためマニフェスト変更がなくても毎回 `rollout restart` が必要

---

## 動作確認コマンド

### 全リソース確認

```bash
kubectl get all -n uma-crown
```

### Pod の状態確認

```bash
kubectl get pods -n uma-crown
```

### ログ確認

```bash
# バックエンドログ
kubectl logs -n uma-crown deploy/backend

# フロントエンドログ
kubectl logs -n uma-crown deploy/frontend

# リアルタイムで流す
kubectl logs -n uma-crown deploy/backend -f
```

### Pod に入る（デバッグ）

```bash
kubectl exec -it -n uma-crown deploy/backend -- sh
kubectl exec -it -n uma-crown deploy/frontend -- sh
```

### Pod 再起動

```bash
kubectl rollout restart deployment/backend -n uma-crown
kubectl rollout restart deployment/frontend -n uma-crown
```

### デプロイ状態の待機確認

```bash
kubectl rollout status deployment/backend -n uma-crown --timeout=120s
kubectl rollout status deployment/frontend -n uma-crown --timeout=120s
```

---

## 環境の削除・リセット

```bash
bash k8s/teardown.sh
```

---

## Cognito 設定（ローカル環境）

`frontend/src/app/environments/environment.development.ts` に記載。
デプロイスクリプトがここから値を読み取り `--build-arg` で Docker に渡す。

---

## フロントエンド単体開発（k8s なし）

```bash
cd frontend
npm install
npm start
```

アクセス URL: `http://localhost:4200`
