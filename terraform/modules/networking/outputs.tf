output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "ec2_security_group_id" {
  value = aws_security_group.ec2.id
}

output "eip_id" {
  value = aws_eip.ec2.id
}

output "eip_public_ip" {
  value = aws_eip.ec2.public_ip
}
