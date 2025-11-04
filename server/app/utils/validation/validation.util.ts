import { Logger } from '@nestjs/common';

export const validationExceptionFactory = (errors: unknown): Error => {
    new Logger('ValidationPipe').error('Validation failed:', errors);
    throw new Error('Validation failed');
};
