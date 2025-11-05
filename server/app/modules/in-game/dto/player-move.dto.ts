import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Orientation } from '@common/enums/orientation.enum';

export class PlayerMoveDto {
    @ApiProperty()
    @IsString()
    sessionId: string;

    @ApiProperty({ enum: Orientation, enumName: 'Orientation' })
    @IsEnum(Orientation)
    orientation: Orientation;
}
