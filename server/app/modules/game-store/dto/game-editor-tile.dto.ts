import { MAX_TELEPORT_CHANNEL, MIN_TELEPORT_CHANNEL } from '@app/constants/game-config.constants';
import { TileKind } from '@common/enums/tile.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GameEditorTileDto {
    @ApiProperty({ enum: TileKind, enumName: 'TileKind' })
    @IsEnum(TileKind)
    kind!: TileKind;

    @ApiProperty()
    @IsInt()
    @Min(0)
    x!: number;

    @ApiProperty()
    @IsInt()
    @Min(0)
    y!: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    open?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Min(MIN_TELEPORT_CHANNEL)
    @Max(MAX_TELEPORT_CHANNEL)
    teleportChannel?: number;
}
