// import { ChangeDetectionStrategy, Component, Input, HostBinding } from '@angular/core';
// import { CommonModule } from '@angular/common';

// import { PlaceableObject, footprintOf } from '@app/interfaces/game/game-editor.interface';
// import { PlaceableKind } from '@common/enums/placeable-kind.enum';

// @Component({
//     selector: 'app-edit-base-object',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './base-object.component.html',
//     styleUrls: ['./base-object.component.scss'],
//     changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class EditBaseObjectComponent {
//     @Input({ required: true }) object!: PlaceableObject;
//     @Input({ required: true }) tileSize = 48; // px (propagated as CSS var)

//     placeableKind = PlaceableKind;

//     /** host binding: grid placement directly from object.position */
//     @HostBinding('style.grid-column')
//     get gridCol() {
//         const w = footprintOf(this.object.kind).w;
//         return `${this.object.x + 1} / span ${w}`;
//     }

//     @HostBinding('style.grid-row')
//     get gridRow() {
//         const h = footprintOf(this.object.kind).h;
//         return `${this.object.y + 1} / span ${h}`;
//     }

//     @HostBinding('style.--tile.px')
//     get tileVar() {
//         return this.tileSize;
//     }
// }
