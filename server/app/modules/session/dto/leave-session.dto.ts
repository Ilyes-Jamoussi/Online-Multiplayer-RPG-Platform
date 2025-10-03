import { Avatar } from '@common/enums/avatar.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class LeaveSessionDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    readonly playerName: string;

    @ApiProperty()
    @IsEnum(Avatar)
    readonly playerAvatar: Avatar;
}

export class SessionLeftDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    readonly playerName: string;

    @ApiProperty()
    @IsEnum(Avatar)
    readonly playerAvatar: Avatar;
}
