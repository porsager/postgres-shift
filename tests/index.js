const shift = require('../index.js')
const postgres = require('postgres')
const cp = require('child_process')
const path = require('path')

const db = 'postgres_shift_test'
cp.execSync('dropdb ' + db + ';createdb ' + db)

const sql = postgres({
  db,
  timeout: 1
})

shift({
  sql,
  path: path.join(__dirname, 'migrations')
})
.then(() => console.log('All good'))
.catch(err => {
  console.error('Failed', err)
  process.exit(1)
})
