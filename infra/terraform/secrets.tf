resource "aws_secretsmanager_secret" "database" {
  name = "${var.project_name}/database"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    host     = aws_db_instance.postgresql.endpoint
    port     = 5432
    name     = aws_db_instance.postgresql.db_name
    username = aws_db_instance.postgresql.username
    password = var.db_password
  }
}

resource "aws_secretsmanager_secret" "jwt" {
  name = "${var.project_name}/jwt"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret" "payment_keys" {
  name = "${var.project_name}/payment-keys"

  tags = {
    Environment = var.environment
  }
}