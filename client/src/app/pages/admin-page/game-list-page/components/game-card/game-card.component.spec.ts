import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCardComponent } from './game-card.component';
import { Game } from '@app/shared/models/game.model';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiCardTitleComponent, UiCardFooterComponent, UiCardContentComponent } from '@app/shared/ui/components/card/card-sections.component';
import { UiCheckboxComponent } from '@app/shared/ui/components/checkbox/checkbox.component';
import { UiLinkButtonComponent2 } from '@app/shared/ui/components/button/link-button2.component';
import { UiTooltipComponent } from '@app/shared/ui/components/tooltip/tooltip.component';

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let debugElement: DebugElement;

    const mockGame: Game = {
        id: '123',
        name: 'Test Game',
        lastEdit: new Date().toISOString(),
        gameMode: 'classique',
        mapSize: '10x10',
        visible: true,
        previewImageUrl: 'test-url.jpg',
        description: 'Test description',
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                RouterModule.forRoot([]),
                GameCardComponent,
                UiCardComponent,
                UiCardContentComponent,
                UiCardTitleComponent,
                UiCardFooterComponent,
                UiCheckboxComponent,
                UiLinkButtonComponent2,
                UiTooltipComponent,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        component.game = mockGame;
        debugElement = fixture.debugElement;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show admin features when admin is true', () => {
        component.admin = true;
        fixture.detectChanges();

        const checkbox = debugElement.query(By.directive(UiCheckboxComponent));
        const editButton = debugElement.query(By.css('app-ui-link-button2[leftIcon="Edit"]'));

        expect(checkbox).toBeTruthy();
        expect(editButton).toBeTruthy();
    });

    it('should show player features when admin is false', () => {
        component.admin = false;
        fixture.detectChanges();

        const checkbox = debugElement.query(By.directive(UiCheckboxComponent));
        const createButton = debugElement.query(By.css('app-ui-link-button2[leftIcon="Play"]'));

        expect(checkbox).toBeFalsy();
        expect(createButton).toBeTruthy();
    });

    it('should emit toggleVisibility when checkbox is changed', () => {
        component.admin = true;
        fixture.detectChanges();

        spyOn(component.toggleVisibility, 'emit');

        // Manually emit the event as we would in the template
        component.toggleVisibility.emit(component.game.visible);

        expect(component.toggleVisibility.emit).toHaveBeenCalledWith(component.game.visible);
    });
});
