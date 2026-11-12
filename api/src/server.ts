import dotenv from 'dotenv'
import { createApp } from './app.js'

dotenv.config()

const port = Number(process.env.API_PORT ?? 3000)
const app = createApp()

const onListen = () => console.log(`[badevannweb-api] Lytter på port ${port}`)

// API_HOST=127.0.0.1 in production; unset listens on all interfaces (dev)
if (process.env.API_HOST) {
  app.listen(port, process.env.API_HOST, onListen)
} else {
  app.listen(port, onListen)
}
