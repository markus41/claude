declare module 'kuzu' {
  export class Database {
    constructor(path: string);
  }
  export class Connection {
    constructor(db: Database);
    execute(query: string): Promise<unknown>;
  }
  const _default: {
    Database: typeof Database;
    Connection: typeof Connection;
  };
  export default _default;
}
