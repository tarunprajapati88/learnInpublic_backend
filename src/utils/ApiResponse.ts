
class ApiResponse<T> {
  public statuscode: number;
  public message: string;
  public data: T | null;
  public success: boolean;

  constructor(statuscode: number, message: string = "success", data: T | null = null) {
    this.statuscode = statuscode;
    this.message = message;
    this.data = data;
    this.success = statuscode < 400;
  }
}

export { ApiResponse };
