import type { IWidgetSettingsDto } from './widget-settings.types';
import type { ProjectMemberDto } from './project-member.dto'; // Already in shared-types

export interface IProject {
  id: number;
  name: string;
  widgetSettings: IWidgetSettingsDto;
  whitelistedDomains: string[];
  autoResolveMinutes?: number | null;
  aiResponderEnabled?: boolean;
  aiResponderPrompt?: string | null;
  members: ProjectMemberDto[]; // Frontend needs this for displaying project members
  createdAt: Date;
}

export type Project = IProject;