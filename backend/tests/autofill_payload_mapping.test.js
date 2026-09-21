import test from 'node:test';
import assert from 'node:assert/strict';

// Helper simulating executePosterAutofill unpacking logic
function processApiResponse(resData) {
  const payload = resData.data || resData;

  const apiGeneratedContent = payload;

  const extractedData = {
    title: payload.eventTitle || payload.title || '',
    date: payload.eventStartDate || payload.date || '',
    time: payload.eventStartTime || payload.time || '',
    eventType: payload.eventType || '',
    venue: payload.venue || '',
    department: payload.organizingDepartment || payload.department || '',
    speaker: (payload.resourcePersons || payload.speakers)?.map((s) => {
      const name = s.name ? String(s.name).trim() : '';
      if (!name) return '';
      const designation = s.designation ? String(s.designation).trim() : '';
      if (designation && !name.toLowerCase().includes(designation.toLowerCase())) {
        return `${name} (${designation})`;
      }
      return name;
    }).filter(Boolean).join(', ') || '',
    coordinator: payload.organizingBody || payload.organizedBy || '',
    theme: (payload.resourcePersons || payload.speakers)?.[0]?.designation || '',
    description: payload.objectiveDescription || payload.eventSummary || payload.briefDescription || '',
    eventStartDate: payload.eventStartDate || payload.date || '',
    eventEndDate: payload.eventEndDate || '',
    collaborators: Array.isArray(payload.collaborators) ? payload.collaborators : [],
    resourcePersons: Array.isArray(payload.resourcePersons || payload.speakers) ? (payload.resourcePersons || payload.speakers) : []
  };

  const confMapping = {
    title: extractedData.title ? Math.round((payload.confidence?.eventTitle ?? 0.96) * 100) : 50,
    date: extractedData.date ? Math.round((payload.confidence?.eventStartDate ?? payload.confidence?.date ?? 0.96) * 100) : 50,
    venue: extractedData.venue ? Math.round((payload.confidence?.venue ?? 0.92) * 100) : 85,
    department: extractedData.department ? Math.round((payload.confidence?.organizingDepartment ?? payload.confidence?.department ?? 0.94) * 100) : 85,
    speaker: extractedData.speaker ? Math.round((payload.confidence?.resourcePersons ?? payload.confidence?.speakers ?? 0.96) * 100) : 85,
  };

  let generatedReport;
  if (apiGeneratedContent && (apiGeneratedContent.objectiveDescription || apiGeneratedContent.eventSummary || (apiGeneratedContent.keyProgramOutcomes && apiGeneratedContent.keyProgramOutcomes.length > 0))) {
    generatedReport = {
      title: extractedData.title,
      objective: apiGeneratedContent.objectiveDescription || '',
      objectiveDescription: apiGeneratedContent.objectiveDescription || '',
      eventSummary: apiGeneratedContent.eventSummary || '',
      highlights: apiGeneratedContent.summaryPoints || [],
      outcomes: apiGeneratedContent.keyProgramOutcomes || [],
      conclusion: apiGeneratedContent.conclusion || '',
    };
  } else {
    generatedReport = null;
  }

  return { extractedData, confMapping, generatedReport };
}

test('Correctly unpacks nested backend data object { status: "success", data: { ... } }', () => {
  const backendResponse = {
    status: 'success',
    data: {
      eventTitle: 'HACK TO PATENT: TRANSFORMING IDEAS INTO IP',
      eventType: 'Workshop',
      organizingDepartment: 'Department of Computer Science',
      organizingBody: 'IIC & ACE Club',
      eventStartDate: '15-08-2026',
      venue: 'Seminar Hall 2',
      resourcePersons: [
        { name: 'Dr. N. Mathimurugan', designation: 'CEO', organization: 'SM AI Mojo Tech' }
      ],
      objectiveDescription: 'The objective of this workshop is to guide students on patent filing.',
      eventSummary: 'The Department of Computer Science organized Hack to Patent on 15-08-2026.',
      summaryPoints: ['Overview of Intellectual Property Rights', 'Patent Filing Steps'],
      keyProgramOutcomes: ['Domain Competence: Learned patent filing process'],
      conclusion: 'The event concluded with interactive Q&A.',
      confidence: {
        eventTitle: 0.98,
        eventStartDate: 0.96,
        venue: 0.92,
        organizingDepartment: 0.95,
        resourcePersons: 0.97
      }
    }
  };

  const result = processApiResponse(backendResponse);

  assert.equal(result.extractedData.title, 'HACK TO PATENT: TRANSFORMING IDEAS INTO IP');
  assert.equal(result.extractedData.department, 'Department of Computer Science');
  assert.equal(result.extractedData.coordinator, 'IIC & ACE Club');
  assert.equal(result.extractedData.date, '15-08-2026');
  assert.equal(result.extractedData.venue, 'Seminar Hall 2');
  assert.equal(result.extractedData.speaker, 'Dr. N. Mathimurugan (CEO)');
  assert.equal(result.confMapping.title, 98);
  assert.equal(result.confMapping.department, 95);

  assert.ok(result.generatedReport);
  assert.equal(result.generatedReport.objectiveDescription, 'The objective of this workshop is to guide students on patent filing.');
  assert.equal(result.generatedReport.eventSummary, 'The Department of Computer Science organized Hack to Patent on 15-08-2026.');
  assert.equal(result.generatedReport.highlights.length, 2);
  assert.equal(result.generatedReport.outcomes.length, 1);
  assert.equal(result.generatedReport.conclusion, 'The event concluded with interactive Q&A.');
});
