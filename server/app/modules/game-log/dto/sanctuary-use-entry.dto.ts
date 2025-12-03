import { PlaceableKind } from '@common/enums/placeable-kind.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SanctuaryUseEntryDto {
    @ApiProperty()
    @IsString()
    sessionId: string;

    @ApiProperty()
    @IsString()
    playerId: string;

    @ApiProperty({ enum: PlaceableKind, enumName: 'PlaceableKind' })
    @IsEnum(PlaceableKind)
    kind: PlaceableKind;

    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    addedHealth?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    addedDefense?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    addedAttack?: number;
}
