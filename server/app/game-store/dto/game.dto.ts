// server/src/games/dto/game.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { CreateGameDto } from './create-game.dto';

export class GameDto extends CreateGameDto {
    @ApiProperty({ example: '66e6a8c9f2d3a1b7c8e9f012' })
    @Expose()
    @Transform(({ obj }) => obj.id ?? obj._id?.toString())
    id: string;

    @ApiProperty({ example: '2025-09-15T03:12:34.000Z' })
    lastModified?: Date;
}
