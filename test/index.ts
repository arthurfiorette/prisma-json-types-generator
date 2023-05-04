import { Prisma, PrismaClient, User } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type Simple = { a: number };

    type Optional = { a: number };

    type List = { a: number };

    type StringType = 'a' | 'b';

    enum EnumType {
      Case1 = 'Case1',
      Case2 = 'Case2'
    }
  }
}

declare function user<T extends Omit<User, 'id'>>(_: T): void;
declare const client: PrismaClient['user'];

user({
  simple: {
    //@ts-expect-error - should be a
    b: 1
  },

  optional: {
    //@ts-expect-error - should be a
    b: 'not a number'
  },

  list: [
    {
      //@ts-expect-error - should be a
      b: true
    }
  ]
});

user({
  //@ts-expect-error - not optional
  simple: null,

  // optional
  optional: null,

  //@ts-expect-error - not optional
  list: null
});

user({
  //@ts-expect-error - not a list
  simple: [
    {
      a: 1
    }
  ],

  //@ts-expect-error - not a list
  optional: [
    {
      a: 1
    }
  ],

  list: [
    {
      a: 1
    }
  ]
});

client.create({
  data: {
    simple: {
      //@ts-expect-error - should be a
      b: 1
    },

    optional: {
      //@ts-expect-error - should be a
      b: 'not a number'
    },

    list: [
      {
        //@ts-expect-error - should be a
        b: true
      }
    ],

    //@ts-expect-error - should be a or b
    stringArrayField: ['c']
  }
});

client.create({
  data: {
    //@ts-expect-error - not optional
    simple: null,

    // optional
    optional: Prisma.DbNull,

    //@ts-expect-error - not optional
    list: null
  }
});

client.create({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: [
      {
        a: 1
      }
    ]
  }
});

client.create({
  data: {
    simple: {
      //@ts-expect-error - should be a
      b: 1
    },

    optional: {
      //@ts-expect-error - should be a
      b: 'not a number'
    },

    list: {
      set: {
        //@ts-expect-error - should be a
        b: true
      }
    }
  }
});

client.create({
  data: {
    simple: {
      //@ts-expect-error - should be a
      b: 1
    },

    optional: {
      //@ts-expect-error - should be a
      b: 'not a number'
    },

    list: {
      set: [
        {
          //@ts-expect-error - should be a
          b: true
        }
      ]
    }
  }
});

client.findMany({
  where: {
    list: {
      equals: [
        {
          //@ts-expect-error - should be a
          b: 1
        }
      ],
      has: {
        //@ts-expect-error - should be a
        b: 1
      },
      hasEvery: [
        {
          //@ts-expect-error - should be a
          b: 1
        }
      ],
      hasSome: [
        {
          //@ts-expect-error - should be a
          b: 1
        }
      ],
      isEmpty: false
    }
  }
});

client.findMany({
  where: {
    list: {
      equals: {
        //@ts-expect-error - should be a
        b: 1
      },
      has: {
        //@ts-expect-error - should be a
        b: 1
      },
      hasEvery: {
        //@ts-expect-error - should be a
        b: 1
      },
      hasSome: {
        //@ts-expect-error - should be a
        b: 1
      },
      isEmpty: false
    }
  }
});

client.update({
  data: {
    simple: {
      //@ts-expect-error - should be a
      b: 1
    },

    optional: {
      //@ts-expect-error - should be a
      b: 'not a number'
    },

    list: [
      {
        //@ts-expect-error - should be a
        b: true
      }
    ],

    //@ts-expect-error - should be a or b
    stringArrayField: ['c']
  }
});

client.update({
  data: {
    //@ts-expect-error - not optional
    simple: null,

    // optional
    optional: Prisma.DbNull,

    //@ts-expect-error - not optional
    list: null
  }
});

client.update({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: [
      {
        a: 1
      }
    ]
  }
});

client.update({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: {
      set: [
        {
          //@ts-expect-error - should be a
          b: true
        }
      ]
    }
  }
});

client.update({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: {
      set: {
        //@ts-expect-error - should be a
        b: true
      }
    }
  }
});

client.update({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: {
      push: [
        {
          //@ts-expect-error - should be a
          b: true
        }
      ]
    }
  }
});

client.update({
  data: {
    //@ts-expect-error - not a list
    simple: [
      {
        a: 1
      }
    ],

    //@ts-expect-error - not a list
    optional: [
      {
        a: 1
      }
    ],

    list: {
      push: {
        //@ts-expect-error - should be a
        b: true
      }
    }
  }
});

user({
  simple: {
    //@ts-expect-error - should be a
    b: 1
  },

  optional: {
    //@ts-expect-error - should be a
    b: 'not a number'
  },

  list: [
    {
      //@ts-expect-error - should be a
      b: true
    }
  ],

  //@ts-expect-error - should only be a | b
  stringField: 'c'
});

//
// Strings
//

//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: 'c' } });

client.findMany({
  //@ts-expect-error - should not be able to construct since {one: "a"} is not a string
  where: { incorrectlyTypedStringField: { equals: { one: 'a' } } }
});

//@ts-expect-error - should not be able to construct since {one: "a"} is not a string
client.findMany({ where: { incorrectlyTypedStringField: { one: 'a' } } });

//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { equals: 'c' } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { in: ['c'] } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { notIn: ['c'] } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { not: { equals: 'c' } } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { not: { in: ['c'] } } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringField: { not: { notIn: ['c'] } } } });

//@ts-expect-error - should only be a | b
client.aggregate({ _count: { list: true }, where: { stringField: 'c' } });

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: 'c' }
});

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: { equals: 'c' } }
});

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: { not: 'c' } }
});

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: { not: { equals: 'c' } } }
});

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: { in: ['a', 'b', 'c'] } }
});

client.groupBy({
  by: ['stringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { stringField: { notIn: ['a', 'b', 'c'] } }
});

//@ts-expect-error - should only be a | b
client.update({ where: { id: 1 }, data: { stringField: 'c' } });

//@ts-expect-error - should only be a | b
client.update({ where: { id: 1 }, data: { stringField: { set: 'c' } } });

//
// Nullable Strings
//

//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: 'c' } });

//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { equals: 'c' } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { in: ['c'] } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { notIn: ['c'] } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { not: { equals: 'c' } } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { not: { in: ['c'] } } } });
//@ts-expect-error - should only be a | b
client.findMany({ where: { optionalStringField: { not: { notIn: ['c'] } } } });

client.aggregate({
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  where: { optionalStringField: 'c' }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: 'c' }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: { equals: 'c' } }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: { not: 'c' } }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: { not: { equals: 'c' } } }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: { in: ['a', 'b', 'c'] } }
});

client.groupBy({
  by: ['optionalStringField'],
  _count: { list: true },
  //@ts-expect-error - should only be a | b
  having: { optionalStringField: { notIn: ['a', 'b', 'c'] } }
});

//@ts-expect-error - should only be a | b
client.update({ where: { id: 1 }, data: { optionalStringField: 'c' } });

client.update({
  where: { id: 1 },
  //@ts-expect-error - should only be a | b
  data: { optionalStringField: { set: 'c' } }
});

//@ts-expect-error - should only be able to pass enum values
client.findMany({ where: { enumField: 'incorrectCase' } });
client.findMany({ where: { enumField: PrismaJson.EnumType.Case1 } });

//@ts-expect-error - should only be able to pass enum values
client.findMany({ where: { optionalEnumField: 'incorrectCase' } });
client.findMany({ where: { optionalEnumField: PrismaJson.EnumType.Case1 } });

//
// String Arrays
//
//@ts-expect-error - should only be a | b
client.findMany({ where: { stringArrayField: ['c', 'd'] } });

//@ts-expect-error - should only be a | b
client.findMany({ where: { stringArrayField: { has: 'c' } } });
