// this module exposes interactions with the postgres database

import type { Pool } from "pg";
import type { Result } from "./types";

export function getCodesForSite(pool: Pool, site: string, number_of_codes: number) {
  return pool.query(`
    SELECT code FROM promocodes
    WHERE website = $1
    ORDER BY last_successful DESC
    LIMIT $2;`, [site, number_of_codes])
}

export function getEntryForCode(pool: Pool, code: string, site: string) {
  return pool.query(`
    SELECT id FROM promocodes
    WHERE code = $1 AND website = $2
    LIMIT 1;`, [code, site])
}

export function getRecentAttemptHistory(pool: Pool, code: string, site: string, number_of_attempts: number) {
  return pool.query(`
    SELECT website, code, timestamp, result
    FROM attempthistory
    WHERE code = $1 AND website = $2
    ORDER BY id DESC
    LIMIT $3;`, [code, site, number_of_attempts])
}

export function registerNewAttempt(pool: Pool, code: string, site: string, time: Date, result: Result) {
  return pool.query(`
    INSERT INTO attempthistory (timestamp, website, code, result)
    VALUES ($1, $2, $3, $4);`,
    [time, site, code, result])
}

export function registerNewCode(pool: Pool, code: string, site: string, last_successful: Date) {
  return pool.query(`
    INSERT INTO promocodes (website, code, last_successful)
    VALUES ($1, $2, $3);`, [site, code, last_successful])
}

export function updateLastSuccess(pool: Pool, code: string, site: string, last_successful: Date) {
  return pool.query(`
          UPDATE promocodes
          SET last_successful = $1
          WHERE code = $2 AND website = $3
          `, [last_successful, code, site])
}

