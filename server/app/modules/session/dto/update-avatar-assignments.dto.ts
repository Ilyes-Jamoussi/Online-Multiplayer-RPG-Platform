import { Avatar } from '@common/enums/avatar.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class UpdateAvatarAssignmentsDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;

    @ApiProperty()
    @IsEnum(Avatar)
    readonly avatar: Avatar;
}

export class AvatarAssignmentDto {
    @ApiProperty()
    avatar: string;

    @ApiProperty({ nullable: true })
    chosenBy: string | null;
}

export class AvatarAssignmentsUpdatedDto {
    @ApiProperty({ type: [AvatarAssignmentDto] })
    readonly avatarAssignments: AvatarAssignmentDto[];
}
