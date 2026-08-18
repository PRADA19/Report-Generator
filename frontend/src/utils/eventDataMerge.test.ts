import { describe, it, expect } from 'vitest';
import { fillEmptyBlanks, isEmptyValue, isUneditedDefault } from './eventDataMerge';
import type { EventData } from '../types/editor';
import { DEFAULT_MOCK_EVENT } from '../features/editor/store/mockData';

describe('eventDataMerge utility', () => {
  it('should identify empty values correctly', () => {
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue('   ')).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue('Guest Speaker')).toBe(true);
    expect(isEmptyValue('N/A')).toBe(true);
    expect(isEmptyValue('valid text')).toBe(false);
  });

  it('should identify unedited default template fields correctly', () => {
    expect(isUneditedDefault('title', DEFAULT_MOCK_EVENT.title)).toBe(true);
    expect(isUneditedDefault('title', 'Custom Title')).toBe(false);
  });

  it('should selectively merge incoming details and preserve user edits', () => {
    const currentData: EventData = {
      ...DEFAULT_MOCK_EVENT,
      title: 'User Edited Title', // User edited
      venue: 'Seminar Hall II, KPR Building', // Unedited default
      purpose: '', // Empty
    };

    const incomingData: EventData = {
      ...DEFAULT_MOCK_EVENT,
      title: 'Incoming Poster Title',
      venue: 'Conference Hall A',
      purpose: 'Learn Cloud Native Architectures',
    };

    const result = fillEmptyBlanks(currentData, incomingData);

    // User edited title should be preserved!
    expect(result.title).toBe('User Edited Title');

    // Unedited default venue should be replaced by incoming!
    expect(result.venue).toBe('Conference Hall A');

    // Empty purpose should be filled by incoming!
    expect(result.purpose).toBe('Learn Cloud Native Architectures');
  });

  it('should clear untouched default fields if incoming data has no content for them', () => {
    const currentData: EventData = {
      ...DEFAULT_MOCK_EVENT,
      venue: 'Seminar Hall II, KPR Building', // Unedited default
    };

    const incomingData: EventData = {
      ...DEFAULT_MOCK_EVENT,
      venue: '', // Missing in poster
    };

    const result = fillEmptyBlanks(currentData, incomingData);

    // Unedited default venue should be cleared to empty string!
    expect(result.venue).toBe('');
  });
});
