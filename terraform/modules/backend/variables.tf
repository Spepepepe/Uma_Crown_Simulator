variable "project" { type = string }
variable "env" { type = string }
variable "region" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "instance_type" { type = string }
variable "ebs_volume_size" { type = number }
variable "log_group_name" { type = string }
variable "eip_id" {
  description = "networking モジュールで作成した EIP の allocation ID"
  type        = string
}

# SSM ARN 群（ECS タスク定義の secrets ブロックで参照）
variable "db_password_arn" { type = string }
variable "db_name_arn" { type = string }
variable "db_user_arn" { type = string }
variable "database_url_arn" { type = string }
variable "cors_origin_arn" { type = string }
variable "cognito_user_pool_id_arn" { type = string }
variable "cognito_client_id_arn" { type = string }
