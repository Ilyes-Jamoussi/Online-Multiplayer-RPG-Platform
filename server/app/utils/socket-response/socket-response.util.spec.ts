import { errorResponse, successResponse } from './socket-response.util';

describe('SocketResponseUtil', () => {
    describe('successResponse', () => {
        it('should return success response with data', () => {
            const data = { test: 'value' };
            const result = successResponse(data);

            expect(result).toEqual({
                success: true,
                data,
            });
        });
    });

    describe('errorResponse', () => {
        it('should return error response with message', () => {
            const message = 'Test error';
            const result = errorResponse(message);

            expect(result).toEqual({
                success: false,
                message,
            });
        });
    });
});
