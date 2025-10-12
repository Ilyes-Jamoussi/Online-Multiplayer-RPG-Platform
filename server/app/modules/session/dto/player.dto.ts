import { Avatar } from '@common/enums/avatar.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

export class PlayerDto {
    @ApiProperty()
    @IsString()
    readonly id: string;

    @ApiProperty()
    @IsString()
    readonly name: string;

    @ApiProperty({ enum: Avatar, enumName: 'Avatar', nullable: true })
    @IsEnum(Avatar)
    readonly avatar: Avatar | null;

    @ApiProperty()
    @IsBoolean()
    readonly isAdmin: boolean;
}
