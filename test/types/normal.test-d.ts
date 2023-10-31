import { expectAssignable, expectNotAssignable } from 'tsd';
import { Model, UpdateManyInput } from '../target/normal/index';

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

expectAssignable<UpdateManyInput<Model["list"][0]>>({
  push: 3
})

expectAssignable<UpdateManyInput<Model["list"][0]>>({
  push: []
})

expectAssignable<UpdateManyInput<Model["list"][0]>>({
  push: [3]
})

expectAssignable<UpdateManyInput<Model["list"][0]>>({
  push: [3, 3, 3]
})

expectAssignable<UpdateManyInput<Model["list"][0]>>({
  set: []
})
expectAssignable<UpdateManyInput<Model["list"][0]>>({
  set: [3]
})
expectAssignable<UpdateManyInput<Model["list"][0]>>({
  set: [3, 3, 3]
})

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

expectNotAssignable<UpdateManyInput<Model["list"][0]>>({
  push: '3',
})
expectNotAssignable<UpdateManyInput<Model["list"][0]>>({
  push: ['3'],
})

expectNotAssignable<UpdateManyInput<Model["list"][0]>>({
  set: 3
})

expectNotAssignable<UpdateManyInput<Model["list"][0]>>({
  set: '3'
})

expectNotAssignable<UpdateManyInput<Model["list"][0]>>({
  set: ['3,3,3']
})