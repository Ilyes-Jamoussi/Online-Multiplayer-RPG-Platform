// server/src/schemas/tile.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TileKind } from '@common/enums/tile-kind.enum';

export type TileDocument = Tile & Document;

@Schema({ versionKey: false })
export class Tile {
    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;

    @Prop({ required: true, enum: TileKind })
    kind: TileKind;

    @Prop() open?: boolean;
    @Prop() endpointId?: number;
}
export const tileSchema = SchemaFactory.createForClass(Tile);
