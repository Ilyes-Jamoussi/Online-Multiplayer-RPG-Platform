/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function -- OpenAPI DTO generation placeholders */
import { Controller, Post, Body } from '@nestjs/common';
import { SendMessageDto } from '@app/modules/chat/dto/send-message.dto';
import { LoadMessagesDto } from '@app/modules/chat/dto/load-messages.dto';

@Controller('chat')
export class ChatController {
    @Post('send')
    sendMessage(@Body() data: SendMessageDto): void {}

    @Post('load-messages')
    loadMessages(@Body() data: LoadMessagesDto): void {}
}
