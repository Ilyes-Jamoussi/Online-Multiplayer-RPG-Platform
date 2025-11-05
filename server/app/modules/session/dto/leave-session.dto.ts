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

    @ApiProperty({ enum: Avatar, enumName: 'Avatar', nullable: true })
    @IsEnum(Avatar)
    readonly playerAvatar: Avatar | null;
}

export class SessionLeftDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    readonly playerName: string;

    @ApiProperty({ enum: Avatar, enumName: 'Avatar', nullable: true })
    @IsEnum(Avatar)
    readonly playerAvatar: Avatar | null;
}
