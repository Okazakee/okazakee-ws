'use client';

import { useCallback, useState } from 'react';

type ValidationRule = {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { regex: RegExp; message: string };
  url?: boolean | string;
  custom?: (value: unknown, allData: Record<string, unknown>) => string | null;
};

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule;
};

interface UseFormValidationReturn<T extends Record<string, unknown>> {
  errors: Partial<Record<keyof T, string>>;
  touched: Set<keyof T>;
  isValid: boolean;
  validateField: (field: keyof T) => string | null;
  validateAll: () => boolean;
  touchField: (field: keyof T) => void;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());

  const validateField = useCallback(
    (field: keyof T, data?: T): string | null => {
      const rules = schema[field];
      if (!rules) return null;

      const value = data?.[field] ?? undefined;

      if (rules.required) {
        const msg = typeof rules.required === 'string' ? rules.required : 'This field is required';
        const isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim().length === 0);
        if (isEmpty) return msg;
      }

      if (rules.minLength && typeof value === 'string' && value.trim().length > 0) {
        if (value.trim().length < rules.minLength.value) {
          return rules.minLength.message;
        }
      }

      if (rules.maxLength && typeof value === 'string') {
        if (value.length > rules.maxLength.value) {
          return rules.maxLength.message;
        }
      }

      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.regex.test(value)) {
          return rules.pattern.message;
        }
      }

      if (rules.url && typeof value === 'string' && value.trim().length > 0) {
        try {
          new URL(value);
        } catch {
          return typeof rules.url === 'string' ? rules.url : 'Please enter a valid URL';
        }
      }

      if (rules.custom && data) {
        const err = rules.custom(value, data as Record<string, unknown>);
        if (err) return err;
      }

      return null;
    },
    [schema]
  );

  const touchField = useCallback(
    (field: keyof T, data?: T) => {
      setTouched((prev) => new Set(prev).add(field));
      const error = validateField(field, data);
      setErrors((prev) => {
        const next = { ...prev };
        if (error) {
          next[field] = error;
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [validateField]
  );

  const validateAll = useCallback(
    (data?: T): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {};
      const allTouched = new Set<keyof T>();
      for (const key of Object.keys(schema) as Array<keyof T>) {
        allTouched.add(key);
        const error = validateField(key, data);
        if (error) {
          newErrors[key] = error;
        }
      }
      setErrors(newErrors);
      setTouched(allTouched);
      return Object.keys(newErrors).length === 0;
    },
    [schema, validateField]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched(new Set());
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    touched,
    isValid,
    validateField,
    validateAll,
    touchField,
    clearErrors,
    clearFieldError,
  };
}
