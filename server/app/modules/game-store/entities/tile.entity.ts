import { TileKind } from '@common/enums/tile.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false, _id: false })
export class Tile {
    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;

    @Prop({ required: true, enum: TileKind }) kind: TileKind;

    @Prop() open?: boolean;
    @Prop({ min: 1, max: 5 }) teleportChannel?: number;
}
export const tileSchema = SchemaFactory.createForClass(Tile);
