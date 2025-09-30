import { PLACEABLE_UNPLACED_COORDINATE } from '@app/constants/game-config.constants';
import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GameEditorPlaceableDto {
    @ApiProperty()
    @IsString()
    id!: string;

    @ApiProperty({ enum: PlaceableKind })
    @IsEnum(PlaceableKind)
    kind!: PlaceableKind;

    @ApiProperty()
    @IsEnum(Orientation)
    @IsOptional()
    orientation?: Orientation;

    @ApiProperty()
    @IsInt()
    @Min(PLACEABLE_UNPLACED_COORDINATE)
    x!: number;

    @ApiProperty()
    @IsInt()
    @Min(PLACEABLE_UNPLACED_COORDINATE)
    y!: number;

    @ApiProperty()
    @IsBoolean()
    placed!: boolean;
}
