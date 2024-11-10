import { Sql } from 'postgres';

type Migration = {
    path: string;
    migration_id: number;
    name: string;
};
export default function migrationRunner({ sql, path, before, after }: {
    sql: Sql;
    path: string;
    before?: (m: Migration) => void;
    after?: (m: Migration) => void;
}): Promise<void>;
