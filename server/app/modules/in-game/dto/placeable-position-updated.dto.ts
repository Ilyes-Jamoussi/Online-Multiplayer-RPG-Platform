import { Orientation } from '@common/enums/orientation.enum';
import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class PlaceablePositionUpdatedDto {
    @ApiProperty({ required: false })
    _id?: string;

    @ApiProperty({ enum: PlaceableKind, enumName: 'PlaceableKind' })
    @IsEnum(PlaceableKind)
    kind: PlaceableKind;

    @ApiProperty()
    x: number;

    @ApiProperty()
    y: number;

    @ApiProperty()
    placed: boolean;

    @ApiProperty({ enum: Orientation, enumName: 'Orientation', required: false })
    @IsEnum(Orientation)
    @IsOptional()
    orientation?: Orientation;
}
