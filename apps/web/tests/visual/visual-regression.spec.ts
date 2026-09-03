import { test, expect } from '@playwright/test';

const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://localhost:6006';

// List of stories to visually test
const STORIES = [
  // UI Components
  { id: 'components-button--primary', name: 'Button/Primary' },
  { id: 'components-button--secondary', name: 'Button/Secondary' },
  { id: 'components-button--disabled', name: 'Button/Disabled' },
  { id: 'components-icon--default', name: 'Icon/Default' },
  { id: 'components-icon--sizes', name: 'Icon/Sizes' },
  { id: 'components-input--default', name: 'Input/Default' },
  { id: 'components-modal--default', name: 'Modal/Default' },
  { id: 'components-toast--default', name: 'Toast/Default' },
  { id: 'components-card--default', name: 'Card/Default' },

  // Web App Components
  { id: 'web-components-emptystate--default', name: 'EmptyState/Default' },
  { id: 'web-components-emptystate--withaction', name: 'EmptyState/WithAction' },
  { id: 'web-components-skeleton--default', name: 'Skeleton/Default' },
  { id: 'web-components-skeleton--cardskeleton', name: 'Skeleton/CardSkeleton' },
  { id: 'web-components-skeleton--listskeleton', name: 'Skeleton/ListSkeleton' },
  { id: 'web-components-breadcrumbs--default', name: 'Breadcrumbs/Default' },
  { id: 'web-components-starrating--default', name: 'StarRating/Default' },
  { id: 'web-components-starrating--halfstars', name: 'StarRating/HalfStars' },
  { id: 'web-components-sharebutton--default', name: 'ShareButton/Default' },

  // Homepage Components
  { id: 'web-homepage-contentcard--default', name: 'ContentCard/Default' },
  { id: 'web-homepage-contentcard--compact', name: 'ContentCard/Compact' },
  { id: 'web-homepage-contentcard--withprogress', name: 'ContentCard/WithProgress' },
  { id: 'web-homepage-sectionheader--default', name: 'SectionHeader/Default' },
  { id: 'web-homepage-loginprompt--default', name: 'LoginPrompt/Default' },

  // Auth Components
  { id: 'web-auth-brandlogo--medium', name: 'BrandLogo/Medium' },
];

test.describe('Visual Regression Tests', () => {
  for (const story of STORIES) {
    test(`${story.name}`, async ({ page }) => {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`);

      // Wait for content to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Take screenshot
      await expect(page).toHaveScreenshot(`${story.name.replace('/', '-')}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

test.describe('Responsive Visual Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    for (const story of STORIES.slice(0, 5)) {
      test(`${story.name} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot(`${story.name.replace('/', '-')}-${viewport.name}.png`, {
          fullPage: false,
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});
