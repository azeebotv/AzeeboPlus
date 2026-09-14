# =============================================================================
# Azeebo+ Production Environment — af-south-1 (Cape Town)
# =============================================================================

terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket         = "azeebo-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "af-south-1"
    encrypt        = true
    dynamodb_table = "azeebo-terraform-locks"
  }
}

provider "aws" {
  region = "af-south-1"

  default_tags {
    tags = {
      Project     = "azeebo"
      Environment = "production"
      ManagedBy   = "terraform"
      CostCentre  = "engineering"
      Owner       = "platform-team"
    }
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "domain_name" {
  description = "Production domain name"
  type        = string
  default     = "azeebo.plus"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

# =============================================================================
# Modules
# =============================================================================

module "vpc" {
  source = "../../modules/vpc"

  project_name = "azeebo"
  environment  = "production"
  vpc_cidr     = "10.0.0.0/16"

  availability_zones    = ["af-south-1a", "af-south-1b", "af-south-1c"]
  public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "rds" {
  source = "../../modules/rds"

  project_name = "azeebo"
  environment  = "production"

  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.database_subnet_ids
  app_security_group_id = module.vpc.app_security_group_id

  instance_class          = "db.r6g.xlarge"
  engine_version          = "16.4"
  backup_retention_period = 30
  deletion_protection     = true

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "elasticache" {
  source = "../../modules/elasticache"

  project_name = "azeebo"
  environment  = "production"

  vpc_id                = module.vpc.vpc_id
  subnet_ids            = module.vpc.private_subnet_ids
  app_security_group_id = module.vpc.app_security_group_id

  node_type       = "cache.r6g.large"
  num_cache_nodes = 3

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "ecs" {
  source = "../../modules/ecs"

  project_name = "azeebo"
  environment  = "production"

  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  public_subnet_ids     = module.vpc.public_subnet_ids
  app_security_group_id = module.vpc.app_security_group_id
  alb_security_group_id = module.vpc.alb_security_group_id
  certificate_arn       = var.certificate_arn
  domain_name           = var.domain_name

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name = "azeebo"
  environment  = "production"

  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn
  alb_dns_name    = module.ecs.alb_dns_name
  alb_zone_id     = module.ecs.alb_zone_id

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "waf" {
  source = "../../modules/waf"

  project_name = "azeebo"
  environment  = "production"

  cloudfront_arn = module.cloudfront.distribution_arn

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "secrets_manager" {
  source = "../../modules/secrets-manager"

  project_name = "azeebo"
  environment  = "production"

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  project_name = "azeebo"
  environment  = "production"

  ecs_cluster_name = module.ecs.cluster_name
  rds_cluster_id   = module.rds.cluster_arn
  redis_cluster_id = module.elasticache.cluster_id

  tags = {
    CostCentre = "engineering"
    Owner      = "platform-team"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = module.ecs.alb_dns_name
}

output "cloudfront_domain" {
  value = module.cloudfront.domain_name
}

output "rds_endpoint" {
  value = module.rds.cluster_endpoint
}

output "redis_endpoint" {
  value = module.elasticache.primary_endpoint_address
}
