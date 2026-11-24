import { Test } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootTestApp } from './supertest-utils';

@Controller('health')
class HealthController {
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

describe('bootTestApp', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    ({ app, baseUrl } = await bootTestApp(moduleFixture));
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a baseUrl that serves requests', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('keeps the server alive across multiple requests (no per-request close)', async () => {
    await request(baseUrl).get('/health').expect(200);
    await request(baseUrl).get('/health').expect(200);
    await request(baseUrl).get('/health').expect(200);
  });

  it('runs the configure callback before the app boots', async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    const booted = await bootTestApp(moduleFixture, (a) => a.setGlobalPrefix('api'));
    try {
      await request(booted.baseUrl).get('/api/health').expect(200);
      await request(booted.baseUrl).get('/health').expect(404);
    } finally {
      await booted.app.close();
    }
  });
});
