export class ApiResponse {
  static success(data: any, message: string = 'Success', statusCode: number = 200) {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  static error(message: string = 'Internal Server Error', statusCode: number = 500, errors: any = null) {
    return {
      success: false,
      message,
      errors,
      statusCode,
    };
  }
}
