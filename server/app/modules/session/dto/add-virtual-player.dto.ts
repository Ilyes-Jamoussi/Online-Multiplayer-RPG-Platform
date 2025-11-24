import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';

export class AddVirtualPlayerDto {
    @ApiProperty()
    @IsString()
    sessionId: string;

    @ApiProperty({
        enum: VirtualPlayerType,
        enumName: 'VirtualPlayerType',
    })
    @IsEnum(VirtualPlayerType)
    virtualPlayerType: VirtualPlayerType;
}
