import { expectAssignable, expectNotAssignable } from 'tsd';
import { Model } from '../target/literal/index';

expectAssignable<Model>({
  id: 0,
  simple: 1,
  optional: 2,
  list: [3]
});

expectAssignable<Model>({
  id: 0,
  simple: 1,
  optional: null,
  list: [3]
});

expectAssignable<Model>({
  id: 0,
  simple: 1,
  optional: null,
  list: []
});

expectAssignable<Model>({
  id: 0,
  simple: 1,
  optional: 2,
  list: [3, 3, 3]
});

expectNotAssignable<Model>({
  id: 0,
  simple: '1',
  optional: 2,
  list: [3]
});

expectNotAssignable<Model>({
  id: 0,
  simple: 1,
  optional: '2',
  list: [3]
});

expectNotAssignable<Model>({
  id: 0,
  simple: 1,
  optional: 'undefined',
  list: 3
});

expectNotAssignable<Model>({
  id: 0,
  simple: 1,
  optional: 2,
  list: '3,3,3'
});
