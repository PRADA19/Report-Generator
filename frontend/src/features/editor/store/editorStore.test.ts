// frontend/src/features/editor/store/editorStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';

describe('EventFlow Zustand Editor Store', () => {
  beforeEach(() => {
    // Reset state to template defaults before each test run
    useEditorStore.getState().resetToTemplateDefaults();
  });

  it('should successfully reset state to template defaults', () => {
    const state = useEditorStore.getState();
    expect(state.templateId).toBe('kprcas-iqac-v1');
    expect(state.layoutLocked).toBe(false);
    expect(state.sections.length).toBe(8);
  });

  it('should dynamically append a blank resource person profile', () => {
    const stateBefore = useEditorStore.getState();
    const initialCount = stateBefore.data.resourcePersons.length;

    stateBefore.addResourcePerson();

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.data.resourcePersons.length).toBe(initialCount + 1);
    expect(stateAfter.data.resourcePersons[initialCount]).toEqual({
      name: '',
      designation: '',
      organization: ''
    });
  });

  it('should update specific page margin dimensions correctly', () => {
    const stateBefore = useEditorStore.getState();
    
    stateBefore.updateMargins({ top: 15, left: 25 });

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.styling.pageLayout.margins.top).toBe(15);
    expect(stateAfter.styling.pageLayout.margins.left).toBe(25);
    expect(stateAfter.styling.pageLayout.margins.right).toBe(20); // Right margin remains unaffected
  });

  it('should swap section orders and normalize indices upon reordering', () => {
    const stateBefore = useEditorStore.getState();
    const firstSectionId = stateBefore.sections[0].id;
    const secondSectionId = stateBefore.sections[1].id;

    // Swap index 0 and index 1
    stateBefore.reorderSections(0, 1);

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.sections[0].id).toBe(secondSectionId);
    expect(stateAfter.sections[1].id).toBe(firstSectionId);
    expect(stateAfter.sections[0].order).toBe(0);
    expect(stateAfter.sections[1].order).toBe(1);
  });

  it('should delete a photograph from the images list by ID key', () => {
    const stateBefore = useEditorStore.getState();
    const imageIdToRemove = stateBefore.data.images[0].id;
    const initialImageCount = stateBefore.data.images.length;

    stateBefore.removeImage(imageIdToRemove);

    const stateAfter = useEditorStore.getState();
    expect(stateAfter.data.images.length).toBe(initialImageCount - 1);
    expect(stateAfter.data.images.find(img => img.id === imageIdToRemove)).toBeUndefined();
  });

  it('should save and load independent section orders per template', () => {
    const state = useEditorStore.getState();

    // 1. Initial template order reorder
    state.setCurrentTemplate('template-a');
    
    let freshState = useEditorStore.getState();
    const secondSectionId = freshState.sections[1].id;
    freshState.reorderSections(0, 1);

    // Verify it is reordered in state and saved
    freshState = useEditorStore.getState();
    expect(freshState.sections[0].id).toBe(secondSectionId);
    expect(freshState.templateSectionOrders['template-a'][0]).toBe(secondSectionId);

    // 2. Switch to a new template, check that it generates default order
    freshState.setCurrentTemplate('template-b');
    freshState = useEditorStore.getState();
    expect(freshState.templateId).toBe('template-b');
    expect(freshState.currentTemplateId).toBe('template-b');
    expect(freshState.templateSectionOrders['template-b']).toBeDefined();

    // Reorder sections in template-b
    const wsSecondSectionId = freshState.sections[1].id;
    freshState.reorderSections(0, 1);
    
    freshState = useEditorStore.getState();
    expect(freshState.sections[0].id).toBe(wsSecondSectionId);

    // 3. Switch back to template-a and check order is preserved
    freshState.setCurrentTemplate('template-a');
    freshState = useEditorStore.getState();
    expect(freshState.sections[0].id).toBe(secondSectionId);
  });

  it('should reset template section order to defaults without affecting other templates', () => {
    const state = useEditorStore.getState();
    state.setCurrentTemplate('template-c');

    let freshState = useEditorStore.getState();
    const originalFirstId = freshState.sections[0].id;
    const secondSectionId = freshState.sections[1].id;
    
    // Rearrange sections
    freshState.reorderSections(0, 1);
    freshState = useEditorStore.getState();
    expect(freshState.sections[0].id).toBe(secondSectionId);

    // Trigger reset
    freshState.resetTemplateSectionOrder('template-c');
    freshState = useEditorStore.getState();
    // Verify first section is restored to original default
    expect(freshState.sections[0].id).toBe(originalFirstId);
  });

  it('should support updating photo sizing properties and compact layout modes', () => {
    const state = useEditorStore.getState();
    
    // Add image and verify defaults
    state.addImage('https://test-photo.jpg');
    let freshState = useEditorStore.getState();
    const addedImage = freshState.data.images[freshState.data.images.length - 1];
    expect(addedImage.heightPx).toBe(160);
    expect(addedImage.maintainAspectRatio).toBe(true);

    // Update width/height and layout modes
    state.updateImage(addedImage.id, { widthPercent: 50, heightPx: 120 });
    state.updateLayoutConfig({ compactPhotoMode: true, photoLayoutMode: 'compact' });

    freshState = useEditorStore.getState();
    const updatedImage = freshState.data.images.find(img => img.id === addedImage.id);
    expect(updatedImage?.widthPercent).toBe(50);
    expect(updatedImage?.heightPx).toBe(120);
    expect(freshState.layoutConfig.compactPhotoMode).toBe(true);
    expect(freshState.layoutConfig.photoLayoutMode).toBe('compact');
  });
});
