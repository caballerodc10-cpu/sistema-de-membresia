import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const htmlFile = path.join(__dirname, 'presentacion-oruga.html')

http.createServer((req, res) => {
  try {
    const content = fs.readFileSync(htmlFile, 'utf8')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(content)
  } catch(e) {
    res.writeHead(500)
    res.end('Error: ' + e.message)
  }
}).listen(3004, () => console.log('Sirviendo en http://localhost:3004'))
