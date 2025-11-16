import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { VirtualPlayerType } from '@common/enums/virtual-player-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class PlayerUpdatedDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: Avatar, nullable: true })
    avatar: Avatar | null;

    @ApiProperty()
    isAdmin: boolean;

    @ApiProperty()
    baseHealth: number;

    @ApiProperty()
    healthBonus: number;

    @ApiProperty()
    health: number;

    @ApiProperty()
    maxHealth: number;

    @ApiProperty()
    baseSpeed: number;

    @ApiProperty()
    speedBonus: number;

    @ApiProperty()
    speed: number;

    @ApiProperty()
    boatSpeedBonus: number;

    @ApiProperty()
    boatSpeed: number;

    @ApiProperty()
    baseAttack: number;

    @ApiProperty()
    attackBonus: number;

    @ApiProperty()
    baseDefense: number;

    @ApiProperty()
    defenseBonus: number;

    @ApiProperty({ enum: Dice })
    attackDice: Dice;

    @ApiProperty({ enum: Dice })
    defenseDice: Dice;

    @ApiProperty()
    x: number;

    @ApiProperty()
    y: number;

    @ApiProperty()
    isInGame: boolean;

    @ApiProperty()
    startPointId: string;

    @ApiProperty()
    actionsRemaining: number;

    @ApiProperty()
    combatCount: number;

    @ApiProperty()
    combatWins: number;

    @ApiProperty()
    combatLosses: number;

    @ApiProperty()
    combatDraws: number;

    @ApiProperty()
    hasCombatBonus: boolean;

    @ApiProperty({ required: false })
    onBoatId?: string;

    @ApiProperty({ enum: VirtualPlayerType, required: false })
    virtualPlayerType?: VirtualPlayerType;
}
