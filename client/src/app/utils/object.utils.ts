export function pickChangedProperties<T extends object>(current: T, initial: T): Partial<T> {
    const out: Partial<T> = {};
    for (const k of Object.keys(current) as (keyof T)[]) {
        if (current[k] !== initial[k]) out[k] = current[k];
    }
    return out;
}

