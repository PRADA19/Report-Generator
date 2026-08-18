// frontend/src/features/editor/components/LeftPanel/SectionList.tsx
import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface SortableItemProps {
  id: string;
  title: string;
  visible: boolean;
  onToggle: () => void;
  onTitleChange: (title: string) => void;
  locked: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, title, visible, onToggle, onTitleChange, locked }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between border rounded-2xl p-3 text-xs transition-all duration-200 theme-transition ${
        isDragging 
          ? 'border-accent-primary ring-2 ring-accent-primary/40 bg-surface-primary shadow-xl scale-[1.01]' 
          : locked
            ? 'bg-surface-tertiary/10 border-surface-tertiary opacity-70'
            : 'bg-surface-primary border border-surface-tertiary shadow-sm hover:border-accent-primary/40 hover:shadow-md hover:bg-surface-secondary'
      }`}
    >
      <div className="flex items-center space-x-3 flex-1 overflow-hidden">
        {/* Grab handle or lock indicator */}
        {locked ? (
          <div className="text-text-muted p-1 flex-shrink-0" title="Section order locked">
            <Lock className="w-3.5 h-3.5" />
          </div>
        ) : (
          <button 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary p-1.5 hover:bg-bg-secondary rounded-xl flex-shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        
        {/* Section title edit field */}
        <input
          type="text"
          disabled={locked}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={`bg-transparent border-0 font-bold text-text-primary focus:outline-none focus:ring-0 p-0 flex-1 rounded px-1.5 py-0.5 transition-all text-xs truncate ${
            locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-bg-secondary/50'
          }`}
        />
      </div>

      <button 
        onClick={onToggle}
        disabled={locked}
        className={`p-1.5 rounded-xl transition-all ml-2 flex-shrink-0 ${
          locked 
            ? 'cursor-not-allowed text-text-muted opacity-50' 
            : 'hover:bg-bg-secondary text-text-secondary hover:text-text-primary'
        }`}
        title={locked ? "Toggle visibility" : "Toggle visibility"}
      >
        {visible ? <Eye className="w-4.5 h-4.5 text-accent-primary" /> : <EyeOff className="w-4.5 h-4.5 text-text-muted" />}
      </button>
    </div>
  );
};

export const SectionList: React.FC = () => {
  const {
    sections,
    layoutLocked,
    reorderSections,
    toggleSectionVisibility,
    updateSectionTitle,
    toggleLayoutLock
  } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (layoutLocked) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      reorderSections(oldIndex, newIndex);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
          Reorder Sections
        </span>
        <Button
          onClick={toggleLayoutLock}
          size="sm"
          variant={layoutLocked ? "primary" : "secondary"}
          className="flex items-center space-x-1.5 py-1 px-2.5 rounded-xl text-[10px] font-bold"
          title={layoutLocked ? "Unlock layout structure" : "Lock layout structure"}
        >
          {layoutLocked ? (
            <>
              <Lock className="w-3 h-3 text-white" />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3" />
              <span>Lock Order</span>
            </>
          )}
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sections.map((sec) => (
              <SortableItem 
                key={sec.id}
                id={sec.id}
                title={sec.title}
                visible={sec.visible}
                locked={layoutLocked}
                onToggle={() => toggleSectionVisibility(sec.id)}
                onTitleChange={(newTitle) => updateSectionTitle(sec.id, newTitle)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
export default SectionList;
