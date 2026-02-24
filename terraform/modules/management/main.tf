locals {
  name   = "${var.project}-${var.env}"
  prefix = "/${var.project}/${var.env}"
}

# ─────────────────────────────────────────
# CloudWatch Logs
# ─────────────────────────────────────────

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name}"
  retention_in_days = 30
  tags              = { Name = "${local.name}-ecs-logs" }
}

# ─────────────────────────────────────────
# SSM Parameter Store
# ─────────────────────────────────────────

# DB パスワード（初回は dummy 値。apply 後に AWS コンソール or CLI で更新）
resource "aws_ssm_parameter" "db_password" {
  name        = "${local.prefix}/db_password"
  description = "PostgreSQL パスワード"
  type        = "SecureString"
  value       = "CHANGE_ME_AFTER_FIRST_APPLY"

  tags = { Name = "${local.name}-db-password" }

  lifecycle {
    ignore_changes = [value]  # 手動更新後に Terraform が上書きしないよう保護
  }
}

resource "aws_ssm_parameter" "db_name" {
  name        = "${local.prefix}/db_name"
  description = "PostgreSQL データベース名"
  type        = "String"
  value       = "uma_crown"

  tags = { Name = "${local.name}-db-name" }
}

resource "aws_ssm_parameter" "db_user" {
  name        = "${local.prefix}/db_user"
  description = "PostgreSQL ユーザー名"
  type        = "String"
  value       = "uma_crown"

  tags = { Name = "${local.name}-db-user" }
}

# DATABASE_URL（Prisma 用。パスワードを含むため初回 apply 後に手動で更新）
resource "aws_ssm_parameter" "database_url" {
  name        = "${local.prefix}/database_url"
  description = "Prisma 用 DATABASE_URL（初回 apply 後に実際の値へ更新）"
  type        = "SecureString"
  value       = "CHANGE_ME_AFTER_FIRST_APPLY"

  tags = { Name = "${local.name}-database-url" }

  lifecycle {
    ignore_changes = [value]
  }
}

# CORS_ORIGIN（本番ドメインを許可）
resource "aws_ssm_parameter" "cors_origin" {
  name        = "${local.prefix}/cors_origin"
  description = "CORS 許可オリジン"
  type        = "String"
  value       = "https://${var.domain_name},https://www.${var.domain_name}"

  tags = { Name = "${local.name}-cors-origin" }
}

# Cognito User Pool ID
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name        = "${local.prefix}/cognito_user_pool_id"
  description = "Cognito ユーザープール ID"
  type        = "String"
  value       = var.cognito_user_pool_id

  tags = { Name = "${local.name}-cognito-user-pool-id" }
}

# Cognito App Client ID
resource "aws_ssm_parameter" "cognito_client_id" {
  name        = "${local.prefix}/cognito_client_id"
  description = "Cognito アプリクライアント ID"
  type        = "String"
  value       = var.cognito_client_id

  tags = { Name = "${local.name}-cognito-client-id" }
}
