/**
    Tous les jeux existants doivent être listés. Un élément doit comporter les info suivantes:
    • Nom du jeu
    • Taille de la carte de jeu
    • Mode de jeu
    • Image de prévisualisation de la carte
    • Date de dernière modification du jeu (sauvegarde dans l’éditeur)
*/
export type GameDimension = '10x10' | '15x15' | '20x20';
export type GameMode = 'classique' | 'ctf';

export interface Game {
    id: string;
    name: string;
    mapSize: GameDimension;
    gameMode: GameMode;
    previewImageUrl: string;
    lastEdit: string;
    visible: boolean;
    description: string;
}
