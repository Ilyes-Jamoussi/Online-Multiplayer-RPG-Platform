import { MAX_TELEPORT_CHANNEL, MIN_TELEPORT_CHANNEL } from '@app/constants/game-config.constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';
import { TeleportTilesDto } from './teleport-tiles.dto';

export class TeleportChannelDto {
    @ApiProperty()
    @IsInt()
    @Min(MIN_TELEPORT_CHANNEL)
    @Max(MAX_TELEPORT_CHANNEL)
    channelNumber!: number;

    @ApiProperty()
    @IsObject()
    @IsOptional()
    tiles?: TeleportTilesDto;
}
