export const HttpError = (
  status: number,
  message: string,
  body?: object
): Error => {
  const e: any = new Error(message)
  e.statusCode = status
  e.body = body
  return e
}
