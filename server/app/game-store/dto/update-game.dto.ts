import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';


export class UpdateGameDto {
    @ApiProperty({ example: 'New game' })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({ example: 'Description…' })
    @IsString()
    @IsNotEmpty()
    readonly description: string;

    @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' })
    @IsString()
    @IsNotEmpty()
    readonly gridPreviewImage: string;
}
