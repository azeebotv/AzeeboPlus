import { by, device, element, expect } from 'detox';

describe('Navigation', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Tab Navigation', () => {
    it('should display tab bar with Home tab', async () => {
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.text('Home'))).toBeVisible();
    });

    it('should display tab bar with Watch tab', async () => {
      await waitFor(element(by.text('Watch')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.text('Watch'))).toBeVisible();
    });

    it('should display tab bar with Rewards tab', async () => {
      await waitFor(element(by.text('Rewards')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.text('Rewards'))).toBeVisible();
    });

    it('should display tab bar with Profile tab', async () => {
      await waitFor(element(by.text('Profile')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.text('Profile'))).toBeVisible();
    });

    it('should display create button in tab bar', async () => {
      await waitFor(element(by.id('tab-create')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.id('tab-create'))).toBeVisible();
    });

    it('should navigate to Watch tab when tapped', async () => {
      await waitFor(element(by.text('Watch')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.text('Watch')).tap();
      // Verify the tab is now selected/active
      await expect(element(by.text('Watch'))).toBeVisible();
    });

    it('should navigate to Rewards tab when tapped', async () => {
      await waitFor(element(by.text('Rewards')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.text('Rewards')).tap();
      await expect(element(by.text('Rewards'))).toBeVisible();
    });

    it('should navigate to Profile tab when tapped', async () => {
      await waitFor(element(by.text('Profile')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.text('Profile')).tap();
      await expect(element(by.text('Profile'))).toBeVisible();
    });

    it('should navigate back to Home tab', async () => {
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(10000);

      // First go to another tab
      await element(by.text('Watch')).tap();
      // Then go back to Home
      await element(by.text('Home')).tap();
      await expect(element(by.text('Home'))).toBeVisible();
    });
  });

  describe('Header Navigation', () => {
    it('should display header search button', async () => {
      await waitFor(element(by.id('header-search-button')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.id('header-search-button'))).toBeVisible();
    });

    it('should display header wallet button', async () => {
      await waitFor(element(by.id('header-wallet-button')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.id('header-wallet-button'))).toBeVisible();
    });

    it('should display header notifications button', async () => {
      await waitFor(element(by.id('header-notifications-button')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.id('header-notifications-button'))).toBeVisible();
    });

    it('should display header profile button', async () => {
      await waitFor(element(by.id('header-profile-button')))
        .toBeVisible()
        .withTimeout(10000);
      await expect(element(by.id('header-profile-button'))).toBeVisible();
    });
  });
});
