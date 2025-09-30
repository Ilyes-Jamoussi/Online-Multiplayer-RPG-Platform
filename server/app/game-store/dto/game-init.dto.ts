import { MapSize } from '@common/enums/map-size.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class GameInitDto {
    @ApiProperty({ enum: MapSize, example: MapSize.MEDIUM, enumName: 'MapSize' })
    @IsEnum(MapSize)
    mapSize: MapSize;
}
