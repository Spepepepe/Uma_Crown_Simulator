#!/bin/bash
# terraform apply 前に一度だけ実行する
# tfstate 用 S3 バケットを手動作成（Terraform 管理外）

set -euo pipefail

BUCKET_NAME="uma-crown-tfstate"
REGION="ap-northeast-1"

echo "tfstate 用 S3 バケットを作成します: $BUCKET_NAME"

aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

# バージョニング有効化（state ファイルの履歴保持）
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

# 暗号化有効化
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# パブリックアクセスブロック
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "完了: s3://$BUCKET_NAME"
