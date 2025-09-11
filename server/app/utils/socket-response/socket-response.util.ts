import { SocketResponse } from '@common/types/socket-response.type';

export function successResponse<T>(data: T): SocketResponse<T> {
    return {
        success: true,
        data,
    };
}

export function errorResponse(message: string): SocketResponse<never> {
    return {
        success: false,
        message,
    };
}
