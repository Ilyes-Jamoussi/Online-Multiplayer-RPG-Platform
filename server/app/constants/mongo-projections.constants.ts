export const GAME_PROJECTION = {
    _id: 1,
    size: 1,
    name: 1,
    description: 1,
    tiles: 1,
    itemContainers: 1,
} as const;

export const GAME_PREVIEW_PROJECTION = {
    _id: 1,
    name: 1,
    size: 1,
    description: 1,
    mapImageUrl: 1,
    lastModified: 1,
    visibility: 1,
    gridPreviewUrl: 1,
} as const;

export const VISIBILITY_PROJECTION = {
    _id: 1,
    visibility: 1,
} as const;

export const LIVE_SESSION_PROJECTION = {
    size: 1,
    tiles: 1,
    items: 1,
} as const;

export const DTO_PROJECTIONS = {
    gameDto: GAME_PROJECTION,
    displayGameDto: GAME_PREVIEW_PROJECTION,
    visibilityDto: VISIBILITY_PROJECTION,
    liveSessionDto: LIVE_SESSION_PROJECTION,
} as const;
