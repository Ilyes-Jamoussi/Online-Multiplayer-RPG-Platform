export type SocketResponse<T> = { success: true; data: T } | { success: false; message: string };
