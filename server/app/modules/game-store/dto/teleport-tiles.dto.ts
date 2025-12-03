import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export class TeleportTileCoordinatesDto {
    @ApiProperty()
    @IsInt()
    @Min(0)
    x!: number;

    @ApiProperty()
    @IsInt()
    @Min(0)
    y!: number;
}

export class TeleportTilesDto {
    @ApiPropertyOptional({ type: TeleportTileCoordinatesDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => TeleportTileCoordinatesDto)
    entryA?: TeleportTileCoordinatesDto;

    @ApiPropertyOptional({ type: TeleportTileCoordinatesDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => TeleportTileCoordinatesDto)
    entryB?: TeleportTileCoordinatesDto;
}
