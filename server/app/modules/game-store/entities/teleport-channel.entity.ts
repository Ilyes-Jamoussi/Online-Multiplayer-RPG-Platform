import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false, _id: false })
class TeleportTileCoordinates {
    @Prop({ required: true, min: 0 }) x: number;
    @Prop({ required: true, min: 0 }) y: number;
}
const teleportTileCoordinatesSchema = SchemaFactory.createForClass(TeleportTileCoordinates);

@Schema({ versionKey: false, _id: false })
class TeleportTiles {
    @Prop({ type: teleportTileCoordinatesSchema, required: false }) entryA?: TeleportTileCoordinates;
    @Prop({ type: teleportTileCoordinatesSchema, required: false }) entryB?: TeleportTileCoordinates;
}
const teleportTilesSchema = SchemaFactory.createForClass(TeleportTiles);

@Schema({ versionKey: false, _id: false })
export class TeleportChannel {
    @Prop({ required: true, min: 1, max: 5 }) channelNumber: number;
    @Prop({
        type: teleportTilesSchema,
        required: false,
    })
    tiles?: TeleportTiles;
}
export const teleportChannelSchema = SchemaFactory.createForClass(TeleportChannel);
