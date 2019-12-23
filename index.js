const fs = require('fs')
const path = require('path')

const join = path.join

module.exports = async function({
  sql,
  path = join(process.cwd(), 'migrations'),
  before = null,
  after = null
}) {
  const migrations = fs.readdirSync(path)
    .filter(x => fs.statSync(join(path, x)).isDirectory() && x.match(/^[0-9]{5}_/))
    .sort()
    .map(x => ({
      path: join(path, x),
      migration_id: parseInt(x.slice(0, 5)),
      name: x.slice(6).replace(/-/g, ' ')
    }))

  const latest = migrations[migrations.length - 1]

  if (latest.migration_id !== migrations.length)
    throw new Error('Inconsistency in migration numbering')

  await ensureMigrationsTable()

  const current = await getCurrentMigration()
  const needed = migrations.slice(current ? current.id : 0)

  return next()

  async function next() {
    const current = needed.shift()
    if (!current)
      return

    before && before(current)
    await run(current)
    after && after(current)
    await next()
  }

  async function run({
    path,
    migration_id,
    name
  }) {
    fs.existsSync(join(path, 'index.sql')) && !fs.existsSync(join(path, 'index.js'))
      ? await sql.file(join(path, 'index.sql'))
      : await require(join(path, 'index.js'))(sql) // eslint-disable-line

    await sql`
      insert into migrations (
        migration_id,
        name
      ) values (
        ${ migration_id },
        ${ name }
      )
    `
  }

  function getCurrentMigration() {
    return sql`
      select migration_id as id from migrations
      order by migration_id desc
      limit 1
    `.then(([x]) => x)
  }

  function ensureMigrationsTable() {
    return sql`
      create table if not exists migrations (
        migration_id serial primary key,
        created_at timestamp with time zone not null default now(),
        name text
      )
    `
  }

}
