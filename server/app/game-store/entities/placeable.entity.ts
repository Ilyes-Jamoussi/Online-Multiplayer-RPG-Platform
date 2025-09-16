import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Placeable {
    @Prop({ required: true, enum: PlaceableKind })
    kind: PlaceableKind;

    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;

    @Prop({ enum: Orientation }) orientation?: Orientation;
}
export const placeableSchema = SchemaFactory.createForClass(Placeable);
