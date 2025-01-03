import express from "express"
import { Pool } from "pg"
import { getCodesForSite, getEntryForCode, getRecentAttemptHistory, registerNewAttempt, registerNewCode, updateLastSuccess } from "./database"
import { isResult, succeeded } from "./types"

const PORT = process.env.PORT
const HISTORY_LIMIT = process.env.HISTORY_LIMIT
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

// get promo codes for this site
app.get('/codes', (req, res) => {
  const site = req.query.site?.toString()

  if (site == undefined) {
    res.status(400).send("invalid or missing site")
    return
  }

  const query = getCodesForSite(database, site, CODE_RETRIEVAL_LIMIT)

  query
    .then((result) => {
      res.status(200).json(result.rows)
    })
    .catch((reason) => {
      res.status(500).send(reason)
    })
})

app.get('/code', (req, res) => {
  const code = req.query.code?.toString()
  const site = req.query.site?.toString()
  if (code == undefined) {
    res.status(400).send("invalid or missing code")
    return
  }
  if (site == undefined) {
    res.status(400).send("invalid or missing site")
    return
  }

  const query = getRecentAttemptHistory(database, code, site, HISTORY_LIMIT)

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
    registerNewAttempt(database, code, site, time, result)

    if (!succeeded(result)) {
      res.status(200).send()
      return
    }

    const promoCode = getEntryForCode(database, code, site)

    promoCode
      .then((promoCodeEntry) => {
        if (promoCodeEntry.rows.length == 0) // previously unregistered code
          registerNewCode(database, code, site, time)
        else // code already registered
          updateLastSuccess(database, code, site, time)
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
