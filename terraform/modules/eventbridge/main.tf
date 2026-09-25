variable "name" {
  description = "Name prefix for EventBridge resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ecs_cluster_arn" {
  description = "ECS cluster ARN for task targets"
  type        = string
}

variable "subnets" {
  description = "Subnet IDs for network configuration"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "rules" {
  description = "EventBridge rules"
  type = list(object({
    name          = string
    description   = string
    event_pattern = string
    target_arn    = string
    enabled       = optional(bool, true)
  }))
  default = []
}

resource "aws_cloudwatch_event_bus" "main" {
  name = "${var.name}-${var.environment}"
  tags = var.tags
}

resource "aws_cloudwatch_event_rule" "rules" {
  for_each = { for rule in var.rules : rule.name => rule }

  name           = each.value.name
  description    = each.value.description
  event_bus_name = aws_cloudwatch_event_bus.main.name
  event_pattern  = each.value.event_pattern
  state          = each.value.enabled ? "ENABLED" : "DISABLED"
}

resource "aws_cloudwatch_event_target" "targets" {
  for_each = { for rule in var.rules : rule.name => rule }

  rule           = aws_cloudwatch_event_rule.rules[each.key].name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = each.value.target_arn

  ecs_target {
    task_count          = 1
    launch_type         = "FARGATE"
    task_definition_arn = each.value.target_arn

    network_configuration {
      subnets          = var.subnets
      security_groups  = var.security_group_ids
      assign_public_ip = false
    }
  }
}

output "event_bus_name" {
  value       = aws_cloudwatch_event_bus.main.name
  description = "EventBridge bus name"
}

output "event_bus_arn" {
  value       = aws_cloudwatch_event_bus.main.arn
  description = "EventBridge bus ARN"
}
