export interface TurnTimerData {
    timeout: NodeJS.Timeout | null;
    callback: () => void;
    startTime: number;
    duration: number;
    remainingTime: number;
}
