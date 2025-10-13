import { Injectable, signal } from '@angular/core';
import { CHARACTER_BASE } from '@app/constants/character.constants';
import { Avatar } from '@common/enums/avatar.enum';
import { Dice } from '@common/enums/dice.enum';
import { Character } from '@common/interfaces/character.interface';

@Injectable({
    providedIn: 'root'
})
export class CharacterStoreService {
    private readonly _character = signal<Character | null>(null);

    get character() {
        return this._character.asReadonly();
    }

    setCharacter(character: Character): void {
        this._character.set(character);
    }

    clearCharacter(): void {
        this._character.set(null);
    }

    // Getters pour les stats calculées
    get lifePoints(): number {
        const char = this._character();
        if (!char) return CHARACTER_BASE;
        return char.attributes.life;
    }

    get speedPoints(): number {
        const char = this._character();
        if (!char) return CHARACTER_BASE;
        return char.attributes.speed;
    }

    get attackPoints(): number {
        return CHARACTER_BASE;
    }

    get defensePoints(): number {
        return CHARACTER_BASE;
    }

    get attackDice(): Dice {
        const char = this._character();
        return char?.diceAssignment.attack || Dice.D4;
    }

    get defenseDice(): Dice {
        const char = this._character();
        return char?.diceAssignment.defense || Dice.D6;
    }

    get name(): string {
        const char = this._character();
        return char?.name || 'Joueur';
    }

    get avatar(): Avatar | null {
        const char = this._character();
        return char?.avatar || null;
    }
}
