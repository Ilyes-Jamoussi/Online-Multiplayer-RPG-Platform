import { ElementRef, EventEmitter, NgZone } from '@angular/core';
import { TileSizeProbeDirective } from './tile-size-probe.directive';

type ROCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

class ResizeObserverStub implements ResizeObserver {
    static instances: ResizeObserverStub[] = [];
    static last(): ResizeObserverStub | undefined {
        return this.instances[this.instances.length - 1];
    }
    private readonly callback: ROCallback;
    observedNode: Element | null = null;
    disconnected = false;
    constructor(callback: ROCallback) {
        this.callback = callback;
        ResizeObserverStub.instances.push(this);
    }
    observe(target: Element): void {
        this.observedNode = target;
    }
    unobserve(): void {
        /** no-op */
    }
    disconnect(): void {
        this.disconnected = true;
    }
    trigger(width: number, height: number): void {
        const entry = { contentRect: { width, height } } as ResizeObserverEntry;
        this.callback([entry], this as unknown as ResizeObserver);
    }
}

const INACTIVE_W = 120;
const INACTIVE_H = 80;

const ACTIVE_INIT_W = 120;
const ACTIVE_INIT_H = 50;
const ACTIVE_INIT_MIN = 50;

const RESIZE_SETUP_W = 90;
const RESIZE_SETUP_H = 60;
const RESIZE_TRIGGER_W = 80;
const RESIZE_TRIGGER_H = 70;

const DESTROY_W = 100;
const DESTROY_H = 40;

const TEARDOWN_FIRST_W = 100;
const TEARDOWN_FIRST_H = 80;
const TEARDOWN_SECOND_W = 60;
const TEARDOWN_SECOND_H = 90;
const TEARDOWN_FIRST_EMIT = 80;
const TEARDOWN_SECOND_EMIT = 60;

const INACTIVE_SWITCH_W = 110;
const INACTIVE_SWITCH_H = 70;
const INACTIVE_SWITCH_EMIT = 70;

describe('TileSizeProbeDirective', () => {
    let originalRO: typeof ResizeObserver;
    let host: HTMLElement;
    let elRef: ElementRef<HTMLElement>;
    let zone: NgZone;
    let directive: TileSizeProbeDirective;
    let emitted: number[];
    let rectSpy: jasmine.Spy<() => DOMRect>;

    function setRect(width: number, height: number): void {
        rectSpy.and.returnValue({ width, height } as DOMRect);
    }

    function requireLast(): ResizeObserverStub {
        const resizeObserver = ResizeObserverStub.last();
        if (!resizeObserver) throw new Error('ResizeObserver not created');
        return resizeObserver;
    }

    beforeAll(() => {
        originalRO = (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver;
        (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
    });

    afterAll(() => {
        (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = originalRO;
    });

    beforeEach(() => {
        host = document.createElement('div');
        document.body.appendChild(host);
        elRef = new ElementRef<HTMLElement>(host);
        const fakeZone: Pick<NgZone, 'runOutsideAngular' | 'run'> = {
            runOutsideAngular: <T>(functionToRun: () => T): T => functionToRun(),
            run: <T>(functionToRun: () => T): T => functionToRun(),
        };
        zone = fakeZone as NgZone;
        directive = new TileSizeProbeDirective(elRef, zone);
        emitted = [];
        directive.sizeChange = new EventEmitter<number>();
        directive.sizeChange.subscribe((value) => emitted.push(value));
        ResizeObserverStub.instances = [];
        rectSpy = spyOn(host, 'getBoundingClientRect').and.returnValue({ width: 1, height: 1 } as DOMRect);
    });

    afterEach(() => {
        directive.ngOnDestroy();
        document.body.removeChild(host);
    });

    it('should not emit nor observe when probe is inactive', () => {
        directive.probeActive = false;
        setRect(INACTIVE_W, INACTIVE_H);
        directive.ngOnChanges();
        expect(emitted.length).toBe(0);
        expect(ResizeObserverStub.instances.length).toBe(0);
    });

    it('should emit initial min(width,height) and start observing when active', () => {
        directive.probeActive = true;
        setRect(ACTIVE_INIT_W, ACTIVE_INIT_H);
        directive.ngOnChanges();
        expect(emitted).toEqual([ACTIVE_INIT_MIN]);
        const resizeObserver = requireLast();
        expect(resizeObserver.observedNode).toBe(host);
    });

    it('should emit on resize via ResizeObserver callback', () => {
        directive.probeActive = true;
        setRect(RESIZE_SETUP_W, RESIZE_SETUP_H);
        directive.ngOnChanges();
        const resizeObserver = requireLast();
        resizeObserver.trigger(RESIZE_TRIGGER_W, RESIZE_TRIGGER_H);
        expect(emitted[0]).toBe(RESIZE_SETUP_H);
        expect(emitted[1]).toBe(RESIZE_TRIGGER_H);
    });

    it('ngOnDestroy should disconnect observer', () => {
        directive.probeActive = true;
        setRect(DESTROY_W, DESTROY_H);
        directive.ngOnChanges();
        const resizeObserver = requireLast();
        directive.ngOnDestroy();
        expect(resizeObserver.disconnected).toBeTrue();
    });

    it('calling ngOnChanges twice active should teardown previous and create a new observer', () => {
        directive.probeActive = true;
        setRect(TEARDOWN_FIRST_W, TEARDOWN_FIRST_H);
        directive.ngOnChanges();
        const resizeObserver1 = requireLast();
        setRect(TEARDOWN_SECOND_W, TEARDOWN_SECOND_H);
        directive.ngOnChanges();
        const resizeObserver2 = requireLast();
        expect(resizeObserver1).not.toBe(resizeObserver2);
        expect(resizeObserver1.disconnected).toBeTrue();
        expect(emitted[0]).toBe(TEARDOWN_FIRST_EMIT);
        expect(emitted[1]).toBe(TEARDOWN_SECOND_EMIT);
    });

    it('switching to inactive should teardown existing observer and not re-emit', () => {
        directive.probeActive = true;
        setRect(INACTIVE_SWITCH_W, INACTIVE_SWITCH_H);
        directive.ngOnChanges();
        const resizeObserver = requireLast();
        directive.probeActive = false;
        directive.ngOnChanges();
        expect(resizeObserver.disconnected).toBeTrue();
        expect(emitted).toEqual([INACTIVE_SWITCH_EMIT]);
        expect(ResizeObserverStub.instances.length).toBe(1);
    });
});
