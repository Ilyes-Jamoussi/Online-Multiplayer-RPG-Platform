import { Logger } from '@nestjs/common';
import { validationExceptionFactory } from './validation.util';

describe('ValidationUtil', () => {
    describe('validationExceptionFactory', () => {
        let loggerErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
        });

        afterEach(() => {
            loggerErrorSpy.mockRestore();
        });

        it('should log error and throw Error', () => {
            const errors = { field: 'error message' };

            expect(() => validationExceptionFactory(errors)).toThrow('Validation failed');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Validation failed:', errors);
        });

        it('should handle null errors', () => {
            expect(() => validationExceptionFactory(null)).toThrow('Validation failed');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Validation failed:', null);
        });

        it('should handle undefined errors', () => {
            expect(() => validationExceptionFactory(undefined)).toThrow('Validation failed');
            expect(loggerErrorSpy).toHaveBeenCalledWith('Validation failed:', undefined);
        });
    });
});
