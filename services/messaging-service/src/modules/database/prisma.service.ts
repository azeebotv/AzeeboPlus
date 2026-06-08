import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client';

export const prisma = new PrismaClient();

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }
}
