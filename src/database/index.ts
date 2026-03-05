import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';

export interface DatabaseConfig {
  url?: string;
  options?: MongoClientOptions;
}

export interface DatabaseOptions {
  url: string;
  options?: MongoClientOptions;
}

class DatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private url: string | null = null;

  async connect(options: DatabaseOptions): Promise<Db> {
    if (this.db) return this.db;

    this.url = options.url;
    const clientOptions: MongoClientOptions = {
      ...options.options,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    this.client = new MongoClient(this.url, clientOptions);
    await this.client.connect();
    this.db = this.client.db();

    return this.db;
  }

  async connectTo(uri: string, dbName?: string, options?: MongoClientOptions): Promise<Db> {
    if (this.db) return this.db;

    const clientOptions: MongoClientOptions = {
      ...options,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    this.client = new MongoClient(uri, clientOptions);
    await this.client.connect();
    this.db = this.client.db(dbName);

    return this.db;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.client;
  }

  collection<T = any>(name: string): Collection<T> {
    return this.getDb().collection<T>(name);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

const databaseManager = new DatabaseManager();

export const database = {
  connect: (options: DatabaseOptions) => databaseManager.connect(options),
  connectTo: (uri: string, dbName?: string, options?: MongoClientOptions) => 
    databaseManager.connectTo(uri, dbName, options),
  getDb: () => databaseManager.getDb(),
  getClient: () => databaseManager.getClient(),
  collection: <T = any>(name: string) => databaseManager.collection<T>(name),
  close: () => databaseManager.close(),
  isConnected: () => databaseManager.isConnected(),
};

export const db = database;

export { DatabaseManager };
export default database;
