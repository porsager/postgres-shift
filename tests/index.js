import shift from '../index.js'
import postgres from 'postgres'
import cp from 'child_process'
import { fileURLToPath } from 'url'

const db = 'postgres_shift_test'
cp.execSync('dropdb ' + db + ';createdb ' + db)

const sql = postgres({
  db,
  idle_timeout: 1
})

shift({
  sql,
  path: fileURLToPath(new URL('migrations', import.meta.url)),
  before: ({
      migration_id,
      name
    }) => {
      console.log('Migrating', migration_id, name)
    }
})
.then(() => console.log('All good'))
.catch(err => {
  console.error('Failed', err)
  process.exit(1)
})
