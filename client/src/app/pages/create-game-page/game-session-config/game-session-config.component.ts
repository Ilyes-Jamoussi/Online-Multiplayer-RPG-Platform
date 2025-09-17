import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Game } from '@app/services/game-mock.service';
import { GameSessionForm } from '@app/interfaces/game-session.interface';

// UI Components
import { UiButtonComponent2 } from '@app/shared/ui/components/button/button2.component';
import { UiCardComponent } from '@app/shared/ui/components/card/card.component';
import { UiInputComponent } from '@app/shared/ui/components/input/input.component';
import { UiSelectComponent } from '@app/shared/ui/components/select/select.component';

@Component({
    selector: 'app-game-session-config',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule,
        UiCardComponent,
        UiButtonComponent2,
        UiInputComponent,
        UiSelectComponent
    ],
    templateUrl: './game-session-config.component.html',
    styleUrls: ['./game-session-config.component.scss'],
})
export class GameSessionConfigComponent {
    @Input() selectedGame!: Game;
    @Input() isVisible = false;
    
    @Output() sessionCreated = new EventEmitter<GameSessionForm>();
    @Output() cancelled = new EventEmitter<void>();

    sessionForm: GameSessionForm = {
        sessionName: '',
        maxPlayers: 4,
        isPrivate: false,
        difficulty: 'moyen',
        timeLimit: 30
    };

    difficultyOptions = [
        { value: 'facile', label: 'Facile' },
        { value: 'moyen', label: 'Moyen' },
        { value: 'difficile', label: 'Difficile' }
    ];

    maxPlayersOptions = [
        { value: 2, label: '2 joueurs' },
        { value: 3, label: '3 joueurs' },
        { value: 4, label: '4 joueurs' },
        { value: 6, label: '6 joueurs' }
    ];

    onSubmit() {
        if (this.isFormValid()) {
            this.sessionCreated.emit(this.sessionForm);
        }
    }

    onCancel() {
        this.cancelled.emit();
    }

    isFormValid(): boolean {
        const MIN_SESSION_NAME_LENGTH = 3;
        return this.sessionForm.sessionName.trim().length >= MIN_SESSION_NAME_LENGTH;
    }
}
