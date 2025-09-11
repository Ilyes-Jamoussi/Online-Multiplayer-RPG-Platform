import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateGameDto } from '@app/api/model/createGameDto';
import { ROUTES } from '@app/constants/routes.constants';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { NotificationService } from '@app/services/notification/notification.service';

@Component({
  selector: 'app-game-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-editor-page.component.html',
  styleUrls: ['./game-editor-page.component.scss']
})
export class GameEditorPageComponent {
  gameName = '';
  gameDescription = '';
  isCreating = false;

  constructor(
    private readonly router: Router,
    private readonly gameHttpService: GameHttpService,
    private readonly notificationService: NotificationService
  ) {}


  onCreateGame(): void {
    if (!this.gameName.trim() || !this.gameDescription.trim()) {
      return;
    }

    this.isCreating = true;

    const createGameDto: CreateGameDto = {
      name: this.gameName.trim(),
      description: this.gameDescription.trim(),
      size: CreateGameDto.SizeEnum.NUMBER_15,
      mode: CreateGameDto.ModeEnum.Classic
    };

    this.gameHttpService.createGame(createGameDto).subscribe({
      next: () => {
        this.isCreating = false;
        this.notificationService.displaySuccess({
          title: 'Jeu créé avec succès !',
          message: `Le jeu "${this.gameName}" a été créé et ajouté à votre collection.`
        });
        // this.router.navigate([ROUTES.gameManagement]);
      },
      error: () => {
        this.notificationService.displayError({
          title: 'Erreur lors de la création',
          message: `Impossible de créer le jeu "${this.gameName}". Veuillez réessayer.`
        });
        this.isCreating = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate([ROUTES.gameParameters]);
  }

  get isFormValid(): boolean {
    return this.gameName.trim().length > 0 && this.gameDescription.trim().length > 0;
  }
}
