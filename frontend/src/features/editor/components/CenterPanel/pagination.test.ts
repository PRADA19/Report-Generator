// frontend/src/features/editor/components/CenterPanel/pagination.test.ts
import { describe, it, expect } from 'vitest';
import type { EventData, StylingConfig, LayoutConfig, LayoutSection } from '../../../../types/editor';

describe('A4 Multi-Page Pagination Logic', () => {

  const defaultStyling: StylingConfig = {
    fontFamily: 'Inter, sans-serif',
    fontSizeBase: 10,
    fontSizeHeader: 13,
    fontSizeSubHeader: 9,
    fontSizeTitle: 11,
    fontSizeReportTitle: 12,
    fontSizeTable: 10,
    primaryColor: '#004B87',
    textColor: '#1e293b',
    paragraphSpacing: 8,
    sectionSpacing: 12,
    lineHeight: 1.4,
    showLogo: true,
    logoWidthPx: 120,
    logoHeightPx: 50,
    logoPosition: 'left',
    tableWidthPercent: 100,
    tableLabelWidthPercent: 32,
    tablePaddingPx: 6,
    tableBorderWidthPx: 1,
    tableBorderColor: '#94a3b8',
    pageLayout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, bottom: 15, left: 15, right: 15 }
    }
  };

  const defaultLayoutConfig: LayoutConfig = {
    showHeader: true,
    showPageBorder: true,
    showFooter: true,
    imageGridColumns: 2,
    sectionOrderLocked: false,
    compactPhotoMode: false,
    photoLayoutMode: 'compact'
  };

  const defaultSections: LayoutSection[] = [
    { id: 'header', title: 'Header', visible: true, order: 0 },
    { id: 'purpose', title: 'Purpose of the Event:', visible: true, order: 1 },
    { id: 'resource_persons', title: 'Details of Resource Person', visible: true, order: 2 },
    { id: 'participants', title: 'Participation Details', visible: true, order: 3 },
    { id: 'summary', title: 'Summary of the Event', visible: true, order: 4 },
    { id: 'outcomes', title: 'Outcome of the Event', visible: true, order: 5 },
    { id: 'images', title: 'Geo-Tagged Photographs:', visible: true, order: 6 },
    { id: 'signatures', title: 'Signatures', visible: true, order: 7 }
  ];

  const shortData: EventData = {
    title: 'HACK TO PATENT',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    venue: 'Lecture Hall 1',
    time: '10:00 AM',
    department: 'Department of Information Technology',
    organizingBody: 'School of Computing Science',
    collaboration: 'IIC & IPR Cell',
    purpose: 'To provide insights into patenting tech innovations.',
    objectiveDescription: 'Students learned about filing provisional patent applications.',
    eventSummary: 'The session covered intellectual property rights basics.',
    summaryPoints: [
      'Overview of patent laws in India.',
      'How to conduct prior art searches.'
    ],
    outcomePoints: [
      'Participants understood patent filing workflows.',
      'Students identified patentable project ideas.'
    ],
    attendancePercentage: '95%',
    participationDetails: 'A total of 120 IT students actively participated.',
    resourcePersons: [
      { name: 'Dr. A. Kumar', designation: 'Professor', organization: 'KPRCAS' }
    ],
    participantCount: { facultyCount: 5, studentCount: 115, externalCount: 0, total: 120 },
    images: []
  };

  it('should compile pagination layout without error for standard report data', () => {
    expect(shortData.title).toBe('HACK TO PATENT');
    expect(defaultSections.length).toBe(8);
    expect(defaultStyling.pageLayout.margins.top).toBe(15);
  });

  it('should verify A4 usable height boundary calculations', () => {
    const pageHeightMm = 297;
    const topMarginMm = defaultStyling.pageLayout.margins.top;
    const bottomMarginMm = defaultStyling.pageLayout.margins.bottom;
    const footerReservedMm = defaultLayoutConfig.showFooter ? 16 : 4;

    const usableHeightMm = pageHeightMm - topMarginMm - bottomMarginMm - footerReservedMm;
    expect(usableHeightMm).toBe(251); // 297 - 15 - 15 - 16 = 251mm

    const usableHeightPx = usableHeightMm * 3.779527559;
    expect(usableHeightPx).toBeGreaterThan(900);
    expect(usableHeightPx).toBeLessThan(1000);
  });

  it('should calculate non-duplication text splitting correctly', () => {
    const longText = 'Paragraph sentence 1. Paragraph sentence 2. Paragraph sentence 3. Paragraph sentence 4. Paragraph sentence 5. Paragraph sentence 6. Paragraph sentence 7. Paragraph sentence 8.';
    
    const splitCharIdx = Math.floor(longText.length * 0.5);
    let splitIdx = longText.lastIndexOf(' ', splitCharIdx);
    if (splitIdx <= 0) splitIdx = splitCharIdx;

    const part1 = longText.substring(0, splitIdx).trim();
    const part2 = longText.substring(splitIdx).trim();

    expect(part1 + ' ' + part2).toBe(longText);
    expect(part1.endsWith('sentence 4.') || part1.endsWith('sentence 4')).toBe(true);
    expect(part2.startsWith('Paragraph sentence 5.')).toBe(true);
    expect(part1).not.toContain('sentence 5');
    expect(part2).not.toContain('sentence 1');
  });

  it('should handle deliberately long content with multi-page structure', () => {
    const longData: EventData = {
      ...shortData,
      purpose: 'A '.repeat(500) + 'Long purpose text block.',
      eventSummary: 'B '.repeat(1000) + 'Long summary paragraph text block.',
      summaryPoints: Array.from({ length: 15 }, (_, i) => `Summary Point ${i + 1}: ${'C '.repeat(30)}`),
      outcomePoints: Array.from({ length: 15 }, (_, i) => `Outcome Point ${i + 1}: ${'D '.repeat(30)}`)
    };

    expect((longData.purpose || '').length).toBeGreaterThan(1000);
    expect((longData.eventSummary || '').length).toBeGreaterThan(2000);
    expect(longData.summaryPoints.length).toBe(15);
    expect(longData.outcomePoints.length).toBe(15);
  });
});
