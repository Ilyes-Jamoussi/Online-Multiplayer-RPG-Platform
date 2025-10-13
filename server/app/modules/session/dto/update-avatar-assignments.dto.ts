import { Avatar } from '@common/enums/avatar.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { AvatarAssignmentDto } from './avatar-assignment.dto';

export class UpdateAvatarAssignmentsDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsEnum(Avatar)
    readonly avatar: Avatar;
}

export class AvatarAssignmentsUpdatedDto {
    @ApiProperty({ type: [AvatarAssignmentDto] })
    readonly avatarAssignments: AvatarAssignmentDto[];
}
