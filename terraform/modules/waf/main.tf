variable "name" {
  description = "Name prefix for WAF resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN to associate with WAF"
  type        = string
}

variable "ip_rate_limit" {
  description = "IP rate limit per 5-minute window"
  type        = number
  default     = 2000
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_wafv2_web_acl" "main" {
  name        = "${var.name}-${var.environment}"
  description = "WAF ACL for ${var.name} (${var.environment})"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.ip_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.name}-rate-limit"
      sampled_requests_enabled  = true
    }
  }

  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "aws-managed-common"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.name}-common-rules"
      sampled_requests_enabled  = true
    }
  }

  # AWS Managed Rules - SQL Injection
  rule {
    name     = "aws-managed-sqli"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.name}-sqli-rules"
      sampled_requests_enabled  = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "aws-managed-bad-inputs"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.name}-bad-inputs"
      sampled_requests_enabled  = true
    }
  }

  # Geographic restriction
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "geo-block"
      priority = 5

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name               = "${var.name}-geo-block"
        sampled_requests_enabled  = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${var.name}-waf"
    sampled_requests_enabled  = true
  }

  tags = var.tags
}

resource "aws_wafv2_web_acl_association" "cloudfront" {
  resource_arn = var.cloudfront_distribution_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

output "web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "WAF Web ACL ARN"
}

output "web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "WAF Web ACL ID"
}
