require('dotenv').config({
  path: `./config/${process.env.NODE_ENV || 'development'}.env`,
})

import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()

app.use(helmet())
app.use(cors())

// disable http trace
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'TRACE') {
    return res.status(405).send('Not allowed')
  }
  return next()
})

// timeout requests hanging for more than a min
app.use((req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(60 * 1000, () => {
    res.set('Connection', 'close')
    return res.status(408).send('Request timed out')
  })
  return next()
})

app.use([
  bodyParser.json({ limit: '250kb' }),
  bodyParser.urlencoded({ extended: true }),
])

// universal route handler
app.use('*', (req: Request, res: Response) => {
  return res.status(404).send('Not found')
})

// generic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error({
    message: err.message,
    stack: err.stack,
    type: 'error',
  })
  return res.status(400).send({
    message: err.message,
    status: 'error',
  })
})

app.listen(process.env.PORT, () => {
  console.log(`started at port: ${process.env.PORT}`)
})

process.on('unhandledRejection', (err: Error) => {
  console.error({
    message: err.message,
    stack: err.stack,
    type: 'unhandled rejection',
  })
})

process.on('uncaughtException', (err: Error) => {
  console.error({
    message: err.message,
    stack: err.stack,
    type: 'uncaught exception',
  })
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('SIGINT .. exiting process')
  process.exit(0)
})
