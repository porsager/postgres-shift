module.exports = async(sql) => {
  await sql`
    alter table test add column c timestamp with time zone
  `

  await sql`
    insert into test (a, b, c) values ('hello', 9, ${ new Date() })
  `
}
