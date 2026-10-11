import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';

/**
 * The distinction these tests exist for: `HeadObjectCommand` throws for a key
 * that was never uploaded and for a bucket that refuses to answer, and the call
 * site used to read both as one client error — a storage outage told creators
 * their upload had not finished, and asking them to retry is the wrong answer to
 * our own failure. `statObject` now splits them, so `mapAndThrow` below never
 * has to guess.
 */
describe('MediaService.statObject', () => {
  let service: MediaService;
  let send: jest.Mock;

  const configMock = {
    get: jest.fn(() => 'test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaService, { provide: ConfigService, useValue: configMock }],
    }).compile();

    service = module.get(MediaService);
    send = jest.fn();
    (service as unknown as { s3Client: { send: jest.Mock } }).s3Client = { send };
  });

  it('returns the object size when the key exists', async () => {
    send.mockResolvedValue({ ContentLength: 2048, ContentType: 'video/mp4' });
    await expect(service.statObject('uploads/c1/m1')).resolves.toEqual({
      size: 2048,
      contentType: 'video/mp4',
    });
  });

  it('reports a missing key as a client-facing 404, not a server failure', async () => {
    for (const missing of [
      Object.assign(new Error('The specified key does not exist.'), { name: 'NotFound' }),
      Object.assign(new Error('Not Found'), {
        $metadata: { httpStatusCode: 404 },
      }),
      Object.assign(new Error('The specified key does not exist.'), { Code: 'NoSuchKey' }),
    ]) {
      send.mockRejectedValue(missing);
      await expect(service.statObject('uploads/c1/m1')).rejects.toBeInstanceOf(NotFoundException);
    }
  });

  it('keeps every other storage failure on the 5xx side', async () => {
    // A credential refusal and an unreachable endpoint are our problem. Neither
    // may reach the client as a 4xx that implies they uploaded wrong.
    send.mockRejectedValue(Object.assign(new Error('InvalidAccessKeyId'), { name: 'SignatureDoesNotMatch' }));
    await expect(service.statObject('uploads/c1/m1')).rejects.toMatchObject({ status: 500 });

    send.mockRejectedValue(Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }));
    const outage = await service.statObject('uploads/c1/m1').catch((e) => e);
    expect(outage).toBeInstanceOf(HttpException);
    expect(outage.getStatus()).toBe(503);
  });
});
