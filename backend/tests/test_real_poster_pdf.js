import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStage1Facts, validateStage2Narratives } from '../routes/autofill.js';

test('Real Poster Test: media_1787484414949.pdf (Empty KPRCAS Form)', () => {
  // Ground truth: media_1787484414949.pdf is an unpopulated KPRCAS Event Report template document.
  // Factual content: NO event facts are present inside the template cells.

  const rawExtractedFromTemplate = {
    eventTitle: null,
    organizingBody: null,
    organizingDepartment: null,
    collaborators: [],
    resourcePersons: [],
    eventStartDate: null,
    eventEndDate: null,
    registrationDeadline: null,
    eventStartTime: null,
    eventEndTime: null,
    registrationStartTime: null,
    venue: null,
    participants: null,
    eventType: null
  };

  const validatedStage1 = validateStage1Facts(rawExtractedFromTemplate);

  assert.equal(validatedStage1.eventTitle, null);
  assert.equal(validatedStage1.organizingBody, null);
  assert.equal(validatedStage1.organizingDepartment, null);
  assert.equal(validatedStage1.collaborators.length, 0);
  assert.equal(validatedStage1.resourcePersons.length, 0);
  assert.equal(validatedStage1.eventStartDate, null);
  assert.equal(validatedStage1.eventStartTime, null);
  assert.equal(validatedStage1.venue, null);
  assert.equal(validatedStage1.participants, null);

  const stage2 = validateStage2Narratives({}, validatedStage1);
  assert.equal(stage2.eventSummary, '');
  assert.equal(stage2.objectiveDescription, '');
  assert.equal(stage2.conclusion, '');
});
