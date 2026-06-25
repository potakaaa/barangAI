export function isDev(): boolean {
  const env = import.meta.env.VITE_ENVIRONMENT
  return env === "development" || !env
}
