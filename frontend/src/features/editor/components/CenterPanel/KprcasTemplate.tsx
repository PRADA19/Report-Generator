// frontend/src/features/editor/components/CenterPanel/KprcasTemplate.tsx
import React from 'react';
import type { EventData, StylingConfig, LayoutConfig, LayoutSection } from '../../../../types/editor';

interface KprcasTemplateProps {
  data: EventData;
  styling: StylingConfig;
  layoutConfig: LayoutConfig;
  sections: LayoutSection[];
  zoomScale?: number;
}

// Helper to render raw blocks
const renderRawBlock = (block: any) => {
  if (block.type === 'paragraph' || block.type === 'bullet' || block.type === 'attendance_details') {
    return block.render(block.text);
  }
  return block.render();
};

export const KprcasTemplate: React.FC<KprcasTemplateProps> = ({
  data,
  styling,
  layoutConfig,
  sections,
  zoomScale = 1.0
}) => {
  const measurerRef = React.useRef<HTMLDivElement>(null);
  const [paginatedPages, setPaginatedPages] = React.useState<React.ReactNode[][]>([]);
  const lastStateRef = React.useRef<string>('');

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const textStyle = {
    color: styling.textColor,
  };

  const primaryHeadingStyle = {
    color: styling.primaryColor,
    marginBottom: `${styling.paragraphSpacing}px`,
  };

  const renderHeaderSection = () => {
    const institutionName = data.header?.institutionName || "KPR College of Arts and Science";
    const details = data.header?.details || "(Autonomous) | Affiliated to Bharathiar University";
    const address = data.header?.address || "Avinashi Road, Arasur, Coimbatore - 641407";
    const headerText = data.header?.text || "Internal Quality Assurance Cell (IQAC)";
    const departmentName = data.header?.department || data.department || "Academic Department";

    return (
      <header key="document-header" className="report-section border-b-2 border-indigo-900 pb-3 mb-4">
        <div className="text-center">
          {data.header?.logo && (
            <div className="mb-2 flex justify-center">
              <img src={data.header.logo} alt="Institution Logo" className="h-10 object-contain" />
            </div>
          )}
          <h1 className="text-base font-extrabold tracking-tight uppercase" style={{ color: styling.primaryColor }}>
            {institutionName}
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
            {details}
          </p>
          <p className="text-[9px] text-slate-500">
            {address}
          </p>
          <div className="my-1.5 border-t border-slate-200" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100/50 py-0.5 inline-block px-3 rounded">
            {headerText}
          </h2>
          <h3 className="text-xs font-extrabold uppercase mt-2 tracking-wide" style={{ color: styling.primaryColor }}>
            Event Report - {departmentName}
          </h3>
        </div>

        <table className="min-w-full text-[10px] text-left border-collapse border border-slate-300 mt-4">
          <tbody>
            <tr>
              <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold w-1/4">Event Title</th>
              <td className="border border-slate-300 px-2 py-1 font-bold text-slate-900 w-3/4" colSpan={3}>
                {data.title}
              </td>
            </tr>
            <tr>
              <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold w-1/4">Department</th>
              <td className="border border-slate-300 px-2 py-1 w-1/4 text-slate-800">{data.department}</td>
              <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold w-1/4">Organizing Body</th>
              <td className="border border-slate-300 px-2 py-1 w-1/4 text-slate-800">{data.organizingBody}</td>
            </tr>
            <tr>
              <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Date (From - To)</th>
              <td className="border border-slate-300 px-2 py-1 text-slate-800">{data.startDate} to {data.endDate}</td>
              <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Venue</th>
              <td className="border border-slate-300 px-2 py-1 text-slate-800">{data.venue}</td>
            </tr>
            {data.collaboration && (
              <tr>
                <th className="border border-slate-300 px-2 py-1 bg-slate-50 font-semibold">Collaboration</th>
                <td className="border border-slate-300 px-2 py-1 text-slate-800" colSpan={3}>{data.collaboration}</td>
              </tr>
            )}
          </tbody>
        </table>
      </header>
    );
  };

  const renderSignatures = () => {
    const showHod = data.signatures?.hod !== false;
    const showIqac = data.signatures?.iqac !== false;
    const showPrincipal = data.signatures?.principal !== false;
    const showCoordinator = data.signatures?.coordinator !== false;

    const activeSignatures = [];
    if (showCoordinator) {
      activeSignatures.push(
        <div key="coordinator" className="signature-item flex-1">
          <div className="h-8" />
          <p className="font-bold text-slate-700">Signature of Coordinator</p>
        </div>
      );
    }
    if (showHod) {
      activeSignatures.push(
        <div key="hod" className="signature-item flex-1">
          <div className="h-8" />
          <p className="font-bold text-slate-700">Signature of HOD</p>
          <p className="text-[8px] text-slate-400 mt-0.5">Department of {data.department || "Academic Department"}</p>
        </div>
      );
    }
    if (showIqac) {
      activeSignatures.push(
        <div key="iqac" className="signature-item flex-1">
          <div className="h-8" />
          <p className="font-bold text-slate-700">IQAC Coordinator</p>
          <p className="text-[8px] text-slate-400 mt-0.5 font-normal">KPRCAS Office</p>
        </div>
      );
    }
    if (showPrincipal) {
      activeSignatures.push(
        <div key="principal" className="signature-item flex-1">
          <div className="h-8" />
          <p className="font-bold text-slate-700">Signature of Principal</p>
          <p className="text-[8px] text-slate-400 mt-0.5">KPRCAS Head Office</p>
        </div>
      );
    }

    if (activeSignatures.length === 0) return null;

    return (
      <footer key="signatures-block" className="mt-6 pt-4 border-t border-dashed border-slate-300">
        <div className="signature-grid flex justify-between gap-4 text-center text-[10px] font-sans">
          {activeSignatures}
        </div>
      </footer>
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
  sortedSections.forEach((sec) => {
    if (!sec.visible) return;
    
    // Title block
    rawBlocks.push({
      id: `title-${sec.id}`,
      type: 'title',
      sectionId: sec.id,
      render: () => (
        <h4 className="text-[11px] font-bold uppercase border-b border-slate-200 pb-0.5" style={primaryHeadingStyle}>
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
          text: data.purpose || "No event objective provided.",
          render: (text: string) => (
            <p className="text-[10px] text-justify leading-normal text-slate-800" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>
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
              <p className="text-[10px] text-justify leading-normal text-slate-800 font-medium" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>
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
            <table className="min-w-full text-[10px] text-left border-collapse border border-slate-300">
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
              <table className="min-w-full text-[10px] text-left border-collapse border border-slate-300" style={{ marginTop: '-1px' }}>
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
            <table className="min-w-full text-[10px] text-left border-collapse border border-slate-300">
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
                <div className="text-right text-[9px] font-semibold text-slate-500 mt-0.5">
                  Attendance Percentage: <span className="text-slate-800 font-bold">{data.attendancePercentage}</span>
                </div>
              )}
              {text && (
                <p className="text-[10px] text-justify leading-normal text-slate-800 font-medium">
                  {text}
                </p>
              )}
            </div>
          )
        });
        break;

      case 'summary':
        if (data.eventSummary) {
          rawBlocks.push({
            id: 'summary-text-block',
            type: 'paragraph',
            sectionId: sec.id,
            text: data.eventSummary,
            render: (text: string) => (
              <p className="text-[10px] text-justify leading-normal text-slate-800" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>
                {text}
              </p>
            )
          });
        }
        if (data.summaryPoints && data.summaryPoints.length > 0) {
          data.summaryPoints.forEach((pt, idx) => {
            rawBlocks.push({
              id: `summary-pt-${idx}`,
              type: 'bullet',
              sectionId: sec.id,
              text: pt,
              render: (text: string) => (
                <ul className="list-disc pl-4 space-y-0.5">
                  <li className="text-[10px] text-justify text-slate-800" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>{text}</li>
                </ul>
              )
            });
          });
        }
        break;

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
                  <li className="text-[10px] text-justify text-slate-800" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>{text}</li>
                </ul>
              )
            });
          });
        }
        break;

      case 'conclusion':
        rawBlocks.push({
          id: 'conclusion-text-block',
          type: 'paragraph',
          sectionId: sec.id,
          text: data.conclusion || "No concluding remarks provided.",
          render: (text: string) => (
            <p className="text-[10px] text-justify leading-normal text-slate-800" style={{ marginBottom: `${styling.paragraphSpacing}px` }}>
              {text}
            </p>
          )
        });
        break;

      case 'images': {
        if (!data.images || data.images.length === 0) break;
        const isCompact = layoutConfig.compactPhotoMode;
        const photoLayout = isCompact ? 'compact' : (layoutConfig.photoLayoutMode || 'two');
        
        let gridColumns = 2;
        if (photoLayout === 'single') gridColumns = 1;
        else if (photoLayout === 'three') gridColumns = 3;

        const imageRows: any[][] = [];
        for (let idx = 0; idx < data.images.length; idx += gridColumns) {
          imageRows.push(data.images.slice(idx, idx + gridColumns));
        }

        imageRows.forEach((imgs, idx) => {
          rawBlocks.push({
            id: `image-row-${idx}`,
            type: 'image_row',
            sectionId: sec.id,
            data: { imgs, gridColumns, isCompact },
            render: () => (
              <div 
                className="grid gap-3 w-full"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
              >
                {imgs.map((img) => {
                  const imgHeight = isCompact ? 130 : (img.heightPx || 160);
                  const widthVal = isCompact ? '100%' : `${img.widthPercent}%`;
                  const capPos = img.captionPosition || 'below';

                  return (
                    <figure 
                      key={img.id} 
                      className={`photo-card relative border border-slate-200 rounded bg-slate-50/50 flex flex-col justify-between overflow-hidden ${
                        isCompact ? 'p-1' : 'p-1.5'
                      }`}
                      style={{ width: widthVal, margin: '0 auto' }}
                    >
                      <div className="relative w-full overflow-hidden rounded border border-slate-100" style={{ height: `${imgHeight}px` }}>
                        <img 
                          src={img.url} 
                          alt={img.caption} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {capPos === 'overlay' && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[8px] py-1 px-1.5 text-center font-medium">
                            {img.caption}
                          </div>
                        )}
                      </div>
                      {capPos === 'below' && (
                        <figcaption className="text-[9px] text-slate-500 italic mt-1 text-center leading-normal">
                          {img.caption}
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
    if (!measurerRef.current) return;

    const dummyPage = measurerRef.current.querySelector('.dummy-page');
    if (!dummyPage) return;
    const usableHeight = dummyPage.getBoundingClientRect().height;

    const childNodes = Array.from(measurerRef.current.querySelector('.continuous-document')?.children || []) as HTMLElement[];
    if (childNodes.length === 0) return;

    const newPages: React.ReactNode[][] = [];
    let currentPageElements: React.ReactNode[] = [];
    let currentPageHeight = 0;

    const startNewPage = () => {
      newPages.push([...currentPageElements]);
      currentPageElements = [];
      currentPageHeight = 0;

      const pageIndex = newPages.length;
      currentPageElements.push(
        <div key={`sub-header-${pageIndex}`} className="text-[9px] font-bold uppercase tracking-wider text-slate-400 pb-1.5 mb-3 border-b border-slate-200 no-print flex items-center justify-between font-sans">
          <span>A4 Page {pageIndex + 1}</span>
          <span className="truncate max-w-[200px]">{data.title}</span>
        </div>
      );
      currentPageHeight += 24;
    };

    let hasOpenRpHeader = false;

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      const blockId = node.getAttribute('data-block-id') || '';
      const blockType = node.getAttribute('data-block-type') || '';
      const sectionId = node.getAttribute('data-section-id') || '';
      const nodeHeight = node.getBoundingClientRect().height;

      const rawBlock = rawBlocks.find(b => b.id === blockId);
      if (!rawBlock) continue;

      // Prevention of orphaned section headers:
      if (blockType === 'title') {
        const nextNode = childNodes[i + 1];
        const nextNodeHeight = nextNode ? nextNode.getBoundingClientRect().height : 0;
        if (currentPageHeight + nodeHeight + nextNodeHeight > usableHeight && currentPageHeight > 24) {
          startNewPage();
          hasOpenRpHeader = false;
        }
      }

      // If we start a new page and the next block is an rp_row, inject the header first
      if (blockType === 'rp_row') {
        if (!hasOpenRpHeader || currentPageHeight === 24 || currentPageHeight === 0) {
          currentPageElements.push(renderRawBlock(rawBlocks.find(b => b.type === 'rp_header') || rawBlocks[0]));
          currentPageHeight += 32;
          hasOpenRpHeader = true;
        }
      } else {
        if (blockType === 'rp_header') {
          hasOpenRpHeader = true;
        } else {
          hasOpenRpHeader = false;
        }
      }

      // Check if it fits
      if (currentPageHeight + nodeHeight <= usableHeight) {
        currentPageElements.push(renderRawBlock(rawBlock));
        currentPageHeight += nodeHeight;
      } else {
        // Does not fit! Can it be split?
        if (blockType === 'paragraph' || blockType === 'bullet' || blockType === 'attendance_details') {
          const textVal = rawBlock.text || '';
          const fontSize = parseFloat(window.getComputedStyle(node.firstElementChild || node).fontSize) || 12;
          const styleLh = window.getComputedStyle(node.firstElementChild || node).lineHeight;
          const lh = styleLh === 'normal' ? fontSize * 1.2 : (parseFloat(styleLh) || fontSize * 1.5);

          const pad = blockType === 'paragraph' ? 10 : (blockType === 'bullet' ? 6 : 20);
          const remHeight = usableHeight - currentPageHeight;
          const linesThatFit = Math.floor((remHeight - pad) / lh);

          if (linesThatFit >= 1) {
            const innerElHeight = (node.firstElementChild as HTMLElement)?.offsetHeight || node.offsetHeight;
            const totalLines = Math.max(1, Math.round(innerElHeight / lh));
            const charLimit = Math.floor(textVal.length * (linesThatFit / totalLines));
            
            let splitIdx = textVal.lastIndexOf(' ', charLimit);
            if (splitIdx <= 0 || splitIdx < charLimit * 0.5) {
              splitIdx = charLimit;
            }

            const part1 = textVal.substring(0, splitIdx).trim();
            const part2 = textVal.substring(splitIdx).trim();

            if (part1) {
              currentPageElements.push(renderRawBlock({ ...rawBlock, text: part1 }));
            }

            startNewPage();
            hasOpenRpHeader = false;

            if (part2) {
              const splitBlockId = `${blockId}-split-${Date.now()}`;
              const part2Lines = Math.max(1, totalLines - linesThatFit);
              const part2Height = part2Lines * lh + pad;
              
              const mockBlock = {
                id: splitBlockId,
                type: blockType,
                sectionId,
                text: part2,
                height: part2Height,
                isMock: true
              };
              
              rawBlocks.splice(rawBlocks.indexOf(rawBlock) + 1, 0, mockBlock as any);
              
              const mockHtmlNode = {
                getAttribute: (attr: string) => {
                  if (attr === 'data-block-id') return splitBlockId;
                  if (attr === 'data-block-type') return blockType;
                  if (attr === 'data-section-id') return sectionId;
                  return '';
                },
                getBoundingClientRect: () => ({ height: part2Height } as DOMRect),
                firstElementChild: null,
                offsetHeight: part2Height
              } as unknown as HTMLElement;

              childNodes.splice(i + 1, 0, mockHtmlNode);
            }
          } else {
            startNewPage();
            hasOpenRpHeader = false;
            i--;
          }
        } else {
          startNewPage();
          hasOpenRpHeader = false;
          i--;
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

  const pageWidthMm = styling.pageLayout.orientation === 'landscape' ? 297 : 210;
  const pageHeightMm = styling.pageLayout.orientation === 'landscape' ? 210 : 297;
  const margins = styling.pageLayout.margins;

  const pageOrientationSetting = styling.pageLayout.orientation || 'portrait';

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
        className="offscreen-measurer font-serif select-none pointer-events-none" 
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
        <div className="dummy-page" style={{ height: `calc(${pageHeightMm}mm - ${margins.top}mm - ${margins.bottom}mm)`, width: '100%' }} />
        <div className="continuous-document">
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
            height: `${pageHeightMm * zoomScale}mm`,
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          } : {
            marginBottom: '24px'
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
              className="flex-shrink-0"
            >
              <div 
                className={`a4-page ${styling.pageLayout.orientation} ${layoutConfig.showPageBorder ? 'page-border-active' : ''} bg-white shadow-2xl rounded-sm`}
                style={pageStyleWithZoom}
              >
                {/* Page Watermark */}
                <div className="page-watermark font-sans">
                  KPRCAS
                </div>

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
                  <div className="flex-1 overflow-hidden">
                    {page}
                  </div>

                  {/* Footer Page Number */}
                  {layoutConfig.showFooter && (
                    <div className="page-footer font-sans flex justify-between items-center text-[8px] text-slate-400 mt-2 border-t border-slate-100 pt-1.5 w-full">
                      <span>{data.footer?.contact || "KPRCAS Head Office"}</span>
                      {data.footer?.text && <span className="font-semibold">{data.footer.text}</span>}
                      {data.footer?.pageNumber !== false && (
                        <span>Page {pageNumber} of {totalPages}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* Fallback message during first measuring layout render */
        <div className="p-10 text-center text-text-muted text-xs">
          Calculating page layouts...
        </div>
      )}
    </div>
  );
};
