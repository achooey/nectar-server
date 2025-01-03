import express from "express"
import { Pool } from "pg"

const PORT = process.env.PORT
const HISTORY_LIMIT = process.env.HISTORYLIMIT
const CODE_RETRIEVAL_LIMIT = process.env.CODE_RETRIEVAL_LIMIT
const CODE_CHARACTER_LIMIT = process.env.CODE_CHARACTER_LIMIT
const SITE_CHARACTER_LIMIT = process.env.SITE_CHARACTER_LIMIT

const app = express()

const database = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: true
})

const results = ["failure", "success"] as const
type Result = "success" | "failure"
const isResult = (x: any): x is Result => results.includes(x);
const succeeded = (x: Result) => x == 'success'

// get promo codes for this site
app.get('/codes', (req, res) => {
  const site = req.query.site

  const query = database.query(`
  SELECT code FROM promocodes
  WHERE website = $1
  ORDER BY last_successful DESC
  LIMIT $2;`, [site, CODE_RETRIEVAL_LIMIT])

  query
    .then((result) => {
      res.status(200).json(result.rows)
    })
    .catch((reason) => {
      res.status(500).send(reason)
    })
})

app.get('/code', (req, res) => {
  const code = req.query.code
  const site = req.query.site

  const query = database.query(`
      SELECT website, code, timestamp, result
      FROM attempthistory
      WHERE code = $1 AND website = $2
      ORDER BY id DESC
      LIMIT $3;`, [code, site, HISTORY_LIMIT])

  query
    .then((result) => {
      res.status(200).json(result.rows)
    })
    .catch((reason) => {
      res.status(500).send(reason)
    })
})

app.post('/code', (req, res) => {
  const code = req.query.code?.toString()
  const site = req.query.site?.toString()
  const result = req.query.result
  const time = new Date()

  if (!isResult(result)) {
    res.status(400).send("improperly formatted result")
    return
  }

  if (!code)
    res.status(400).send("no code")
  else if (!site)
    res.status(400).send("no site")
  else if (code.length > CODE_CHARACTER_LIMIT)
    res.status(400).send("code too long")
  else if (site.length > SITE_CHARACTER_LIMIT)
    res.status(400).send("site name too long")
  else {
    database.query(`
    INSERT INTO attempthistory (timestamp, website, code, result)
    VALUES ($1, $2, $3, $4)`,
      [time, site, code, result])

    if (!succeeded(result)) {
      res.status(200).send()
      return
    }

    const promoCode = database.query(`
    SELECT (id) FROM promocodes
    WHERE code = $1 AND website = $2
    LIMIT 1`, [code, site])

    promoCode
      .then((promoCodeEntry) => {
        if (promoCodeEntry.rows.length == 0) { //new code
          database.query(`
          INSERT INTO promocodes (website, code, last_successful)
          VALUES ($1, $2, $3)
          `, [site, code, time])
        }
        else { //old code
          const id = promoCodeEntry.rows[0].id
          database.query(`
          UPDATE promocodes
          SET last_successful = $1
          WHERE id = $2
          `, [time, id])
        }
        res.status(200).send()
      })
      .catch((result) => {
        console.log(result)
        res.status(500).send(result)
      })
  }
})

app.get('/status', (_, res) => {
  res.status(200).send("at attention!")
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`)
  if (process.env.NODE_ENV == "development") {
    console.log("live at http://localhost:" + PORT)
  }
})
