import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  tags: {
    include: ['test'],
    exclude: ['skip-test'],
  },
};

export default config;
