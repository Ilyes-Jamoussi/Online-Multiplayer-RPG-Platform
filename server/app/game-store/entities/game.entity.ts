import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ versionKey: false })
export class Game {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, enum: MapSize })
    size: MapSize;

    @Prop({ required: true, enum: GameMode })
    mode: GameMode;

    @Prop({ required: true, default: false })
    visibility: boolean;

    @Prop({ required: true, default: Date.now })
    lastModified: Date;
}

export const gameSchema = SchemaFactory.createForClass(Game);
