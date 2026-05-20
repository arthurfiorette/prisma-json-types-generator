import {
  createRegexForType,
  extractBaseNameFromRelationType,
  generateTypeNamesFromName,
  isUpdateOneType
} from './regex';

describe('regex helper functions', () => {
  describe('createRegexForType', () => {
    it('should create regex patterns for a given name', () => {
      const name = 'User';
      const regexArray = createRegexForType(name) as [RegExp, RegExp, RegExp, RegExp];
      const [
        createWithoutPattern,
        createManyPattern,
        updateWithoutPattern,
        updateManyWithoutPattern
      ] = regexArray;

      expect(createWithoutPattern).toBeInstanceOf(RegExp);
      expect(createManyPattern).toBeInstanceOf(RegExp);
      expect(updateWithoutPattern).toBeInstanceOf(RegExp);
      expect(updateManyWithoutPattern).toBeInstanceOf(RegExp);

      // Test that a valid CreateWithout pattern matches
      expect(createWithoutPattern.test('UserCreateWithoutProfileInput')).toBe(true);
      expect(createWithoutPattern.test('UserUncheckedCreateWithoutProfileInput')).toBe(true);

      // Test that a valid CreateMany pattern matches
      expect(createManyPattern.test('UserCreateManyProfileInput')).toBe(true);
      expect(createManyPattern.test('UserUncheckedCreateManyProfileInput')).toBe(true);

      // Test that a valid UpdateWithout pattern matches
      expect(updateWithoutPattern.test('UserUpdateWithoutProfileInput')).toBe(true);
      expect(updateWithoutPattern.test('UserUncheckedUpdateWithoutProfileInput')).toBe(true);

      // Test that a valid UpdateManyWithout pattern matches
      expect(updateManyWithoutPattern.test('UserUpdateManyWithoutProfileInput')).toBe(true);
      expect(updateManyWithoutPattern.test('UserUncheckedUpdateManyWithoutProfileInput')).toBe(
        true
      );

      // Test that invalid patterns don't match
      expect(createWithoutPattern.test('UserProfile')).toBe(false);
      expect(updateWithoutPattern.test('UserProfile')).toBe(false);
    });

    it('should handle different base names', () => {
      const name = 'Post';
      const regexArray = createRegexForType(name) as [RegExp, RegExp, RegExp, RegExp];
      const [
        createWithoutPattern,
        createManyPattern,
        updateWithoutPattern,
        updateManyWithoutPattern
      ] = regexArray;

      // Test CreateWithout pattern
      expect(createWithoutPattern.test('PostCreateWithoutAuthorInput')).toBe(true);
      expect(createWithoutPattern.test('PostUncheckedCreateWithoutAuthorInput')).toBe(true);

      // Test CreateMany pattern
      expect(createManyPattern.test('PostCreateManyAuthorInput')).toBe(true);
      expect(createManyPattern.test('PostUncheckedCreateManyAuthorInput')).toBe(true);

      // Test UpdateWithout pattern
      expect(updateWithoutPattern.test('PostUpdateWithoutAuthorInput')).toBe(true);
      expect(updateWithoutPattern.test('PostUncheckedUpdateWithoutAuthorInput')).toBe(true);

      // Test UpdateManyWithout pattern
      expect(updateManyWithoutPattern.test('PostUpdateManyWithoutAuthorInput')).toBe(true);
      expect(updateManyWithoutPattern.test('PostUncheckedUpdateManyWithoutAuthorInput')).toBe(true);
    });

    it('should match patterns with different relation names', () => {
      const name = 'User';
      const regexArray = createRegexForType(name) as [RegExp, RegExp, RegExp, RegExp];
      const [
        createWithoutPattern,
        createManyPattern,
        updateWithoutPattern,
        updateManyWithoutPattern
      ] = regexArray;

      expect(createWithoutPattern.test('UserCreateWithoutPostsInput')).toBe(true);
      expect(createWithoutPattern.test('UserCreateWithoutProfileInput')).toBe(true);
      expect(createWithoutPattern.test('UserCreateWithoutCommentsInput')).toBe(true);

      expect(createManyPattern.test('UserCreateManyPostsInput')).toBe(true);
      expect(createManyPattern.test('UserCreateManyProfileInput')).toBe(true);
      expect(createManyPattern.test('UserCreateManyCommentsInput')).toBe(true);

      expect(updateWithoutPattern.test('UserUpdateWithoutPostsInput')).toBe(true);
      expect(updateWithoutPattern.test('UserUpdateWithoutProfileInput')).toBe(true);
      expect(updateWithoutPattern.test('UserUpdateWithoutCommentsInput')).toBe(true);

      expect(updateManyWithoutPattern.test('UserUpdateManyWithoutPostsInput')).toBe(true);
      expect(updateManyWithoutPattern.test('UserUpdateManyWithoutProfileInput')).toBe(true);
      expect(updateManyWithoutPattern.test('UserUpdateManyWithoutCommentsInput')).toBe(true);
    });
  });

  describe('extractBaseNameFromRelationType', () => {
    it('should extract base name from CreateWithout patterns', () => {
      expect(extractBaseNameFromRelationType('UserCreateWithoutProfileInput')).toBe('User');
      expect(extractBaseNameFromRelationType('UserUncheckedCreateWithoutProfileInput')).toBe(
        'User'
      );
      expect(extractBaseNameFromRelationType('PostCreateWithoutAuthorInput')).toBe('Post');
      expect(extractBaseNameFromRelationType('CommentCreateWithoutPostInput')).toBe('Comment');
    });

    it('should extract base name from CreateMany patterns', () => {
      expect(extractBaseNameFromRelationType('UserCreateManyProfileInput')).toBe('User');
      expect(extractBaseNameFromRelationType('UserUncheckedCreateManyProfileInput')).toBe('User');
      expect(extractBaseNameFromRelationType('PostCreateManyAuthorInput')).toBe('Post');
      expect(extractBaseNameFromRelationType('CommentCreateManyPostInput')).toBe('Comment');
    });

    it('should extract base name from UpdateWithout patterns', () => {
      expect(extractBaseNameFromRelationType('UserUpdateWithoutProfileInput')).toBe('User');
      expect(extractBaseNameFromRelationType('UserUncheckedUpdateWithoutProfileInput')).toBe(
        'User'
      );
      expect(extractBaseNameFromRelationType('PostUpdateWithoutAuthorInput')).toBe('Post');
      expect(extractBaseNameFromRelationType('CommentUpdateWithoutPostInput')).toBe('Comment');
    });

    it('should extract base name from UpdateManyWithout patterns', () => {
      expect(extractBaseNameFromRelationType('UserUpdateManyWithoutProfileInput')).toBe('User');
      expect(extractBaseNameFromRelationType('UserUncheckedUpdateManyWithoutProfileInput')).toBe(
        'User'
      );
      expect(extractBaseNameFromRelationType('PostUpdateManyWithoutAuthorInput')).toBe('Post');
      expect(extractBaseNameFromRelationType('CommentUpdateManyWithoutPostInput')).toBe('Comment');
    });

    it('should return null for invalid patterns', () => {
      expect(extractBaseNameFromRelationType('InvalidPattern')).toBeNull();
      expect(extractBaseNameFromRelationType('UserInvalidSuffix')).toBeNull();
      expect(extractBaseNameFromRelationType('UserProfile')).toBeNull();
      expect(extractBaseNameFromRelationType('SomeOtherPattern')).toBeNull();
      expect(extractBaseNameFromRelationType('User')).toBeNull();
      expect(extractBaseNameFromRelationType('UserWhereInput')).toBeNull();
    });

    it('should properly match different relation names in the middle', () => {
      expect(extractBaseNameFromRelationType('UserCreateWithoutEmailsInput')).toBe('User');
      expect(extractBaseNameFromRelationType('UserUpdateWithoutSettingsInput')).toBe('User');
      expect(extractBaseNameFromRelationType('PostCreateWithoutTagsInput')).toBe('Post');
      expect(extractBaseNameFromRelationType('CategoryUpdateManyWithoutProductsInput')).toBe(
        'Category'
      );
    });
  });

  describe('isUpdateOneType', () => {
    it('should return truthy for UpdateInput types', () => {
      expect(isUpdateOneType('UserUpdateInput')).toBeTruthy();
      expect(isUpdateOneType('UserUncheckedUpdateInput')).toBeTruthy();
      expect(isUpdateOneType('PostUpdateInput')).toBeTruthy();
      expect(isUpdateOneType('UserProfileUpdateInput')).toBeTruthy();
    });

    it('should return truthy for UpdateWithout types', () => {
      expect(isUpdateOneType('UserUpdateWithoutProfileInput')).toBeTruthy();
      expect(isUpdateOneType('UserUncheckedUpdateWithoutProfileInput')).toBeTruthy();
      expect(isUpdateOneType('PostUpdateWithoutAuthorInput')).toBeTruthy();
      expect(isUpdateOneType('CommentUpdateWithoutPostInput')).toBeTruthy();
    });

    it('should return truthy for UpdateManyWithout types', () => {
      expect(isUpdateOneType('UserUpdateManyWithoutProfileInput')).toBeTruthy();
      expect(isUpdateOneType('UserUncheckedUpdateManyWithoutProfileInput')).toBeTruthy();
      expect(isUpdateOneType('PostUpdateManyWithoutAuthorInput')).toBeTruthy();
      expect(isUpdateOneType('CommentUpdateManyWithoutPostInput')).toBeTruthy();
    });

    it('should return falsy for non-update types', () => {
      expect(isUpdateOneType('UserCreateInput')).toBeFalsy();
      expect(isUpdateOneType('UserWhereInput')).toBeFalsy();
      expect(isUpdateOneType('UserProfile')).toBeFalsy();
      expect(isUpdateOneType('User')).toBeFalsy();
      expect(isUpdateOneType('UserCreateWithoutProfileInput')).toBeFalsy();
      expect(isUpdateOneType('UserCreateManyProfileInput')).toBeFalsy();
    });

    it('should return falsy for types that partially match', () => {
      expect(isUpdateOneType('UpdateUser')).toBeFalsy();
      // Note: UpdateInput actually does match the pattern (it ends with UpdateInput)
      // So let's test a different case that doesn't end with UpdateInput
      expect(isUpdateOneType('SomeOtherUpdateInputType')).toBeFalsy();
    });
  });

  describe('generateTypeNamesFromName', () => {
    it('should generate all expected type names for a basic model', () => {
      const name = 'User';
      const types = generateTypeNamesFromName(name);

      // Check that all expected types are present
      expect(types).toContain('$UserPayload');

      // Check capitalized output types
      expect(types).toContain('UserCountAggregate');
      expect(types).toContain('UserGroup');
      expect(types).toContain('UserGroupByOutputType');
      expect(types).toContain('UserAvgAggregateOutputType');
      expect(types).toContain('UserSumAggregateOutputType');
      expect(types).toContain('UserMinAggregateOutputType');
      expect(types).toContain('UserMaxAggregateOutputType');
      expect(types).toContain('UserCountAggregateOutputType');

      // Check where types
      expect(types).toContain('UserWhere');
      expect(types).toContain('UserScalarWhere');
      expect(types).toContain('UserWhereInput');
      expect(types).toContain('UserScalarWhereInput');
      expect(types).toContain('UserWhereWithAggregatesInput');
      expect(types).toContain('UserScalarWhereWithAggregatesInput');

      // Check create types
      expect(types).toContain('UserCreateInput');
      expect(types).toContain('UserUncheckedCreateInput');
      expect(types).toContain('UserCreateManyInput');
      expect(types).toContain('UserUncheckedCreateManyInput');

      // Check update types
      expect(types).toContain('UserUpdateInput');
      expect(types).toContain('UserUncheckedUpdateInput');
      expect(types).toContain('UserUpdateManyInput');
      expect(types).toContain('UserUncheckedUpdateManyInput');
      expect(types).toContain('UserUpdateManyMutationInput');
      expect(types).toContain('UserUncheckedUpdateManyMutationInput');

      // Verify total count (25 types)
      expect(types).toHaveLength(25);
    });

    it('should handle different model names', () => {
      const name = 'Post';
      const types = generateTypeNamesFromName(name);

      expect(types).toContain('$PostPayload');
      expect(types).toContain('PostCreateInput');
      expect(types).toContain('PostWhereInput');
      expect(types).toContain('PostUpdateInput');
    });

    it('should properly capitalize for output types while preserving original casing for inputs', () => {
      const name = 'post'; // lowercase
      const types = generateTypeNamesFromName(name);

      // Payload uses original case
      expect(types).toContain('$postPayload');

      // Output types should be capitalized (first letter)
      expect(types).toContain('PostCountAggregate'); // capitalized
      expect(types).toContain('PostGroup'); // capitalized
      expect(types).toContain('PostGroupByOutputType'); // capitalized
      expect(types).toContain('PostAvgAggregateOutputType'); // capitalized
      expect(types).toContain('PostSumAggregateOutputType'); // capitalized
      expect(types).toContain('PostMinAggregateOutputType'); // capitalized
      expect(types).toContain('PostMaxAggregateOutputType'); // capitalized
      expect(types).toContain('PostCountAggregateOutputType'); // capitalized

      // Input types should preserve original case
      expect(types).toContain('postWhere');
      expect(types).toContain('postScalarWhere');
      expect(types).toContain('postWhereInput');
      expect(types).toContain('postScalarWhereInput');
      expect(types).toContain('postWhereWithAggregatesInput');
      expect(types).toContain('postScalarWhereWithAggregatesInput');
      expect(types).toContain('postCreateInput');
      expect(types).toContain('postUncheckedCreateInput');
      expect(types).toContain('postCreateManyInput');
      expect(types).toContain('postUncheckedCreateManyInput');
      expect(types).toContain('postUpdateInput');
      expect(types).toContain('postUncheckedUpdateInput');
      expect(types).toContain('postUpdateManyInput');
      expect(types).toContain('postUncheckedUpdateManyInput');
      expect(types).toContain('postUpdateManyMutationInput');
      expect(types).toContain('postUncheckedUpdateManyMutationInput');
    });

    it('should correctly handle already capitalized names', () => {
      const name = 'User';
      const types = generateTypeNamesFromName(name);

      // Both payload and output types use the same capitalized form
      expect(types).toContain('$UserPayload');
      expect(types).toContain('UserCountAggregate');
    });
  });
});
