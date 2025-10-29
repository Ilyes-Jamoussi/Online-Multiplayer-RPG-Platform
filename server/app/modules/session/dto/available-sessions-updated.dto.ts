import { ApiProperty } from '@nestjs/swagger';

export class SessionPreviewDto {
    @ApiProperty()
    readonly id: string;

    @ApiProperty()
    readonly currentPlayers: number;

    @ApiProperty()
    readonly maxPlayers: number;
}

export class AvailableSessionsUpdatedDto {
    @ApiProperty({ type: [SessionPreviewDto] })
    readonly sessions: SessionPreviewDto[];
}
