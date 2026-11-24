# CloudFront CDN Module for Azeebo+
# Creates CloudFront distribution for content delivery

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "azeebo"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the distribution"
  type        = string
}

variable "origin_domain_name" {
  description = "Origin domain name (S3 bucket or ALB)"
  type        = string
}

variable "origin_protocol_policy" {
  description = "Origin protocol policy (http-only, https-only, match-viewer)"
  type        = string
  default     = "https-only"
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "aliases" {
  description = "Additional CNAMEs for the distribution"
  type        = list(string)
  default     = []
}

variable "viewer_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "price_class" {
  description = "Price class (PriceClass_100, PriceClass_200, PriceClass_All)"
  type        = string
  default     = "PriceClass_All"
}

variable "web_acl_id" {
  description = "WAF Web ACL ID for the distribution"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

locals {
  name = "${var.project_name}-${var.environment}"

  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "cdn"
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${local.name}-oac"
  description                       = "OAC for ${local.name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = var.default_root_object
  aliases             = var.aliases
  price_class         = var.price_class
  web_acl_id          = var.web_acl_id != "" ? var.web_acl_id : null

  # Origin configuration
  origin {
    domain_name              = var.origin_domain_name
    origin_id                = "${local.name}-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.name}-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.name}-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # Cache behavior for images
  ordered_cache_behavior {
    path_pattern     = "/images/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.name}-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  # Cache behavior for API (no caching)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.name}-origin"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Accept"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Custom error responses
  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500.html"
    error_caching_min_ttl = 5
  }

  # SSL certificate
  viewer_certificate {
    acm_certificate_arn      = var.viewer_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Geographic restrictions (required block; no restrictions by default)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = "${var.project_name}-${var.environment}-logs.s3.amazonaws.com"
    prefix          = "cloudfront/"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-cloudfront"
  })
}

# Outputs
output "distribution_id" {
  description = "The ID of the distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "The ARN of the distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "domain_name" {
  description = "The domain name of the distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "hosted_zone_id" {
  description = "The hosted zone ID of the distribution"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "status" {
  description = "The current status of the distribution"
  value       = aws_cloudfront_distribution.main.status
}
