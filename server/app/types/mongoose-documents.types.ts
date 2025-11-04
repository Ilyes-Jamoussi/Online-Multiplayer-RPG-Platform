import { Document } from 'mongoose';
import { Game } from '@app/modules/game-store/entities/game.entity';
import { Tile } from '@app/modules/game-store/entities/tile.entity';

export type GameDocument = Game & Document;
export type TileDocument = Tile & Document;
