import type { Statement, Database } from "better-sqlite3";

export type PreparedStatement = { [key in keyof typeof DatabaseStatement.Statements]: Statement }
export class DatabaseStatement {
    static Statements = {
        fetchRegistriesOfGroup: "SELECT * FROM channels WHERE groupId = ?",
        groupCreate:
            "INSERT INTO groups (tag, id, ownerId, settings, appearances, entrance, data, locale, status, createdTimestamp, bans) values (@tag, @id, @ownerId, @settings, @appearances, @entrance, @data, @locale, @status, @createdTimestamp, @bans)",
        fetchGroupById: "SELECT * FROM groups WHERE id = ?",
        fetchGroupByTag: "SELECT * FROM groups WHERE LOWER(tag) = ?",
        deleteGroup: "DELETE FROM groups WHERE id = ?",
        fetchAllGroups: "SELECT * FROM groups",
        createRegistry:
            "INSERT OR REPLACE INTO channels (id, webhookurl, guildId, groupId) VALUES (@id, @webhookurl, @guildId, @groupId);",
        deleteRegistry: "DELETE FROM channels WHERE id = ?",
        getRegistry: "SELECT * FROM channels WHERE id = ?;",
    };
    
    static prepareStatements(database: Database): PreparedStatement {
        //@ts-expect-error
        const preparedStatements: PreparedStatement = {}
    
        for (const [key, value] of Object.entries(this.Statements)) {
            Object.assign(preparedStatements, {
                [`${key}`]: database.prepare(value),
            });
        }
        return preparedStatements;
    }
}