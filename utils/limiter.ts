import rateLimit from 'express-rate-limit'
// import RedisStore from 'rate-limit-redis'
import { createClient } from 'redis'

// const client = createClient({
// ... (see https://github.com/redis/node-redis/blob/master/docs/client-configuration.md)
// })

// await client.connect()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: false,
  legacyHeaders: false
  // store: new RedisStore({
  //   sendCommand: (...args: string[]) => client.sendCommand(args)
  // })
})

export default limiter
