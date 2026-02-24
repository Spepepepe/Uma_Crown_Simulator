#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────
# ECS クラスター設定
# ─────────────────────────────────────────
echo "ECS_CLUSTER=${cluster_name}" >> /etc/ecs/ecs.config
echo "ECS_ENABLE_TASK_IAM_ROLE=true" >> /etc/ecs/ecs.config

# ─────────────────────────────────────────
# EBS マウント（PostgreSQL データ）
# ─────────────────────────────────────────
# デバイスが存在するまで待機
for i in $(seq 1 30); do
  if [ -b /dev/xvdf ] || [ -b /dev/nvme1n1 ]; then
    break
  fi
  sleep 2
done

# nvme の場合のデバイス名を検出
DEVICE="/dev/xvdf"
if [ -b /dev/nvme1n1 ]; then
  DEVICE="/dev/nvme1n1"
fi

# 未フォーマットの場合のみフォーマット
if ! blkid "$DEVICE" &>/dev/null; then
  mkfs.xfs "$DEVICE"
fi

mkdir -p /data/postgres
mount "$DEVICE" /data/postgres

# 永続マウント設定
UUID=$(blkid -s UUID -o value "$DEVICE")
echo "UUID=$UUID /data/postgres xfs defaults,nofail 0 2" >> /etc/fstab

# ─────────────────────────────────────────
# PostgreSQL コンテナ起動
# ─────────────────────────────────────────
# SSM から DB パスワードを取得
DB_PASSWORD=$(aws ssm get-parameter \
  --name "${db_password_key}" \
  --with-decryption \
  --query Parameter.Value \
  --output text \
  --region ${region})

docker run -d \
  --name postgres \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="${db_name}" \
  -e POSTGRES_USER="${db_user}" \
  -v /data/postgres:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# PostgreSQL の起動を待機
for i in $(seq 1 30); do
  if docker exec postgres pg_isready -U ${db_user} &>/dev/null; then
    break
  fi
  sleep 2
done
