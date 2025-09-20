import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { TileKind } from '@common/enums/tile-kind.enum';

export class GameEditorTileDto {
    @ApiProperty({ enum: TileKind })
    @IsEnum(TileKind)
    kind!: TileKind;

    @ApiProperty() @IsInt() @Min(0) x!: number;
    @ApiProperty() @IsInt() @Min(0) y!: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    open?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Min(1)
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    @Max(5)
    teleportChannel?: number;
}
