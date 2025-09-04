// import { HttpErrorResponse } from '@angular/common/http';
// import { Component } from '@angular/core';
// import { RouterLink } from '@angular/router';
// import { CommunicationService } from '@app/services/communication.service';
// import { Message } from '@common/message';
// import { BehaviorSubject } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { ButtonComponent } from '../../components/shared/button/button.component';

// @Component({
//     selector: 'app-main-page',
//     templateUrl: './main-page.component.html',
//     styleUrls: ['./main-page.component.scss'],
//     imports: [RouterLink, ButtonComponent],
//     standalone: true,
// })
// export class MainPageComponent {
//     readonly title: string = 'LOG2990';
//     message: BehaviorSubject<string> = new BehaviorSubject<string>('');

//     constructor(private readonly communicationService: CommunicationService) {}

//     sendTimeToServer(): void {
//         const newTimeMessage: Message = {
//             title: 'Hello from the client',
//             body: 'Time is : ' + new Date().toString(),
//         };
//         // Important de ne pas oublier "subscribe" ou l'appel ne sera jamais lancé puisque personne l'observe
//         this.communicationService.basicPost(newTimeMessage).subscribe({
//             next: (response) => {
//                 const responseString = `Le serveur a reçu la requête a retourné un code ${response.status} : ${response.statusText}`;
//                 this.message.next(responseString);
//             },
//             error: (err: HttpErrorResponse) => {
//                 const responseString = `Le serveur ne répond pas et a retourné : ${err.message}`;
//                 this.message.next(responseString);
//             },
//         });
//     }

//     getMessagesFromServer(): void {
//         this.communicationService
//             .basicGet()
//             // Cette étape transforme l'objet Message en un seul string
//             .pipe(
//                 map((message: Message) => {
//                     return `${message.title} ${message.body}`;
//                 }),
//             )
//             .subscribe(this.message);
//     }
// }
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../components/button/button.component';
@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [ButtonComponent, CommonModule],
    standalone: true,
})
export class MainPageComponent {

    teamInfo = {
        teamNumber: '204',
        members: [
            'Wael El Karoui',
            'Ilyes Jamoussi',
            'Noah Blanchard',
            'Adam Rafai',
            'Eduard Andrei Podaru',

        ]
    };

    constructor(private router: Router) {}

    onJoinGame(): void {
        // Désactivé pour Sprint 1
        console.log('Joindre une partie - Option désactivée pour le Sprint 1');
    }

    onCreateGame(): void {
        this.router.navigate(['/create-game']);
    }

    onAdminGames(): void {

        this.router.navigate(['/admin-games']);
    }
}
