import { validationExceptionFactory } from './validation.util';

describe('ValidationUtil', () => {
    describe('validationExceptionFactory', () => {
        it('should throw Error', () => {
            expect(() => validationExceptionFactory()).toThrow('Validation failed');
        });
    });
});
