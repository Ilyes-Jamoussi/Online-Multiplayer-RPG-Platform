export enum SessionEvents {
    CreateSession = 'createSession',
    SessionCreated = 'sessionCreated',

    JoinSession = 'joinSession',
    SessionJoined = 'sessionJoined',

    LeaveSession = 'leaveSession',
    SessionLeft = 'sessionLeft',

    JoinAvatarSelection = 'joinAvatarSelection',
    AvatarSelectionJoined = 'avatarSelectionJoined',
    LeaveAvatarSelection = 'leaveAvatarSelection',

    UpdateAvatarAssignments = 'updateAvatarAssignments',
    AvatarAssignmentsUpdated = 'avatarAssignmentsUpdated',

    SessionPlayersUpdated = 'sessionPlayersUpdated',
    UpdatedAvatarAssignments = 'updateAvatarAssignments',

    LockSession = 'lockSession',
    SessionAutoLocked = 'sessionAutoLocked',
    UnlockSession = 'unlockSession',

    StartGameSession = 'startGameSession',
    GameSessionStarted = 'gameSessionStarted',

    KickPlayer = 'kickPlayer',
    SessionEnded = 'sessionEnded',

    AvailableSessionsUpdated = 'availableSessionsUpdated',
    LoadAvailableSessions = 'loadAvailableSessions',
}
