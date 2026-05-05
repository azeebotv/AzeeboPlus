# Azeebo+ Terraform Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Overview

This document defines Terraform standards and best practices for Azeebo+ infrastructure provisioning.

---

## Infrastructure Overview

### Cloud Provider

- **Provider:** AWS (primary), GCP (backup)
- **Region:** us-east-1 (primary), eu-west-1 (secondary)

### Infrastructure Components

| Component | Terraform Module | Purpose |
|-----------|-----------------|---------|
| VPC | `vpc/` | Network infrastructure |
| ECS/EKS | `ecs/`, `eks/` | Container orchestration |
| RDS | `rds/` | Database |
| Redis | `redis/` | Cache |
| S3 | `s3/` | Object storage |
| CloudFront | `cloudfront/` | CDN |
| Route53 | `route53/` | DNS |
| IAM | `iam/` | Identity management |
| Secrets Manager | `secrets/` | Secret management |

---

## Module Structure

```
infra/terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── providers.tf
├── versions.tf
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── redis/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── s3/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    ├── staging/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars
```

---

## Terraform Standards

### Version Requirements

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "azeebo-plus-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "azeebo-plus-terraform-locks"
  }
}
```

### Provider Configuration

```hcl
# providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "azeebo-plus"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

### Variable Naming

```hcl
# ✅ Good
variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ❌ Bad
variable "env" {
  description = "Environment"
  type        = string
}

variable "count" {
  description = "Count"
  type        = number
}
```

### Output Naming

```hcl
# ✅ Good
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
}

# ❌ Bad
output "id" {
  value = aws_vpc.main.id
}
```

---

## Security Standards

### Encryption

```hcl
# ✅ Good - RDS Encryption
resource "aws_db_instance" "main" {
  identifier           = "azeebo-plus-${var.environment}-db"
  allocated_storage    = 100
  engine               = "postgres"
  engine_version       = "14.9"
  instance_class       = "db.t3.medium"
  db_name              = "azeebo_plus"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres14"

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn

  # SSL
  iam_database_authentication_enabled = true

  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Security
  skip_final_snapshot = false
  final_snapshot_identifier = "azeebo-plus-${var.environment}-db-final"
}
```

### IAM Best Practices

```hcl
# ✅ Good - Least Privilege IAM
resource "aws_iam_role" "ecs_task" {
  name = "azeebo-plus-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "azeebo-plus-${var.environment}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.media.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db.arn,
          aws_secretsmanager_secret.redis.arn
        ]
      }
    ]
  })
}
```

### Secrets Management

```hcl
# ✅ Good - Secrets Manager
resource "aws_secretsmanager_secret" "db" {
  name = "azeebo-plus-${var.environment}-db-credentials"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
  })
}

resource "aws_secretsmanager_secret" "redis" {
  name = "azeebo-plus-${var.environment}-redis-auth"
}

resource "aws_secretsmanager_secret" "api_keys" {
  name = "azeebo-plus-${var.environment}-api-keys"
}
```

---

## Environment Separation

### Environment Variables

```hcl
# environments/dev/terraform.tfvars
environment = "dev"
aws_region  = "us-east-1"

instance_count = 1
db_instance_class = "db.t3.micro"
redis_instance_class = "cache.t3.micro"

# environments/prod/terraform.tfvars
environment = "prod"
aws_region  = "us-east-1"

instance_count = 4
db_instance_class = "db.r5.large"
redis_instance_class = "cache.r5.large"
```

### State Management

```hcl
# Backend configuration per environment
# environments/dev/main.tf
module "vpc" {
  source = "../../modules/vpc"

  environment = var.environment
  vpc_cidr    = "10.0.0.0/16"
}

module "ecs" {
  source = "../../modules/ecs"

  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_count  = var.instance_count
}
```

---

## CI/CD Integration

### Terraform Plan

```bash
# CI/CD pipeline step
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan -input=false
```

### Terraform Apply

```bash
# Production apply (manual approval required)
terraform apply -input=false tfplan
```

### Destroy Protection

```hcl
# Prevent accidental destroy
lifecycle {
  prevent_destroy = true
  ignore_changes  = [tags["Environment"]]
}
```

---

## Testing

### Terraform Validation

```bash
# Validate all modules
terraform validate

# Format check
terraform fmt -check -recursive

# TFLint (optional)
tflint --recursive
```

### Test Modules

```hcl
# tests/vpc_test.tftest.hcl
run "vpc_creation" {
  command = plan

  variables {
    environment = "test"
    vpc_cidr    = "10.10.0.0/16"
  }

  assert {
    condition     = aws_vpc.main.id != ""
    error_message = "VPC ID should not be empty"
  }
}
```

---

## Prohibited Actions

- No hardcoded secrets
- No production changes without plan
- No direct state file editing
- No disabling encryption
- No public S3 buckets
- No security group with 0.0.0.0/0 for sensitive ports
- No skipping terraform validate
- No committing state files