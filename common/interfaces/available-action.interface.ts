export interface AvailableAction {
    type: 'ATTACK' | 'DOOR' | 'HEAL' | 'FIGHT' | 'BOAT' | 'DISEMBARK';
    x: number;
    y: number;
}
