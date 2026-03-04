import dotenv from 'dotenv'
import { createApp } from './app.js'

dotenv.config()

const port = Number(process.env.API_PORT ?? 3000)
const app = createApp()

app.listen(port, () => {
  console.log(`[badevannweb-api] Lytter pa port ${port}`)
})
