/**
 * Cadriciel Serveur
 *
 * NOTE: This file mirrors the OpenAPI contract for CreateGameDto
 * with sparse tiles (no BASE entries) and placeable objects.
 */

export interface CreateGameDto {
    size: CreateGameDto.SizeEnum;
    mode: CreateGameDto.ModeEnum;
    name: string;
    description: string;
    visibility?: boolean;
    tiles: TileCreateDto[];
    objects: ObjectCreateDto[];
}

export namespace CreateGameDto {
    export const SizeEnum = {
        NUMBER_10: 10,
        NUMBER_15: 15,
        NUMBER_20: 20,
    } as const;
    export type SizeEnum = (typeof SizeEnum)[keyof typeof SizeEnum];

    export const ModeEnum = {
        Classic: 'classic',
        CaptureTheFlag: 'capture-the-flag',
    } as const;
    export type ModeEnum = (typeof ModeEnum)[keyof typeof ModeEnum];
}

export interface TileCreateDto {
    x: number;
    y: number;
    kind: TileCreateDto.KindEnum;
    open?: boolean;
    endpointId?: number;
}
export namespace TileCreateDto {
    export const KindEnum = {
        WALL: 'WALL',
        WATER: 'WATER',
        ICE: 'ICE',
        DOOR: 'DOOR',
        TELEPORT: 'TELEPORT',
    } as const;
    export type KindEnum = (typeof KindEnum)[keyof typeof KindEnum];
}

export interface ObjectCreateDto {
    kind: ObjectCreateDto.KindEnum;
    x: number;
    y: number;
    orientation?: ObjectCreateDto.OrientationEnum;
    id?: string;
}
export namespace ObjectCreateDto {
    export const KindEnum = {
        START: 'START',
        FLAG: 'FLAG',
        HEAL: 'HEAL',
        FIGHT: 'FIGHT',
        BOAT: 'BOAT',
    } as const;
    export type KindEnum = (typeof KindEnum)[keyof typeof KindEnum];

    export const OrientationEnum = {
        N: 'N',
        E: 'E',
        S: 'S',
        W: 'W',
    } as const;
    export type OrientationEnum = (typeof OrientationEnum)[keyof typeof OrientationEnum];
}
