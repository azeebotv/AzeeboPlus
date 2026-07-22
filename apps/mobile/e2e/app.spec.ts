import { by, device, element, expect } from 'detox';

describe('App Smoke Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show the login screen', async () => {
    await waitFor(element(by.id('login-card')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should display login form elements', async () => {
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('login-email-input'))).toBeVisible();
    await expect(element(by.id('login-password-input'))).toBeVisible();
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });

  it('should display social login buttons', async () => {
    await waitFor(element(by.id('login-google-button')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('login-google-button'))).toBeVisible();
    await expect(element(by.id('login-apple-button'))).toBeVisible();
  });

  it('should display forgot password and sign up links', async () => {
    await waitFor(element(by.id('login-forgot-password')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('login-forgot-password'))).toBeVisible();
    await expect(element(by.id('login-signup-button'))).toBeVisible();
  });

  it('should show validation error when submitting empty form', async () => {
    await waitFor(element(by.id('login-submit-button')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('login-submit-button')).tap();

    // The form should show an error about filling in all fields
    await waitFor(element(by.text('Please fill in all fields')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should show validation error for invalid email', async () => {
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('login-email-input')).typeText('invalid-email');
    await element(by.id('login-password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();

    await waitFor(element(by.text('Please enter a valid email address')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should allow typing in email and password fields', async () => {
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('login-email-input')).typeText('test@example.com');
    await expect(element(by.id('login-email-input'))).toHaveText('test@example.com');

    await element(by.id('login-password-input')).typeText('secretpass');
    await expect(element(by.id('login-password-input'))).toHaveText('secretpass');
  });

  it('should support scrolling the login form', async () => {
    await waitFor(element(by.id('login-card')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('login-card')).scroll(200, 'down');
    // Verify the form is still visible after scrolling
    await expect(element(by.id('login-submit-button'))).toBeVisible();
  });
});
