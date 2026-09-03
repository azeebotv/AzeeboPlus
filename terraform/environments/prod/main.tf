# Production Environment for Azeebo+
# Configures all modules for production deployment

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "azeebo-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "azeebo"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "database_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Auth token for Redis"
  type        = string
  sensitive   = true
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  project_name = "azeebo"
  environment  = "prod"

  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false  # Use multiple NAT gateways for HA

  tags = {
    CostCenter = "production"
  }
}

# RDS PostgreSQL
module "rds" {
  source = "../../modules/rds"

  project_name = "azeebo"
  environment  = "prod"

  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.elasticache.security_group_id]

  instance_class      = "db.r6g.large"
  engine_version      = "16.1"
  allocated_storage   = 100
  max_allocated_storage = 500

  database_name     = "azeebo"
  database_username = "azeebo_admin"
  database_password = var.database_password

  multi_az               = true
  storage_encrypted      = true
  deletion_protection    = true
  skip_final_snapshot    = false

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true
  monitoring_interval         = 60

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}

# ElastiCache Redis
module "elasticache" {
  source = "../../modules/elasticache"

  project_name = "azeebo"
  environment  = "prod"

  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.security_group_id]

  node_type            = "cache.r6g.large"
  engine_version       = "7.0"
  num_cache_nodes      = 3

  automatic_failover_enabled = true
  multi_az_enabled          = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token

  snapshot_retention_limit = 7
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "sun:05:00-sun:07:00"
}

# S3 Buckets
module "s3" {
  source = "../../modules/s3"

  project_name = "azeebo"
  environment  = "prod"

  enable_versioning = true
  enable_encryption = true

  lifecycle_rules = [
    {
      id      = "archive-old-content"
      enabled = true
      prefix  = "archive/"
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        },
      ]
      expiration = null
      noncurrent_version_expiration = {
        days = 90
      }
    },
  ]
}

# IAM
module "iam" {
  source = "../../modules/iam"

  project_name = "azeebo"
  environment  = "prod"

  s3_content_bucket_arn = module.s3.content_bucket_arn
  s3_backups_bucket_arn = module.s3.backups_bucket_arn
  s3_logs_bucket_arn    = module.s3.logs_bucket_arn
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.primary_endpoint_address
}

output "content_bucket" {
  description = "S3 content bucket"
  value       = module.s3.content_bucket_id
}

output "cicd_role_arn" {
  description = "CI/CD role ARN"
  value       = module.iam.cicd_role_arn
}
