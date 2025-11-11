import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MAX_CHAT_MESSAGE_LENGTH } from '@common/constants/chat';

export class SendMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    authorName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
    content: string;

    @ApiProperty()
    @IsBoolean()
    isGameStarted: boolean;
}
