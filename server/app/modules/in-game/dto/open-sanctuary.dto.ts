import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';

export class OpenSanctuaryDto {
    @ApiProperty({ enum: PlaceableKind, enumName: 'PlaceableKind' })
    @IsEnum(PlaceableKind)
    kind: PlaceableKind;

    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;
}
