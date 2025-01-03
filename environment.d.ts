declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      PORT: number
      HISTORY_LIMIT: number
      CODE_CHARACTER_LIMIT: number
      CODE_RETRIEVAL_LIMIT: number
      SITE_CHARACTER_LIMIT: number

      PGHOST: string
      PGDATABASE: string
      PGUSER: string
      PGPASSWORD: string
      PGPORT: number
    }
  }
}

// module yo??
export { }
