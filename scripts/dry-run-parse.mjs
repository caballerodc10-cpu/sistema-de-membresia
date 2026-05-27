import fs from 'fs'

const buf = fs.readFileSync('C:\\Users\\Alan\\Downloads\\Planilla de caja(caja 2026) ayer.csv')
const content = buf.toString('latin1')
const lines = content.split('\n')

let headerLine = -1
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('TIPO COMP') && lines[i].includes('FECHA')) {
    headerLine = i
    break
  }
}

let count = 0
for (let i = headerLine + 1; i < lines.length; i++) {
  const cols = lines[i].split(';')
  const fecha = (cols[1] || '').trim()
  if (fecha.match(/\d{2}\/\d{2}\/\d{4}/)) count++
}
console.log('Registros con fecha valida:', count)
console.log('\nMuestra de primeros 5 registros:')

let shown = 0
for (let i = headerLine + 1; i < lines.length && shown < 5; i++) {
  const cols = lines[i].split(';')
  const fecha = (cols[1] || '').trim()
  if (fecha.match(/\d{2}\/\d{2}\/\d{4}/)) {
    console.log(`  ${fecha} | ${(cols[4]||'').trim().slice(0,30)} | ${(cols[16]||'').trim()} | ingreso: ${(cols[9]||'').trim()}`)
    shown++
  }
}
