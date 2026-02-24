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
