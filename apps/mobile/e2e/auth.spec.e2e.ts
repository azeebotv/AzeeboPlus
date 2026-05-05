import { describe, it, expect, beforeAll } from '@jest/globals';
import { by, element, expect as detoxExpect } from 'detox';

describe('Mobile App Authentication Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen', async () => {
    await expect(element(by.id('loginScreen'))).toBeVisible();
  });

  it('should have email input field', async () => {
    await expect(element(by.id('emailInput'))).toBeVisible();
  });

  it('should have password input field', async () => {
    await expect(element(by.id('passwordInput'))).toBeVisible();
  });

  it('should have login button', async () => {
    await expect(element(by.id('loginButton'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    await element(by.id('registerLink')).tap();
    await expect(element(by.id('registerScreen'))).toBeVisible();
  });

  it('should show validation error for empty fields', async () => {
    await element(by.id('loginButton')).tap();
    await expect(element(by.text(/required|invalid/i))).toBeVisible();
  });
});

describe('Mobile App Navigation', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should have tab bar with home tab', async () => {
    await expect(element(by.id('homeTab'))).toBeVisible();
  });

  it('should have tab bar with search tab', async () => {
    await expect(element(by.id('searchTab'))).toBeVisible();
  });

  it('should have tab bar with library tab', async () => {
    await expect(element(by.id('libraryTab'))).toBeVisible();
  });

  it('should have tab bar with profile tab', async () => {
    await expect(element(by.id('profileTab'))).toBeVisible();
  });
});

describe('Mobile App Content Display', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should display content on home screen', async () => {
    await expect(element(by.id('homeContent'))).toBeVisible({ timeout: 10000 });
  });

  it('should have working search functionality', async () => {
    await element(by.id('searchTab')).tap();
    await element(by.id('searchInput')).typeText('test');
    await expect(element(by.id('searchResults'))).toBeVisible({ timeout: 5000 });
  });
});

describe('Mobile App Settings', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  it('should have settings accessible', async () => {
    await element(by.id('profileTab')).tap();
    await expect(element(by.id('settingsButton'))).toBeVisible();
  });
});
