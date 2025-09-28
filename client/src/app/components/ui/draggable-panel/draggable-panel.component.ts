import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UI_CONSTANTS } from '@app/constants/ui.constants';
import { DraggablePanelService, Bounds } from '@app/services/draggable-panel/draggable-panel.service';
import { UiIconComponent } from '@app/components/ui/icon/icon.component';

@Component({
    selector: 'app-draggable-panel',
    standalone: true,
    imports: [CommonModule, UiIconComponent],
    templateUrl: './draggable-panel.component.html',
    styleUrls: ['./draggable-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DraggablePanelService],
})
export class DraggablePanelComponent implements AfterViewInit, OnDestroy {
    @Input() title = '';
    @Input() initialX = UI_CONSTANTS.draggablePanel.initialX;
    @Input() initialY = UI_CONSTANTS.draggablePanel.initialY;
    @Input() clamp: Bounds = 'viewport';
    @Input() snap = 1;
    @Input() zIndex = UI_CONSTANTS.draggablePanel.zIndex;
    @Input() disabled = false;
    @Input() storageKey?: string;

    @Output() positionChange = new EventEmitter<{ x: number; y: number }>();

    @ViewChild('root', { static: true }) rootRef!: ElementRef<HTMLElement>;
    @ViewChild('handle', { static: true }) handleRef!: ElementRef<HTMLElement>;

    styleLeft = this.draggablePanelService.styleLeft;
    styleTop = this.draggablePanelService.styleTop;
    styleZ = this.draggablePanelService.styleZ;
    dragging = this.draggablePanelService.dragging;
    pos = this.draggablePanelService;

    constructor(readonly draggablePanelService: DraggablePanelService) {
        this.draggablePanelService.positionCommitted.subscribe((p) => this.positionChange.emit(p));
    }

    ngAfterViewInit() {
        this.draggablePanelService.attach(this.rootRef.nativeElement, this.handleRef.nativeElement, {
            title: this.title,
            initialX: this.initialX,
            initialY: this.initialY,
            clamp: this.clamp,
            snap: this.snap,
            zIndex: this.zIndex,
            disabled: this.disabled,
            storageKey: this.storageKey,
        });
    }

    ngOnDestroy() {
        this.draggablePanelService.detach();
    }
}
