variable "project" { type = string }
variable "env" { type = string }
variable "github_repo" {
  description = "GitHub リポジトリ（owner/repo 形式）"
  type        = string
}
variable "ecr_arn" { type = string }
variable "ecs_cluster" { type = string }
variable "ecs_service" { type = string }
