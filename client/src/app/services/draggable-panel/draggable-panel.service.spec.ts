/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { DraggablePanelService, DraggablePanelConfig } from './draggable-panel.service';

describe('DraggablePanelService', () => {
    let service: DraggablePanelService;
    let doc: Document;
    let win: Window;
    let rootEl: HTMLElement;
    let handleEl: HTMLElement;

    const BASE_CFG: DraggablePanelConfig = {
        title: 'Outils',
        initialX: 100,
        initialY: 120,
        clamp: 'viewport',
        snap: 1,
        zIndex: 2000,
        disabled: false,
        storageKey: 'panel:test',
        startCollapsed: undefined,
    };

    // Helpers

    function createEls() {
        rootEl = doc.createElement('div');
        handleEl = doc.createElement('div');
        rootEl.appendChild(handleEl);
        doc.body.appendChild(rootEl);

        // Mock dimensions for clamp (200x100)
        spyOn(rootEl, 'getBoundingClientRect').and.returnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 200,
            bottom: 100,
            width: 200,
            height: 100,
            toJSON: () => ({}),
        } as DOMRect);
    }

    function attach(cfg: Partial<DraggablePanelConfig> = {}) {
        service.attach(rootEl, handleEl, { ...BASE_CFG, ...cfg });
        // queueMicrotask in attach -> flush microtask
        flush();
    }

    function pointerDownOn(el: Element, x = 10, y = 20) {
        const ev = new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true });
        el.dispatchEvent(ev);
        return ev;
    }

    function pointerMoveOn(target: EventTarget, x: number, y: number) {
        const ev = new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true, cancelable: true });
        target.dispatchEvent(ev);
        return ev;
    }

    function pointerUpOn(target: EventTarget) {
        const ev = new PointerEvent('pointerup', { bubbles: true });
        target.dispatchEvent(ev);
        return ev;
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DraggablePanelService],
        });
        service = TestBed.inject(DraggablePanelService);
        doc = TestBed.inject(DOCUMENT);
        win = doc.defaultView as Window;

        // Clean/spy localStorage
        win.localStorage.clear();
        spyOn(win.localStorage, 'setItem').and.callThrough();
        spyOn(win.localStorage, 'getItem').and.callThrough();
        spyOn(win.localStorage, 'removeItem').and.callThrough();
        spyOn(win.localStorage, 'clear').and.callThrough();
    });

    afterEach(() => {
        try {
            if (doc.body.contains(rootEl)) {
                doc.body.removeChild(rootEl);
            }
        } catch {
            // ignore
        }
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('getters return signals', () => {
        expect(service.dragging).toBeFalse();
        expect(service.isCollapsed).toBeFalse();
        expect(service.pos).toEqual({ x: 0, y: 0 });
    });

    it('attach() initializes position, applies clamp async and registers listeners', fakeAsync(() => {
        createEls();

        // Window 800x600
        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(800);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(600);

        const addSpy = spyOn(win, 'addEventListener').and.callThrough();

        attach();

        // initial position
        expect(service['_pos']()).toEqual({ x: 100, y: 120 });
        // styles
        expect(service.styleLeft()).toBe('100px');
        expect(service.styleTop()).toBe('120px');
        expect(service.styleZ()).toBe(BASE_CFG.zIndex);

        // resize listeners added
        expect(addSpy).toHaveBeenCalledWith('resize', jasmine.any(Function), { passive: true });
    }));

    it('drag -> move (snap=1) -> up: updates pos, emits positionCommitted and persists', fakeAsync(() => {
        createEls();
        handleEl.setPointerCapture = () => {
            /**/
        };
        handleEl.releasePointerCapture = () => {
            /**/
        };

        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(800);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(600);

        attach({ snap: 1, storageKey: 'panel:drag' });

        const committed: { x: number; y: number }[] = [];
        const sub = service.positionCommitted.subscribe((v) => committed.push(v));

        pointerDownOn(handleEl, 200, 200);
        expect(service['_dragging']()).toBeTrue();

        const pm = pointerMoveOn(handleEl, 260, 250);
        expect(pm.defaultPrevented).toBeTrue();
        expect(service['_pos']()).toEqual({ x: 160, y: 170 });

        pointerUpOn(handleEl);
        expect(service['_dragging']()).toBeFalse();
        expect(committed[committed.length - 1]).toEqual({ x: 160, y: 170 });

        const raw = win.localStorage.getItem('panel:drag');
        expect(raw).toBeTruthy();
        expect(JSON.parse(raw ?? '{}')).toEqual({ x: 160, y: 170 });

        sub.unsubscribe();
    }));

    it('clamp limits position in the viewport (margin=6)', fakeAsync(() => {
        createEls();
        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(300);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(200);
        attach({ clamp: 'viewport' });

        // Force a negative position then clamp via internal method
        service['_pos'].set({ x: -1000, y: -500 });
        service.clampToViewport();
        // width=200 height=100 => maxX = 300-200-6=94, maxY = 200-100-6=94
        expect(service['_pos']()).toEqual({ x: 6, y: 6 });

        // Position too large
        service['_pos'].set({ x: 999, y: 999 });
        service.clampToViewport();
        expect(service['_pos']()).toEqual({ x: 94, y: 94 });
    }));

    it('resize triggers clamp + commit + persist', fakeAsync(() => {
        createEls();
        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(300);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(200);
        attach({ storageKey: 'panel:resize' });

        const committed: { x: number; y: number }[] = [];
        const sub = service.positionCommitted.subscribe((v) => committed.push(v));

        // place at an out-of-bounds position and trigger resize
        service['_pos'].set({ x: 999, y: 999 });
        win.dispatchEvent(new Event('resize')); // boundResize
        // expected clamp (94,94)
        expect(service['_pos']()).toEqual({ x: 94, y: 94 });
        // commit + persist
        expect(committed[committed.length - 1]).toEqual({ x: 94, y: 94 });
        const resizeItem = win.localStorage.getItem('panel:resize');
        expect(resizeItem).toBeTruthy();
        expect(JSON.parse(resizeItem ?? '{}')).toEqual({ x: 94, y: 94 });

        sub.unsubscribe();
    }));

    it('toggleCollapsed / startCollapsed / collapsed persistence', fakeAsync(() => {
        createEls();
        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(800);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(600);

        attach({ storageKey: 'panel:collapsed', startCollapsed: true });
        expect(service.isCollapsed).toBeTrue();
        service.toggleCollapsed();
        expect(service.isCollapsed).toBeFalse();
        service.setCollapsed(true);
        flush(); // Ensure async completion
        expect(win.localStorage.setItem).toHaveBeenCalledWith('panel:collapsed:collapsed', '1');
        expect(win.localStorage.getItem('panel:collapsed:collapsed')).toBe('1');
    }));

    it('loads position and collapsed from localStorage (valid and invalid)', fakeAsync(() => {
        // Valid case: collapsed loaded from localStorage
        createEls();
        spyOnProperty(win, 'innerWidth', 'get').and.returnValue(800);
        spyOnProperty(win, 'innerHeight', 'get').and.returnValue(600);

        win.localStorage.setItem('panel:load', JSON.stringify({ x: 10, y: 20 }));
        win.localStorage.setItem('panel:load:collapsed', '1');

        attach({ storageKey: 'panel:load', initialX: 5, initialY: 6 });
        expect(service['_pos']()).toEqual({ x: 10, y: 20 });
        expect(service.isCollapsed).toBeTrue();

        // Invalid case: collapsed missing or storage corrupted, startCollapsed false
        const svc2 = TestBed.inject(DraggablePanelService);
        const root2 = doc.createElement('div');
        const handle2 = doc.createElement('div');
        root2.appendChild(handle2);
        doc.body.appendChild(root2);
        spyOn(root2, 'getBoundingClientRect').and.returnValue({
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 200,
            bottom: 100,
            width: 200,
            height: 100,
            toJSON: () => ({}),
        } as DOMRect);

        win.localStorage.setItem('panel:bad', '{not-json');
        win.localStorage.removeItem('panel:bad:collapsed');

        svc2.attach(root2, handle2, { ...BASE_CFG, storageKey: 'panel:bad', initialX: 7, initialY: 8, startCollapsed: false });
        flush();
        // falls back to initialX/initialY
        expect(svc2['_pos']()).toEqual({ x: 7, y: 8 });
        // collapsed defaults to false if nothing in storage
        expect(svc2.isCollapsed).toBeFalse();
    }));

    it('styleLeft/styleTop/styleZ reflect signals', fakeAsync(() => {
        createEls();
        attach({ zIndex: 4321 });
        expect(service.styleZ()).toBe(4321);
        // move signal
        service['_pos'].set({ x: 3, y: 4 });
        expect(service.styleLeft()).toBe('3px');
        expect(service.styleTop()).toBe('4px');
    }));

    it('disabled: pointerdown does not activate drag', fakeAsync(() => {
        createEls();
        attach({ disabled: true });
        pointerDownOn(handleEl, 10, 10);
        expect(service['_dragging']()).toBeFalse();
    }));

    it('savePositionIfAny does not throw if storage unavailable', fakeAsync(() => {
        createEls();
        attach({ storageKey: 'panel:nos' });

        spyOnProperty(win, 'localStorage', 'get').and.returnValue(undefined as unknown as Storage);

        service['_pos'].set({ x: 11, y: 22 });
        expect(service['_pos']()).toEqual({ x: 11, y: 22 });
    }));

    it('detach() removes listeners and resets state', fakeAsync(() => {
        createEls();
        attach();
        // Spy on removeEventListener
        const removeSpy = spyOn(win, 'removeEventListener').and.callThrough();
        service.detach();
        expect(service['_rootEl']).toBeUndefined();
        expect(service['_handleEl']).toBeUndefined();
        expect(service['_cfg']()).toBeUndefined();
        expect(service['_dragging']()).toBeFalse();
        expect(removeSpy).toHaveBeenCalledWith('resize', jasmine.any(Function));
    }));

    it('clamped() returns input when clamp is not viewport', fakeAsync(() => {
        createEls();
        attach({ clamp: undefined });
        const result = service.clamped(50, 60);
        expect(result).toEqual({ x: 50, y: 60 });
    }));

    it('clamped() returns input if rootEl is missing', () => {
        service['_cfg'].set({ ...BASE_CFG, clamp: 'viewport' });
        service['_rootEl'] = undefined;
        const result = service.clamped(30, 40);
        expect(result).toEqual({ x: 30, y: 40 });
    });

    it('clamped() returns input if window is missing', fakeAsync(() => {
        createEls();
        attach({ clamp: 'viewport' });
        spyOnProperty(Object.getPrototypeOf(service), 'window', 'get').and.returnValue(null);
        const result = service.clamped(50, 60);
        expect(result).toEqual({ x: 50, y: 60 });
    }));

    it('saveCollapsedIfAny does nothing if storageKey is missing', fakeAsync(() => {
        createEls();
        attach({ storageKey: undefined });
        expect(() => service['saveCollapsedIfAny'](true)).not.toThrow();
        expect(win.localStorage.setItem).not.toHaveBeenCalled();
    }));

    it('saveCollapsedIfAny does nothing if localStorage is unavailable', fakeAsync(() => {
        createEls();
        attach({ storageKey: 'panel:nos' });
        spyOnProperty(win, 'localStorage', 'get').and.returnValue(undefined as unknown as Storage);
        expect(() => service['saveCollapsedIfAny'](true)).not.toThrow();
    }));

    it('parseStoredPosition returns initial values if JSON is invalid', () => {
        const result = service['parseStoredPosition']('{bad json', 5, 6);
        expect(result).toEqual({ x: 5, y: 6 });
    });

    it('onPointerDown sets dragging, pointer capture, and tracking listeners', fakeAsync(() => {
        createEls();
        attach();
        // Mock setPointerCapture to avoid DOM error
        handleEl.setPointerCapture = jasmine.createSpy('setPointerCapture');
        const addMoveSpy = spyOn(win, 'addEventListener').and.callThrough();

        const ev = new PointerEvent('pointerdown', { pointerId: 123, clientX: 10, clientY: 20, bubbles: true });
        service.onPointerDown(ev);

        expect(service.dragging).toBeTrue();
        expect(handleEl.setPointerCapture).toHaveBeenCalledWith(123);
        expect(addMoveSpy).toHaveBeenCalledWith('pointermove', jasmine.any(Function), { passive: false });
        expect(addMoveSpy).toHaveBeenCalledWith('pointerup', jasmine.any(Function), { passive: true });
        expect(addMoveSpy).toHaveBeenCalledWith('pointercancel', jasmine.any(Function), { passive: true });
    }));

    it('onPointerMove updates position with snap > 1', fakeAsync(() => {
        createEls();
        attach({ snap: 10 });
        service['_dragging'].set(true);
        service['dragStartPos'] = { x: 50, y: 60 };
        service['pointerStart'] = { x: 100, y: 100 };

        const ev = new PointerEvent('pointermove', { clientX: 120, clientY: 130, bubbles: true });
        service.onPointerMove(ev);

        // dx = 20, dy = 30, snap = 10
        // x = 50 + 20 = 70, y = 60 + 30 = 90, snapped to 70, 90
        expect(service['_pos']()).toEqual(service.clamped(70, 90));
    }));

    it('onPointerMove updates position with snap = 1', fakeAsync(() => {
        createEls();
        attach({ snap: 1 });
        service['_dragging'].set(true);
        service['dragStartPos'] = { x: 5, y: 6 };
        service['pointerStart'] = { x: 10, y: 10 };

        const ev = new PointerEvent('pointermove', { clientX: 13, clientY: 15, bubbles: true });
        service.onPointerMove(ev);

        // dx = 3, dy = 5, x = 8, y = 11
        expect(service['_pos']()).toEqual(service.clamped(8, 11));
    }));

    it('onPointerMove does nothing if not dragging or config missing', fakeAsync(() => {
        createEls();
        attach();
        // Set dragStartPos and pointerStart to initial position so movement is zero
        service['_dragging'].set(false);
        service['dragStartPos'] = { x: 100, y: 120 };
        service['pointerStart'] = { x: 10, y: 10 };
        const ev = new PointerEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true });
        service.onPointerMove(ev);
        // position unchanged
        expect(service['_pos']()).toEqual({ x: 100, y: 120 });

        service['_dragging'].set(true);
        service['_cfg'].set(undefined);
        service['dragStartPos'] = { x: 100, y: 120 };
        service['pointerStart'] = { x: 10, y: 10 };
        service.onPointerMove(ev);
        // position unchanged
        expect(service['_pos']()).toEqual({ x: 100, y: 120 });
    }));

    it('onPointerUp resets dragging, saves position, emits, and removes tracking', fakeAsync(() => {
        createEls();
        attach({ storageKey: 'panel:up' });
        service['_dragging'].set(true);
        service['_pos'].set({ x: 42, y: 43 });
        const emitSpy = spyOn(service.positionCommitted, 'emit').and.callThrough();
        const removeSpy = spyOn(service, 'removePointerTracking').and.callThrough();

        service.onPointerUp();

        expect(service['_dragging']()).toBeFalse();
        expect(win.localStorage.getItem('panel:up')).toContain('42');
        expect(emitSpy).toHaveBeenCalledWith({ x: 42, y: 43 });
        expect(removeSpy).toHaveBeenCalled();
    }));

    it('onPointerUp does nothing if not dragging', fakeAsync(() => {
        createEls();
        attach();
        service['_dragging'].set(false);
        const emitSpy = spyOn(service.positionCommitted, 'emit').and.callThrough();
        service.onPointerUp();
        expect(emitSpy).not.toHaveBeenCalled();
    }));

    it('removePointerTracking removes pointer listeners', fakeAsync(() => {
        createEls();
        attach();
        const removeSpy = spyOn(window, 'removeEventListener').and.callThrough();
        service.removePointerTracking();
        expect(removeSpy).toHaveBeenCalledWith('pointermove', jasmine.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('pointerup', jasmine.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('pointercancel', jasmine.any(Function));
    }));

    it('effect: savePositionIfAny is NOT called when dragging', fakeAsync(() => {
        createEls();
        attach();
        service['_dragging'].set(true);
        const spy = spyOn(service, 'savePositionIfAny').and.callThrough();
        service['_pos'].set({ x: 789, y: 101 });
        flush();
        expect(spy).not.toHaveBeenCalled();
    }));
});
