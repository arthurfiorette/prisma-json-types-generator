import { PrismaJsonTypesGeneratorError } from './error';

describe('PrismaJsonTypesGeneratorError', () => {
  describe('constructor', () => {
    it('should create an error with the provided message', () => {
      const errorMessage = 'Test error message';
      const error = new PrismaJsonTypesGeneratorError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(errorMessage);
      expect(error.constructor.name).toBe('PrismaJsonTypesGeneratorError');
    });

    it('should assign additional data to the error object', () => {
      const errorMessage = 'Test error message';
      const additionalData = { code: 404, reason: 'Not Found' };
      const error = new PrismaJsonTypesGeneratorError(errorMessage, additionalData);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(errorMessage);
      expect((error as any).code).toBe(404);
      expect((error as any).reason).toBe('Not Found');
    });

    it('should handle undefined additional data gracefully', () => {
      const errorMessage = 'Test error message';
      const error = new PrismaJsonTypesGeneratorError(errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(errorMessage);
    });
  });
});
