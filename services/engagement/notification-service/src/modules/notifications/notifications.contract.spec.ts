import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SavePushTokenDto } from './dto/save-push-token.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

// Mirrors the ValidationPipe options in src/main.ts so the contract matches
// what the running service actually accepts.
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });

const validate = (metatype: new () => object, body: unknown) =>
  pipe.transform(body, { type: 'body', metatype });

// Bodies sent by packages/react-data/src/api/notification.ts.
describe('Notification API contract (client request bodies)', () => {
  it('accepts the push token body sent by registerPushToken', async () => {
    await expect(
      validate(SavePushTokenDto, { token: 'fcm-token-123', deviceType: 'ios' })
    ).resolves.toBeDefined();
  });

  it('rejects a push token body without deviceType', async () => {
    await expect(validate(SavePushTokenDto, { token: 'fcm-token-123' })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('accepts channel flags plus categoryOverrides from updatePreferences', async () => {
    await expect(
      validate(UpdatePreferencesDto, {
        email: true,
        push: false,
        sms: false,
        categoryOverrides: { newContent: true, payments: false },
      })
    ).resolves.toBeDefined();
  });

  it('rejects a raw `types` key, which the server does not accept', async () => {
    await expect(
      validate(UpdatePreferencesDto, { email: true, types: { newContent: true } })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
