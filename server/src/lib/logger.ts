// Minimal structured logger used by the server.
// Keeps the API small and avoids adding a dependency while emitting JSON for easy ingestion.
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function formatArgs(args: any[]) {
  return args
    .map((a) => {
      if (a instanceof Error) {
        return {message: a.message, stack: a.stack}
      }
      if (typeof a === 'object') {
        try {
          return JSON.parse(JSON.stringify(a))
        } catch (_e) {
          return String(a)
        }
      }
      return String(a)
    })
    .map((a) => (typeof a === 'object' ? a : {msg: a}))
}

function write(level: LogLevel, ...args: any[]) {
  const payload: any = {
    ts: new Date().toISOString(),
    level,
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
    msg: undefined,
  }
  const formatted = formatArgs(args)
  // If there's a single string-like message, keep it compact
  if (formatted.length === 1 && formatted[0] && typeof formatted[0].msg === 'string') {
    payload.msg = (formatted[0] as any).msg
    // merge any additional object fields
    Object.assign(payload, formatted[0])
  } else {
    payload.msg = formatted
  }

  // Print JSON to stdout/stderr depending on level
  const out = level === 'error' ? console.error : console.log
  try {
    out(JSON.stringify(payload))
  } catch (_e) {
    out(payload)
  }
}

export const logger = {
  info: (...args: any[]) => write('info', ...args),
  warn: (...args: any[]) => write('warn', ...args),
  error: (...args: any[]) => write('error', ...args),
  debug: (...args: any[]) => {
    if (process.env.LOG_LEVEL === 'debug') write('debug', ...args)
  },
}

export default logger
