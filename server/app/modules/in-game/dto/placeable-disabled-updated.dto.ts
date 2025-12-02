import { Position } from '@common/interfaces/position.interface';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceableDisabledUpdatedDto {
    @ApiProperty({ required: false })
    placeableId?: string;

    @ApiProperty({ type: [Object] })
    positions: Position[];

    @ApiProperty()
    turnCount: number;
}
