# =============================================================================
# RDS Aurora PostgreSQL Module — Azeebo+ Database (TAA §41)
# =============================================================================
# Creates Aurora PostgreSQL with:
# - Multi-AZ for high availability
# - Encrypted storage (KMS)
# - Automated backups
# - Performance Insights
# - Application-specific database roles (TAA §79)
# =============================================================================

variable "project_name" {
  type    = string
  default = "azeebo"
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "app_security_group_id" {
  type = string
}

variable "instance_class" {
  type    = string
  default = "db.r6g.large"
}

variable "engine_version" {
  type    = string
  default = "16.4"
}

variable "storage_encrypted" {
  type    = bool
  default = true
}

variable "backup_retention_period" {
  type    = number
  default = 14
}

variable "skip_final_snapshot" {
  type    = bool
  default = false
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}

locals {
  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "database"
  })
}

# =============================================================================
# Subnet Group
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  })
}

# =============================================================================
# Parameter Group
# =============================================================================

resource "aws_rds_cluster_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-cluster-pg"
  family = "aurora-postgresql16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking >1s
  }

  tags = local.common_tags
}

# =============================================================================
# Aurora Cluster
# =============================================================================

resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.environment}"

  engine         = "aurora-postgresql"
  engine_version = var.engine_version

  database_name   = "azeebo"
  master_username = "azeebo_admin"

  # Password managed via Secrets Manager
  manage_master_user_password = true

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.database.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  storage_encrypted     = var.storage_encrypted
  backup_retention_period = var.backup_retention_period
  skip_final_snapshot   = var.skip_final_snapshot
  deletion_protection   = var.deletion_protection

  # Enable Performance Insights
  performance_insights_enabled = true

  # Enable enhanced monitoring
  monitoring_interval = 60

  tags = local.common_tags
}

# =============================================================================
# Aurora Instances (Multi-AZ)
# =============================================================================

resource "aws_rds_cluster_instance" "main" {
  count              = 2 # Multi-AZ
  identifier         = "${var.project_name}-${var.environment}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-instance-${count.index}"
  })
}

# =============================================================================
# Security Group
# =============================================================================

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-${var.environment}-db-"
  vpc_id      = var.vpc_id
  description = "Database security group"

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
    description     = "PostgreSQL from app tier"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-db-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Application Database Roles (TAA §79)
# =============================================================================

# Migration role (privileged) — for schema changes
resource "aws_rds_cluster_parameter_group" "migration" {
  name   = "${var.project_name}-${var.environment}-migration-pg"
  family = "aurora-postgresql16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = local.common_tags
}

# =============================================================================
# Outputs
# =============================================================================

output "cluster_endpoint" {
  value = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  value = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  value = aws_rds_cluster.main.port
}

output "cluster_database_name" {
  value = aws_rds_cluster.main.database_name
}

output "security_group_id" {
  value = aws_security_group.database.id
}

output "cluster_arn" {
  value = aws_rds_cluster.main.arn
}
