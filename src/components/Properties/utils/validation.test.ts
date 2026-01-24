/**
 * Form Validation Utilities Tests
 *
 * Comprehensive test suite for validation helper functions.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { FieldErrors } from 'react-hook-form';
import {
  formatFormErrors,
  getFieldLabel,
  getErrorId,
  validateFieldMatch,
  validatePattern,
  ValidationMessages,
  ValidationPatterns,
  sanitizeInput,
  normalizeWhitespace,
} from './validation';

describe('formatFormErrors', () => {
  it('should format flat errors', () => {
    const errors: FieldErrors = {
      email: { type: 'required', message: 'Email is required' },
      password: { type: 'minLength', message: 'Password too short' },
    };

    const formatted = formatFormErrors(errors);

    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toEqual({ field: 'email', message: 'Email is required' });
    expect(formatted[1]).toEqual({ field: 'password', message: 'Password too short' });
  });

  it('should format nested errors', () => {
    const errors: FieldErrors = {
      user: {
        name: { type: 'required', message: 'Name is required' },
        email: { type: 'invalid', message: 'Invalid email' },
      },
    };

    const formatted = formatFormErrors(errors);

    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toEqual({ field: 'user.name', message: 'Name is required' });
    expect(formatted[1]).toEqual({ field: 'user.email', message: 'Invalid email' });
  });

  it('should handle errors without messages', () => {
    const errors: FieldErrors = {
      field1: { type: 'custom' },
    };

    const formatted = formatFormErrors(errors);

    expect(formatted).toHaveLength(1);
    expect(formatted[0].message).toBe('field1 is invalid');
  });

  it('should handle empty errors object', () => {
    const errors: FieldErrors = {};

    const formatted = formatFormErrors(errors);

    expect(formatted).toHaveLength(0);
  });
});

describe('getFieldLabel', () => {
  it('should convert camelCase to readable label', () => {
    expect(getFieldLabel('firstName')).toBe('First Name');
    expect(getFieldLabel('maxRetryAttempts')).toBe('Max Retry Attempts');
  });

  it('should convert snake_case to readable label', () => {
    expect(getFieldLabel('first_name')).toBe('First Name');
    expect(getFieldLabel('api_endpoint_url')).toBe('API Endpoint URL');
  });

  it('should handle nested field names', () => {
    expect(getFieldLabel('user.address.city')).toBe('City');
    expect(getFieldLabel('config.api.baseUrl')).toBe('Base URL');
  });

  it('should capitalize acronyms correctly', () => {
    expect(getFieldLabel('apiUrl')).toBe('API URL');
    expect(getFieldLabel('userId')).toBe('User ID');
    expect(getFieldLabel('httpEndpoint')).toBe('HTTP Endpoint');
    expect(getFieldLabel('jsonSchema')).toBe('JSON Schema');
  });

  it('should handle single word fields', () => {
    expect(getFieldLabel('name')).toBe('Name');
    expect(getFieldLabel('email')).toBe('Email');
  });
});

describe('getErrorId', () => {
  it('should generate error ID without form ID', () => {
    expect(getErrorId('email')).toBe('email-error');
    expect(getErrorId('password')).toBe('password-error');
  });

  it('should generate error ID with form ID', () => {
    expect(getErrorId('email', 'login-form')).toBe('login-form-email-error');
    expect(getErrorId('password', 'signup')).toBe('signup-password-error');
  });

  it('should handle nested field names', () => {
    expect(getErrorId('user.email')).toBe('user-email-error');
    expect(getErrorId('config.api.url', 'settings')).toBe('settings-config-api-url-error');
  });
});

describe('validateFieldMatch', () => {
  it('should return undefined for matching values', () => {
    expect(validateFieldMatch('password', 'password')).toBeUndefined();
    expect(validateFieldMatch(123, 123)).toBeUndefined();
  });

  it('should return error for non-matching values', () => {
    const error = validateFieldMatch('password1', 'password2');
    expect(error).toBe('Fields do not match');
  });

  it('should support custom error message', () => {
    const error = validateFieldMatch('a', 'b', 'Passwords must be identical');
    expect(error).toBe('Passwords must be identical');
  });
});

describe('validatePattern', () => {
  it('should return undefined for valid pattern', () => {
    const result = validatePattern('abc123', /^[a-z0-9]+$/);
    expect(result).toBeUndefined();
  });

  it('should return error for invalid pattern', () => {
    const result = validatePattern('ABC', /^[a-z]+$/);
    expect(result).toBe('Invalid format');
  });

  it('should support custom error message', () => {
    const result = validatePattern('invalid', /^[0-9]+$/, 'Must contain only numbers');
    expect(result).toBe('Must contain only numbers');
  });
});

describe('ValidationMessages', () => {
  it('should generate required message', () => {
    expect(ValidationMessages.required('email')).toBe('Email is required');
  });

  it('should generate minLength message', () => {
    expect(ValidationMessages.minLength('password', 8)).toBe('Password must be at least 8 characters');
  });

  it('should generate maxLength message', () => {
    expect(ValidationMessages.maxLength('username', 20)).toBe('Username must be at most 20 characters');
  });

  it('should generate min message', () => {
    expect(ValidationMessages.min('age', 18)).toBe('Age must be at least 18');
  });

  it('should generate max message', () => {
    expect(ValidationMessages.max('quantity', 100)).toBe('Quantity must be at most 100');
  });

  it('should generate email message', () => {
    expect(ValidationMessages.email('contactEmail')).toBe('Contact Email must be a valid email address');
  });

  it('should generate url message', () => {
    expect(ValidationMessages.url('websiteUrl')).toBe('Website URL must be a valid URL');
  });

  it('should generate match message', () => {
    expect(ValidationMessages.match('password', 'confirmPassword')).toBe('Password must match Confirm Password');
  });
});

describe('ValidationPatterns', () => {
  describe('email', () => {
    it('should validate email addresses', () => {
      expect(ValidationPatterns.email.test('test@example.com')).toBe(true);
      expect(ValidationPatterns.email.test('invalid-email')).toBe(false);
      expect(ValidationPatterns.email.test('missing@domain')).toBe(false);
    });
  });

  describe('url', () => {
    it('should validate URLs with protocol', () => {
      expect(ValidationPatterns.url.test('https://example.com')).toBe(true);
      expect(ValidationPatterns.url.test('http://example.com')).toBe(true);
      expect(ValidationPatterns.url.test('example.com')).toBe(false);
    });
  });

  describe('uuid', () => {
    it('should validate UUID v4', () => {
      expect(ValidationPatterns.uuid.test('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
      expect(ValidationPatterns.uuid.test('invalid-uuid')).toBe(false);
    });
  });

  describe('slug', () => {
    it('should validate URL-safe slugs', () => {
      expect(ValidationPatterns.slug.test('my-slug')).toBe(true);
      expect(ValidationPatterns.slug.test('my-slug-123')).toBe(true);
      expect(ValidationPatterns.slug.test('MySlug')).toBe(false);
      expect(ValidationPatterns.slug.test('my_slug')).toBe(false);
    });
  });

  describe('identifier', () => {
    it('should validate alphanumeric identifiers', () => {
      expect(ValidationPatterns.identifier.test('validName')).toBe(true);
      expect(ValidationPatterns.identifier.test('valid_name')).toBe(true);
      expect(ValidationPatterns.identifier.test('_privateVar')).toBe(true);
      expect(ValidationPatterns.identifier.test('123invalid')).toBe(false);
      expect(ValidationPatterns.identifier.test('invalid-name')).toBe(false);
    });
  });

  describe('semver', () => {
    it('should validate semantic versions', () => {
      expect(ValidationPatterns.semver.test('1.0.0')).toBe(true);
      expect(ValidationPatterns.semver.test('1.2.3-alpha')).toBe(true);
      expect(ValidationPatterns.semver.test('1.2.3-beta.1')).toBe(true);
      expect(ValidationPatterns.semver.test('1.2')).toBe(false);
    });
  });

  describe('hexColor', () => {
    it('should validate hex colors', () => {
      expect(ValidationPatterns.hexColor.test('#fff')).toBe(true);
      expect(ValidationPatterns.hexColor.test('#ffffff')).toBe(true);
      expect(ValidationPatterns.hexColor.test('#FF00AA')).toBe(true);
      expect(ValidationPatterns.hexColor.test('ffffff')).toBe(false);
      expect(ValidationPatterns.hexColor.test('#gggggg')).toBe(false);
    });
  });

  describe('ipv4', () => {
    it('should validate IPv4 addresses', () => {
      expect(ValidationPatterns.ipv4.test('192.168.1.1')).toBe(true);
      expect(ValidationPatterns.ipv4.test('0.0.0.0')).toBe(true);
      expect(ValidationPatterns.ipv4.test('255.255.255.255')).toBe(true);
      expect(ValidationPatterns.ipv4.test('256.1.1.1')).toBe(false);
      expect(ValidationPatterns.ipv4.test('192.168.1')).toBe(false);
    });
  });

  describe('port', () => {
    it('should validate port numbers', () => {
      expect(ValidationPatterns.port.test('80')).toBe(true);
      expect(ValidationPatterns.port.test('8080')).toBe(true);
      expect(ValidationPatterns.port.test('65535')).toBe(true);
      expect(ValidationPatterns.port.test('0')).toBe(false);
      expect(ValidationPatterns.port.test('65536')).toBe(false);
    });
  });

  describe('cron', () => {
    it('should validate cron expressions', () => {
      expect(ValidationPatterns.cron.test('* * * * *')).toBe(true);
      expect(ValidationPatterns.cron.test('0 0 * * *')).toBe(true);
      expect(ValidationPatterns.cron.test('*/5 * * * *')).toBe(true);
      expect(ValidationPatterns.cron.test('invalid cron')).toBe(false);
    });
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML entities', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should escape quotes', () => {
    expect(sanitizeInput('He said "hello"')).toBe('He said &quot;hello&quot;');
    expect(sanitizeInput("It's working")).toBe('It&#x27;s working');
  });

  it('should escape slashes', () => {
    expect(sanitizeInput('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('normalizeWhitespace', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
    expect(normalizeWhitespace('\n\nhello\n\n')).toBe('hello');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
    expect(normalizeWhitespace('a  b  c')).toBe('a b c');
  });

  it('should handle mixed whitespace', () => {
    expect(normalizeWhitespace('  hello \n  world  ')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(normalizeWhitespace('')).toBe('');
    expect(normalizeWhitespace('   ')).toBe('');
  });
});
