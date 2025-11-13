import { GameMode } from '@common/enums/game-mode.enum';
import { MapSize } from '@common/enums/map-size.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Placeable, placeableSchema } from './placeable.entity';
import { TeleportChannel, teleportChannelSchema } from './teleport-channel.entity';
import { Tile, tileSchema } from './tile.entity';

@Schema({ versionKey: false })
export class Game {
    readonly _id?: Types.ObjectId;

    @Prop({ type: String, required: true, unique: true })
    name: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ required: true, enum: MapSize })
    size: MapSize;

    @Prop({ required: true, enum: GameMode })
    mode: GameMode;

    @Prop({ required: true, default: false })
    visibility: boolean;

    @Prop({ required: true, default: Date.now })
    lastModified: Date;

    @Prop({ required: true, default: Date.now })
    createdAt: Date;

    @Prop({ default: '' })
    gridPreviewUrl: string;

    @Prop({ type: [tileSchema], default: [] })
    tiles: Tile[];

    @Prop({ type: [placeableSchema], default: [] })
    objects: Placeable[];

    @Prop({ required: true })
    draft: boolean;

    @Prop({
        type: [teleportChannelSchema],
        default: [],
        validate: {
            validator: (value: TeleportChannel[]) => value.length <= 5,
            message: 'teleportChannels array cannot exceed 5 elements',
        },
    })
    teleportChannels: TeleportChannel[];
}
export const gameSchema = SchemaFactory.createForClass(Game);
