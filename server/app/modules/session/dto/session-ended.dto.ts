import { ApiProperty } from '@nestjs/swagger';

export class SessionEndedDto {
    @ApiProperty()
    message: string;
}
