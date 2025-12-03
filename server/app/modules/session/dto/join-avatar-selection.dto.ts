import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class JoinAvatarSelectionDto {
    @ApiProperty()
    @IsString()
    readonly sessionId: string;
}

export class AvatarSelectionJoinedDto {
    @ApiProperty()
    @IsString()
    readonly playerId: string;

    @ApiProperty()
    @IsString()
    readonly sessionId: string;
}
