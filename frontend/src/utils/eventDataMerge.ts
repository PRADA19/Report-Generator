// frontend/src/utils/eventDataMerge.ts
import type { EventData } from '../types/editor';
import { DEFAULT_MOCK_EVENT } from '../features/editor/store/mockData';

/**
 * Checks if a value is empty (null, undefined, empty string, N/A, or empty array).
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    return trimmed === '' || trimmed === 'n/a' || trimmed === 'guest speaker' || trimmed === 'academic event' || trimmed === 'seminar hall';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    // For resource persons, check if all objects in the list are empty/placeholder
    if (value.every(item => typeof item === 'object' && item !== null && Object.values(item).every(val => {
      if (!val) return true;
      if (typeof val === 'string') {
        const t = val.trim().toLowerCase();
        return t === '' || t === 'n/a' || t === 'guest speaker' || t === 'resource person' || t === 'invited organization';
      }
      return false;
    }))) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a field's value still equals its unedited default template state.
 */
export function isUneditedDefault(field: keyof EventData, value: unknown): boolean {
  const defaultValue = DEFAULT_MOCK_EVENT[field];
  if (defaultValue === undefined) return false;

  if (typeof defaultValue === 'object' && defaultValue !== null) {
    return JSON.stringify(defaultValue) === JSON.stringify(value);
  }

  return defaultValue === value;
}

/**
 * Selectively merges incoming extracted event data with the current report data.
 * Merges ONLY empty or unedited default fields, preserving manual edits.
 */
export function fillEmptyBlanks(currentData: EventData, incomingData: EventData): EventData {
  const merged = { ...currentData };
  const keys = Object.keys(DEFAULT_MOCK_EVENT) as Array<keyof EventData>;

  for (const key of keys) {
    const currentVal = currentData[key];
    const incomingVal = incomingData[key];

    const isCurrentEmpty = isEmptyValue(currentVal);
    const isCurrentDefault = isUneditedDefault(key, currentVal);

    if (isCurrentEmpty || isCurrentDefault) {
      if (!isEmptyValue(incomingVal)) {
        if (key === 'resourcePersons') {
          // Clean empty/placeholder entries in resourcePersons
          merged.resourcePersons = (incomingVal as any[]).filter(
            rp => rp.name && rp.name.trim() && rp.name.toLowerCase() !== 'n/a'
          );
        } else if (key === 'participantCount') {
          merged.participantCount = { ...currentData.participantCount, ...(incomingVal as object) };
        } else {
          (merged as any)[key] = incomingVal;
        }
      } else {
        // If incoming is empty and current is default, clear the default value to empty string or array
        if (isCurrentDefault) {
          if (Array.isArray(currentVal)) {
            (merged as any)[key] = [];
          } else if (key === 'participantCount') {
            merged.participantCount = { facultyCount: 0, studentCount: 0, externalCount: 0, total: 0 };
          } else if (typeof currentVal === 'object' && currentVal !== null) {
            (merged as any)[key] = {};
          } else {
            (merged as any)[key] = '';
          }
        }
      }
    }
  }

  return merged;
}
