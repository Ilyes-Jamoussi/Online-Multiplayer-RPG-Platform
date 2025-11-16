import { AvailableActionType } from '@common/enums/available-action-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, ValidateNested } from 'class-validator';

export class AvailableActionDto {
    @ApiProperty({ enum: AvailableActionType, enumName: 'AvailableActionType' })
    @IsEnum(AvailableActionType)
    type: AvailableActionType;

    @ApiProperty()
    @IsNumber()
    x: number;

    @ApiProperty()
    @IsNumber()
    y: number;
}

export class AvailableActionsDto {
    @ApiProperty({ type: [AvailableActionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AvailableActionDto)
    availableActions: AvailableActionDto[];
}
