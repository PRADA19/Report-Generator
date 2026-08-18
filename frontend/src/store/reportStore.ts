// frontend/src/store/reportStore.ts
import { create } from 'zustand';
import type { ReportDraft } from '../types/report';
import { useEditorStore } from '../features/editor/store/editorStore';
import type { TemplateItem } from '../types/template';

interface ReportStoreState {
  currentDraft: ReportDraft | null;
  reportsCount: number;

  // Actions
  initializeReportFromTemplate: (template: TemplateItem) => void;
  updateDraftTitle: (title: string) => void;
  setDraftStep: (step: number) => void;
  incrementReportsCount: () => void;
}

export const useReportStore = create<ReportStoreState>((set) => ({
  currentDraft: null,
  reportsCount: 0, // Enterprise counter base

  initializeReportFromTemplate: (template) => {
    // Update existing editorStore template selection
    useEditorStore.getState().setCurrentTemplate(template.id);
    
    const currentData = useEditorStore.getState().data;
    const newDraft: ReportDraft = {
      id: `rep_${Date.now()}`,
      title: `${template.name} - ${template.department}`,
      templateId: template.id,
      templateVersion: template.currentVersion,
      currentStep: 1,
      data: {
        ...currentData,
        title: `${template.name} - ${template.department}`
      },
      lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Draft'
    };

    set({ currentDraft: newDraft });
  },

  updateDraftTitle: (title) => set((state) => {
    if (!state.currentDraft) return {};
    useEditorStore.getState().updateDataField('title', title);
    return {
      currentDraft: {
        ...state.currentDraft,
        title,
        lastSaved: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };
  }),

  setDraftStep: (step) => set((state) => {
    if (!state.currentDraft) return {};
    return {
      currentDraft: {
        ...state.currentDraft,
        currentStep: step
      }
    };
  }),

  incrementReportsCount: () => set((state) => ({ reportsCount: state.reportsCount + 1 }))
}));
