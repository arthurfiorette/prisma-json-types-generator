/**
 * Simple error to throw when something goes wrong. Simply wraps the message to help
 * identify whether the error is from this package or not.
 */
export class PrismaJsonTypesGeneratorError extends Error {
  constructor(message: string, data?: any) {
    super(message);
    Object.assign(this, data);
  }

  // TODO: Better handler? investigate how to handle errors in the best way.
  static handler(error: PrismaJsonTypesGeneratorError) {
    console.log(error);
  }
}
