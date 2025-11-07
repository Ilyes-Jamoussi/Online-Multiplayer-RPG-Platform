import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    @MaxLength(200)
    content: string;
}
