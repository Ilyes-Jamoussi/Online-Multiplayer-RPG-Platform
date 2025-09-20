// server/src/schemas/game.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Tile, tileSchema } from './tile.entity';
import { Placeable, placeableSchema } from './placeable.entity';
import { MapSize } from '@common/enums/map-size.enum';
import { GameMode } from '@common/enums/game-mode.enum';

export type GameDocument = Game & Document;

@Schema({ versionKey: false })
export class Game {
    @Prop({ required: true }) name: string;
    @Prop({ required: true }) description: string;

    @Prop({ required: true, enum: MapSize }) size: MapSize;
    @Prop({ required: true, enum: GameMode }) mode: GameMode;

    @Prop({ required: true, default: false }) visibility: boolean;
    @Prop({ required: true, default: Date.now }) lastModified: Date;
    @Prop({ required: true, default: Date.now }) createdAt: Date;

    @Prop({ default: '' }) gridPreviewUrl: string;

    @Prop({ type: [tileSchema], default: [] }) tiles: Tile[];

    @Prop({ type: [placeableSchema], default: [] }) objects: Placeable[];
}
export const gameSchema = SchemaFactory.createForClass(Game);
