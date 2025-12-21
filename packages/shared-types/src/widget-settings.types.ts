export enum WidgetPosition {
  BOTTOM_RIGHT = 'bottom-right',
  BOTTOM_LEFT = 'bottom-left',
}

export enum WidgetTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface IWidgetSettingsDto {
  theme?: WidgetTheme;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  headerText?: string;
  primaryColor?: string;
  position?: WidgetPosition;
  fontFamily?: string;
  companyLogoUrl?: string;
  welcomeMessage?: string;
  agentDisplayName?: string;
  offlineMessage?: string;
  autoOpenDelay?: number;
}
