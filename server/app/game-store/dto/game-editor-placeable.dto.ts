// editor-object.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';

export class GameEditorPlaceableDto {
    @ApiProperty()
    @IsString()
    id!: string;

    @ApiProperty({ enum: PlaceableKind })
    @IsEnum(PlaceableKind)
    kind!: PlaceableKind;

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
