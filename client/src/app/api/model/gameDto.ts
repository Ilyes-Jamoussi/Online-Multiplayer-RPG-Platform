import { CreateGameDto } from './createGameDto';

export type GameDto = CreateGameDto & { id: string };
