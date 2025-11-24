import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class SanctuaryActionSuccessDto {
    @ApiProperty({ enum: PlaceableKind, enumName: 'PlaceableKind' })
    @IsEnum(PlaceableKind)
    kind: PlaceableKind;

    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;

    @ApiProperty()
    @IsBoolean()
    success: boolean;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    addedHealth?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    addedDefense?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    addedAttack?: number;
}
