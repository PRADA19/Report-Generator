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

    const headerInstitutionName = (safeData.header?.institutionName && safeData.header.institutionName.trim()) 
      ? safeData.header.institutionName 
      : "KPR College of Arts Science and Research";
    const headerDetails = (safeData.header?.details && safeData.header.details.trim()) 
      ? safeData.header.details 
      : "(Affiliated to Bharathiar University, Coimbatore)";
    const headerAddress = (safeData.header?.address && safeData.header.address.trim()) 
      ? safeData.header.address 
      : "Avinashi Road, Arasur, Coimbatore – 641 407";
    const headerDocTitle = (safeData.header?.documentTitle && safeData.header.documentTitle.trim()) 
      ? safeData.header.documentTitle 
      : ((safeData.header?.text && safeData.header.text.trim()) ? safeData.header.text : "Quality System Document");
    const headerReportTitle = (safeData.header?.reportTitle && safeData.header.reportTitle.trim()) 
      ? safeData.header.reportTitle 
      : "Report of the Event";

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
  const CANONICAL_SECTIONS = [
    { id: 'purpose', title: 'Purpose of the Event:' },
    { id: 'summary', title: 'Summary of the Event' },
    { id: 'outcomes', title: 'Outcome of the Event' },
    { id: 'images', title: 'Geo-Tagged Photographs:' },
  ];

  // Process sections preserving user-customized order while ensuring canonical sections remain visible
  const sectionsToRender = CANONICAL_SECTIONS.filter(sec => {
    const found = sortedSections.find(s => s.id === sec.id);
    return found ? found.visible !== false : true;
  });

  sectionsToRender.forEach((sec) => {
    // Title block
    rawBlocks.push({
      id: `title-${sec.id}`,
      type: 'title',
      sectionId: sec.id,
      render: () => (
        <h4 className="font-bold text-[#004B87] mt-4 mb-2" style={{ fontSize: `${fontSizeSubHeader}pt`, color: styling.primaryColor }}>
          {sec.title}
        </h4>
      )
    });

    switch (sec.id) {
      case 'purpose':
        rawBlocks.push({
          id: 'purpose-text',
          type: 'paragraph',
          sectionId: sec.id,
          text: data.purpose || "To provide a comprehensive domain understanding and practical insight tailored specifically to the event theme.",
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

      case 'summary': {
        const summaryText = data.eventSummary
          ? data.eventSummary
          : (data.summaryPoints && data.summaryPoints.length > 0 ? data.summaryPoints.join(' ') : 'The event commenced with an inaugural session highlighting domain concepts followed by practical interactive demonstrations.');

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
        break;
      }

      case 'outcomes': {
        const outcomeList = (data.outcomePoints && data.outcomePoints.length > 0)
          ? data.outcomePoints
          : [
              'Subject & Domain Awareness: Gained a comprehensive understanding of core domain concepts and significance.',
              'Conceptual Clarity: Acquired practical knowledge on key principles, methodologies, and technical frameworks.'
            ];

        outcomeList.forEach((pt, idx) => {
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
        break;
      }

      case 'images': {
        const imagesToRender = (data.images && data.images.length > 0)
          ? data.images
          : [
              {
                id: 'placeholder_1',
                url: '',
                caption: 'Geo-Tagged Photograph 1',
                widthPercent: 100,
                heightPx: 160,
                captionPosition: 'below'
              },
              {
                id: 'placeholder_2',
                url: '',
                caption: 'Geo-Tagged Photograph 2',
                widthPercent: 100,
                heightPx: 160,
                captionPosition: 'below'
              }
            ];

        const totalImages = imagesToRender.length;
        const preset = getPresetById(layoutConfig.photoLayoutPreset, totalImages);
        
        let imagePointer = 0;
        preset.rows.forEach((rowConfig, rowIdx) => {
          if (imagePointer >= totalImages) return;

          const rowImgsWithWidth: { img: any; colWidth: number }[] = [];
          rowConfig.columns.forEach((colWidth) => {
            if (imagePointer < totalImages) {
              rowImgsWithWidth.push({
                img: imagesToRender[imagePointer],
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
                        {img.url ? (
                          <img 
                            src={img.url} 
                            alt={img.caption || 'Geo-Tagged Photograph'} 
                            style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <svg className="w-8 h-8 mb-1 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-medium text-slate-400">Geo-Tagged Photo Placeholder</span>
                          </div>
                        )}
                        {img.captionPosition === 'overlay' && img.caption && (
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

  const renderBlockWithWrapper = (block: any) => {
    const rendered = renderRawBlock(block);
    if (!rendered) return null;
    return (
      <div 
        key={block.id} 
        data-block-id={block.id} 
        data-block-type={block.type}
        data-section-id={block.sectionId || ''}
        className="report-block-wrapper w-full"
        style={{ display: 'flow-root', boxSizing: 'border-box' }}
      >
        {rendered}
      </div>
    );
  };

  // Dynamic Flow-Based Pagination Engine via DOM Measurement
  React.useLayoutEffect(() => {
    if (!measurerRef.current) {
      setPaginatedPages([[...rawBlocks.map(renderBlockWithWrapper)]]);
      return;
    }

    const dummyPage = measurerRef.current.querySelector('.dummy-page') as HTMLElement;
    if (!dummyPage) {
      setPaginatedPages([[...rawBlocks.map(renderBlockWithWrapper)]]);
      return;
    }

    const pageOrientationSetting = safeStyling.pageLayout?.orientation || 'portrait';
    const pageHeightMm = pageOrientationSetting === 'landscape' ? 210 : 297;
    const margins = safeStyling.pageLayout?.margins || { top: 15, bottom: 15, left: 15, right: 15 };

    // Reserve 20mm clear height for footer + separation space so text NEVER collides with footer
    const footerReservedMm = layoutConfig.showFooter !== false ? 20 : 0;
    const usableHeightMm = pageHeightMm - margins.top - margins.bottom - footerReservedMm;
    const a4FallbackPx = usableHeightMm * 3.779527559;

    const measuredHeight = dummyPage.offsetHeight || dummyPage.clientHeight || 0;
    const rawUsableHeight = measuredHeight > 100 ? measuredHeight : a4FallbackPx;
    const usableHeight = Math.min(rawUsableHeight, a4FallbackPx);

    const childNodes = Array.from(measurerRef.current.querySelector('.continuous-document')?.children || []) as HTMLElement[];
    if (childNodes.length === 0) {
      setPaginatedPages([[...rawBlocks.map(renderBlockWithWrapper)]]);
      return;
    }

    const blocks = rawBlocks.map(b => ({ ...b }));
    const newPages: React.ReactNode[][] = [];
    let currentPageElements: React.ReactNode[] = [];
    let currentPageHeight = 0;

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
        currentPageElements.push(renderBlockWithWrapper(rawBlock));
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
        }
      }

      // Check if current block fits on current page cleanly
      if (currentPageHeight + nodeHeight <= usableHeight) {
        currentPageElements.push(renderBlockWithWrapper(rawBlock));
        currentPageHeight += nodeHeight;
      } else {
        // Block does NOT fit! Move block cleanly to top of next page to guarantee zero text truncation
        if (currentPageHeight > 0) {
          startNewPage();
          i--; // Retry block on top of new page
        } else {
          // Force fit if page is completely empty
          currentPageElements.push(renderBlockWithWrapper(rawBlock));
          currentPageHeight += nodeHeight;
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

  // Recalculate pagination once document fonts finish loading to prevent text measurement discrepancies
  React.useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        lastStateRef.current = '';
        const dummyPage = measurerRef.current?.querySelector('.dummy-page') as HTMLElement;
        if (dummyPage) {
          // Force layout effect trigger
          setPaginatedPages(prev => [...prev]);
        }
      }).catch(() => {});
    }
  }, []);

  const pageOrientationSetting = safeStyling.pageLayout?.orientation || 'portrait';
  const pageWidthMm = pageOrientationSetting === 'landscape' ? 297 : 210;
  const pageHeightMm = pageOrientationSetting === 'landscape' ? 210 : 297;
  const margins = safeStyling.pageLayout?.margins || { top: 15, bottom: 15, left: 15, right: 15 };

  const footerReservedMm = layoutConfig.showFooter !== false ? 20 : 0;
  const usableHeightMm = pageHeightMm - margins.top - margins.bottom - footerReservedMm;

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
        className="offscreen-measurer select-none pointer-events-none no-print" 
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
        <div className="dummy-page" style={{ height: `${usableHeightMm}mm`, width: '100%' }} />
        <div 
          className="continuous-document"
          style={{
            width: `calc(${pageWidthMm}mm - ${margins.left}mm - ${margins.right}mm)`,
            boxSizing: 'border-box'
          }}
        >
          {rawBlocks.map((block) => renderBlockWithWrapper(block))}
        </div>
      </div>

      {/* Main Visible Paginated Pages */}
      {paginatedPages.length > 0 ? (
        paginatedPages.map((page, idx) => {
          const pageNumber = idx + 1;
          const totalPages = paginatedPages.length;
          const isScaled = zoomScale !== 1.0;

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
            overflow: 'visible',
            ['--paragraph-spacing' as any]: `${styling.paragraphSpacing}px`,
            ['--primary-color' as any]: styling.primaryColor,
          };

          return (
            <div 
              key={`page-visible-${pageNumber}`}
              className="a4-page-wrapper flex flex-col items-center flex-shrink-0 mb-8"
              style={{
                width: isScaled ? `${pageWidthMm * zoomScale}mm` : `${pageWidthMm}mm`,
                height: isScaled ? `${(pageHeightMm + 15) * zoomScale}mm` : 'auto',
              }}
            >
              <div 
                className="a4-zoom-container flex flex-col items-center"
                style={{
                  width: `${pageWidthMm}mm`,
                  transform: isScaled ? `scale(${zoomScale})` : undefined,
                  transformOrigin: 'top center',
                  flexShrink: 0,
                }}
              >
                {/* Page Number Badge above sheet in live editor */}
                <div className="no-print flex items-center justify-between w-full mb-1.5 px-1 font-sans text-slate-500">
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                    Page {pageNumber} of {totalPages}
                  </span>
                  <span className="truncate max-w-[250px] italic text-[10px] text-slate-400">{data.title}</span>
                </div>

                {/* Un-transformed A4 Page Sheet */}
                <div 
                  className={`a4-page ${styling.pageLayout.orientation} ${layoutConfig.showPageBorder ? 'page-border-active' : ''} bg-white shadow-2xl rounded-sm`}
                  style={individualPageStyle}
                >
                  {/* Printable Content Area */}
                  <div 
                    id={`print-page-${pageNumber}`} 
                    className="a4-page-content w-full h-full document-content relative flex flex-col justify-between overflow-visible"
                    style={{
                      paddingTop: `${margins.top}mm`,
                      paddingBottom: `${margins.bottom}mm`,
                      paddingLeft: `${margins.left}mm`,
                      paddingRight: `${margins.right}mm`,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Upper content area ending cleanly with breathing space above footer */}
                    <div className="flex-1 relative flex flex-col justify-start min-h-0 overflow-visible mb-2">
                      {page}
                    </div>

                    {/* Single Line Footer locked at bottom margin of every page */}
                    {layoutConfig.showFooter !== false && (
                      <div className="page-footer font-sans flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-300 pt-1.5 w-full font-semibold whitespace-nowrap flex-shrink-0 mt-auto">
                        <span>{data.footer?.docCode || data.footer?.contact || 'KPRCAS/IQAC/EVENTREPORT'}</span>
                        <span>{data.footer?.version || data.footer?.text || 'VERSION: 2'}</span>
                        <span>
                          {data.footer?.docDate 
                            ? (data.footer.docDate.trim().toUpperCase().startsWith('DATE') ? data.footer.docDate.trim() : `DATE : ${data.footer.docDate.trim()}`)
                            : (data.startDate ? `DATE : ${formatDateToDdMmYyyy(data.startDate)}` : 'DATE : 21/08/2026')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Fallback page layout during initial measurement render */
        <div 
          className="a4-page-wrapper flex flex-col items-center flex-shrink-0 mb-8"
          style={{
            width: zoomScale !== 1.0 ? `${pageWidthMm * zoomScale}mm` : `${pageWidthMm}mm`,
            height: zoomScale !== 1.0 ? `${(pageHeightMm + 15) * zoomScale}mm` : 'auto',
          }}
        >
          <div 
            className="a4-zoom-container flex flex-col items-center"
            style={{
              width: `${pageWidthMm}mm`,
              transform: zoomScale !== 1.0 ? `scale(${zoomScale})` : undefined,
              transformOrigin: 'top center',
              flexShrink: 0,
            }}
          >
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
                paddingTop: `${margins.top}mm`,
                paddingBottom: `${margins.bottom}mm`,
                paddingLeft: `${margins.left}mm`,
                paddingRight: `${margins.right}mm`,
                overflow: 'visible',
              }}
            >
              {rawBlocks.map(block => renderBlockWithWrapper(block))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
