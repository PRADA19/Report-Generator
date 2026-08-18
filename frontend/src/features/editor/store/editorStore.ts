// frontend/src/features/editor/store/editorStore.ts
import { create } from 'zustand';
import type { EditorState, EventData, StylingConfig, LayoutConfig, LayoutSection } from '../../../types/editor';
import { DEFAULT_MOCK_EVENT, DEFAULT_STYLING, DEFAULT_LAYOUT_CONFIG, DEFAULT_SECTIONS } from './mockData';
import { fillEmptyBlanks } from '../../../utils/eventDataMerge';

const saveToLocalStorage = (state: {
  templateId: string;
  currentTemplateId?: string;
  data: EventData;
  styling: StylingConfig;
  layoutConfig: LayoutConfig;
  sections: LayoutSection[];
  layoutLocked?: boolean;
}) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_editor_state', JSON.stringify({
        templateId: state.templateId,
        currentTemplateId: state.currentTemplateId || state.templateId,
        data: state.data,
        styling: state.styling,
        layoutConfig: state.layoutConfig,
        sections: state.sections,
        layoutLocked: state.layoutLocked !== undefined ? state.layoutLocked : false
      }));
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

const loadInitialState = () => {
  let templateSectionOrders = {
    'kprcas-iqac-v1': ['header', 'purpose', 'resource_persons', 'participants', 'summary', 'outcomes', 'conclusion', 'images']
  };
  try {
    if (typeof localStorage !== 'undefined') {
      const savedOrders = localStorage.getItem('eventflow_template_section_orders');
      if (savedOrders) {
        templateSectionOrders = JSON.parse(savedOrders);
      }
    }
  } catch (err) {
    console.error('Failed to load initial template orders:', err);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('eventflow_editor_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.styling && parsed.sections) {
          return {
            templateId: parsed.templateId || 'kprcas-iqac-v1',
            currentTemplateId: parsed.currentTemplateId || parsed.templateId || 'kprcas-iqac-v1',
            data: parsed.data,
            styling: parsed.styling,
            layoutConfig: parsed.layoutConfig || DEFAULT_LAYOUT_CONFIG,
            sections: parsed.sections,
            layoutLocked: parsed.layoutLocked || false,
            templateSectionOrders
          };
        }
      }
    }
  } catch (err) {
    console.error('Failed to load initial state:', err);
  }
  return {
    templateId: 'kprcas-iqac-v1',
    currentTemplateId: 'kprcas-iqac-v1',
    data: DEFAULT_MOCK_EVENT,
    styling: DEFAULT_STYLING,
    layoutConfig: DEFAULT_LAYOUT_CONFIG,
    sections: DEFAULT_SECTIONS,
    layoutLocked: false,
    templateSectionOrders
  };
};

const initialState = loadInitialState();

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  updateDataField: (key, value) => set((state) => {
    const nextData = { ...state.data, [key]: value };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateNestedField: (path, value) => set((state) => {
    const parts = path.split('.');
    const nextData = { ...state.data };
    let current: any = nextData;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateStyling: (newStyling) => set((state) => {
    const nextStyling = { ...state.styling, ...newStyling };
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: nextStyling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { styling: nextStyling };
  }),

  updateMargins: (newMargins) => set((state) => {
    const nextStyling = {
      ...state.styling,
      pageLayout: {
        ...state.styling.pageLayout,
        margins: {
          ...state.styling.pageLayout.margins,
          ...newMargins
        }
      }
    };
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: nextStyling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { styling: nextStyling };
  }),

  updateLayoutConfig: (newConfig) => set((state) => {
    const nextConfig = { ...state.layoutConfig, ...newConfig };
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: nextConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { layoutConfig: nextConfig };
  }),

  reorderSections: (startIndex, endIndex) => set((state) => {
    const nextSections = Array.from(state.sections);
    const [removed] = nextSections.splice(startIndex, 1);
    nextSections.splice(endIndex, 0, removed);
    
    // Normalize order index
    const reordered = nextSections.map((sec, idx) => ({
      ...sec,
      order: idx
    }));

    const nextOrderIds = reordered.map(sec => sec.id);
    const nextTemplateOrders = {
      ...state.templateSectionOrders,
      [state.templateId]: nextOrderIds
    };

    const nextState = {
      templateId: state.templateId,
      currentTemplateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: reordered,
      templateSectionOrders: nextTemplateOrders
    };
    saveToLocalStorage(nextState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_template_section_orders', JSON.stringify(nextTemplateOrders));
    }

    return { 
      sections: reordered,
      templateSectionOrders: nextTemplateOrders
    };
  }),

  toggleSectionVisibility: (sectionId) => set((state) => {
    const nextSections = state.sections.map((sec) => 
      sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
    );

    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: nextSections
    };
    saveToLocalStorage(nextState);
    return { sections: nextSections };
  }),

  updateSectionTitle: (sectionId, title) => set((state) => {
    const nextSections = state.sections.map((sec) => 
      sec.id === sectionId ? { ...sec, title } : sec
    );

    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: nextSections
    };
    saveToLocalStorage(nextState);
    return { sections: nextSections };
  }),

  loadSavedState: (saved) => set(() => {
    saveToLocalStorage(saved);
    return saved;
  }),

  resetToDefault: () => set(() => {
    const defaults = {
      templateId: 'kprcas-iqac-v1',
      data: DEFAULT_MOCK_EVENT,
      styling: DEFAULT_STYLING,
      layoutConfig: DEFAULT_LAYOUT_CONFIG,
      sections: DEFAULT_SECTIONS
    };
    saveToLocalStorage(defaults);
    return defaults;
  }),

  addResourcePerson: () => set((state) => {
    const nextRP = [...state.data.resourcePersons, { name: '', designation: '', organization: '' }];
    const nextData = { ...state.data, resourcePersons: nextRP };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  removeResourcePerson: (index) => set((state) => {
    const nextRP = state.data.resourcePersons.filter((_, i) => i !== index);
    const nextData = { ...state.data, resourcePersons: nextRP };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateResourcePerson: (index, rpUpdates) => set((state) => {
    const nextRP = state.data.resourcePersons.map((rp, i) => 
      i === index ? { ...rp, ...rpUpdates } : rp
    );
    const nextData = { ...state.data, resourcePersons: nextRP };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  addSummaryPoint: () => set((state) => {
    const nextPoints = [...state.data.summaryPoints, ''];
    const nextData = { ...state.data, summaryPoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  removeSummaryPoint: (index) => set((state) => {
    const nextPoints = state.data.summaryPoints.filter((_, i) => i !== index);
    const nextData = { ...state.data, summaryPoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateSummaryPoint: (index, text) => set((state) => {
    const nextPoints = state.data.summaryPoints.map((pt, i) => i === index ? text : pt);
    const nextData = { ...state.data, summaryPoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  addOutcomePoint: () => set((state) => {
    const nextPoints = [...state.data.outcomePoints, ''];
    const nextData = { ...state.data, outcomePoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  removeOutcomePoint: (index) => set((state) => {
    const nextPoints = state.data.outcomePoints.filter((_, i) => i !== index);
    const nextData = { ...state.data, outcomePoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateOutcomePoint: (index, text) => set((state) => {
    const nextPoints = state.data.outcomePoints.map((pt, i) => i === index ? text : pt);
    const nextData = { ...state.data, outcomePoints: nextPoints };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  addImage: (url) => set((state) => {
    const nextImages = [
      ...state.data.images,
      {
        id: `img_${Date.now()}`,
        url,
        caption: 'New event photograph',
        widthPercent: 100,
        heightPx: 160,
        maintainAspectRatio: true,
        captionPosition: 'below' as const
      }
    ];
    const nextData = { ...state.data, images: nextImages };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  updateImage: (id, updates) => set((state) => {
    const nextImages = state.data.images.map((img) => 
      img.id === id ? { ...img, ...updates } : img
    );
    const nextData = { ...state.data, images: nextImages };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  removeImage: (id) => set((state) => {
    const nextImages = state.data.images.filter((img) => img.id !== id);
    const nextData = { ...state.data, images: nextImages };
    const nextState = {
      templateId: state.templateId,
      data: nextData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections
    };
    saveToLocalStorage(nextState);
    return { data: nextData };
  }),

  toggleLayoutLock: () => set((state) => {
    const nextLocked = !state.layoutLocked;
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections,
      layoutLocked: nextLocked
    };
    saveToLocalStorage(nextState);
    return { layoutLocked: nextLocked };
  }),

  resetDocument: () => set((state) => {
    const nextState = {
      templateId: state.templateId,
      data: DEFAULT_MOCK_EVENT,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections,
      layoutLocked: state.layoutLocked
    };
    saveToLocalStorage(nextState);
    return { data: DEFAULT_MOCK_EVENT };
  }),

  resetStyling: () => set((state) => {
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: DEFAULT_STYLING,
      layoutConfig: state.layoutConfig,
      sections: state.sections,
      layoutLocked: state.layoutLocked
    };
    saveToLocalStorage(nextState);
    return { styling: DEFAULT_STYLING };
  }),

  resetLayout: () => set((state) => {
    const nextState = {
      templateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: DEFAULT_LAYOUT_CONFIG,
      sections: DEFAULT_SECTIONS,
      layoutLocked: state.layoutLocked
    };
    saveToLocalStorage(nextState);
    return { layoutConfig: DEFAULT_LAYOUT_CONFIG, sections: DEFAULT_SECTIONS };
  }),

  resetToTemplateDefaults: () => set((state) => {
    const defaults = {
      templateId: 'kprcas-iqac-v1',
      currentTemplateId: 'kprcas-iqac-v1',
      data: DEFAULT_MOCK_EVENT,
      styling: DEFAULT_STYLING,
      layoutConfig: DEFAULT_LAYOUT_CONFIG,
      sections: DEFAULT_SECTIONS,
      layoutLocked: false,
      templateSectionOrders: state.templateSectionOrders
    };
    saveToLocalStorage(defaults);
    return defaults;
  }),

  autofillData: (newData) => set((state) => {
    const mergedData = fillEmptyBlanks(state.data, newData);
    const nextState = {
      templateId: state.templateId,
      currentTemplateId: state.templateId,
      data: mergedData,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: state.sections,
      layoutLocked: state.layoutLocked,
      templateSectionOrders: state.templateSectionOrders
    };
    saveToLocalStorage(nextState);
    return { data: mergedData };
  }),

  saveTemplateSectionOrder: (templateId, sectionOrder) => set((state) => {
    const nextOrders = { ...state.templateSectionOrders, [templateId]: sectionOrder };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_template_section_orders', JSON.stringify(nextOrders));
    }
    return { templateSectionOrders: nextOrders };
  }),

  loadTemplateSectionOrder: (templateId) => set((state) => {
    const order = state.templateSectionOrders[templateId] || ['header', 'purpose', 'resource_persons', 'participants', 'summary', 'outcomes', 'conclusion', 'images'];
    const nextSections = [...state.sections];
    nextSections.sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);
      return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
    });
    const reorderedSections = nextSections.map((sec, idx) => ({
      ...sec,
      order: idx
    }));
    return { sections: reorderedSections };
  }),

  setCurrentTemplate: (templateId) => set((state) => {
    let templateOrder = state.templateSectionOrders[templateId];
    if (!templateOrder) {
      // Default order
      templateOrder = ['header', 'purpose', 'resource_persons', 'participants', 'summary', 'outcomes', 'conclusion', 'images'];
    }

    const nextSections = [...state.sections];
    nextSections.sort((a, b) => {
      const indexA = templateOrder.indexOf(a.id);
      const indexB = templateOrder.indexOf(b.id);
      return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
    });
    
    const reorderedSections = nextSections.map((sec, idx) => ({
      ...sec,
      order: idx
    }));

    const nextState = {
      templateId,
      currentTemplateId: templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: reorderedSections,
      templateSectionOrders: {
        ...state.templateSectionOrders,
        [templateId]: templateOrder
      }
    };
    saveToLocalStorage(nextState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_template_section_orders', JSON.stringify(nextState.templateSectionOrders));
    }

    return { 
      templateId, 
      currentTemplateId: templateId, 
      sections: reorderedSections,
      templateSectionOrders: nextState.templateSectionOrders
    };
  }),

  resetTemplateSectionOrder: (templateId) => set((state) => {
    const defaultOrder = ['header', 'purpose', 'resource_persons', 'participants', 'summary', 'outcomes', 'conclusion', 'images'];
    const nextSections = [...state.sections];
    nextSections.sort((a, b) => {
      const indexA = defaultOrder.indexOf(a.id);
      const indexB = defaultOrder.indexOf(b.id);
      return (indexA !== -1 ? indexA : 99) - (indexB !== -1 ? indexB : 99);
    });

    const reorderedSections = nextSections.map((sec, idx) => ({
      ...sec,
      order: idx
    }));

    const nextTemplateOrders = {
      ...state.templateSectionOrders,
      [templateId]: defaultOrder
    };

    const nextState = {
      templateId: state.templateId,
      currentTemplateId: state.templateId,
      data: state.data,
      styling: state.styling,
      layoutConfig: state.layoutConfig,
      sections: reorderedSections,
      templateSectionOrders: nextTemplateOrders
    };
    saveToLocalStorage(nextState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('eventflow_template_section_orders', JSON.stringify(nextTemplateOrders));
    }

    return {
      sections: reorderedSections,
      templateSectionOrders: nextTemplateOrders
    };
  })
}));
