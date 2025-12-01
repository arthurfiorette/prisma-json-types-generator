import { expectAssignable, expectNotAssignable } from 'tsd';
import type { Model } from '../target/normal/client';
import type { ModelGroupByOutputType } from '../target/normal/models/Model';
import type { UpdateManyInput } from '../target/normal/pjtg';

declare global {
  export namespace PNormalJson {
    export type Simple = 1;
    export type Optional = 2;
    export type List = 3;
  }
}

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

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  push: 3
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  push: []
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  push: [3]
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  push: [3, 3, 3]
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  set: []
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  set: [3]
});

expectAssignable<UpdateManyInput<Model['list'][number]>>({
  set: [3, 3, 3]
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

expectNotAssignable<UpdateManyInput<Model['list'][number]>>({
  push: '3'
});

expectNotAssignable<UpdateManyInput<Model['list'][number]>>({
  push: ['3']
});

expectNotAssignable<UpdateManyInput<Model['list'][number]>>({
  set: 3
});

expectNotAssignable<UpdateManyInput<Model['list'][number]>>({
  set: '3'
});

expectNotAssignable<UpdateManyInput<Model['list'][number]>>({
  set: ['3,3,3']
});

// GroupBy output type should have properly typed JSON fields
expectAssignable<ModelGroupByOutputType>({
  id: 0,
  simple: 1,
  optional: 2,
  list: [3],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

expectAssignable<ModelGroupByOutputType>({
  id: 0,
  simple: 1,
  optional: null,
  list: [3, 3, 3],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

// GroupBy should reject incorrect JSON types
expectNotAssignable<ModelGroupByOutputType>({
  id: 0,
  simple: '1', // should be number 1, not string '1'
  optional: 2,
  list: [3],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

expectNotAssignable<ModelGroupByOutputType>({
  id: 0,
  simple: 1,
  optional: '2', // should be number 2, not string '2'
  list: [3],
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});

expectNotAssignable<ModelGroupByOutputType>({
  id: 0,
  simple: 1,
  optional: 2,
  list: ['3'], // should be number[] [3], not string[] ['3']
  _count: null,
  _avg: null,
  _sum: null,
  _min: null,
  _max: null
});
