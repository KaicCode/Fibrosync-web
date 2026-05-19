export class ApiResponse {
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static error(
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    errors: unknown = null,
  ) {
    return {
      success: false,
      message,
      errors,
      statusCode,
    };
  }
}
