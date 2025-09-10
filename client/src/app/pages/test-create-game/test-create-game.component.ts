import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateGameDto } from '@app/api/model/models';
import { GameHttpService } from '@app/services/game-http/game-http.service';
import { GameStoreSocketService } from '@app/services/game-store-socket/game-store-socket.service';
import { GameStoreService } from '@app/services/game-store/game-store.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-create-game',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './test-create-game.component.html',
  styleUrl: './test-create-game.component.scss'
})
export class TestCreateGameComponent implements OnInit {
  gameForm: FormGroup;
  message = '';
  isSuccess = false;

  constructor(
    private fb: FormBuilder,
    private gameHttpService: GameHttpService,
    private socketService: GameStoreSocketService,
    public gameStoreService: GameStoreService
  ) {
    this.gameForm = this.fb.group({
      name: ['Jeu Test', [Validators.required, Validators.minLength(2)]],
      description: ['Description du jeu de test', [Validators.required, Validators.minLength(5)]],
      size: [15, Validators.required],
      mode: ['classic', Validators.required]
    });

    // Écouter les événements WebSocket
    this.socketService.onGameCreated((game) => {
      console.log('Jeu créé via WebSocket:', game);
    });
  }

  ngOnInit(): void {
    // Charger la liste des jeux au démarrage
    this.gameStoreService.loadGames().subscribe();
  }

  onSubmit(): void {
    if (this.gameForm.valid) {
      const gameData: CreateGameDto = this.gameForm.value;
      
      this.gameHttpService.createGame(gameData).subscribe({
        next: () => {
          this.message = 'Jeu créé avec succès !';
          this.isSuccess = true;
          this.gameForm.reset({ size: 15, mode: 'classic' });
        },
        error: (error) => {
          this.message = `Erreur: ${error.message}`;
          this.isSuccess = false;
        }
      });
    }
  }
}
