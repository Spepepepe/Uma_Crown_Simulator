variable "project" { type = string }
variable "env" { type = string }
variable "backend_origin" {
  description = "バックエンド origin のホスト名"
  type        = string
}

variable "certificate_arn" {
  description = "ACM 証明書 ARN（us-east-1）"
  type        = string
}

variable "domain_name" {
  description = "サイトのドメイン名"
  type        = string
}
