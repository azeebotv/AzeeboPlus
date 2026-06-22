module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "~> 19.0"
  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = "1.30"
  subnets         = module.vpc.private_subnets
  vpc_id          = module.vpc.vpc_id

  node_groups = {
    azeebo-nodes = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 2
      instance_type    = "t3.medium"
      ami_type         = "AL2_x86_64"
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}