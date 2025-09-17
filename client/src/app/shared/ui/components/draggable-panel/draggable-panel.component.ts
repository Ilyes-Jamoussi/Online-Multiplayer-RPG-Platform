import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    ViewChild,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_CONSTANTS } from '@app/constants/ui.constants';

type Bounds = 'viewport';

@Component({
    selector: 'app-draggable-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './draggable-panel.component.html',
    styleUrls: ['./draggable-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraggablePanelComponent implements AfterViewInit {
    @Input() title = '';
    @Input() initialX = UI_CONSTANTS.draggablePanel.initialX;
    @Input() initialY = UI_CONSTANTS.draggablePanel.initialY;
    @Input() clamp: Bounds = 'viewport';
    @Input() snap = 1;
    @Input() zIndex = UI_CONSTANTS.draggablePanel.zIndex;
    @Input() disabled = false;

    /** Emits the position after drag ends */
    @Output() positionChange = new EventEmitter<{ x: number; y: number }>();

    @ViewChild('root', { static: true }) rootRef!: ElementRef<HTMLElement>;
    @ViewChild('handle', { static: true }) handleRef!: ElementRef<HTMLElement>;

    // Reactive state
    pos = signal<{ x: number; y: number }>({ x: this.initialX, y: this.initialY });
    dragging = signal(false);

    private dragStartPos = { x: 0, y: 0 };
    private pointerStart = { x: 0, y: 0 };

    styleLeft = computed(() => `${this.pos().x}px`);
    styleTop = computed(() => `${this.pos().y}px`);
    styleZ = computed(() => this.zIndex);

    ngAfterViewInit() {
        queueMicrotask(() => this.clampToViewport());
        this.handleRef.nativeElement.addEventListener('dragstart', (e) => e.preventDefault());
    }

    onMouseDown(ev: MouseEvent) {
        if (this.disabled) return;
        ev.preventDefault();
        this.beginDrag(ev.clientX, ev.clientY);
    }
    @HostListener('window:mousemove', ['$event'])
    onMouseMove(ev: MouseEvent) {
        if (!this.dragging()) return;
        this.updateDrag(ev.clientX, ev.clientY);
    }
    @HostListener('window:mouseup')
    onMouseUp() {
        if (!this.dragging()) return;
        this.endDrag();
    }

    onTouchStart(ev: TouchEvent) {
        if (this.disabled) return;
        const t = ev.touches[0];
        if (!t) return;
        this.beginDrag(t.clientX, t.clientY);
    }
    @HostListener('window:touchmove', ['$event'])
    onTouchMove(ev: TouchEvent) {
        if (!this.dragging()) return;
        const t = ev.touches[0];
        if (!t) return;
        this.updateDrag(t.clientX, t.clientY);
    }
    @HostListener('window:touchend')
    onTouchEnd() {
        if (!this.dragging()) return;
        this.endDrag();
    }

    private beginDrag(px: number, py: number) {
        this.dragging.set(true);
        this.dragStartPos = { ...this.pos() };
        this.pointerStart = { x: px, y: py };
    }

    private updateDrag(px: number, py: number) {
        const dx = px - this.pointerStart.x;
        const dy = py - this.pointerStart.y;

        let x = this.dragStartPos.x + dx;
        let y = this.dragStartPos.y + dy;

        if (this.snap > 1) {
            x = Math.round(x / this.snap) * this.snap;
            y = Math.round(y / this.snap) * this.snap;
        } else {
            x = Math.round(x);
            y = Math.round(y);
        }

        this.pos.set(this.clamped(x, y));
    }

    private endDrag() {
        this.dragging.set(false);
        this.positionChange.emit(this.pos());
    }

    private clamped(x: number, y: number) {
        if (this.clamp !== 'viewport') return { x, y };

        const el = this.rootRef.nativeElement;
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        const margin = 6;
        const maxX = Math.max(window.innerWidth - w - margin, margin);
        const maxY = Math.max(window.innerHeight - h - margin, margin);

        return {
            x: Math.min(Math.max(x, margin), maxX),
            y: Math.min(Math.max(y, margin), maxY),
        };
    }

    private clampToViewport() {
        const { x, y } = this.pos();
        this.pos.set(this.clamped(x, y));
    }
}
