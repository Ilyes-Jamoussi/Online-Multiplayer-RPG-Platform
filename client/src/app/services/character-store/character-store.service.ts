import { computed, Injectable, signal } from '@angular/core';
import { CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { Avatar } from '@common/enums/avatar.enum';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';

import { Character } from '@common/interfaces/character.interface';

@Injectable()
export class CharacterStoreService {
    private readonly _name = signal('');
    private readonly _avatar = signal<Avatar | null>(null);
    private readonly _bonus = signal<BonusType | null>(null);
    private readonly _dice = signal<{ attack: Dice; defense: Dice }>({ attack: Dice.D4, defense: Dice.D6 });

    private readonly _attributes = computed(() => {
        const bonus = this._bonus();
        return {
            life: bonus === BonusType.Life ? CHARACTER_BASE + CHARACTER_PLUS : CHARACTER_BASE,
            speed: bonus === BonusType.Speed ? CHARACTER_BASE + CHARACTER_PLUS : CHARACTER_BASE,
        };
    });

    readonly character = computed<Character>(() => ({
        name: this._name(),
        avatar: this._avatar(),
        bonus: this._bonus(),
        diceAssignment: this._dice(),
        attributes: this._attributes(),
    }));

    get avatars(): Avatar[] {
        return Object.values(Avatar);
    }

    set name(name: string) {
        this._name.set(name);
    }

    set bonus(bonus: BonusType | null) {
        this._bonus.set(bonus);
    }

    set avatar(avatar: Avatar | null) {
        this._avatar.set(avatar);
    }

    setDice(attr: 'attack' | 'defense', value: Dice) {
        if (attr === 'attack') this._dice.set({ attack: value, defense: value === Dice.D6 ? Dice.D4 : Dice.D6 });
        else this._dice.set({ attack: value === Dice.D6 ? Dice.D4 : Dice.D6, defense: value });
    }

    generateRandom() {
        const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Samwise', 'Boromir', 'Faramir', 'Eowyn', 'Arwen', 'Galadriel', 'Elrond'];
        const avatars = Object.values(Avatar);
        this._name.set(names[Math.floor(Math.random() * names.length)]);
        this._avatar.set(avatars[Math.floor(Math.random() * avatars.length)]);
        const RANDOM_THRESHOLD = 0.5;
        this._bonus.set(Math.random() < RANDOM_THRESHOLD ? BonusType.Life : BonusType.Speed);
        this.setDice(Math.random() < RANDOM_THRESHOLD ? 'attack' : 'defense', Dice.D6);
    }
}
