// server/src/schemas/placeable.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPlaceableKind, ApiOrientation } from '@app/game-store/dto/create-game.dto';

@Schema({ versionKey: false })
export class Placeable {
    @Prop({ required: true, enum: ApiPlaceableKind })
    kind: ApiPlaceableKind;

    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;

    @Prop({ enum: ApiOrientation }) orientation?: ApiOrientation;
    // @Prop({ type: SchemaTypes.Mixed }) props?: any; // si tu veux des props libres
}
export const placeableSchema = SchemaFactory.createForClass(Placeable);
