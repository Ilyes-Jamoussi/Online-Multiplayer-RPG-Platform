import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarGridComponent } from '@app/components/features/avatar-grid/avatar-grid.component';
import { ErrorsBadgeComponent } from '@app/components/features/errors-badge/errors-badge.component';
import { StatsBarComponent } from '@app/components/features/stats-bar/stats-bar.component';
import { UiButtonComponent } from '@app/components/ui/button/button.component';
import { UiInputComponent } from '@app/components/ui/input/input.component';
import { UiPageLayoutComponent } from '@app/components/ui/page-layout/page-layout.component';
import { ROUTES } from '@app/constants/routes.constants';
import { CHARACTER_NAME_MAX_LENGTH, NAME_MIN_LENGTH } from '@app/constants/validation.constants';
import { CreateSessionDto } from '@app/dto/create-session-dto';
import { JoinSessionDto } from '@app/dto/join-session-dto';
import { AssetsService } from '@app/services/assets/assets.service';
import { CharacterCreationCheckService } from '@app/services/character-creation-check/character-creation-check.service';
import { CharacterStoreService } from '@app/services/character-store/character-store.service';
import { NotificationService } from '@app/services/notification/notification.service';
import { PlayerService } from '@app/services/player/player.service';
import { SessionSocketService } from '@app/services/session-socket/session-socket.service';
import { SessionService } from '@app/services/session/session.service';
import { BonusType } from '@common/enums/character-creation.enum';
import { Dice } from '@common/enums/dice.enum';


@Component({
    standalone: true,
    selector: 'app-character-creation-page',
    templateUrl: './character-creation-page.component.html',
    styleUrls: ['./character-creation-page.component.scss'],
    imports: [CommonModule, FormsModule, UiButtonComponent, UiInputComponent, UiPageLayoutComponent, StatsBarComponent, ErrorsBadgeComponent, AvatarGridComponent],
    providers: [CharacterCreationCheckService, CharacterStoreService],
})
export class CharacterCreationPageComponent {
    readonly dice = Dice;
    readonly bonusType = BonusType;
    readonly characterNameMinLength = NAME_MIN_LENGTH;
    readonly characterNameMaxLength = CHARACTER_NAME_MAX_LENGTH;

    constructor(
        private readonly assetsService: AssetsService,
        private readonly characterCreationCheckService: CharacterCreationCheckService,
        private readonly characterStoreService: CharacterStoreService,
        private readonly playerService: PlayerService,
        private readonly sessionService: SessionService,
        private readonly sessionSocketService: SessionSocketService,
        private readonly notificationService: NotificationService,
    ) {}

    get isLifeBonusSelected(): boolean {
        return this.character.bonus === BonusType.Life;
    }

    get isSpeedBonusSelected(): boolean {
        return this.character.bonus === BonusType.Speed;
    }

    get isAttackD4Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D4;
    }

    get isAttackD6Selected(): boolean {
        return this.character.diceAssignment.attack === Dice.D6;
    }

    get isDefenseD4Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D4;
    }

    get isDefenseD6Selected(): boolean {
        return this.character.diceAssignment.defense === Dice.D6;
    }

    get character() {
        return this.characterStoreService.character();
    }

    get canCreateCharacter(): boolean {
        return this.characterCreationCheckService.canCreate();
    }

    getDiceImage(dice: Dice): string {
        return this.assetsService.getDiceImage(dice);
    }

    onNameChange(v: string) {
        this.characterStoreService.name = v;
    }

    onBonusChange(bonus: BonusType) {
        this.characterStoreService.bonus = bonus;
    }

    onAttackDiceChange(value: Dice) {
        this.characterStoreService.setDice('attack', value);
    }

    onDefenseDiceChange(value: Dice) {
        this.characterStoreService.setDice('defense', value);
    }

    generateRandomCharacter() {
        this.characterStoreService.generateRandom();
    }

    onSubmit(): void {
        if (this.playerService.isAdmin()) {
            this.handleAdminCreation();
        } else {
            this.handlePlayerJoin();
        }
    }

    private handleAdminCreation(): void {
        const dto: CreateSessionDto = {
            player: this.playerService.player(),
            mapSize: 1,
            map: [],
            itemContainers: [],
        };

        this.sessionSocketService.createSession(dto);
        this.sessionSocketService.onSessionCreated((data) => {
            this.sessionService.updateSession({ id: data.sessionId });
            this.playerService.updatePlayer({ id: data.playerId });
            this.notificationService.displaySuccess({
                title: 'Personnage créé',
                message: `${this.character.name} est prêt pour l'aventure.`,
                redirectRoute: ROUTES.waitingRoomPage,
            });
        });
    }

    private handlePlayerJoin(): void {

        const dto: JoinSessionDto = {
            player: this.playerService.player(),
            sessionId: this.sessionService.id(),
        };

        this.sessionSocketService.joinSession(dto);
        this.sessionSocketService.onSessionJoined(() => {
            this.notificationService.displaySuccess({
                title: 'Personnage créé',
                message: `${this.character.name} est prêt pour l'aventure.`,
                redirectRoute: ROUTES.waitingRoomPage,
            });
        });

        this.sessionSocketService.onSessionJoinError((msg) => {
            this.notificationService.displayError({ title: 'Erreur', message: msg });
        });
    }
}

