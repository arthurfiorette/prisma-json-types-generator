import { expectAssignable, expectNotAssignable } from 'tsd';
import type { Prisma, User } from '../target/extensions/client';

declare global {
  export namespace PExtensionsJson {
    export type UserProfile = {
      theme: 'dark' | 'light';
      language?: string;
    };
  }
}

// Test 1: Base Prisma Client types without extensions - THESE SHOULD WORK
expectAssignable<Prisma.UserCreateInput>({
  profile: {
    theme: 'dark',
    language: 'en'
  }
});

expectAssignable<Prisma.UserCreateInput>({
  profile: {
    theme: 'light'
  }
});

// Test 2: These should NOT be assignable (type errors expected)
expectNotAssignable<Prisma.UserCreateInput>({
  profile: 10
});

expectNotAssignable<Prisma.UserCreateInput>({
  profile: {
    theme: 'invalid-theme'
  }
});

// Test 3: Check that User model has correct type
expectAssignable<User>({
  id: 1,
  profile: {
    theme: 'dark',
    language: 'en'
  }
});

expectAssignable<User>({
  id: 1,
  profile: null
});

expectNotAssignable<User>({
  id: 1,
  profile: 10
});
