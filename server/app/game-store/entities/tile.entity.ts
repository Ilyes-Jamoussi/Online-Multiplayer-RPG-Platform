// server/src/schemas/tile.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiTileKind } from '@app/game-store/dto/create-game.dto';

export type TileDocument = Tile & Document;

@Schema({ versionKey: false, _id: false })
export class Tile {
    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;

    @Prop({ required: true, enum: ApiTileKind })
    kind: ApiTileKind;

    @Prop() open?: boolean;
    @Prop() endpointId?: number;
}
export const tileSchema = SchemaFactory.createForClass(Tile);

tileSchema.index({ x: 1, y: 1 }, { unique: true });
