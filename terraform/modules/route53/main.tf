variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "records" {
  description = "DNS records to create"
  type = list(object({
    name    = string
    type    = string
    records = list(string)
    ttl     = optional(number, 300)
  }))
  default = []
}

variable "health_checks" {
  description = "Health checks to create"
  type = list(object({
    name               = string
    fqdn               = string
    port               = number
    type               = string
    request_interval   = optional(number, 30)
    failure_threshold  = optional(number, 3)
    failure_rate_threshold = optional(number, 1.0)
  }))
  default = []
}

resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "Hosted zone for ${var.domain_name} (${var.environment})"
  tags    = var.tags
}

resource "aws_route53_record" "records" {
  for_each = { for record in var.records : "${record.name}-${record.type}" => record }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = each.value.ttl
  records = each.value.records
}

resource "aws_route53_health_check" "checks" {
  for_each = { for hc in var.health_checks : hc.name => hc }

  fqdn              = each.value.fqdn
  port               = each.value.port
  type               = each.value.type
  request_interval   = each.value.request_interval
  failure_threshold  = each.value.failure_threshold

  tags = merge(var.tags, { Name = each.value.name })
}

output "zone_id" {
  value       = aws_route53_zone.main.zone_id
  description = "Route53 hosted zone ID"
}

output "zone_name_servers" {
  value       = aws_route53_zone.main.name_servers
  description = "Name servers for the hosted zone"
}
