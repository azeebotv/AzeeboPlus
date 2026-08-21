variable "name" {
  description = "Name prefix for secrets"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "secrets" {
  description = "Secrets to create"
  type = list(object({
    name        = string
    description = string
    value       = string
    kms_key_arn = optional(string)
  }))
  sensitive = true
}

variable "recovery_window_in_days" {
  description = "Recovery window in days (0 for immediate deletion)"
  type        = number
  default     = 30
}

variable "rotation_lambda_arn" {
  description = "ARN of the Lambda function for rotation"
  type        = string
  default     = ""
}

variable "rotation_rules" {
  description = "Rotation rules"
  type = list(object({
    secret_name             = string
    automatically_after_days = number
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_secretsmanager_secret" "secrets" {
  for_each = { for secret in var.secrets : secret.name => secret }

  name        = "${var.name}-${var.environment}-${each.value.name}"
  description = each.value.description
  kms_key_id  = each.value.kms_key_arn

  recovery_window_in_days = var.recovery_window_in_days
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each = { for secret in var.secrets : secret.name => secret }

  secret_id = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = jsonencode({
    username = each.value.name
    password = each.value.value
  })
}

resource "aws_secretsmanager_secret_rotation" "rotation" {
  for_each = { for rule in var.rotation_rules : rule.secret_name => rule }

  secret_id           = aws_secretsmanager_secret.secrets[each.key].id
  rotation_lambda_arn = var.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = each.value.automatically_after_days
  }
}

output "secret_arns" {
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.arn }
  description = "Map of secret names to ARNs"
}

output "secret_ids" {
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.id }
  description = "Map of secret names to IDs"
}
