import { INestApplication } from '@nestjs/common';
export interface CorsOptions {
    allowedOrigins: string[];
    credentials?: boolean;
    maxAge?: number;
}
export declare function configureCors(app: INestApplication, options: CorsOptions): void;
