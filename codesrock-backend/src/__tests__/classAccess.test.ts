/**
 * Class access tests: teachers in the same school share classes
 */

import { canAccessClass } from '../services/classAccess';

const cls = { teacher_id: 'ama', school_id: 'sunrise' };

describe('canAccessClass', () => {
  it('lets the teacher who created a class see and change it', () => {
    expect(canAccessClass({ userId: 'ama', role: 'teacher', schoolId: 'sunrise' }, cls, true)).toBe(true);
  });

  it('lets another teacher in the same school see and change it', () => {
    const kofi = { userId: 'kofi', role: 'teacher', schoolId: 'sunrise' };
    expect(canAccessClass(kofi, cls)).toBe(true);
    expect(canAccessClass(kofi, cls, true)).toBe(true);
  });

  it('keeps teachers at other schools out', () => {
    expect(canAccessClass({ userId: 'esi', role: 'teacher', schoolId: 'other' }, cls)).toBe(false);
    expect(canAccessClass({ userId: 'esi', role: 'teacher', schoolId: null }, cls)).toBe(false);
  });

  it('does not share a class that has no school', () => {
    const loose = { teacher_id: 'ama', school_id: null };
    expect(canAccessClass({ userId: 'kofi', role: 'teacher', schoolId: null }, loose)).toBe(false);
    expect(canAccessClass({ userId: 'ama', role: 'teacher', schoolId: null }, loose, true)).toBe(true);
  });

  it('keeps admin rules: school admins own school, super admins all, content admins read only', () => {
    expect(canAccessClass({ userId: 'h', role: 'school_admin', schoolId: 'sunrise' }, cls, true)).toBe(true);
    expect(canAccessClass({ userId: 'h', role: 'school_admin', schoolId: 'other' }, cls)).toBe(false);
    expect(canAccessClass({ userId: 's', role: 'super_admin', schoolId: null }, cls, true)).toBe(true);
    expect(canAccessClass({ userId: 'c', role: 'content_admin', schoolId: null }, cls)).toBe(true);
    expect(canAccessClass({ userId: 'c', role: 'content_admin', schoolId: null }, cls, true)).toBe(false);
  });
});
