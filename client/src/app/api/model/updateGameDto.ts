import { CreateGameDto, TileCreateDto, ObjectCreateDto } from './createGameDto';

export type UpdateGameDto = Partial<Omit<CreateGameDto, 'tiles' | 'objects'>> & {
    tiles?: TileCreateDto[];
    objects?: ObjectCreateDto[];
};

export type TileUpsertDto = TileCreateDto;
export type ObjectUpsertDto = ObjectCreateDto;
