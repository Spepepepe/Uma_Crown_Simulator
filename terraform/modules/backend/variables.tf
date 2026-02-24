variable "project" { type = string }
variable "env" { type = string }
variable "region" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "instance_type" { type = string }
variable "ebs_volume_size" { type = number }
variable "log_group_name" { type = string }
variable "db_password_arn" { type = string }
variable "db_name" { type = string }
variable "db_user" { type = string }
variable "cognito_user_pool_id" { type = string }
variable "cognito_client_id" { type = string }
variable "eip_id" {
  description = "networking モジュールで作成した EIP の allocation ID"
  type        = string
}
