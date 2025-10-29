class ApiError extends Error {
  public statusCode: number;
  public data: any;
  public success: boolean;
  public error: any[];
  public stack?: string;

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    error: any[] = [],
    stack: string = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.message = message;
    this.error = error;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };

