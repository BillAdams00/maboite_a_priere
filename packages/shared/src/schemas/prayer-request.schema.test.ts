import { describe, it, expect } from 'vitest';
import { CreatePrayerRequestSchema } from './prayer-request.schema.js';

describe('CreatePrayerRequestSchema', () => {
  it('valide un sujet public conforme', () => {
    const input = {
      firstName: '  Jean ',
      lastName: 'Dupont  ',
      content: 'Prière pour le rétablissement complet de ma grand-mère hospitalisée.',
      visibility: 'PUBLIC' as const,
      category: 'sante',
      displayAsAnonymous: false,
    };

    const result = CreatePrayerRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Jean');
      expect(result.data.lastName).toBe('Dupont');
      expect(result.data.content).toBe(
        'Prière pour le rétablissement complet de ma grand-mère hospitalisée.'
      );
    }
  });

  it('rejette un sujet contenant une URL', () => {
    const input = {
      firstName: 'Marie',
      lastName: 'Martin',
      content: 'Consultez mon site http://spam-example.com pour prier avec moi.',
      visibility: 'PUBLIC' as const,
    };

    const result = CreatePrayerRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain('URLs');
    }
  });

  it('rejette un sujet trop court (< 10 caractères)', () => {
    const input = {
      firstName: 'Marc',
      lastName: 'Dubois',
      content: 'Aidez moi',
      visibility: 'PUBLIC' as const,
    };

    const result = CreatePrayerRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
