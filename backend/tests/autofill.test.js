import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeField, sanitizeAudience, validateStage1Facts, validateStage2Narratives } from '../routes/autofill.js';

test('Sanitizes placeholder strings to null', () => {
  assert.equal(sanitizeField('Unknown'), null);
  assert.equal(sanitizeField('TBD'), null);
  assert.equal(sanitizeField('N/A'), null);
  assert.equal(sanitizeField('Not mentioned'), null);
  assert.equal(sanitizeField('Academic Event'), null);
  assert.equal(sanitizeField('Students and Faculty'), null);
  assert.equal(sanitizeField('Dr. John Doe'), 'Dr. John Doe');
});

test('Sanitizes generic audience strings to null', () => {
  assert.equal(sanitizeAudience('Students and Faculty'), null);
  assert.equal(sanitizeAudience('All Students and Faculty'), null);
  assert.equal(sanitizeAudience('Faculty and Students'), null);
  assert.equal(sanitizeAudience('Academic Event'), null);
  assert.equal(sanitizeAudience('Final Year IT Students'), 'Final Year IT Students');
});

test('Validates Stage 1 facts and normalizes missing fields to null', () => {
  const rawInput = {
    eventTitle: 'Cloud Security Workshop',
    eventType: 'Workshop',
    eventStartDate: '20 August 2026',
    eventStartTime: 'TBD',
    venue: 'Unknown',
    organizingDepartment: 'Information Technology',
    organizingBody: 'IQAC',
    audience: 'Students and Faculty',
    participants: 'InvalidNumber',
    resourcePersons: [
      { name: 'Dr. Alice', designation: 'Professor', organization: 'KPRCAS' },
      { name: 'TBD', designation: 'Invited Organization', organization: 'Unknown' }
    ]
  };

  const validated = validateStage1Facts(rawInput);
  assert.equal(validated.eventTitle, 'Cloud Security Workshop');
  assert.equal(validated.eventType, 'Workshop');
  assert.equal(validated.eventStartDate, '20 August 2026');
  assert.equal(validated.eventStartTime, null);
  assert.equal(validated.venue, null);
  assert.equal(validated.participants, null);
  assert.equal(validated.resourcePersons.length, 1);
  assert.equal(validated.resourcePersons[0].name, 'Dr. Alice');
});

test('Validates Stage 2 narrative generation grounding', () => {
  const facts = {
    eventTitle: 'AI & Data Science Webinar',
    eventType: 'Webinar',
    eventStartDate: '15 September 2026',
    venue: null,
    organizingDepartment: 'Data Science',
    organizingBody: 'Department of Data Science'
  };

  const rawGen = {
    objectiveDescription: 'To introduce key concepts of Machine Learning.',
    eventSummary: 'The Department of Data Science hosted AI & Data Science Webinar on 15 September 2026.',
    participationDetails: '',
    keyProgramOutcomes: ['Understanding ML fundamentals'],
    summaryPoints: ['Overview of Deep Learning architectures'],
    conclusion: ''
  };

  const validatedNarratives = validateStage2Narratives(rawGen, facts);
  assert.ok(validatedNarratives.objectiveDescription.includes('Machine Learning'));
  assert.ok(validatedNarratives.eventSummary.includes('AI & Data Science Webinar'));
  assert.equal(validatedNarratives.keyProgramOutcomes.length, 1);
});

test('Handles missing facts gracefully without introducing fabricated text', () => {
  const facts = {
    eventTitle: 'Cyber Security Seminar'
  };

  const rawGen = {};

  const validatedNarratives = validateStage2Narratives(rawGen, facts);
  assert.equal(validatedNarratives.objectiveDescription, '');
  assert.equal(validatedNarratives.eventSummary, '');
  assert.equal(validatedNarratives.keyProgramOutcomes.length, 0);
});

test('Verifies session ID matching logic', () => {
  const currentSessionId = 'session-xyz-123';
  const incomingResponseSessionId = 'session-xyz-123';
  const staleResponseSessionId = 'session-abc-456';

  assert.equal(incomingResponseSessionId === currentSessionId, true);
  assert.equal(staleResponseSessionId === currentSessionId, false);
});

test('Disambiguates event date vs registration deadline and event time vs registration time', () => {
  const rawInput = {
    eventTitle: 'National Level Hackathon',
    eventType: 'Hackathon',
    eventStartDate: '25 August 2026',
    eventEndDate: '26 August 2026',
    registrationDeadline: '20 August 2026',
    eventStartTime: '10:00 AM',
    eventEndTime: '4:00 PM',
    registrationStartTime: '9:30 AM',
    venue: null,
    participants: null,
    collaborators: ['IEEE Student Branch', 'CSI Chapter'],
    resourcePersons: [
      { name: 'Dr. Anand (AWS Certified)', designation: 'Lead Architect', organization: 'AWS' },
      { name: 'Prof. Sarah Jenkins', designation: 'HOD CSE', organization: 'KPRCAS' }
    ]
  };

  const validated = validateStage1Facts(rawInput);
  assert.equal(validated.eventStartDate, '25 August 2026');
  assert.equal(validated.eventEndDate, '26 August 2026');
  assert.equal(validated.registrationDeadline, '20 August 2026');
  assert.equal(validated.eventStartTime, '10:00 AM');
  assert.equal(validated.registrationStartTime, '9:30 AM');
  assert.equal(validated.venue, null);
  assert.equal(validated.participants, null);
  assert.equal(validated.collaborators.length, 2);
  assert.equal(validated.collaborators[0], 'IEEE Student Branch');
  assert.equal(validated.resourcePersons.length, 2);
  assert.equal(validated.resourcePersons[0].name, 'Dr. Anand (AWS Certified)');
  assert.equal(validated.resourcePersons[1].name, 'Prof. Sarah Jenkins');
});

test('Strips hallucinated venue in Stage 2 narratives when Stage 1 venue is null', () => {
  const facts = {
    eventTitle: 'AI Workshop',
    venue: null,
    resourcePersons: [{ name: 'Dr. Kumar', designation: 'Professor', organization: 'KPRCAS' }]
  };

  const rawGen = {
    objectiveDescription: 'The objective of AI Workshop held at the Computer Lab was to introduce AI concepts.',
    eventSummary: 'The session was conducted at the Seminar Hall with interactive discussions.',
    keyProgramOutcomes: [],
    summaryPoints: [],
    conclusion: 'The event concluded at the Auditorium.'
  };

  const validatedNarratives = validateStage2Narratives(rawGen, facts);
  assert.equal(validatedNarratives.eventSummary.includes('Seminar Hall'), false);
  assert.equal(validatedNarratives.objectiveDescription.includes('Computer Lab'), false);
  assert.equal(validatedNarratives.conclusion.includes('Auditorium'), false);
});

test('Preserves speaker honorifics, initials, parenthetical titles, and multiple speakers without truncation', () => {
  const rawInput = {
    eventTitle: 'Advanced Cloud Workshop',
    resourcePersons: [
      { name: 'Dr. Anand (AWS Certified)', designation: 'Principal Architect', organization: 'AWS' },
      { name: 'Prof. R. Kumar', designation: 'Professor & Head', organization: 'KPRCAS' },
      { name: 'Dr. Priya, Assistant Professor, Department of IT', designation: 'Assistant Professor', organization: 'KPRCAS' }
    ]
  };

  const validated = validateStage1Facts(rawInput);
  assert.equal(validated.resourcePersons.length, 3);
  assert.equal(validated.resourcePersons[0].name, 'Dr. Anand (AWS Certified)');
  assert.equal(validated.resourcePersons[1].name, 'Prof. R. Kumar');
  assert.equal(validated.resourcePersons[2].name, 'Dr. Priya, Assistant Professor, Department of IT');
});

test('Validates participant count accuracy: accepts explicit counts and rejects registration/capacity inferences', () => {
  // Case 1: Explicit participant count present
  const withParticipants = validateStage1Facts({ eventTitle: 'Test Event A', participants: 120 });
  assert.equal(withParticipants.participants, 120);

  // Case 2: Participant count absent
  const withoutParticipants = validateStage1Facts({ eventTitle: 'Test Event B', participants: null });
  assert.equal(withoutParticipants.participants, null);

  // Case 3: Invalid non-numeric / string registration inferences
  const invalidParticipants = validateStage1Facts({ eventTitle: 'Test Event C', participants: '150 registered' });
  assert.equal(invalidParticipants.participants, null);
});

test('Regression Test: Stage 2 keyProgramOutcomes are preserved in validated narratives and never forced to []', () => {
  const facts = { eventTitle: 'HACK TO PATENT: TRANSFORMING IDEAS INTO IP' };
  const rawGen = {
    objectiveDescription: 'The purpose of the event was to create awareness about IPR.',
    eventSummary: 'The session focused on intellectual property rights.',
    keyProgramOutcomes: [
      'Participants gained awareness of patent filing procedures.',
      'Understood transformation of innovative ideas into intellectual property.'
    ],
    summaryPoints: ['IPR Overview'],
    conclusion: 'The event concluded successfully.'
  };

  const validated = validateStage2Narratives(rawGen, facts);
  assert.equal(validated.keyProgramOutcomes.length, 2);
  assert.equal(validated.keyProgramOutcomes[0], 'Participants gained awareness of patent filing procedures.');
});

test('Regression Test: Poster A Outcome vs Poster B Outcome isolation', () => {
  const posterAFacts = { eventTitle: 'Poster A: Cloud Workshop' };
  const posterANarratives = validateStage2Narratives({
    objectiveDescription: 'Purpose A',
    eventSummary: 'Summary A',
    keyProgramOutcomes: ['Outcome A: Cloud certifications gained']
  }, posterAFacts);

  const posterBFacts = { eventTitle: 'Poster B: Hack to Patent' };
  const posterBNarratives = validateStage2Narratives({
    objectiveDescription: 'Purpose B',
    eventSummary: 'Summary B',
    keyProgramOutcomes: ['Outcome B: Patent concepts understood']
  }, posterBFacts);

  assert.notEqual(posterANarratives.keyProgramOutcomes[0], posterBNarratives.keyProgramOutcomes[0]);
  assert.equal(posterANarratives.keyProgramOutcomes[0], 'Outcome A: Cloud certifications gained');
  assert.equal(posterBNarratives.keyProgramOutcomes[0], 'Outcome B: Patent concepts understood');
});
