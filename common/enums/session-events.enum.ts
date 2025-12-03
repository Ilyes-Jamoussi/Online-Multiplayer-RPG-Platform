export enum SessionEvents {
    CreateSession = 'create-session',
    SessionCreated = 'session-created',

    JoinSession = 'join-session',
    SessionJoined = 'session-joined',

    LeaveSession = 'leave-session',

    JoinAvatarSelection = 'join-avatar-selection',
    AvatarSelectionJoined = 'avatar-selection-joined',
    LeaveAvatarSelection = 'leave-avatar-selection',

    UpdateAvatarAssignments = 'update-avatar-assignments',
    AvatarAssignmentsUpdated = 'avatar-assignments-updated',

    SessionPlayersUpdated = 'session-players-updated',

    PlayerNameUpdated = 'player-name-updated',

    LockSession = 'lock-session',
    SessionAutoLocked = 'session-auto-locked',

    StartGameSession = 'start-game-session',
    GameSessionStarted = 'game-session-started',

    KickPlayer = 'kick-player',
    SessionEnded = 'session-ended',

    AddVirtualPlayer = 'add-virtual-player',

    AvailableSessionsUpdated = 'available-sessions-updated',
    LoadAvailableSessions = 'load-available-sessions',
}
