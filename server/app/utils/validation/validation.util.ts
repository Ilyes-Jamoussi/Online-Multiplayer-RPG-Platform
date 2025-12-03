export const validationExceptionFactory = (): Error => {
    throw new Error('Validation failed');
};
