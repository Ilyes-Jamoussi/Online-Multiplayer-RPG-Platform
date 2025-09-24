import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal, computed, EventEmitter } from '@angular/core';

export type Bounds = 'viewport';

export interface DraggablePanelConfig {
    title?: string;
    initialX: number;
    initialY: number;
    clamp: Bounds;
    snap: number;
    zIndex: number;
    disabled: boolean;
    storageKey?: string;
    startCollapsed?: boolean;
}

@Injectable()
export class DraggablePanelService {
    private readonly _pos = signal<{ x: number; y: number }>({ x: 0, y: 0 });
    private readonly _dragging = signal(false);
    private readonly _cfg = signal<DraggablePanelConfig | undefined>(undefined);
    private readonly collapsed = signal(false);

    readonly styleLeft = computed(() => `${this._pos().x}px`);
    readonly styleTop = computed(() => `${this._pos().y}px`);
    readonly styleZ = computed(() => this._cfg()?.zIndex ?? 1);

    readonly positionCommitted = new EventEmitter<{ x: number; y: number }>();

    private _rootEl?: HTMLElement;
    private _handleEl?: HTMLElement;

    private dragStartPos = { x: 0, y: 0 };
    private pointerStart = { x: 0, y: 0 };

    private boundPointerMove = (ev: PointerEvent) => this.onPointerMove(ev);
    private boundPointerUp = () => this.onPointerUp();
    private boundResize = () => this.onResize();

    constructor(@Inject(DOCUMENT) private readonly doc: Document) {}

    get dragging() {
        return this._dragging();
    }
    get isCollapsed() {
        return this.collapsed();
    }
    get pos() {
        return this._pos();
    }

    attach(rootEl: HTMLElement, handleEl: HTMLElement, cfg: DraggablePanelConfig) {
        this._rootEl = rootEl;
        this._handleEl = handleEl;
        this._cfg.set(cfg);

        this._pos.set({ x: cfg.initialX, y: cfg.initialY });

        this.loadStoredDataIfAny();
        if (cfg.startCollapsed !== undefined) this.collapsed.set(cfg.startCollapsed);

        queueMicrotask(() => this.clampToViewport());

        this._handleEl.addEventListener('dragstart', (e) => e.preventDefault());
        this._handleEl.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.window?.addEventListener('resize', this.boundResize, { passive: true });
    }
    detach() {
        if (this._handleEl) {
            this._handleEl.removeEventListener('pointerdown', (e) => this.onPointerDown(e as PointerEvent));
        }
        this.window?.removeEventListener('resize', this.boundResize);
        this.removePointerTracking();
        this._rootEl = undefined;
        this._handleEl = undefined;
        this._cfg.set(undefined);
        this._dragging.set(false);
    }

    toggleCollapsed() {
        this.setCollapsed(!this.collapsed());
    }

    setCollapsed(v: boolean) {
        this.collapsed.set(v);
        this.saveCollapsedIfAny(v);
    }

    onPointerDown(ev: PointerEvent) {
        if (!this._cfg || this._cfg()?.disabled) return;

        ev.preventDefault();
        this._handleEl?.setPointerCapture?.(ev.pointerId);

        this._dragging.set(true);
        this.dragStartPos = { ...this._pos() };
        this.pointerStart = { x: ev.clientX, y: ev.clientY };

        this.window?.addEventListener('pointermove', this.boundPointerMove, { passive: false });
        this.window?.addEventListener('pointerup', this.boundPointerUp, { passive: true });
        this.window?.addEventListener('pointercancel', this.boundPointerUp, { passive: true });
    }

    onPointerMove(ev: PointerEvent) {
        if (!this._dragging() || !this._cfg) return;
        ev.preventDefault();

        const dx = ev.clientX - this.pointerStart.x;
        const dy = ev.clientY - this.pointerStart.y;

        let x = this.dragStartPos.x + dx;
        let y = this.dragStartPos.y + dy;

        const snap = Math.max(1, this._cfg()?.snap ?? 1);
        if (snap > 1) {
            x = Math.round(x / snap) * snap;
            y = Math.round(y / snap) * snap;
        } else {
            x = Math.round(x);
            y = Math.round(y);
        }

        this._pos.set(this.clamped(x, y));
    }

    onPointerUp() {
        if (!this._dragging()) return;
        this._dragging.set(false);
        const p = this._pos();
        this.savePositionIfAny(p);
        this.positionCommitted.emit(p);
        this.removePointerTracking();
    }

    removePointerTracking() {
        this.window?.removeEventListener('pointermove', this.boundPointerMove);
        this.window?.removeEventListener('pointerup', this.boundPointerUp);
        this.window?.removeEventListener('pointercancel', this.boundPointerUp);
    }

    onResize() {
        this.clampToViewport();
        const p = this._pos();
        this.savePositionIfAny(p);
        this.positionCommitted.emit(p);
    }

    clampToViewport() {
        const { x, y } = this._pos();
        this._pos.set(this.clamped(x, y));
    }

    clamped(x: number, y: number) {
        if (!this._cfg || this._cfg()?.clamp !== 'viewport' || !this._rootEl || !this.window) {
            return { x, y };
        }

        const rect = this._rootEl.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        const margin = 6;
        const maxX = Math.max(this.window.innerWidth - w - margin, margin);
        const maxY = Math.max(this.window.innerHeight - h - margin, margin);

        return {
            x: Math.min(Math.max(x, margin), maxX),
            y: Math.min(Math.max(y, margin), maxY),
        };
    }

    private get window(): Window | null {
        return this.doc.defaultView ?? null;
    }

    private get canUseStorage() {
        return !!this.window?.localStorage;
    }

    private loadStoredDataIfAny() {
        const key = this._cfg()?.storageKey;
        if (!key || !this.canUseStorage) return;
        try {
            const win = this.window;
            if (!win) return;

            const raw = win.localStorage.getItem(key);
            if (raw) {
                const p = this.parseStoredPosition(raw, this._cfg()?.initialX ?? 0, this._cfg()?.initialY ?? 0);
                this._pos.set(p);
            }

            const rawCollapsed = win.localStorage.getItem(`${key}:collapsed`);
            if (rawCollapsed != null) this.collapsed.set(rawCollapsed === '1');
        } catch {
            // quota or private mode — ignore
        }
    }

    private parseStoredPosition(raw: string, ix: number, iy: number): { x: number; y: number } {
        try {
            const parsed = JSON.parse(raw) as { x?: number; y?: number };
            const x = Number.isFinite(parsed?.x) ? Math.trunc(parsed.x ?? ix) : ix;
            const y = Number.isFinite(parsed?.y) ? Math.trunc(parsed.y ?? iy) : iy;
            return { x, y };
        } catch {
            return { x: ix, y: iy };
        }
    }

    savePositionIfAny(p: { x: number; y: number }) {
        const key = this._cfg()?.storageKey;
        if (!key || !this.canUseStorage) return;
        try {
            const win = this.window;
            if (win) {
                win.localStorage.setItem(key, JSON.stringify({ x: p.x, y: p.y }));
            }
        } catch {
            // quota or private mode — ignore
        }
    }

    private saveCollapsedIfAny(v: boolean) {
        const key = this._cfg()?.storageKey;
        if (!key || !this.canUseStorage) return;
        try {
            const win = this.window;
            if (win) {
                win.localStorage.setItem(`${key}:collapsed`, v ? '1' : '0');
            }
        } catch {
            // quota or private mode — ignore
        }
    }
}
