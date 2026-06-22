resource "aws_elasticache_subnet_group" "azeebo" {
  name       = "${var.project_name}-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for Redis ElastiCache"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  tags = {
    Name        = "${var.project_name}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-redis"
  replication_group_description = "Redis cluster for Azeebo+"
  engine                     = "redis"
  engine_version             = "7.2"
  node_type                  = "cache.t4g.small"
  number_cache_clusters      = 3
  automatic_failover_enabled = true
  multi_az_enabled           = true

  subnet_group_name = aws_elasticache_subnet_group.azeebo.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled  = true

  log_delivery_configuration {
    destination_type = "cloudwatch-logs"
    log_format       = "text"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}