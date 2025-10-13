export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = <T extends (...args: any[]) => Promise<any>>(fn: T) =>
  (req: any, res: any, next: any) => fn(req, res, next).catch(next);
