import { computed, Injectable, Signal, signal } from '@angular/core';

export type BonusKey = 'life' | 'speed';
export type Dice = 'D4' | 'D6';
export type DiceAttr = 'attack' | 'defense';

export interface Attributes {
    life: number;
    speed: number;
    attack: number;
    defense: number;
}

export interface CharacterForm {
    name: string;
    avatar: number | null;
    bonus: BonusKey | null;
    diceAssignment: { attack: Dice; defense: Dice };
    attributes: Attributes;
}

const BASE = 4;
const BONUS = 2;
const AVATAR_COUNT = 12;

@Injectable({ providedIn: 'root' })
export class CharacterStoreService {
    // état
    private readonly _name = signal<string>('');
    private readonly _avatar = signal<number | null>(null);
    private readonly _bonus = signal<BonusKey | null>(null);
    private readonly _dice = signal<{ attack: Dice; defense: Dice }>({ attack: 'D4', defense: 'D6' });

    // attributs calculés
    private readonly _attributes = computed<Attributes>(() => {
        const a: Attributes = { life: BASE, speed: BASE, attack: BASE, defense: BASE };
        const b = this._bonus();
        const d = this._dice();
        if (b) a[b] += BONUS;
        if (d.attack === 'D6') a.attack += BONUS;
        if (d.defense === 'D6') a.defense += BONUS;
        return a;
    });

    // exposé au composant
    get character(): Signal<CharacterForm> {
        return computed(() => ({
            name: this._name(),
            avatar: this._avatar(),
            bonus: this._bonus(),
            diceAssignment: this._dice(),
            attributes: this._attributes(),
        }));
    }

    get avatars(): number[] {
        return Array.from({ length: AVATAR_COUNT }, (_, i) => i);
    }

    // mutateurs
    setName(name: string) { this._name.set(name); }
    selectAvatar(index: number) { if (index >= 0 && index < AVATAR_COUNT) this._avatar.set(index); }
    resetAvatar() { this._avatar.set(null); }
    setBonus(bonus: BonusKey | null) { this._bonus.set(bonus); }

    setDice(attr: DiceAttr, value: Dice) {
        if (attr === 'attack') this._dice.set({ attack: value, defense: value === 'D6' ? 'D4' : 'D6' });
        else this._dice.set({ attack: value === 'D6' ? 'D4' : 'D6', defense: value });
    }

    generateRandom() {
        const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Samwise', 'Boromir', 'Faramir', 'Eowyn', 'Arwen', 'Galadriel', 'Elrond'];
        this._name.set(names[Math.floor(Math.random() * names.length)]);
        this._avatar.set(Math.floor(Math.random() * AVATAR_COUNT));
        this._bonus.set(Math.random() < 0.5 ? 'life' : 'speed');
        this.setDice(Math.random() < 0.5 ? 'attack' : 'defense', 'D6');
    }

    isValid(): boolean {
        return this._name().trim().length > 0 && this._bonus() !== null;
    }

    resetForm() {
        this._name.set('');
        this._avatar.set(0);
        this._bonus.set(null);
        this._dice.set({ attack: 'D4', defense: 'D6' });
    }
}
