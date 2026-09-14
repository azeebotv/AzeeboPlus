# ElastiCache Module for Azeebo+
# Creates a production-ready Redis cluster

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "azeebo"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ElastiCache will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ElastiCache subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to connect"
  type        = list(string)
  default     = []
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (1 for non-cluster mode)"
  type        = number
  default     = 1
}

variable "parameter_group_name" {
  description = "Parameter group name"
  type        = string
  default     = "default.redis7"
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = false
}

variable "at_rest_encryption_enabled" {
  description = "Enable at-rest encryption"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable transit encryption"
  type        = bool
  default     = false
}

variable "auth_token" {
  description = "Auth token for Redis AUTH"
  type        = string
  sensitive   = true
  default     = null
}

variable "snapshot_retention_limit" {
  description = "Number of snapshots to retain"
  type        = number
  default     = 3
}

variable "snapshot_window" {
  description = "Snapshot window"
  type        = string
  default     = "03:00-05:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:05:00-sun:07:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable auto minor version upgrade"
  type        = bool
  default     = true
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
    Service     = "cache"
  })
}

# Security Group
resource "aws_security_group" "redis" {
  name_prefix = "${local.name}-redis-"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Redis access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-redis-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.name}-redis-subnet-group"
  })
}

# Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name   = "${local.name}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# Redis Replication Group (for cluster mode)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.name}-redis"
  description          = "Redis cluster for ${var.project_name} ${var.environment}"

  node_type          = var.node_type
  num_cache_clusters = var.num_cache_nodes
  engine_version     = var.engine_version
  port               = var.port

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  parameter_group_name = aws_elasticache_parameter_group.main.name

  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.auth_token

  snapshot_retention_limit   = var.snapshot_retention_limit
  snapshot_window            = var.snapshot_window
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  tags = merge(local.common_tags, {
    Name = "${local.name}-redis"
  })
}

# Outputs
output "replication_group_id" {
  description = "The ID of the replication group"
  value       = aws_elasticache_replication_group.main.id
}

output "primary_endpoint_address" {
  description = "The address of the endpoint for the primary node"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "The address of the endpoint for the reader node"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "port" {
  description = "The port of the Redis instance"
  value       = aws_elasticache_replication_group.main.port
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = aws_security_group.redis.id
}

output "arn" {
  description = "The ARN of the replication group"
  value       = aws_elasticache_replication_group.main.arn
}
