import * as fs from 'fs'
import * as path from 'path'

import type { Sql } from 'postgres'

const join = path.join

type Migration = {
  path: string;
  migration_id: number;
  name: string;
}

export default async function ({
  sql,
  path = join(process.cwd(), 'migrations'),
  before,
  after
}: {
  sql: Sql;
  path: string;
  before?: (m: Migration) => void;
  after?: (m: Migration) => void;
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

  async function next(sql: Sql) {
    const current = needed.shift()
    if (!current) {
      return
    }
    before?.(current)
    await run(sql, current)
    after?.(current)
    await next(sql)
  }

  async function run(sql: Sql, {
    path,
    migration_id,
    name
  }: Migration) {
    fs.existsSync(join(path, 'index.sql')) && !fs.existsSync(join(path, 'index.js'))
      ? await sql.file(join(path, 'index.sql'))
      : await import(join(path, 'index.js')).then(x => x.default(sql)) // eslint-disable-line

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

  async function getCurrentMigration() {
    return sql`
      select migration_id as id from migrations
      order by migration_id desc
      limit 1
    `.then(([x]) => x)
  }

  async function ensureMigrationsTable() {
    return sql`
      select 'migrations'::regclass
    `.catch((err) => sql`
      create table migrations (
        migration_id serial primary key,
        created_at timestamp with time zone not null default now(),
        name text
      )
    `)
  }

  return sql.begin(next)
}
