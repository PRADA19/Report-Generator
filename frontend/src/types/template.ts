// frontend/src/types/template.ts

export type EventType = 
  | 'Workshop'
  | 'Seminar'
  | 'Conference'
  | 'Guest Lecture'
  | 'FDP'
  | 'Webinar'
  | 'Club Activity'
  | 'Sports'
  | 'Cultural'
  | 'Placement'
  | 'Others';

export type SectionType = 
  | 'Text'
  | 'Paragraph'
  | 'Number'
  | 'Date'
  | 'Dropdown'
  | 'Checkbox'
  | 'Image Upload'
  | 'Table'
  | 'Rich Text';

export type TemplateStatus = 'Active' | 'Draft' | 'Archived';

export interface TemplateSectionField {
  id: string;
  name: string;
  type: SectionType;
  required: boolean;
  options?: string[];
}

export interface TemplateVersion {
  version: string;
  createdAt: string;
  changelog?: string;
  sections: TemplateSectionField[];
}

export interface TemplateItem {
  id: string;
  name: string;
  department: string;
  eventType: EventType;
  currentVersion: string;
  versions: TemplateVersion[];
  status: TemplateStatus;
  description: string;
  sectionsCount: number;
  sectionsList: string[];
  lastUsed?: string;
  lastUpdated: string;
  isDefault?: boolean;
}

export interface CreateTemplateInput {
  name: string;
  department: string;
  version: string;
  eventType: EventType;
  description: string;
  status: TemplateStatus;
  sections: Array<{ name: string; type: SectionType; required: boolean }>;
}
