output "cloudfront_domain" {
  description = "CloudFront のドメイン名"
  value       = module.frontend.cloudfront_domain_name
}

output "site_url" {
  description = "サイト URL"
  value       = "https://${var.domain_name}"
}

output "ecr_repository_url" {
  description = "ECR リポジトリ URL（docker push 先）"
  value       = module.backend.ecr_repository_url
}

output "ec2_public_ip" {
  description = "EC2 の Elastic IP"
  value       = module.networking.eip_public_ip
}

output "cognito_user_pool_id" {
  description = "Cognito ユーザープール ID（フロントエンド設定用）"
  value       = module.auth.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito アプリクライアント ID（フロントエンド設定用）"
  value       = module.auth.client_id
}

output "github_actions_role_arn" {
  description = "GitHub Actions が assume する IAM ロール ARN"
  value       = module.cicd.github_actions_role_arn
}
