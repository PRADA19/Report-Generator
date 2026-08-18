// frontend/src/pages/TemplateLibrary/index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowRight, Layers, Building2, Save, X } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTemplateStore } from '../../store/templateStore';
import { useReportStore } from '../../store/reportStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { UploadTemplateModal } from '../../components/templates/UploadTemplateModal';
import { Upload } from 'lucide-react';
import type { TemplateItem, EventType, SectionType } from '../../types/template';

export const ManageTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { templates, addTemplate, updateTemplate, deleteTemplate, selectTemplate } = useTemplateStore();
  const { initializeReportFromTemplate } = useReportStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('IT');
  const [formVersion, setFormVersion] = useState('Version 1');
  const [formEventType, setFormEventType] = useState<EventType>('Workshop');
  const [formDescription, setFormDescription] = useState('');
  const [formSections, setFormSections] = useState<Array<{ name: string; type: SectionType; required: boolean }>>([
    { name: 'Header Information', type: 'Text', required: true },
    { name: 'Event Purpose', type: 'Paragraph', required: true },
    { name: 'Resource Persons', type: 'Table', required: true },
    { name: 'Summary & Highlights', type: 'Rich Text', required: true },
  ]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDept('IT');
    setFormVersion('Version 1');
    setFormEventType('Workshop');
    setFormDescription('');
    setFormSections([
      { name: 'Header Information', type: 'Text', required: true },
      { name: 'Event Purpose', type: 'Paragraph', required: true },
      { name: 'Resource Persons', type: 'Table', required: true },
      { name: 'Summary & Highlights', type: 'Rich Text', required: true },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (template: TemplateItem) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDept(template.department);
    setFormVersion(template.currentVersion);
    setFormEventType(template.eventType);
    setFormDescription(template.description);
    setFormSections(
      template.sectionsList.map(s => ({ name: s, type: 'Text' as SectionType, required: true }))
    );
    setIsModalOpen(true);
  };

  const handleAddSection = () => {
    setFormSections([...formSections, { name: 'New Section', type: 'Text', required: false }]);
  };

  const handleRemoveSection = (index: number) => {
    setFormSections(formSections.filter((_, idx) => idx !== index));
  };

  const handleSectionChange = (index: number, key: 'name' | 'type' | 'required', value: any) => {
    const next = [...formSections];
    next[index] = { ...next[index], [key]: value };
    setFormSections(next);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, {
        name: formName,
        department: formDept,
        currentVersion: formVersion,
        eventType: formEventType,
        description: formDescription,
        sectionsCount: formSections.length,
        sectionsList: formSections.map(s => s.name)
      });
    } else {
      addTemplate({
        name: formName,
        department: formDept,
        version: formVersion,
        eventType: formEventType,
        description: formDescription,
        status: 'Active',
        sections: formSections
      });
    }

    setIsModalOpen(false);
  };

  const handleUse = (template: TemplateItem) => {
    selectTemplate(template.id);
    initializeReportFromTemplate(template);
    navigate('/editor');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteTemplate(id);
    }
  };

  return (
    <DashboardLayout 
      pageTitle="Templates" 
      pageSubtitle="Create, edit, and organize your institutional event report templates."
    >
      <div className="space-y-6">
        
        {/* Header Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-tertiary/60">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Templates</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Manage unlimited custom report templates with instant updates.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              variant="secondary" 
              size="sm"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold border-surface-tertiary"
            >
              <Upload className="w-4 h-4 text-accent-primary" />
              <span>Upload Template</span>
            </Button>
            <Button 
              onClick={openCreateModal}
              variant="primary" 
              size="sm"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold shadow-md shadow-accent-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </Button>
          </div>
        </div>

        <UploadTemplateModal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
        />

        {/* Responsive Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div 
              key={template.id}
              className="bg-surface-primary border border-surface-tertiary rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="purple">{template.currentVersion}</Badge>
                  <div className="flex items-center space-x-1 text-[11px] text-text-muted font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-accent-primary" />
                    <span>Department {template.department}</span>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="text-base font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>

                {/* Section count */}
                <div className="flex items-center space-x-2 text-[11px] text-text-muted font-medium pt-1">
                  <Layers className="w-3.5 h-3.5 text-text-muted" />
                  <span>{template.sectionsCount} Configured Sections</span>
                </div>
              </div>

              {/* Actions row: Edit, Delete, Use */}
              <div className="pt-3 border-t border-surface-tertiary/60 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => openEditModal(template)}
                    variant="secondary"
                    size="sm"
                    className="px-2.5 py-1 text-[11px] font-semibold"
                  >
                    <Edit2 className="w-3 h-3 mr-1 text-text-muted" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    onClick={() => handleDelete(template.id, template.name)}
                    variant="danger"
                    size="sm"
                    className="px-2.5 py-1 text-[11px] font-semibold"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    <span>Delete</span>
                  </Button>
                </div>

                <Button
                  onClick={() => handleUse(template)}
                  variant="primary"
                  size="sm"
                  className="px-3 py-1 text-[11px] font-bold flex items-center space-x-1"
                >
                  <span>Use</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CREATE / EDIT TEMPLATE MODAL */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTemplate ? "Edit Template" : "Add New Template"}
          subtitle="Configure template properties and custom document sections."
        >
          <form onSubmit={handleSave} className="space-y-4">
            
            <Input
              label="Template Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Annual Event Report"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Department"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                placeholder="e.g. IT, ECE, CSE"
                required
              />

              <Input
                label="Version"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. Version 1"
                required
              />

              <Select
                label="Event Type"
                value={formEventType}
                onChange={(e) => setFormEventType(e.target.value as EventType)}
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Conference">Conference</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="FDP">FDP</option>
                <option value="Webinar">Webinar</option>
                <option value="Club Activity">Club Activity</option>
                <option value="Sports">Sports</option>
                <option value="Cultural">Cultural</option>
                <option value="Placement">Placement</option>
                <option value="Others">Others</option>
              </Select>
            </div>

            <Textarea
              label="Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of this report template..."
              rows={3}
            />

            {/* Template Sections */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-surface-tertiary/60 pb-1.5">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Template Sections
                </span>
                <Button 
                  type="button" 
                  onClick={handleAddSection} 
                  variant="secondary" 
                  size="sm"
                  className="text-[11px] py-1 px-2.5"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span>Add Section</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {formSections.map((sec, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-surface-secondary/70 p-2 rounded-xl border border-surface-tertiary/40">
                    <input
                      type="text"
                      value={sec.name}
                      onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                      className="flex-1 bg-surface-primary border border-surface-tertiary rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                      placeholder="Section Title"
                    />
                    <select
                      value={sec.type}
                      onChange={(e) => handleSectionChange(index, 'type', e.target.value as SectionType)}
                      className="bg-surface-primary border border-surface-tertiary rounded-lg px-2 py-1 text-[11px] text-text-primary focus:outline-none"
                    >
                      <option value="Text">Text</option>
                      <option value="Paragraph">Paragraph</option>
                      <option value="Number">Number</option>
                      <option value="Date">Date</option>
                      <option value="Dropdown">Dropdown</option>
                      <option value="Checkbox">Checkbox</option>
                      <option value="Image Upload">Image Upload</option>
                      <option value="Table">Table</option>
                      <option value="Rich Text">Rich Text</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(index)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-surface-tertiary/60 flex items-center justify-end space-x-3">
              <Button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                size="sm"
                className="px-5 font-bold shadow-md shadow-accent-primary/20"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Save</span>
              </Button>
            </div>

          </form>
        </Modal>

      </div>
    </DashboardLayout>
  );
};
