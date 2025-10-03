export enum SessionEvents {
    CreateSession = 'createSession',
    SessionCreated = 'sessionCreated',

    JoinSession = 'joinSession',
    SessionJoined = 'sessionJoined',

    LeaveSession = 'leaveSession',
    SessionLeft = 'sessionLeft',

    JoinAvatarSelection = 'joinAvatarSelection',
    AvatarSelectionJoined = 'avatarSelectionJoined',

    UpdateAvatarAssignments = 'updateAvatarAssignments',
    AvatarAssignmentsUpdated = 'avatarAssignmentsUpdated',

    SessionPlayersUpdated = 'sessionPlayersUpdated',
    UpdatedAvatarAssignments = 'updateAvatarAssignments',

    LockSession = 'lockSession',
    UnlockSession = 'unlockSession',

    // Game

    StartGameSession = 'startGameSession',
    GameSessionStarted = 'gameSessionStarted',
}
