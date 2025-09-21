// editor-object.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { Orientation } from '@common/enums/orientation.enum';

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
    @Min(-1)
    x!: number;

    @ApiProperty()
    @IsInt()
    @Min(-1)
    y!: number;

    @ApiProperty()
    @IsBoolean()
    placed!: boolean;
}
