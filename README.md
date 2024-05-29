# `postgres-shift`

A simple forwards only migration solution for [postgres.js](https://github.com/porsager/postgres).

`postgres-shift` 

## `shift()`
`postgres-shift` exports a single function which is used to start migrations.
It expects a [postgres.js sql]() database object to run migrations with.

## `Example`

1. Create `migrations` directory with following structure
```
.
└── migrations
    ├── 00001_initial
    │   └── index.sql
    ├── 00002_update
    │   └── index.js
    └── 00003_delete
        └── index.sql
```
Note that migration folder name expects 5 digits. This is very important
detail.

2. Create actual migrations. Note that it can be either in SQL or JS syntax
```sql
create table test (
  a text,
  b int
)
```
```js
export default async function(sql) {
  await sql`
    alter table test add column c timestamp with time zone
  `

  await sql`
    insert into test (a, b, c) values ('hello', 9, ${ new Date() })
  `
}
```

3. Create your `migrate.js` script:
```js
import shift from 'postgres-shift';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    ADMIN_DB_USER,
    ADMIN_DB_PASSWORD,
} = process.env;

export const sql = postgres({
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: ADMIN_DB_USER,
    pass: ADMIN_DB_PASSWORD,
    idle_timeout: 1,
});

shift({
    sql,
    path: fileURLToPath(new URL('migrations', import.meta.url)),
    before: ({ migration_id, name }) => {
        console.log('Migrating', migration_id, name);
    },
})
    .then(() => console.log('All good'))
    .catch((err) => {
        console.error('Failed', err);
        process.exit(1);
    });
```

4. Run it with
```console
node ./migrate.js
```
