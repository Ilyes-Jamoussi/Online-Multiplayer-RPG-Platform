import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
    @ApiProperty()
    authorId: string;

    @ApiProperty()
    authorName: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    timestamp: string;
}

export class LoadMessagesDto {
    @ApiProperty({ type: [ChatMessageDto] })
    messages: ChatMessageDto[];
}
