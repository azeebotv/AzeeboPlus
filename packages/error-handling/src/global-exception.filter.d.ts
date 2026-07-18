import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private getProblemTypeUri;
    private getProblemTitle;
    catch(exception: unknown, host: ArgumentsHost): void;
}
