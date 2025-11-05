import { Avatar } from '@common/enums/avatar.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class AvatarAssignmentDto {
    @ApiProperty({ enum: Avatar, enumName: 'Avatar' })
    @IsEnum(Avatar)
    readonly avatar: Avatar;

    @ApiProperty({ nullable: true })
    @IsString()
    chosenBy: string | null;
}
