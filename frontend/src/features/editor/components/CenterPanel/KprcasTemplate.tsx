import React from 'react';
import type { EventData, StylingConfig, LayoutConfig, LayoutSection } from '../../../../types/editor';
import { getPresetById } from '../LeftPanel/photoLayoutPresets';
import { DEFAULT_MOCK_EVENT, DEFAULT_STYLING, DEFAULT_LAYOUT_CONFIG, DEFAULT_SECTIONS } from '../../store/mockData';

interface KprcasTemplateProps {
  data?: EventData;
  styling?: StylingConfig;
  layoutConfig?: LayoutConfig;
  sections?: LayoutSection[];
  zoomScale?: number;
}

// Helper to render raw blocks safely
const renderRawBlock = (block: any) => {
  if (!block || typeof block.render !== 'function') return null;
  try {
    if (block.type === 'paragraph' || block.type === 'bullet' || block.type === 'attendance_details') {
      return block.render(block.text || '');
    }
    return block.render();
  } catch (err) {
    console.error('Error rendering block:', block, err);
    return null;
  }
};

const formatDateToDdMmYyyy = (dateStr: string) => {
  if (!dateStr || !dateStr.trim()) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  const match = dateStr.match(/(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
  if (match) {
    if (match[1].length === 4) {
      return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
    } else {
      return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3].length === 2 ? '20' + match[3] : match[3]}`;
    }
  }
  return dateStr;
};

export const KprcasTemplate: React.FC<KprcasTemplateProps> = ({
  data = DEFAULT_MOCK_EVENT,
  styling = DEFAULT_STYLING,
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
  sections = DEFAULT_SECTIONS,
  zoomScale = 1.0
}) => {
  const safeData = data || DEFAULT_MOCK_EVENT;
  const safeStyling = styling || DEFAULT_STYLING;
  const safeSections = (sections && Array.isArray(sections) && sections.length > 0) ? sections : DEFAULT_SECTIONS;

  const measurerRef = React.useRef<HTMLDivElement>(null);
  const [paginatedPages, setPaginatedPages] = React.useState<React.ReactNode[][]>([]);
  const lastStateRef = React.useRef<string>('');

  const sortedSections = [...safeSections].sort((a, b) => (a.order || 0) - (b.order || 0));

  const textStyle = {
    color: safeStyling.textColor || '#1e293b',
  };

  const fontSizeHeader = safeStyling.fontSizeHeader || 13;
  const fontSizeSubHeader = safeStyling.fontSizeSubHeader || 9;
  const fontSizeTitle = safeStyling.fontSizeTitle || 11;
  const fontSizeReportTitle = safeStyling.fontSizeReportTitle || 12;
  const fontSizeTable = safeStyling.fontSizeTable || 10;
  const fontSizeBase = safeStyling.fontSizeBase || 10;

  const tableWidthPercent = safeStyling.tableWidthPercent !== undefined ? safeStyling.tableWidthPercent : 100;
  const tableLabelWidthPercent = safeStyling.tableLabelWidthPercent !== undefined ? safeStyling.tableLabelWidthPercent : 32;
  const tablePaddingPx = safeStyling.tablePaddingPx !== undefined ? safeStyling.tablePaddingPx : 6;
  const tableBorderWidthPx = safeStyling.tableBorderWidthPx !== undefined ? safeStyling.tableBorderWidthPx : 1;
  const tableBorderColor = safeStyling.tableBorderColor || '#94a3b8';

  const logoWidthPx = safeStyling.logoWidthPx !== undefined ? safeStyling.logoWidthPx : 120;
  const logoHeightPx = safeStyling.logoHeightPx !== undefined ? safeStyling.logoHeightPx : 50;
  const logoPosition = safeStyling.logoPosition || 'left';
  const showLogo = safeStyling.showLogo !== false;

    const renderHeaderSection = () => {
    const tableStyle: React.CSSProperties = {
      width: `${tableWidthPercent}%`,
      marginLeft: 'auto',
      marginRight: 'auto',
      fontSize: `${fontSizeTable}pt`,
      borderCollapse: 'collapse',
      border: `${tableBorderWidthPx}px solid ${tableBorderColor}`
    };

    const cellStyle: React.CSSProperties = {
      border: `${tableBorderWidthPx}px solid ${tableBorderColor}`,
      padding: `${Math.max(3, tablePaddingPx - 2)}px ${Math.max(4, tablePaddingPx)}px`,
      minHeight: '24px',
      verticalAlign: 'middle',
      lineHeight: 1.3
    };

    const headerInstitutionName = safeData.header?.institutionName || "KPR College of Arts Science and Research";
    const headerDetails = safeData.header?.details || "(Affiliated to Bharathiar University, Coimbatore)";
    const headerAddress = safeData.header?.address || "Avinashi Road, Arasur, Coimbatore – 641 407";
    const headerDocTitle = safeData.header?.documentTitle || safeData.header?.text || "Quality System Document";
    const headerReportTitle = safeData.header?.reportTitle || "Report of the Event";

    return (
      <div key="document-header" className="report-section document-header-section pb-2 mb-3">
        <div className="pb-2 border-b-2 mb-3 relative flex flex-col w-full" style={{ borderColor: styling.primaryColor }}>
          {showLogo && logoPosition === 'center' ? (
            <div className="flex flex-col items-center w-full">
              <div className="mb-2" style={{ width: `${logoWidthPx}px` }}>
                <img 
                  src={data.header?.logo || '/kprcas_logo.png'} 
                  alt="KPRCAS Logo" 
                  style={{ width: `${logoWidthPx}px`, height: `${logoHeightPx}px`, objectFit: 'contain' }} 
                />
              </div>
              <div className="text-center w-full px-2">
                <h1 className="font-extrabold uppercase" style={{ fontSize: `${fontSizeHeader}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerInstitutionName}
                </h1>
                <p className="text-slate-700 font-semibold mt-0.5" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerDetails}
                </p>
                <p className="text-slate-700 font-medium" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerAddress}
                </p>
                <div className="my-1.5" />
                <h2 className="font-bold uppercase" style={{ fontSize: `${fontSizeTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerDocTitle}
                </h2>
                <h3 className="font-extrabold uppercase mt-0.5" style={{ fontSize: `${fontSizeReportTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerReportTitle}
                </h3>
              </div>
            </div>
          ) : showLogo && logoPosition === 'right' ? (
            <div className="flex items-center justify-between w-full">
              <div style={{ width: `${logoWidthPx}px` }} className="flex-shrink-0" aria-hidden="true" />
              <div className="text-center flex-1 min-w-0 px-2">
                <h1 className="font-extrabold uppercase" style={{ fontSize: `${fontSizeHeader}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerInstitutionName}
                </h1>
                <p className="text-slate-700 font-semibold mt-0.5" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerDetails}
                </p>
                <p className="text-slate-700 font-medium" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerAddress}
                </p>
                <div className="my-1.5" />
                <h2 className="font-bold uppercase" style={{ fontSize: `${fontSizeTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerDocTitle}
                </h2>
                <h3 className="font-extrabold uppercase mt-0.5" style={{ fontSize: `${fontSizeReportTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerReportTitle}
                </h3>
              </div>
              <div style={{ width: `${logoWidthPx}px` }} className="flex-shrink-0 flex items-center justify-end">
                <img 
                  src={data.header?.logo || '/kprcas_logo.png'} 
                  alt="KPRCAS Logo" 
                  style={{ width: `${logoWidthPx}px`, height: `${logoHeightPx}px`, objectFit: 'contain' }} 
                />
              </div>
            </div>
          ) : showLogo ? (
            /* Default: Logo Left with Balanced Right Spacer */
            <div className="flex items-center justify-between w-full">
              <div style={{ width: `${logoWidthPx}px` }} className="flex-shrink-0 flex items-center justify-start">
                <img 
                  src={data.header?.logo || '/kprcas_logo.png'} 
                  alt="KPRCAS Logo" 
                  style={{ width: `${logoWidthPx}px`, height: `${logoHeightPx}px`, objectFit: 'contain' }} 
                />
              </div>
              <div className="text-center flex-1 min-w-0 px-2">
                <h1 className="font-extrabold uppercase" style={{ fontSize: `${fontSizeHeader}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerInstitutionName}
                </h1>
                <p className="text-slate-700 font-semibold mt-0.5" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerDetails}
                </p>
                <p className="text-slate-700 font-medium" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                  {headerAddress}
                </p>
                <div className="my-1.5" />
                <h2 className="font-bold uppercase" style={{ fontSize: `${fontSizeTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerDocTitle}
                </h2>
                <h3 className="font-extrabold uppercase mt-0.5" style={{ fontSize: `${fontSizeReportTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                  {headerReportTitle}
                </h3>
              </div>
              <div style={{ width: `${logoWidthPx}px` }} className="flex-shrink-0" aria-hidden="true" />
            </div>
          ) : (
            <div className="text-center w-full px-2">
              <h1 className="font-extrabold uppercase" style={{ fontSize: `${fontSizeHeader}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                {headerInstitutionName}
              </h1>
              <p className="text-slate-700 font-semibold mt-0.5" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                {headerDetails}
              </p>
              <p className="text-slate-700 font-medium" style={{ fontSize: `${fontSizeSubHeader}pt`, lineHeight: 1.2 }}>
                {headerAddress}
              </p>
              <div className="my-1.5" />
              <h2 className="font-bold uppercase" style={{ fontSize: `${fontSizeTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                {headerDocTitle}
              </h2>
              <h3 className="font-extrabold uppercase mt-0.5" style={{ fontSize: `${fontSizeReportTitle}pt`, color: styling.primaryColor, lineHeight: 1.25 }}>
                {headerReportTitle}
              </h3>
            </div>
          )}

          {/* Date Label on Far Right under Header Title */}
          <div className="w-full flex justify-end mt-1 pr-1 font-bold text-slate-800" style={{ fontSize: `${fontSizeBase * 0.9}pt` }}>
            <span>Date: <span className="font-normal">{data.startDate ? formatDateToDdMmYyyy(data.startDate) : '\u00A0'}</span></span>
          </div>
        </div>

        <table style={tableStyle} className="text-left mt-4">
          <tbody>
            <tr>
              <th style={{ ...cellStyle, width: `${tableLabelWidthPercent}%` }} className="font-bold text-slate-800 bg-slate-50/50">Event Title</th>
              <td style={{ ...cellStyle, width: `${100 - tableLabelWidthPercent}%` }} className="font-bold text-slate-900">{data.title || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Organizing Body</th>
              <td style={cellStyle} className="text-slate-800">{data.organizingBody || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Collaborations (If any)</th>
              <td style={cellStyle} className="text-slate-800">{data.collaboration || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Details of Resource Person</th>
              <td style={cellStyle} className="text-slate-800">
                {data.resourcePersons && data.resourcePersons.length > 0 ? (
                  <div className="space-y-1">
                    {data.resourcePersons.map((rp, idx) => (
                      <div key={idx}>
                        <span className="font-semibold">{rp.name}</span>
                        {rp.qualification && <span className="font-normal text-slate-700"> {rp.qualification}</span>}
                        {rp.designation && <span>, {rp.designation}</span>}
                        {rp.organization && <span> - {rp.organization}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  '\u00A0'
                )}
              </td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Organizing Department</th>
              <td style={cellStyle} className="text-slate-800">{data.department || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Event Date</th>
              <td style={cellStyle} className="text-slate-800">
                {data.startDate ? (formatDateToDdMmYyyy(data.startDate) + (data.endDate && data.endDate !== data.startDate ? ` to ${formatDateToDdMmYyyy(data.endDate)}` : '')) : '\u00A0'}
              </td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Venue</th>
              <td style={cellStyle} className="text-slate-800">{data.venue || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">Time</th>
              <td style={cellStyle} className="text-slate-800">{data.time || '\u00A0'}</td>
            </tr>
            <tr>
              <th style={cellStyle} className="font-bold text-slate-800 bg-slate-50/50">
                Total number of Students Participated
              </th>
              <td style={cellStyle} className="text-slate-800 font-bold">
                {(data.participantCount?.total && data.participantCount.total > 0) ? (data.participantCount.studentCount || data.participantCount.total) : '\u00A0'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderSignatures = () => {
    const hodLabel = data.signatures?.hodLabel || 'HOD';
    const deanLabel = data.signatures?.deanLabel || 'Dean';
    const principalLabel = data.signatures?.principalLabel || 'Principal';

    return (
      <div key="signatures-block" className="signatures-block mt-12 pt-6">
        <div className="signature-grid flex justify-between gap-8 text-center font-sans font-bold text-slate-800" style={{ fontSize: `${fontSizeBase * 0.9}pt` }}>
          <div className="flex-grow flex-shrink w-1/3">
            <div className="h-16" />
            <p>{hodLabel}</p>
          </div>
          <div className="flex-grow flex-shrink w-1/3">
            <div className="h-16" />
            <p>{deanLabel}</p>
          </div>
          <div className="flex-grow flex-shrink w-1/3">
            <div className="h-16" />
            <p>{principalLabel}</p>
          </div>
        </div>
      </div>
    );
  };

  // Generate granular content blocks for measurement and partitioning
  const rawBlocks: any[] = [];
  
  // 1. Header
  rawBlocks.push({
    id: 'header-block',
    type: 'header',
    render: () => renderHeaderSection()
  });

  // 2. Dynamic Sections
  const SECTION_TITLES: Record<string, string> = {
    purpose: 'Purpose of the Event:',
    summary: 'Summary of the Event',
    outcomes: 'Outcome of the Event',
    images: 'Geo-Tagged Photographs:',
  };

  sortedSections.forEach((sec) => {
    if (!sec.visible) return;
    if (sec.id === 'header' || sec.id === 'resource_persons' || sec.id === 'participants') return; // Embedded in the header layout & table
    
    // Title block
    rawBlocks.push({
      id: `title-${sec.id}`,
      type: 'title',
      sectionId: sec.id,
      render: () => (
        <h4 className="font-bold text-[#004B87] mt-4 mb-2" style={{ fontSize: `${fontSizeSubHeader}pt`, color: styling.primaryColor }}>
          {SECTION_TITLES[sec.id] || sec.title}
        </h4>
      )
    });

    switch (sec.id) {
      case 'purpose':
        rawBlocks.push({
          id: 'purpose-text',
          type: 'paragraph',
          sectionId: sec.id,
          text: data.purpose || "No event objective provided.",
          render: (text: string) => (
            <p className="text-justify leading-normal text-slate-800" style={{ fontSize: `${fontSizeBase}pt`, marginBottom: `${styling.paragraphSpacing}px` }}>
              {text}
            </p>
          )
        });
        if (data.objectiveDescription) {
          rawBlocks.push({
            id: 'objective-desc-text',
            type: 'paragraph',
            sectionId: sec.id,
            text: data.objectiveDescription,
            render: (text: string) => (
              <p className="text-justify leading-normal text-slate-800 font-medium" style={{ fontSize: `${fontSizeBase}pt`, marginBottom: `${styling.paragraphSpacing}px` }}>
                {text}
              </p>
            )
          });
        }
        break;

      case 'resource_persons':
        // Table Header
        rawBlocks.push({
          id: 'rp-table-header',
          type: 'rp_header',
          sectionId: sec.id,
          render: () => (
            <table className="min-w-full text-left border-collapse border border-slate-300" style={{ fontSize: `${fontSizeTable}pt` }}>
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-300 px-2 py-1 font-semibold w-[8%]">S.No</th>
                  <th className="border border-slate-300 px-2 py-1 font-semibold w-[32%]">Name of Resource Person</th>
                  <th className="border border-slate-300 px-2 py-1 font-semibold w-[30%]">Designation</th>
                  <th className="border border-slate-300 px-2 py-1 font-semibold w-[30%]">Organization</th>
                </tr>
              </thead>
            </table>
          )
        });
        // Table Rows
        data.resourcePersons.forEach((rp, idx) => {
          rawBlocks.push({
            id: `rp-row-${idx}`,
            type: 'rp_row',
            sectionId: sec.id,
            data: { rp, idx },
            render: () => (
              <table className="min-w-full text-left border-collapse border border-slate-300" style={{ fontSize: `${fontSizeTable}pt`, marginTop: '-1px' }}>
                <tbody>
                  <tr className="hover:bg-slate-50/50">
                    <td className="border border-slate-300 px-2 py-1 text-slate-800 w-[8%]">{idx + 1}</td>
                    <td className="border border-slate-300 px-2 py-1 font-medium text-slate-900 w-[32%]">{rp.name}</td>
                    <td className="border border-slate-300 px-2 py-1 text-slate-800 w-[30%]">{rp.designation}</td>
                    <td className="border border-slate-300 px-2 py-1 text-slate-800 w-[30%]">{rp.organization}</td>
                  </tr>
                </tbody>
              </table>
            )
          });
        });
        break;

      case 'participants':
        rawBlocks.push({
          id: 'participant-table',
          type: 'participant_table',
          sectionId: sec.id,
          render: () => (
            <table className="min-w-full text-left border-collapse border border-slate-300" style={{ fontSize: `${fontSizeTable}pt` }}>
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-slate-300 px-3 py-1 font-semibold">Category</th>
                  <th className="border border-slate-300 px-3 py-1 font-semibold text-center">Faculty Count</th>
                  <th className="border border-slate-300 px-3 py-1 font-semibold text-center">Student Count</th>
                  <th className="border border-slate-300 px-3 py-1 font-semibold text-center">External Participants</th>
                  <th className="border border-slate-300 px-3 py-1 font-semibold text-center bg-slate-100">Total Count</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-slate-800">
                  <td className="border border-slate-300 px-3 py-1 font-medium">Participants</td>
                  <td className="border border-slate-300 px-3 py-1 text-center">{data.participantCount.facultyCount}</td>
                  <td className="border border-slate-300 px-3 py-1 text-center">{data.participantCount.studentCount}</td>
                  <td className="border border-slate-300 px-3 py-1 text-center">{data.participantCount.externalCount}</td>
                  <td className="border border-slate-300 px-3 py-1 text-center font-bold bg-slate-100/50 text-slate-900">{data.participantCount.total}</td>
                </tr>
              </tbody>
            </table>
          )
        });
        
        rawBlocks.push({
          id: 'attendance-details-block',
          type: 'attendance_details',
          sectionId: sec.id,
          text: data.participationDetails || '',
          render: (text: string) => (
            <div className="space-y-1.5 w-full">
              {data.attendancePercentage && (
                <div className="text-right font-semibold text-slate-500 mt-0.5" style={{ fontSize: `${fontSizeBase * 0.9}pt` }}>
                  Attendance Percentage: <span className="text-slate-800 font-bold">{data.attendancePercentage}</span>
                </div>
              )}
              {text && (
                <p className="text-justify leading-normal text-slate-800 font-medium" style={{ fontSize: `${fontSizeBase}pt` }}>
                  {text}
                </p>
              )}
            </div>
          )
        });
        break;

      case 'summary': {
        const summaryText = data.eventSummary
          ? data.eventSummary
          : (data.summaryPoints && data.summaryPoints.length > 0 ? data.summaryPoints.join(' ') : '');

        if (summaryText) {
          rawBlocks.push({
            id: 'summary-text-block',
            type: 'paragraph',
            sectionId: sec.id,
            text: summaryText,
            render: (text: string) => (
              <p className="text-justify leading-normal text-slate-800" style={{ fontSize: `${fontSizeBase}pt`, marginBottom: `${styling.paragraphSpacing}px` }}>
                {text}
              </p>
            )
          });
        }
        break;
      }

      case 'outcomes':
        if (data.outcomePoints && data.outcomePoints.length > 0) {
          data.outcomePoints.forEach((pt, idx) => {
            rawBlocks.push({
              id: `outcome-pt-${idx}`,
              type: 'bullet',
              sectionId: sec.id,
              text: pt,
              render: (text: string) => (
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className="text-justify text-slate-800" style={{ fontSize: `${fontSizeBase}pt`, marginBottom: `${styling.paragraphSpacing}px` }}>{text}</li>
                </ul>
              )
            });
          });
        }
        break;

      case 'images': {
        if (!data.images || data.images.length === 0) break;
        
        const totalImages = data.images.length;
        const preset = getPresetById(layoutConfig.photoLayoutPreset, totalImages);
        
        let imagePointer = 0;
        preset.rows.forEach((rowConfig, rowIdx) => {
          if (imagePointer >= totalImages) return;

          const rowImgsWithWidth: { img: any; colWidth: number }[] = [];
          rowConfig.columns.forEach((colWidth) => {
            if (imagePointer < totalImages) {
              rowImgsWithWidth.push({
                img: data.images[imagePointer],
                colWidth
              });
              imagePointer++;
            }
          });

          if (rowImgsWithWidth.length === 0) return;

          const cardHeight = rowConfig.heightPx || 160;
          const isSingleCentered = rowImgsWithWidth.length === 1 && rowImgsWithWidth[0].colWidth < 100;

          rawBlocks.push({
            id: `image-row-${rowIdx}`,
            type: 'image_row',
            sectionId: sec.id,
            render: () => (
              <div 
                className={`w-full mb-3 flex gap-3 ${isSingleCentered ? 'justify-center' : 'justify-between'}`} 
              >
                {rowImgsWithWidth.map(({ img, colWidth }, imgIdx: number) => {
                  const effectiveWidth = (img.widthPercent && img.widthPercent !== 100)
                    ? (img.widthPercent / 100) * colWidth
                    : colWidth;
                  const effectiveHeight = img.heightPx || cardHeight;

                  return (
                    <figure 
                      key={img.id || imgIdx} 
                      style={{ width: `${effectiveWidth}%` }}
                      className="photo-card relative border border-slate-300 rounded p-1.5 bg-slate-50/50 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="relative w-full overflow-hidden rounded border border-slate-200 bg-slate-100/60 flex items-center justify-center" style={{ height: `${effectiveHeight}px` }}>
                        <img 
                          src={img.url} 
                          alt={img.caption || 'Geo-Tagged Photograph'} 
                          style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        {img.captionPosition === 'overlay' && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[8px] py-1 px-1.5 text-center font-medium">
                            {img.caption}
                          </div>
                        )}
                      </div>
                      {img.captionPosition !== 'overlay' && img.captionPosition !== 'hidden' && (
                        <figcaption className="text-[9px] text-slate-600 italic mt-1 text-center leading-tight">
                          {img.caption || `Geo-Tagged Photograph ${imagePointer - rowImgsWithWidth.length + imgIdx + 1}`}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            )
          });
        });
        break;
      }
    }
  });

  // 3. Signatures
  rawBlocks.push({
    id: 'signatures-block',
    type: 'signatures',
    render: () => renderSignatures()
  });

  // Dynamic Flow-Based Pagination Engine via DOM Measurement
  React.useLayoutEffect(() => {
    if (!measurerRef.current) {
      setPaginatedPages([[...rawBlocks.map(renderRawBlock)]]);
      return;
    }

    const dummyPage = measurerRef.current.querySelector('.dummy-page') as HTMLElement;
    if (!dummyPage) {
      setPaginatedPages([[...rawBlocks.map(renderRawBlock)]]);
      return;
    }

    const measuredHeight = dummyPage.offsetHeight || dummyPage.clientHeight || 0;
    const footerReservedMm = layoutConfig.showFooter !== false ? 8 : 0;
    const a4FallbackPx = (pageHeightMm - margins.top - margins.bottom - footerReservedMm) * 3.779527559;
    const rawUsableHeight = measuredHeight > 100 ? measuredHeight : a4FallbackPx;
    const usableHeight = Math.max(100, rawUsableHeight - 8);

    const childNodes = Array.from(measurerRef.current.querySelector('.continuous-document')?.children || []) as HTMLElement[];
    if (childNodes.length === 0) {
      setPaginatedPages([[...rawBlocks.map(renderRawBlock)]]);
      return;
    }

    const blocks = rawBlocks.map(b => ({ ...b }));
    const newPages: React.ReactNode[][] = [];
    let currentPageElements: React.ReactNode[] = [];
    let currentPageHeight = 0;
    let hasOpenRpHeader = false;

    const startNewPage = () => {
      if (currentPageElements.length > 0) {
        newPages.push([...currentPageElements]);
        currentPageElements = [];
        currentPageHeight = 0;
      }
    };

    let lastI = -1;
    let attempts = 0;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];

      if (i === lastI) {
        attempts++;
      } else {
        lastI = i;
        attempts = 0;
      }

      const blockId = node.getAttribute('data-block-id') || '';
      const blockType = node.getAttribute('data-block-type') || '';
      const sectionId = node.getAttribute('data-section-id') || '';

      let marginTop = 0;
      let marginBottom = 0;
      if (node instanceof HTMLElement) {
        const style = window.getComputedStyle(node);
        marginTop = parseFloat(style.marginTop) || 0;
        marginBottom = parseFloat(style.marginBottom) || 0;
      }
      const nodeHeight = (node.getBoundingClientRect ? node.getBoundingClientRect().height : 0) + marginTop + marginBottom;

      const rawBlock = blocks.find(b => b.id === blockId);
      if (!rawBlock) continue;

      if (attempts > 8) {
        // Safe fallback to prevent infinite loop
        currentPageElements.push(renderRawBlock(rawBlock));
        currentPageHeight += nodeHeight;
        continue;
      }

      // Prevention of orphaned section headers:
      if (blockType === 'title') {
        const nextNode = childNodes[i + 1];
        let nextNodeHeight = 35; // Default minimum height for content under heading
        if (nextNode) {
          let nextMarginTop = 0;
          let nextMarginBottom = 0;
          if (nextNode instanceof HTMLElement) {
            const nextStyle = window.getComputedStyle(nextNode);
            nextMarginTop = parseFloat(nextStyle.marginTop) || 0;
            nextMarginBottom = parseFloat(nextStyle.marginBottom) || 0;
          }
          nextNodeHeight = (nextNode.getBoundingClientRect ? nextNode.getBoundingClientRect().height : 0) + nextMarginTop + nextMarginBottom;
        }

        // If heading + next content exceeds usable height AND page has content, move heading to new page
        if (currentPageHeight + nodeHeight + Math.min(nextNodeHeight, 40) > usableHeight && currentPageHeight > 0) {
          startNewPage();
          hasOpenRpHeader = false;
        }
      }

      // Handle Resource Person table header repetition across page breaks
      if (blockType === 'rp_row') {
        if (!hasOpenRpHeader || currentPageHeight === 0) {
          const rpHeaderBlock = blocks.find(b => b.type === 'rp_header') || rawBlocks.find(b => b.type === 'rp_header');
          if (rpHeaderBlock) {
            currentPageElements.push(renderRawBlock(rpHeaderBlock));
            currentPageHeight += 32;
            hasOpenRpHeader = true;
          }
        }
      } else if (blockType === 'rp_header') {
        hasOpenRpHeader = true;
      } else {
        hasOpenRpHeader = false;
      }

      // Check if current block fits on current page
      if (currentPageHeight + nodeHeight <= usableHeight) {
        currentPageElements.push(renderRawBlock(rawBlock));
        currentPageHeight += nodeHeight;
      } else {
        // Block does NOT fit! Check if text block can be split across pages
        if (blockType === 'paragraph' || blockType === 'attendance_details') {
          const textVal = rawBlock.text || '';

          const isRealEl = node instanceof HTMLElement;
          const targetEl = isRealEl ? (node.firstElementChild || node) as HTMLElement : measurerRef.current;
          const targetStyle = targetEl ? window.getComputedStyle(targetEl) : null;
          const fontSize = targetStyle ? (parseFloat(targetStyle.fontSize) || 12) : 12;
          const styleLh = targetStyle ? targetStyle.lineHeight : 'normal';
          const lineH = styleLh === 'normal' ? fontSize * 1.3 : (parseFloat(styleLh) || fontSize * 1.3);

          const pad = blockType === 'paragraph' ? 8 : 12;
          const remainingSpace = usableHeight - currentPageHeight;
          const linesThatFit = Math.floor((remainingSpace - pad) / lineH);

          if (linesThatFit >= 1 && textVal.length > 20) {
            const innerElHeight = isRealEl ? ((node.firstElementChild as HTMLElement)?.offsetHeight || node.offsetHeight || nodeHeight) : nodeHeight;
            const totalLines = Math.max(1, Math.round(innerElHeight / lineH));

            if (linesThatFit < totalLines) {
              const ratio = linesThatFit / totalLines;
              const targetCharIdx = Math.floor(textVal.length * ratio);
              let splitIdx = textVal.lastIndexOf(' ', targetCharIdx);
              if (splitIdx <= 0 || splitIdx < targetCharIdx * 0.4) {
                splitIdx = targetCharIdx;
              }

              const part1 = textVal.substring(0, splitIdx).trim();
              const part2 = textVal.substring(splitIdx).trim();

              if (part1) {
                const part1Block = {
                  ...rawBlock,
                  text: part1,
                  render: (t?: string) => rawBlock.render(t || part1)
                };
                currentPageElements.push(renderRawBlock(part1Block));
              }

              startNewPage();
              hasOpenRpHeader = false;

              if (part2) {
                const splitBlockId = `${blockId}-split-${Date.now()}-${i}`;
                const part2Lines = Math.max(1, totalLines - linesThatFit);
                const part2EstHeight = part2Lines * lineH + pad;

                const part2Block = {
                  id: splitBlockId,
                  type: blockType,
                  sectionId,
                  text: part2,
                  render: (t?: string) => rawBlock.render(t || part2)
                };

                blocks.splice(blocks.indexOf(rawBlock) + 1, 0, part2Block);

                const mockHtmlNode = {
                  getAttribute: (attr: string) => {
                    if (attr === 'data-block-id') return splitBlockId;
                    if (attr === 'data-block-type') return blockType;
                    if (attr === 'data-section-id') return sectionId;
                    return '';
                  },
                  getBoundingClientRect: () => ({ height: part2EstHeight } as DOMRect),
                  firstElementChild: targetEl,
                  offsetHeight: part2EstHeight
                } as unknown as HTMLElement;

                childNodes.splice(i + 1, 0, mockHtmlNode);
              }
              continue;
            }
          }

          if (currentPageHeight > 0) {
            startNewPage();
            hasOpenRpHeader = false;
            i--; // Retry block on top of new page
          } else {
            // Force fit if page is completely empty
            currentPageElements.push(renderRawBlock(rawBlock));
            currentPageHeight += nodeHeight;
          }
        } else {
          // Non-splittable block
          if (currentPageHeight > 0) {
            startNewPage();
            hasOpenRpHeader = false;
            i--; // Retry block on top of new page
          } else {
            // Force fit if page is completely empty
            currentPageElements.push(renderRawBlock(rawBlock));
            currentPageHeight += nodeHeight;
          }
        }
      }
    }

    if (currentPageElements.length > 0) {
      newPages.push([...currentPageElements]);
    }

    const currentStateStr = JSON.stringify({ data, styling, layoutConfig, sections });
    const isLayoutIdentical = paginatedPages.length === newPages.length &&
      paginatedPages.every((page, idx) => page.length === newPages[idx].length);

    if (lastStateRef.current !== currentStateStr || !isLayoutIdentical) {
      lastStateRef.current = currentStateStr;
      setPaginatedPages(newPages);
    }
  }, [data, styling, layoutConfig, sections]);

  const pageOrientationSetting = safeStyling.pageLayout?.orientation || 'portrait';
  const pageWidthMm = pageOrientationSetting === 'landscape' ? 297 : 210;
  const pageHeightMm = pageOrientationSetting === 'landscape' ? 210 : 297;
  const margins = safeStyling.pageLayout?.margins || { top: 15, bottom: 15, left: 15, right: 15 };

  return (
    <div className="a4-multi-page-document flex flex-col items-center select-text w-full" style={textStyle}>
      <style>{`
        @media print {
          @page {
            size: A4 ${pageOrientationSetting} !important;
            margin: 0 !important;
          }
        }
      `}</style>
      
      {/* Invisible Measurer Container */}
      <div 
        ref={measurerRef} 
        className="offscreen-measurer font-serif select-none pointer-events-none no-print" 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: `${pageWidthMm}mm`,
          fontFamily: styling.fontFamily,
          fontSize: `${styling.fontSizeBase}pt`,
          lineHeight: styling.lineHeight,
          color: styling.textColor,
          boxSizing: 'border-box',
          opacity: 0
        }}
      >
        <div className="dummy-page" style={{ height: `calc(${pageHeightMm}mm - ${margins.top}mm - ${margins.bottom}mm - ${layoutConfig.showFooter !== false ? '8mm' : '0mm'})`, width: '100%' }} />
        <div 
          className="continuous-document"
          style={{
            width: `calc(${pageWidthMm}mm - ${margins.left}mm - ${margins.right}mm)`,
            boxSizing: 'border-box'
          }}
        >
          {rawBlocks.map((block) => (
            <div 
              key={block.id} 
              data-block-id={block.id} 
              data-block-type={block.type}
              data-section-id={block.sectionId || ''}
            >
              {renderRawBlock(block)}
            </div>
          ))}
        </div>
      </div>

      {/* Main Visible Paginated Pages */}
      {paginatedPages.length > 0 ? (
        paginatedPages.map((page, idx) => {
          const pageNumber = idx + 1;
          const totalPages = paginatedPages.length;

          const individualPageStyle: React.CSSProperties = {
            fontFamily: styling.fontFamily,
            fontSize: `${styling.fontSizeBase}pt`,
            lineHeight: styling.lineHeight,
            color: styling.textColor,
            width: `${pageWidthMm}mm`,
            height: `${pageHeightMm}mm`,
            minHeight: `${pageHeightMm}mm`,
            maxHeight: `${pageHeightMm}mm`,
            boxSizing: 'border-box',
            position: 'relative',
            background: 'white',
            overflow: 'hidden',
            ['--paragraph-spacing' as any]: `${styling.paragraphSpacing}px`,
            ['--primary-color' as any]: styling.primaryColor,
          };

          const zoomScaleContainerStyle: React.CSSProperties = zoomScale !== 1.0 ? {
            width: `${pageWidthMm * zoomScale}mm`,
            height: `${(pageHeightMm + 12) * zoomScale}mm`,
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          } : {
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          };

          const pageStyleWithZoom: React.CSSProperties = {
            ...individualPageStyle,
            transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            margin: '0 auto',
          };

          return (
            <div 
              key={`page-visible-${pageNumber}`}
              style={zoomScaleContainerStyle}
              className="a4-page-wrapper flex-shrink-0"
            >
              {/* Page Number Badge above sheet in live editor */}
              <div 
                className="no-print flex items-center justify-between w-full mb-1 px-1 font-sans text-slate-500"
                style={{ width: `${pageWidthMm * zoomScale}mm` }}
              >
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                  Page {pageNumber} of {totalPages}
                </span>
                <span className="truncate max-w-[200px] italic text-[10px] text-slate-400">{data.title}</span>
              </div>

              <div 
                className={`a4-page ${styling.pageLayout.orientation} ${layoutConfig.showPageBorder ? 'page-border-active' : ''} bg-white shadow-2xl rounded-sm`}
                style={pageStyleWithZoom}
              >
                {/* Printable Content Area */}
                <div 
                  id={`print-page-${pageNumber}`} 
                  className="a4-page-content w-full h-full document-content relative flex flex-col justify-between"
                  style={{
                    paddingTop: `${margins.top}mm`,
                    paddingBottom: `${margins.bottom}mm`,
                    paddingLeft: `${margins.left}mm`,
                    paddingRight: `${margins.right}mm`,
                  }}
                >
                  <div className="flex-1 relative overflow-hidden flex flex-col justify-start">
                    {page}
                  </div>

                  {/* Single Line Footer */}
                  {layoutConfig.showFooter !== false && (
                    <div className="page-footer font-sans flex justify-between items-center text-[9px] text-slate-500 mt-2 border-t border-slate-300 pt-1.5 w-full font-semibold whitespace-nowrap flex-shrink-0">
                      <span>{data.footer?.docCode || data.footer?.contact || 'KPRCAS/IQAC/EVENTREPORT'}</span>
                      <span>{data.footer?.version || data.footer?.text || 'VERSION: 2'}</span>
                      <span>
                        {data.footer?.docDate || (data.startDate ? `DATE : ${formatDateToDdMmYyyy(data.startDate)}` : 'DATE : 18/02/2022')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Fallback page layout during initial measurement render */
        <div style={zoomScale !== 1.0 ? { width: `${pageWidthMm * zoomScale}mm`, height: `${pageHeightMm * zoomScale}mm`, margin: '0 auto 24px auto', display: 'flex', justifyContent: 'center' } : { marginBottom: '24px' }}>
          <div 
            className={`a4-page ${styling.pageLayout.orientation} ${layoutConfig.showPageBorder ? 'page-border-active' : ''} bg-white shadow-2xl rounded-sm`}
            style={{
              fontFamily: styling.fontFamily,
              fontSize: `${styling.fontSizeBase}pt`,
              lineHeight: styling.lineHeight,
              color: styling.textColor,
              width: `${pageWidthMm}mm`,
              height: `${pageHeightMm}mm`,
              boxSizing: 'border-box',
              position: 'relative',
              background: 'white',
              transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : undefined,
              transformOrigin: 'top center',
              paddingTop: `${margins.top}mm`,
              paddingBottom: `${margins.bottom}mm`,
              paddingLeft: `${margins.left}mm`,
              paddingRight: `${margins.right}mm`,
            }}
          >
            {rawBlocks.map(block => (
              <div key={block.id}>{renderRawBlock(block)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
