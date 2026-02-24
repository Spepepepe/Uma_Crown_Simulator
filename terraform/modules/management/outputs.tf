output "ecs_log_group_name" {
  value = aws_cloudwatch_log_group.ecs.name
}

output "db_password_arn" {
  value = aws_ssm_parameter.db_password.arn
}

output "db_name_value" {
  value = aws_ssm_parameter.db_name.value
}

output "db_user_value" {
  value = aws_ssm_parameter.db_user.value
}
