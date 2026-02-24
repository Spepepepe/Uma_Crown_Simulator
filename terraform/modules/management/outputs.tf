output "ecs_log_group_name" {
  value = aws_cloudwatch_log_group.ecs.name
}

# DB 系 ARN（ECS secrets ブロックで参照）
output "db_password_arn" {
  value = aws_ssm_parameter.db_password.arn
}

output "db_name_arn" {
  value = aws_ssm_parameter.db_name.arn
}

output "db_user_arn" {
  value = aws_ssm_parameter.db_user.arn
}

# 新規追加パラメータ ARN
output "database_url_arn" {
  value = aws_ssm_parameter.database_url.arn
}

output "cors_origin_arn" {
  value = aws_ssm_parameter.cors_origin.arn
}

output "cognito_user_pool_id_arn" {
  value = aws_ssm_parameter.cognito_user_pool_id.arn
}

output "cognito_client_id_arn" {
  value = aws_ssm_parameter.cognito_client_id.arn
}
