export type UiVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type UiColorVariant = UiVariant;
export type UiSize = 'sm' | 'md' | 'lg';
export type UiShapeVariant = 'rounded' | 'square' | 'pill';
export type UiSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type UiAlignment = 'left' | 'center' | 'right' | 'justify';
export type UiElevation = 'none' | 'xs' | 'sm' | 'md' | 'lg';

export enum MaterialIcon {
    // Navigation & UI
    Home = 'home',
    Menu = 'menu',
    Close = 'close',
    ArrowBack = 'arrow_back',
    ArrowForward = 'arrow_forward',
    ExpandMore = 'expand_more',
    ExpandLess = 'expand_less',

    // Actions
    Add = 'add',
    Remove = 'remove',
    Edit = 'edit',
    Delete = 'delete',
    Save = 'save',
    Refresh = 'refresh',
    Search = 'search',

    // Content & Media
    PlayArrow = 'play_arrow',
    Pause = 'pause',
    Stop = 'stop',
    VolumeUp = 'volume_up',
    VolumeOff = 'volume_off',

    // Communication
    Email = 'email',
    Phone = 'phone',
    Message = 'message',
    Notifications = 'notifications',

    // Status & Feedback
    Check = 'check',
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Favorite = 'favorite',

    // User & Account
    Person = 'person',
    Settings = 'settings',
    Logout = 'logout',
    Visibility = 'visibility',
    VisibilityOff = 'visibility_off',

    // Dev
    Code = 'code',

    SportsEsports = 'sports_esports',
    School = 'school',
    Computer = 'computer',
    BugReport = 'bug_report',
    Build = 'build',
    Lightbulb = 'lightbulb',
    Psychology = 'psychology',
    Group = 'group',
    Work = 'work',
    LogoDev = 'logo_dev',
    FrameSource = 'frame_source',
    JavaScript = 'javascript',
    Html = 'html',
    Css = 'css',
    Php = 'php',
    Python = 'python',
    FileJson = 'file_json',
}
