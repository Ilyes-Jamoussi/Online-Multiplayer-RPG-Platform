import { removeLeadingSlash } from './route.utils';

describe('Route Utils', () => {
    describe('removeLeadingSlash', () => {
        it('should remove leading slash if present', () => {
            expect(removeLeadingSlash('/test')).toBe('test');
            expect(removeLeadingSlash('/path/to/something')).toBe('path/to/something');
        });

        it('should not modify string if no leading slash', () => {
            expect(removeLeadingSlash('test')).toBe('test');
            expect(removeLeadingSlash('path/to/something')).toBe('path/to/something');
        });

        it('should handle empty string', () => {
            expect(removeLeadingSlash('')).toBe('');
        });

        it('should handle string with only slash', () => {
            expect(removeLeadingSlash('/')).toBe('');
        });
    });
});
