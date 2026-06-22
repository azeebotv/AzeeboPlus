resource "aws_db_subnet_group" "azeebo" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.project_name}-db-subnet"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for PostgreSQL RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgresql" {
  identifier        = "${var.project_name}-postgresql"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t4g.medium"
  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "azeebo_prod"
  username = "azeebo_admin"
  password = var.db_password

  db_subnet_group_name = aws_db_subnet_group.azeebo.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az             = true
  backup_retention_period = 30
  backup_window         = "03:00-04:00"
  maintenance_window    = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  deletion_protection = true

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}