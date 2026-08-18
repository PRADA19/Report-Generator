// frontend/src/store/templateStore.ts
import { create } from 'zustand';
import type { TemplateItem, CreateTemplateInput } from '../types/template';

interface TemplateState {
  templates: TemplateItem[];
  selectedTemplateId: string | null;
  searchQuery: string;
  selectedDepartment: string;
  selectedEventType: string;
  autoSaveStatus: 'saved' | 'saving' | 'idle';

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedDepartment: (dept: string) => void;
  setSelectedEventType: (type: string) => void;
  selectTemplate: (templateId: string) => void;
  clearSelectedTemplate: () => void;
  addTemplate: (input: CreateTemplateInput) => TemplateItem;
  updateTemplate: (id: string, updates: Partial<TemplateItem>) => void;
  deleteTemplate: (id: string) => void;
  getFilteredTemplates: () => TemplateItem[];
  getSelectedTemplate: () => TemplateItem | null;
  touchLastUsed: (id: string) => void;
}

const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: 'kprcas-event-template',
    name: 'KPRCAS Event Template',
    department: 'IQAC',
    eventType: 'Workshop',
    currentVersion: 'Version 1',
    versions: [
      {
        version: 'Version 1',
        createdAt: new Date().toISOString(),
        sections: [
          { id: 'kpr1', name: 'Header & Approval', type: 'Text', required: true },
          { id: 'kpr2', name: 'Event Purpose', type: 'Paragraph', required: true },
          { id: 'kpr3', name: 'Resource Persons', type: 'Table', required: true },
          { id: 'kpr4', name: 'Participant Details', type: 'Table', required: true },
          { id: 'kpr5', name: 'Summary & Highlights', type: 'Rich Text', required: true },
          { id: 'kpr6', name: 'Learning Outcomes', type: 'Paragraph', required: true },
          { id: 'kpr7', name: 'Concluding Remarks', type: 'Paragraph', required: true },
          { id: 'kpr8', name: 'Geotagged Photographs', type: 'Image Upload', required: true }
        ]
      }
    ],
    status: 'Active',
    description: 'Official IQAC accredited event report template for KPRCAS institutional events.',
    sectionsCount: 8,
    sectionsList: ['Approval Header', 'Purpose', 'Resource Persons', 'Participants', 'Summary', 'Outcomes', 'Concluding Remarks', 'Geotagged Photos'],
    lastUsed: new Date().toISOString(),
    lastUpdated: new Date().toISOString().split('T')[0],
    isDefault: true
  }
];

const LEGACY_TEMPLATE_IDS = ['annual-event-v1', 'workshop-v2', 'seminar-v1', 'kprcas-iqac-v1'];

const loadInitialTemplates = (): TemplateItem[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const isMigrated = localStorage.getItem('report_generator_templates_v2_migrated');
      const saved = localStorage.getItem('report_generator_templates');

      if (!isMigrated) {
        // One-time migration: purge old default templates from localStorage
        localStorage.setItem('report_generator_templates_v2_migrated', 'true');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((t: TemplateItem) => !LEGACY_TEMPLATE_IDS.includes(t.id));
            if (!cleaned.some((t: TemplateItem) => t.id === 'kprcas-event-template')) {
              cleaned.unshift(DEFAULT_TEMPLATES[0]);
            }
            saveTemplatesToStorage(cleaned);
            return cleaned;
          }
        }
        saveTemplatesToStorage(DEFAULT_TEMPLATES);
        return DEFAULT_TEMPLATES;
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load templates from localStorage:', err);
  }
  return DEFAULT_TEMPLATES;
};

const saveTemplatesToStorage = (templates: TemplateItem[]) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('report_generator_templates', JSON.stringify(templates));
    }
  } catch (err) {
    console.error('Failed to save templates to localStorage:', err);
  }
};

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadInitialTemplates(),
  selectedTemplateId: null, // Initially null so editor route is protected
  searchQuery: '',
  selectedDepartment: 'ALL',
  selectedEventType: 'ALL',
  autoSaveStatus: 'idle',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),
  setSelectedEventType: (type) => set({ selectedEventType: type }),

  selectTemplate: (templateId) => {
    get().touchLastUsed(templateId);
    set({ selectedTemplateId: templateId });
  },

  clearSelectedTemplate: () => set({ selectedTemplateId: null }),

  touchLastUsed: (id) => set((state) => {
    const updated = state.templates.map(t => 
      t.id === id ? { ...t, lastUsed: new Date().toISOString() } : t
    );
    saveTemplatesToStorage(updated);
    return { templates: updated };
  }),

  addTemplate: (input) => {
    const newId = `tpl_${Date.now()}`;
    const newTemplate: TemplateItem = {
      id: newId,
      name: input.name,
      department: input.department || 'General',
      eventType: input.eventType || 'Workshop',
      currentVersion: input.version || 'Version 1',
      versions: [
        {
          version: input.version || 'Version 1',
          createdAt: new Date().toISOString(),
          sections: input.sections.map((sec, idx) => ({
            id: `sec_${idx}_${Date.now()}`,
            name: sec.name,
            type: sec.type,
            required: sec.required
          }))
        }
      ],
      status: input.status || 'Active',
      description: input.description || '',
      sectionsCount: input.sections.length,
      sectionsList: input.sections.map(s => s.name),
      lastUpdated: new Date().toISOString().split('T')[0],
      isDefault: false
    };

    set((state) => {
      const nextTemplates = [newTemplate, ...state.templates];
      saveTemplatesToStorage(nextTemplates);
      return { templates: nextTemplates };
    });

    return newTemplate;
  },

  updateTemplate: (id, updates) => set((state) => {
    const nextTemplates = state.templates.map(t => 
      t.id === id ? { ...t, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : t
    );
    saveTemplatesToStorage(nextTemplates);
    return { templates: nextTemplates };
  }),

  deleteTemplate: (id) => set((state) => {
    const nextTemplates = state.templates.filter(t => t.id !== id);
    saveTemplatesToStorage(nextTemplates);
    const nextSelected = state.selectedTemplateId === id ? null : state.selectedTemplateId;
    return { templates: nextTemplates, selectedTemplateId: nextSelected };
  }),

  getFilteredTemplates: () => {
    const { templates, searchQuery, selectedDepartment, selectedEventType } = get();
    const query = searchQuery.trim().toLowerCase();

    return templates.filter((t) => {
      const matchesSearch = !query || 
        t.name.toLowerCase().includes(query) ||
        t.department.toLowerCase().includes(query) ||
        t.eventType.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query);

      const matchesDept = selectedDepartment === 'ALL' || t.department.toLowerCase() === selectedDepartment.toLowerCase();
      const matchesType = selectedEventType === 'ALL' || t.eventType.toLowerCase() === selectedEventType.toLowerCase();

      return matchesSearch && matchesDept && matchesType;
    });
  },

  getSelectedTemplate: () => {
    const { templates, selectedTemplateId } = get();
    if (!selectedTemplateId) return null;
    return templates.find(t => t.id === selectedTemplateId) || null;
  }
}));
