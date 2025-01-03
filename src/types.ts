const results = ["failure", "success"] as const
export type Result = "success" | "failure"
export const isResult = (x: any): x is Result => results.includes(x);
export const succeeded = (x: Result) => x == 'success'
