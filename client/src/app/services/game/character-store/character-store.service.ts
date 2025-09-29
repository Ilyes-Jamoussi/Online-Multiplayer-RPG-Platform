import { computed, Injectable, signal } from '@angular/core';
import { CHARACTER_AVATARS_COUNT, CHARACTER_BASE, CHARACTER_PLUS } from '@app/constants/character.constants';
import { BonusType, DiceType } from '@common/enums/character-creation.enum';
import { Character } from '@common/interfaces/character.interface';

const MAX_NAME_LENGTH = 8;

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

    setName(name: string) {
        this._name.set(name);
    }
    selectAvatar(index: number) {
        if (index >= 0 && index < CHARACTER_AVATARS_COUNT) this._avatar.set(index);
    }
    resetAvatar() {
        this._avatar.set(null);
    }
    setBonus(bonus: BonusType | null) {
        this._bonus.set(bonus);
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

    get isValid(): boolean {
        return this.isNameValid && this._avatar() !== null && this._bonus() !== null;
    }

    get isNameValid(): boolean {
        const name = this._name().trim();
        return name.length > 0 && name.length <= MAX_NAME_LENGTH && /^[a-zA-Z0-9]+$/.test(name);
    }

    get nameError(): string | null {
        const name = this._name().trim();
        if (name.length === 0) return 'Le nom est requis';
        if (name.length > MAX_NAME_LENGTH) return 'Maximum 8 caractères';
        if (!/^[a-zA-Z0-9]+$/.test(name)) return 'Lettres et chiffres seulement';
        return null;
    }

    resetForm() {
        this._name.set('');
        this._avatar.set(0);
        this._bonus.set(null);
        this._dice.set({ attack: DiceType.D4, defense: DiceType.D6 });
    }
}
