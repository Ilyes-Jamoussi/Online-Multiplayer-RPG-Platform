import { Controller, Post, Body } from '@nestjs/common';
import { SendMessageDto } from '../dto/send-message.dto';
import { LoadMessagesDto } from '../dto/load-messages.dto';

@Controller('chat')
export class ChatController {
    @Post('send')
    sendMessage(@Body() data: SendMessageDto): void {}

    @Post('load-messages')
    loadMessages(@Body() data: LoadMessagesDto): void {}
}
