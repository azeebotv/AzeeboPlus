import type { TestRunnerConfig } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },
  async preVisit(page) {
    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle');
  },
  async postVisit(page, context) {
    // Wait for any animations to complete
    await page.waitForTimeout(500);

    // Take a screenshot for visual comparison
    const screenshot = await page.screenshot({
      fullPage: false,
      animations: 'disabled',
    });

    // Use story name for snapshot filename
    const storyId = context.id || 'unknown';

    expect(screenshot).toMatchImageSnapshot({
      customSnapshotsDir: `__snapshots__/${storyId}`,
      customDiffDir: `__diffs__/${storyId}`,
      failureThreshold: 0.01, // 1% difference allowed
      failureThresholdType: 'percent',
    });
  },
};

export default config;
