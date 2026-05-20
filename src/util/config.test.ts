import { parseConfig } from './config';

describe('config', () => {
  describe('parseConfig', () => {
    it('should return default values when no config is provided', () => {
      const config = {};
      const result = parseConfig(config);

      expect(result).toEqual({
        namespace: 'PrismaJson',
        clientOutput: undefined,
        useType: undefined,
        allowAny: false
      });
    });

    it('should set namespace when provided', () => {
      const config = { namespace: 'MyNamespace' };
      const result = parseConfig(config);

      expect(result.namespace).toBe('MyNamespace');
    });

    it('should use default namespace when empty string is provided', () => {
      const config = { namespace: '' };
      const result = parseConfig(config);

      expect(result.namespace).toBe('PrismaJson');
    });

    it('should convert namespace to string when provided as number', () => {
      const config = { namespace: '123' };
      const result = parseConfig(config);

      expect(result.namespace).toBe('123');
    });

    it('should set clientOutput when provided', () => {
      const config = { clientOutput: './my-client' };
      const result = parseConfig(config);

      expect(result.clientOutput).toBe('./my-client');
    });

    it('should set clientOutput to undefined when not provided', () => {
      const config = {};
      const result = parseConfig(config);

      expect(result.clientOutput).toBeUndefined();
    });

    it('should set useType when provided', () => {
      const config = { useType: 'MyGlobalType' };
      const result = parseConfig(config);

      expect(result.useType).toBe('MyGlobalType');
    });

    it('should set useType to undefined when not provided', () => {
      const config = {};
      const result = parseConfig(config);

      expect(result.useType).toBeUndefined();
    });

    it('should set allowAny to true when string "true" is provided', () => {
      const config = { allowAny: 'true' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(true);
    });

    it('should set allowAny to true when string "TRUE" is provided (case insensitive)', () => {
      const config = { allowAny: 'TRUE' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(true);
    });

    it('should set allowAny to true when string "True" is provided (case insensitive)', () => {
      const config = { allowAny: 'True' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(true);
    });

    it('should set allowAny to true when string "true" with whitespace is provided', () => {
      const config = { allowAny: ' true ' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(true);
    });

    it('should set allowAny to false when string "false" is provided', () => {
      const config = { allowAny: 'false' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(false);
    });

    it('should set allowAny to false when string "FALSE" is provided (case insensitive)', () => {
      const config = { allowAny: 'FALSE' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(false);
    });

    it('should set allowAny to false when invalid string is provided', () => {
      const config = { allowAny: 'invalid' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(false);
    });

    it('should set allowAny to false when empty string is provided', () => {
      const config = { allowAny: '' };
      const result = parseConfig(config);

      expect(result.allowAny).toBe(false);
    });

    it('should handle mixed config values correctly', () => {
      const config = {
        namespace: 'CustomNamespace',
        clientOutput: './custom-output',
        useType: 'CustomType',
        allowAny: 'true'
      };
      const result = parseConfig(config);

      expect(result).toEqual({
        namespace: 'CustomNamespace',
        clientOutput: './custom-output',
        useType: 'CustomType',
        allowAny: true
      });
    });

    it('should handle config with extra properties', () => {
      const config = {
        namespace: 'TestNamespace',
        extraProperty: 'extraValue',
        // @ts-expect-error - testing with extra properties not in the type
        allowAny: 'false'
      } as Record<string, string | string[] | undefined>;
      const result = parseConfig(config);

      expect(result).toEqual({
        namespace: 'TestNamespace',
        clientOutput: undefined,
        useType: undefined,
        allowAny: false
      });
    });

    it('should convert numeric strings to string values for namespace', () => {
      const config = { namespace: '12345' };
      const result = parseConfig(config);

      expect(result.namespace).toBe('12345');
    });

    it('should handle array values by converting the first element to string for namespace', () => {
      const config = { namespace: ['ArrayNamespace'] };
      const result = parseConfig(config);

      expect(result.namespace).toBe('ArrayNamespace');
    });
  });
});
