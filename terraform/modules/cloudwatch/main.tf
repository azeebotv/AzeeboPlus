variable "name" {
  description = "Name prefix for CloudWatch resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "services" {
  description = "List of service names to create alarms for"
  type        = list(string)
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_cloudwatch_log_group" "services" {
  for_each          = toset(var.services)
  name              = "/aws/service/${var.name}/${each.key}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      for idx, service in var.services : {
        type   = "log"
        x      = (idx % 2) * 12
        y      = floor(idx / 2) * 6
        width  = 12
        height = 6
        properties = {
          query   = "SOURCE '/aws/service/${var.name}/${service}' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region  = data.aws_region.current.name
          stacked = false
          view    = "table"
        }
      }
    ]
  })
}

data "aws_region" "current" {}

output "log_group_names" {
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.name }
  description = "Map of service names to log group names"
}
