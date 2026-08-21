variable "domain_name" {
  description = "Domain name for the ACM certificate"
  type        = string
}

variable "subject_alternative_names" {
  description = "Subject alternative names for the certificate"
  type        = list(string)
  default     = []
}

variable "validation_method" {
  description = "Validation method (DNS or EMAIL)"
  type        = string
  default     = "DNS"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = length(var.subject_alternative_names) > 0 ? var.subject_alternative_names : null
  validation_method         = var.validation_method

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "validation" {
  count   = var.validation_method == "DNS" && var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = tolist(aws_acm_certificate.main.domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.main.domain_validation_options)[0].resource_record_type
  records = [tolist(aws_acm_certificate.main.domain_validation_options)[0].resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "main" {
  count                   = var.validation_method == "DNS" && var.route53_zone_id != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [aws_route53_record.validation[0].fqdn]
}

output "certificate_arn" {
  value       = aws_acm_certificate.main.arn
  description = "ARN of the ACM certificate"
}

output "certificate_status" {
  value       = aws_acm_certificate.main.status
  description = "Status of the certificate"
}
