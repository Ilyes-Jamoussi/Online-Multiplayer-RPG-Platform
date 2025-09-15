import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { CreateGameDto, PlaceableCreateDto, TileCreateDto } from './create-game.dto';

export class UpdateGameDto extends PartialType(CreateGameDto) {
    @ApiPropertyOptional({
        type: [TileCreateDto],
        description: 'Tiles array of non-BASE tiles.',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TileCreateDto)
    tiles?: TileCreateDto[];

    @ApiPropertyOptional({
        type: [PlaceableCreateDto],
        description: 'Array of placed objects.',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlaceableCreateDto)
    objects?: PlaceableCreateDto[];
}
