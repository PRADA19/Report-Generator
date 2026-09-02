// frontend/src/types/editor.ts

export interface ResourcePerson {
  name: string;
  qualification?: string;
  designation: string;
  organization: string;
}

export interface ParticipantCount {
  facultyCount: number;
  studentCount: number;
  externalCount: number;
  total: number;
}

export interface EventImage {
  id: string;
  url: string;
  caption: string;
  width?: number;
  widthPercent: number; // 25 to 100
  heightPx?: number;    // 80 to 400
  maintainAspectRatio?: boolean;
  captionPosition?: 'below' | 'overlay' | 'hidden';
}

export interface HeaderConfig {
  institutionName: string;
  department: string;
  logo: string;
  details?: string;
  address?: string;
  text?: string;
  documentTitle?: string;
  reportTitle?: string;
}

export interface FooterConfig {
  pageNumber: boolean;
  contact: string;
  text?: string;
  docCode?: string;
  version?: string;
  docDate?: string;
}

export interface EventData {
  title: string;
  startDate: string;
  endDate: string;
  venue: string;
  time?: string;
  department: string;
  organizingBody: string;
  collaboration: string;
  resourcePersons: ResourcePerson[];
  participantCount: ParticipantCount;
  purpose: string;
  summaryPoints: string[];
  outcomePoints: string[];
  images: EventImage[];
  conclusion?: string;
  attendancePercentage?: string;
  objectiveDescription?: string;
  eventSummary?: string;
  participationDetails?: string;
  header?: HeaderConfig;
  footer?: FooterConfig;
  signatures?: {
    coordinator: boolean;
    hod: boolean;
    iqac: boolean;
    principal: boolean;
    hodLabel?: string;
    deanLabel?: string;
    principalLabel?: string;
  };
}

export interface MarginConfig {
  top: number; // mm
  bottom: number; // mm
  left: number; // mm
  right: number; // mm
}

export interface StylingConfig {
  fontFamily: string;
  fontSizeBase: number; // pt
  fontSizeHeader?: number; // pt (Institution Name)
  fontSizeSubHeader?: number; // pt (Affiliation & Address)
  fontSizeTitle?: number; // pt (Quality System Document)
  fontSizeReportTitle?: number; // pt (Report of the Event)
  fontSizeTable?: number; // pt
  lineHeight: number; // e.g., 1.5
  paragraphSpacing: number; // px
  sectionSpacing: number; // px
  textColor: string; // hex
  primaryColor: string; // hex
  // Table size, length/breadth & layout controls
  tableWidthPercent?: number; // 50 to 100
  tableLabelWidthPercent?: number; // 20 to 60
  tablePaddingPx?: number; // 2 to 16
  tableBorderWidthPx?: number; // 1 to 4
  tableBorderColor?: string; // hex
  // Logo dimensions & position
  logoWidthPx?: number; // 30 to 250
  logoHeightPx?: number; // 30 to 200
  logoPosition?: 'left' | 'center' | 'right';
  showLogo?: boolean;
  pageLayout: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: MarginConfig;
  };
}

export interface LayoutConfig {
  showHeader: boolean;
  showFooter: boolean;
  showPageBorder: boolean;
  imageGridColumns: 1 | 2 | 3;
  sectionOrderLocked: boolean;
  photoLayoutMode?: 'single' | 'two' | 'three' | 'compact';
  photoLayoutPreset?: string;
  compactPhotoMode?: boolean;
}

export interface LayoutSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface EditorState {
  templateId: string;
  data: EventData;
  styling: StylingConfig;
  layoutConfig: LayoutConfig;
  sections: LayoutSection[];
  
  // Actions
  updateDataField: <K extends keyof EventData>(key: K, value: EventData[K]) => void;
  updateNestedField: (path: string, value: any) => void;
  updateStyling: (styling: Partial<StylingConfig>) => void;
  updateMargins: (margins: Partial<MarginConfig>) => void;
  updateLayoutConfig: (config: Partial<LayoutConfig>) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  loadSavedState: (saved: {
    templateId: string;
    data: EventData;
    styling: StylingConfig;
    layoutConfig: LayoutConfig;
    sections: LayoutSection[];
    layoutLocked: boolean;
  }) => void;
  resetToDefault: () => void;
  addResourcePerson: () => void;
  removeResourcePerson: (index: number) => void;
  updateResourcePerson: (index: number, rp: Partial<ResourcePerson>) => void;
  addSummaryPoint: () => void;
  removeSummaryPoint: (index: number) => void;
  updateSummaryPoint: (index: number, text: string) => void;
  addOutcomePoint: () => void;
  removeOutcomePoint: (index: number) => void;
  updateOutcomePoint: (index: number, text: string) => void;
  addImage: (url: string) => void;
  updateImage: (id: string, updates: Partial<EventImage>) => void;
  removeImage: (id: string) => void;
  layoutLocked: boolean;
  toggleLayoutLock: () => void;
  resetDocument: () => void;
  resetStyling: () => void;
  resetLayout: () => void;
  resetToTemplateDefaults: () => void;
  autofillData: (data: EventData) => void;
  clearReportData: () => void;
  currentTemplateId: string;
  templateSectionOrders: Record<string, string[]>;
  saveTemplateSectionOrder: (templateId: string, sectionOrder: string[]) => void;
  loadTemplateSectionOrder: (templateId: string) => void;
  setCurrentTemplate: (templateId: string) => void;
  resetTemplateSectionOrder: (templateId: string) => void;
  // Global Auto Fill Session Management
  activeAutofillSessionId: string | null;
  startAutofillSession: () => string;
  isAutofillSessionActive: (sessionId: string) => boolean;
  cancelAutofillSession: () => void;
}
