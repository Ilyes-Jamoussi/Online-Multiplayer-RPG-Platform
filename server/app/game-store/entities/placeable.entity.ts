import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ versionKey: false })
export class Placeable {
    readonly _id?: Types.ObjectId;

    @Prop({ required: true, enum: PlaceableKind }) kind: PlaceableKind;

    @Prop({ required: true, min: -1 }) x: number;
    @Prop({ required: true, min: -1 }) y: number;

    @Prop({ required: true }) placed: boolean;

    @Prop({ enum: Orientation }) orientation?: Orientation;
}
export const placeableSchema = SchemaFactory.createForClass(Placeable);
