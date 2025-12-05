import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import type { Post, PrismaClient, User } from '../target/query-compiler/client';
import type { UserGroupByOutputType } from '../target/query-compiler/models/User';

declare global {
  export namespace PQueryCompilerJson {
    export type UserProfile = {
      theme: 'dark' | 'light';
      language: string;
    };

    export type Preferences = {
      notifications: boolean;
      email: string;
    };

    export type Tag = {
      id: string;
      name: string;
    };
  }
}

// Test User model with typed JSON fields
expectAssignable<User>({
  id: 0,
  profile: {
    theme: 'dark',
    language: 'en'
  },
  preferences: {
    notifications: true,
    email: 'test@example.com'
  },
  tags: [{ id: '1', name: 'tag1' }]
});

expectAssignable<User>({
  id: 0,
  profile: {
    theme: 'light',
    language: 'es'
  },
  preferences: null,
  tags: []
});

// Test Post model with inline typed JSON field
expectAssignable<Post>({
  id: 0,
  metadata: {
    title: 'Test Post',
    content: 'This is test content'
  }
});

// Test invalid assignments
expectNotAssignable<User>({
  id: 0,
  profile: {
    theme: 'invalid', // Invalid theme
    language: 'en'
  },
  preferences: null,
  tags: []
});

expectNotAssignable<Post>({
  id: 0,
  metadata: {
    title: 123, // Should be string
    content: 'content'
  }
});

// Test GroupBy output type with JSON fields
expectAssignable<UserGroupByOutputType>({
  id: 0,
  profile: {
    theme: 'dark',
    language: 'en'
  },
  preferences: {
    notifications: true,
    email: 'test@example.com'
  },
  tags: [{ id: '1', name: 'tag1' }],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

expectAssignable<UserGroupByOutputType>({
  id: 0,
  profile: {
    theme: 'light',
    language: 'fr'
  },
  preferences: null,
  tags: [],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

// Test GroupBy return type for specific field selections
declare const prisma: PrismaClient;

(async () => {
  const result = await prisma.user.groupBy({
    by: ['profile'],
    _count: true
  });

  for (const item of result) {
    // item.profile should be properly typed
    expectType<PQueryCompilerJson.UserProfile>(item.profile);
    expectAssignable<PQueryCompilerJson.UserProfile>(item.profile);
  }
})();

(async () => {
  const result = await prisma.user.groupBy({
    by: ['preferences'],
    _count: true
  });

  for (const item of result) {
    // item.preferences should be properly typed as optional
    expectType<PQueryCompilerJson.Preferences | null>(item.preferences);
    expectAssignable<PQueryCompilerJson.Preferences | null>(item.preferences);
  }
})();

(async () => {
  const result = await prisma.user.groupBy({
    by: ['tags'],
    _count: true
  });

  for (const item of result) {
    // item.tags should be properly typed as array
    expectType<PQueryCompilerJson.Tag[]>(item.tags);
    expectAssignable<PQueryCompilerJson.Tag[]>(item.tags);
  }
})();
