import { TestBed } from '@angular/core/testing';
import { ResetService } from './reset.service';

describe('ResetService', () => {
    let service: ResetService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ResetService],
        });

        service = TestBed.inject(ResetService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('reset$', () => {
        it('should be an observable', () => {
            expect(service.reset$).toBeDefined();
            expect(service.reset$.subscribe).toBeDefined();
        });

        it('should emit when triggerReset is called', (done) => {
            service.reset$.subscribe(() => {
                done();
            });

            service.triggerReset();
        });

        it('should emit multiple times when triggerReset is called multiple times', () => {
            let emitCount = 0;
            const expectedEmitCount = 3;

            service.reset$.subscribe(() => {
                emitCount++;
            });

            service.triggerReset();
            service.triggerReset();
            service.triggerReset();

            expect(emitCount).toBe(expectedEmitCount);
        });

        it('should allow multiple subscribers', () => {
            let subscriber1Count = 0;
            let subscriber2Count = 0;
            const expectedCount = 1;

            service.reset$.subscribe(() => {
                subscriber1Count++;
            });

            service.reset$.subscribe(() => {
                subscriber2Count++;
            });

            service.triggerReset();

            expect(subscriber1Count).toBe(expectedCount);
            expect(subscriber2Count).toBe(expectedCount);
        });
    });

    describe('triggerReset', () => {
        it('should emit event on reset$ observable', (done) => {
            service.reset$.subscribe(() => {
                done();
            });

            service.triggerReset();
        });

        it('should emit event multiple times when called multiple times', () => {
            let emitCount = 0;
            const expectedEmitCount = 2;

            service.reset$.subscribe(() => {
                emitCount++;
            });

            service.triggerReset();
            service.triggerReset();

            expect(emitCount).toBe(expectedEmitCount);
        });

        it('should not throw error when called without subscribers', () => {
            expect(() => {
                service.triggerReset();
            }).not.toThrow();
        });
    });
});
