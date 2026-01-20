import { validateActionData } from './action-validator';
import { ActionDefinition, ActionFieldType } from '@live-chat/shared-types';

describe('validateActionData', () => {
  const definition: ActionDefinition = {
    fields: [
      {
        key: 'name',
        label: 'Name',
        type: ActionFieldType.TEXT,
        required: true,
      },
      {
        key: 'age',
        label: 'Age',
        type: ActionFieldType.NUMBER,
        required: false,
      },
      {
        key: 'isActive',
        label: 'Active',
        type: ActionFieldType.BOOLEAN,
        required: true,
      },
      {
        key: 'birthDate',
        label: 'Birth Date',
        type: ActionFieldType.DATE,
        required: false,
      },
      {
        key: 'role',
        label: 'Role',
        type: ActionFieldType.SELECT,
        required: true,
        options: ['admin', 'user'],
      },
    ],
  };

  it('should return true for valid data', () => {
    const data = {
      name: 'John',
      age: 30,
      isActive: true,
      birthDate: '2023-01-01',
      role: 'user',
    };
    expect(validateActionData(definition, data)).toBe(true);
  });

  it('should return true for valid data with optional fields missing', () => {
    const data = {
      name: 'John',
      isActive: false,
      role: 'admin',
    };
    expect(validateActionData(definition, data)).toBe(true);
  });

  it('should return false if required field is missing', () => {
    const data = {
      age: 30,
      isActive: true,
      role: 'user',
    };
    expect(validateActionData(definition, data)).toBe(false);
  });

  it('should return false if extra field is present (Strict Mode)', () => {
    const data = {
      name: 'John',
      isActive: true,
      role: 'user',
      extraField: 'not allowed',
    };
    expect(validateActionData(definition, data)).toBe(false);
  });

  describe('Type Validation', () => {
    it('should validate TEXT type', () => {
      expect(
        validateActionData(definition, { ...validData(), name: 123 })
      ).toBe(false);
      expect(
        validateActionData(definition, { ...validData(), name: true })
      ).toBe(false);
    });

    it('should validate NUMBER type', () => {
      expect(
        validateActionData(definition, { ...validData(), age: '30' })
      ).toBe(false);
      expect(validateActionData(definition, { ...validData(), age: NaN })).toBe(
        false
      );
    });

    it('should validate BOOLEAN type', () => {
      expect(
        validateActionData(definition, { ...validData(), isActive: 'true' })
      ).toBe(false);
      expect(
        validateActionData(definition, { ...validData(), isActive: 1 })
      ).toBe(false);
    });

    it('should validate DATE type', () => {
      expect(
        validateActionData(definition, {
          ...validData(),
          birthDate: 'invalid-date',
        })
      ).toBe(false);
      expect(
        validateActionData(definition, { ...validData(), birthDate: 123456789 })
      ).toBe(false); // Expects string or Date object logic in validator? Validator checks strict types usually.
      // Let's check the implementation:
      // if (!(value instanceof Date) && (typeof value !== "string" || isNaN(Date.parse(value))))
      expect(
        validateActionData(definition, {
          ...validData(),
          birthDate: new Date(),
        })
      ).toBe(true);
    });

    it('should validate SELECT type', () => {
      expect(
        validateActionData(definition, { ...validData(), role: 'superadmin' })
      ).toBe(false);
      expect(
        validateActionData(definition, { ...validData(), role: 123 })
      ).toBe(false);
    });
  });

  function validData() {
    return {
      name: 'John',
      age: 30,
      isActive: true,
      birthDate: '2023-01-01',
      role: 'user',
    };
  }
});
