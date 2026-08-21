variable "name" {
  description = "Name prefix for ElastiCache resources"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the replication group"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs allowed to connect"
  type        = list(string)
  default     = []
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ"
  type        = bool
  default     = true
}

variable "at_rest_encryption_enabled" {
  description = "Enable at-rest encryption"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable transit encryption"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.name}-${var.environment}"
  description          = "Redis cluster for ${var.name} (${var.environment})"

  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  engine               = "redis"
  engine_version       = var.engine_version
  port                 = var.port

  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled

  snapshot_retention_limit = var.snapshot_retention_limit

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = var.security_group_ids

  tags = var.tags
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name}-${var.environment}"
  subnet_ids = var.subnet_ids
}

output "primary_endpoint" {
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  description = "Primary endpoint address"
}

output "reader_endpoint" {
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
  description = "Reader endpoint address"
}

output "port" {
  value       = aws_elasticache_replication_group.main.port
  description = "Redis port"
}
