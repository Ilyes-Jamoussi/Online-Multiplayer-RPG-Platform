export interface CharacterAttributes {
    vie: number;
    rapidite: number;
    attaque: number;
    defense: number;
}

export interface DiceAssignment {
    attaque: 'D4' | 'D6';
    defense: 'D4' | 'D6';
}

export interface Character {
    name: string;
    avatar: number;
    attributes: CharacterAttributes;
    bonus: 'vie' | 'rapidite' | null;
    diceAssignment: DiceAssignment;
}
