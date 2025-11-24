import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ResetService {
    private readonly resetSubject = new Subject<void>();
    readonly reset$ = this.resetSubject.asObservable();

    triggerReset(): void {
        this.resetSubject.next();
    }
}
