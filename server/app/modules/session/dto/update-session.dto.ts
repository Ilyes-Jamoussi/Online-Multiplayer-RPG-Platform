import { ApiProperty } from '@nestjs/swagger';

export class SessionPlayerDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    isAdmin: boolean;
}

export class SessionPlayersUpdatedDto {
    @ApiProperty({ type: [SessionPlayerDto] })
    players: SessionPlayerDto[];
}
