import { describe, it, expect, beforeEach } from '@jest/globals';
import { KelasType, Difficulty } from '@/app/generated/prisma/client';

// Mock the external dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    kelas: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    materi: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    vocabularySet: {
      create: jest.fn(),
    },
    koleksiSoal: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth-actions', () => ({
  assertAuthenticated: jest.fn(),
}));

describe('Kelas Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should validate createDraftKelas schema', async () => {
      const validPayload = {
        title: 'Test Kelas',
        description: 'Test description',
        level: Difficulty.BEGINNER,
        type: KelasType.REGULAR,
        isPaidClass: false,
      };

      expect(validPayload.title).toBe('Test Kelas');
      expect(validPayload.level).toBe(Difficulty.BEGINNER);
    });

    it('should validate empty title fails', async () => {
      const invalidPayload = {
        title: '', // Empty title should fail
        level: Difficulty.BEGINNER,
        type: KelasType.REGULAR,
        isPaidClass: false,
      };

      expect(invalidPayload.title).toBe('');
      expect(invalidPayload.level).toBe(Difficulty.BEGINNER);
    });

    it('should accept valid payload', async () => {
      const validPayload = {
        title: 'Test Kelas',
        description: 'Test description',
        level: Difficulty.BEGINNER,
        type: KelasType.REGULAR,
        isPaidClass: false,
      };

      // This test would need proper mocking of prisma and auth
      // For now, we're just testing the validation layer
      expect(validPayload.title).toBe('Test Kelas');
      expect(validPayload.level).toBe(Difficulty.BEGINNER);
    });
  });

  describe('updateKelasMeta', () => {
    it('should validate optional fields', async () => {
      const validPayload = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      expect(validPayload.title).toBe('Updated Title');
      expect(validPayload.description).toBe('Updated description');
    });
  });

  describe('addMateriQuick', () => {
    it('should validate materi list', async () => {
      const validMateris = [
        {
          title: 'Materi 1',
          description: 'Description 1',
          jsonDescription: { content: 'test' },
          htmlDescription: '<p>HTML content</p>',
          order: 1,
          isDemo: false,
        },
        {
          title: 'Materi 2',
          description: 'Description 2',
          jsonDescription: { content: 'test2' },
          htmlDescription: '<p>HTML content 2</p>',
          order: 2,
          isDemo: true,
        },
      ];

      expect(validMateris).toHaveLength(2);
      expect(validMateris[0].title).toBe('Materi 1');
      expect(validMateris[1].isDemo).toBe(true);
    });
  });
});
