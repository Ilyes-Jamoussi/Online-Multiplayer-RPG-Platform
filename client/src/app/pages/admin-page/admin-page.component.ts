import { Component } from '@angular/core';

interface Game {
  id: number;
  title: string;
  size: number;
  mode: boolean;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})

export class AdminPageComponent {
  games: Game[] = [
    { id: 1, title: 'jeu1', size: 20, mode: true },
    { id: 2, title: 'jeu2', size: 20, mode: false }
  ];
}
