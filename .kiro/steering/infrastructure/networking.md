# Azeebo+ Networking Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines networking standards for Azeebo+ including VPC, DNS, load balancing, and security.

---

## Network Architecture

### VPC Design

```
us-east-1 (Primary)
├── Public Subnets (2)
│   ├── 10.0.1.0/24
│   └── 10.0.2.0/24
│
├── Private Subnets (2)
│   ├── 10.0.10.0/24
│   └── 10.0.11.0/24
│
├── Database Subnets (2)
│   ├── 10.0.20.0/24
│   └── 10.0.21.0/24
│
└── Elasticache Subnets (2)
    ├── 10.0.30.0/24
    └── 10.0.31.0/24
```

### CIDR Blocks

| Environment | VPC CIDR | Subnet CIDRs |
|-------------|----------|--------------|
| Development | 10.0.0.0/16 | /24 |
| Staging | 10.1.0.0/16 | /24 |
| Production | 10.2.0.0/16 | /24 |

---

## DNS Standards

### Domain Structure

```
azeebo.plus (Primary domain)
├── api.azeebo.plus (API Gateway)
├── app.azeebo.plus (Web App)
├── admin.azeebo.plus (Admin Panel)
├── creator.azeebo.plus (Creator Portal)
├── cdn.azeebo.plus (CDN)
└── media.azeebo.plus (Media Storage)
```

### DNS Records

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | api.azeebo.plus | ALB DNS | 60s |
| A | app.azeebo.plus | CloudFront | 60s |
| CNAME | cdn.azeebo.plus | CloudFront | 60s |
| MX | azeebo.plus | Mail servers | 3600s |
| TXT | azeebo.plus | SPF/DKIM | 3600s |
| NS | azeebo.plus | Route53 NS | 172800s |

---

## Load Balancing

### Application Load Balancer

```hcl
# ✅ Good - ALB Configuration
resource "aws_lb" "api" {
  name               = "azeebo-plus-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  enable_deletion_protection = true
  enable_http2              = true

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_target_group" "api" {
  name     = "azeebo-plus-api-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    port                = "3000"
    healthy_threshold   = 2
    unhealthy_threshold = 10
    timeout             = 5
    interval            = 30
  }

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

### Network Load Balancer

```hcl
# ✅ Good - NLB Configuration
resource "aws_lb" "internal" {
  name               = "azeebo-plus-internal-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  enable_deletion_protection = true

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## Security Groups

### Security Group Rules

```hcl
# ✅ Good - Security Group
resource "aws_security_group" "alb" {
  name        = "azeebo-plus-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description = "HTTP to backend"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_security_group" "backend" {
  name        = "azeebo-plus-backend-sg"
  description = "Security group for backend services"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from ALB"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## CDN Configuration

### CloudFront Distribution

```hcl
# ✅ Good - CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "s3-media"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = ""

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-media"

    forwarded_values {
      query_string = false
      headers      = []

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## VPN & Direct Connect

### VPN Configuration

```hcl
# ✅ Good - VPN Configuration
resource "aws_vpn_connection" "main" {
  customer_gateway_id = aws_customer_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = true
  vpc_id              = aws_vpc.main.id

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_vpn_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## API Gateway Network

### Private API Gateway

```hcl
# ✅ Good - Private API Gateway
resource "aws_api_gateway_rest_api" "private" {
  name        = "azeebo-plus-private-api"
  endpoint_configuration {
    types = ["PRIVATE"]
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Deny"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "execute-api:/*/*/*"
        Condition = {
          StringNotEquals = {
            "aws:SourceVpce" = aws_vpc_endpoint.api.id
          }
        }
      },
      {
        Effect = "Allow"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "execute-api:/*/*/*"
      }
    ]
  })
}
```

---

## VPC Endpoints

```hcl
# ✅ Good - VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.secretsmanager"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## SSL/TLS Standards

### Certificate Management

```hcl
# ✅ Good - ACM Certificate
resource "aws_acm_certificate" "api" {
  domain_name       = "api.azeebo.plus"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.api.azeebo.plus",
  ]

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}

resource "aws_acm_certificate" "cdn" {
  domain_name       = "cdn.azeebo.plus"
  validation_method = "DNS"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

### TLS Configuration

| Environment | TLS Version | Cipher Suites |
|-------------|-------------|---------------|
| Production | TLS 1.2+ | Modern cipher suites |
| Staging | TLS 1.2+ | Modern cipher suites |
| Development | TLS 1.0+ | Any |

---

## Network Security

### WAF Configuration

```hcl
# ✅ Good - WAF Configuration
resource "aws_wafv2_web_acl" "api" {
  name        = "azeebo-plus-api-waf"
  description = "WAF for API Gateway"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "api-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "api-waf"
    sampled_requests_enabled   = true
  }
}
```

---

## Monitoring & Logging

### VPC Flow Logs

```hcl
# ✅ Good - VPC Flow Logs
resource "aws_flow_log" "main" {
  traffic_type = "ALL"
  vpc_id       = aws_vpc.main.id

  destination_arn = aws_cloudwatch_log_group.flow_logs.arn
  log_format      = "${"${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}"}"

  tags = {
    Environment = var.environment
    Project     = "azeebo-plus"
  }
}
```

---

## Prohibited Actions

- No public S3 buckets
- No security group with 0.0.0.0/0 for sensitive ports
- No HTTP without HTTPS redirect
- No disabling WAF
- No public API Gateway without authentication
- No direct internet access for database subnets
- No disabling VPC flow logs
- No sharing security groups across environments