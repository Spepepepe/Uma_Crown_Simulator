terraform {
  backend "s3" {
    bucket  = "uma-crown-tfstate"
    key     = "prod/terraform.tfstate"
    region  = "ap-northeast-1"
    encrypt = true
  }
}
