/**
 * Infrastructure Testing Configuration
 * INF-005: Test Terraform plans in CI
 */

export interface TerraformTestConfig {
  directory: string;
  validate: boolean;
  plan: boolean;
  costEstimate: boolean;
  securityScan: boolean;
}

export const TERRAFORM_TEST_MATRIX: TerraformTestConfig[] = [
  {
    directory: 'infrastructure/terraform/ecs-cluster',
    validate: true,
    plan: true,
    costEstimate: true,
    securityScan: true,
  },
  {
    directory: 'infrastructure/terraform/rds',
    validate: true,
    plan: true,
    costEstimate: true,
    securityScan: true,
  },
  {
    directory: 'infrastructure/terraform/vpc',
    validate: true,
    plan: true,
    costEstimate: false,
    securityScan: true,
  },
  {
    directory: 'infrastructure/terraform/elasticache',
    validate: true,
    plan: true,
    costEstimate: true,
    securityScan: true,
  },
  {
    directory: 'infrastructure/terraform/s3',
    validate: true,
    plan: true,
    costEstimate: false,
    securityScan: true,
  },
  {
    directory: 'infrastructure/terraform/cloudfront',
    validate: true,
    plan: true,
    costEstimate: true,
    securityScan: false,
  },
  {
    directory: 'infrastructure/terraform/ecs-services',
    validate: true,
    plan: true,
    costEstimate: true,
    securityScan: true,
  },
];

export const TERRAFORM_QUALITY_GATES = {
  // Checkov security scanning
  checkov: {
    skipChecks: [],
    framework: ['terraform', 'terraform_plan'],
  },
  // Infracost cost estimation
  infracost: {
    enableUsageApi: false,
    thresholdPercentage: 10, // Fail if cost increases > 10%
  },
  // tflint rules
  tflint: {
    rules: ['azurerm', 'aws', 'google'],
    config: '.tflint.hcl',
  },
  // Policy-as-code with OPA/Conftest
  conftest: {
    policyPath: 'infrastructure/policies',
    namespaces: ['main'],
  },
} as const;

// GitHub Actions workflow snippet for infrastructure testing
export const INFRA_CI_CONFIG = {
  name: 'Infrastructure Tests',
  on: { pull_request: { paths: ['infrastructure/**'] } },
  jobs: {
    validate: {
      steps: ['terraform init -backend=false', 'terraform validate', 'terraform fmt -check'],
    },
    securityScan: {
      steps: ['pip install checkov', 'checkov -d . --framework terraform'],
    },
    costEstimate: {
      steps: [
        'curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh',
        'infracost breakdown --path .',
      ],
    },
  },
};
