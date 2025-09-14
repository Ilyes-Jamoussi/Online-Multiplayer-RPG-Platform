import { Directive, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output } from '@angular/core';

@Directive({ selector: '[appTileSizeProbe]', standalone: true })
export class TileSizeProbeDirective implements OnChanges, OnDestroy {
    @Input() probeActive = false;
    @Output() sizeChange = new EventEmitter<number>();

    private resizeObserver?: ResizeObserver;

    constructor(
        private el: ElementRef<HTMLElement>,
        private zone: NgZone,
    ) {}

    ngOnChanges(): void {
        this.teardown();
        if (!this.probeActive) return;

        const node = this.el.nativeElement;

        const r = node.getBoundingClientRect();
        this.sizeChange.emit(Math.min(r.width, r.height));

        this.zone.runOutsideAngular(() => {
            this.resizeObserver = new ResizeObserver((entries) => {
                const { width, height } = entries[0].contentRect;
                const size = Math.min(width, height);
                this.zone.run(() => this.sizeChange.emit(size));
            });
            this.resizeObserver.observe(node);
        });
    }
    ngOnDestroy(): void {
        this.teardown();
    }
    private teardown() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
    }
}
