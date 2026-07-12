try { require('@swc-node/register'); } catch(e) { console.log('swc-node/register not found:', e.message); }
require('reflect-metadata');

const { NestFactory } = require('@nestjs/core');
const { Module, Injectable } = require('@nestjs/common');
const { ConfigModule, ConfigService } = require('@nestjs/config');

class FailingService {
  constructor(configService) {
    console.log('FailingService configService:', typeof configService);
  }
}

// Simulate what ts-node-dev with SWC would emit
const Reflect_metadata = (k, v) => (target) => { Reflect.metadata(k, v)(target); return target; };

// Now test with ts-node --transpile-only via register hook
require('ts-node').register({ transpileOnly: true });

// Re-require as ts
delete require.cache[require.resolve('./test-nest.ts')];
require('./test-nest.ts');
