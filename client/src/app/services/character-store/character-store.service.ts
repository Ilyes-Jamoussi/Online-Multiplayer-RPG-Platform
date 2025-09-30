import { computed, Injectable, signal } from '@angular/core';
import { CHARACTER_AVATARS_COUNT, CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { BonusType, DiceType } from '@common/enums/character-creation.enum';
import { Character } from '@common/interfaces/character.interface';

@Injectable({ providedIn: 'root' })
export class CharacterStoreService {
    private readonly _name = signal('');
    private readonly _avatar = signal<number | null>(null);
    private readonly _bonus = signal<BonusType | null>(null);
    private readonly _dice = signal<{ attack: DiceType; defense: DiceType }>({ attack: DiceType.D4, defense: DiceType.D6 });

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

    get avatars(): number[] {
        return Array.from({ length: CHARACTER_AVATARS_COUNT }, (_, i) => i);
    }

    set name(name: string) {
        this._name.set(name);
    }

    set bonus(bonus: BonusType | null) {
        this._bonus.set(bonus);
    }

    set avatar(avatar: number | null) {
        if (avatar !== null && avatar >= 0 && avatar < CHARACTER_AVATARS_COUNT) this._avatar.set(avatar);
    }

    setDice(attr: 'attack' | 'defense', value: DiceType) {
        if (attr === 'attack') this._dice.set({ attack: value, defense: value === DiceType.D6 ? DiceType.D4 : DiceType.D6 });
        else this._dice.set({ attack: value === DiceType.D6 ? DiceType.D4 : DiceType.D6, defense: value });
    }

    generateRandom() {
        const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Samwise', 'Boromir', 'Faramir', 'Eowyn', 'Arwen', 'Galadriel', 'Elrond'];
        this._name.set(names[Math.floor(Math.random() * names.length)]);
        this._avatar.set(Math.floor(Math.random() * CHARACTER_AVATARS_COUNT));
        const RANDOM_THRESHOLD = 0.5;
        this._bonus.set(Math.random() < RANDOM_THRESHOLD ? BonusType.Life : BonusType.Speed);
        this.setDice(Math.random() < RANDOM_THRESHOLD ? 'attack' : 'defense', DiceType.D6);
    }
}
