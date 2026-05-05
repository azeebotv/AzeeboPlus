import { device, detox } from 'detox';

beforeAll(async () => {
  await detox.exportGlobals();
});

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await detox.cleanup();
});
