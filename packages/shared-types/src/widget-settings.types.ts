export enum WidgetPosition {
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
}

export enum WidgetTheme {
  LIGHT = 'light',
  DARK = 'dark',
  OLED_VOID = 'oled-void',
  PAPERBACK = 'paperback',
  NORDIC_FROST = 'nordic-frost',
  CYBERPUNK = 'cyberpunk',
  TERMINAL = 'terminal',
  MATCHA = 'matcha',
  DRACULA = 'dracula',
  LAVENDER_MIST = 'lavender-mist',
  HIGH_CONTRAST = 'high-contrast',
  SOLARIZED_LIGHT = 'solarized-light',
  SOLARIZED_DARK = 'solarized-dark',
}

export type HistoryVisibilityMode = 'limit_to_active' | 'forever';

export interface IWidgetSettingsDto {
  theme?: WidgetTheme;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  headerText?: string;
  position?: WidgetPosition;
  fontFamily?: string;
  companyLogoUrl?: string;
  welcomeMessage?: string;
  agentDisplayName?: string;
  offlineMessage?: string;
  autoOpenDelay?: number;
  historyVisibility?: HistoryVisibilityMode;
}