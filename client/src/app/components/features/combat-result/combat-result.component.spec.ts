import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CombatResultComponent } from './combat-result.component';

describe('CombatResultComponent', () => {
    let component: CombatResultComponent;
    let fixture: ComponentFixture<CombatResultComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CombatResultComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CombatResultComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('victoryData', { playerAId: '1', playerBId: '2', winnerId: '1', abandon: false });
        fixture.componentRef.setInput('isVictory', true);
        fixture.componentRef.setInput('victoryMessage', 'Victoire !');
        fixture.componentRef.setInput('victorySubtitle', 'Tu as gagné le combat !');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
