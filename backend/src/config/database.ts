import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';
import mongoose from 'mongoose';
import Database from 'better-sqlite3';
import oracledb from 'oracledb';

// Database connection configurations
export const dbConfigs = {
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3307'),
    user: process.env.MYSQL_USER || 'mdb_user',
    password: process.env.MYSQL_PASSWORD || 'mdb_password',
    database: process.env.MYSQL_DATABASE || 'postal_codes_db'
  },
  
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    user: process.env.POSTGRES_USER || 'mdb_user',
    password: process.env.POSTGRES_PASSWORD || 'mdb_password',
    database: process.env.POSTGRES_DATABASE || 'postal_codes_db'
  },
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:adminpassword@localhost:27018/postal_codes_db?authSource=admin'
  },
  
  sqlite: {
    path: process.env.SQLITE_PATH || './data/postal_codes.db'
  },
  
  oracle: {
    user: process.env.ORACLE_USER || 'system',
    password: process.env.ORACLE_PASSWORD || 'mdb_password',
    connectString: process.env.ORACLE_CONNECTION || 'localhost:1522/XE'
  }
};

// Database connection singleton class
export class DatabaseConnections {
  private static instance: DatabaseConnections;
  
  public mysql?: mysql.Connection;
  public postgresql?: PgClient;
  public mongodb?: typeof mongoose;
  public sqlite?: Database.Database;
  public oracle?: oracledb.Connection;
  
  private constructor() {}
  
  public static getInstance(): DatabaseConnections {
    if (!DatabaseConnections.instance) {
      DatabaseConnections.instance = new DatabaseConnections();
    }
    return DatabaseConnections.instance;
  }
  
  // MySQL connection
  async connectMySQL(): Promise<mysql.Connection> {
    try {
      this.mysql = await mysql.createConnection(dbConfigs.mysql);
      console.log('✅ MySQL connected successfully');
      return this.mysql;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error);
      throw error;
    }
  }
  
  // PostgreSQL connection
  async connectPostgreSQL(): Promise<PgClient> {
    try {
      this.postgresql = new PgClient(dbConfigs.postgresql);
      await this.postgresql.connect();
      console.log('✅ PostgreSQL connected successfully');
      return this.postgresql;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }
  
  // MongoDB connection
  async connectMongoDB(): Promise<typeof mongoose> {
    try {
      this.mongodb = await mongoose.connect(dbConfigs.mongodb.uri);
      console.log('✅ MongoDB connected successfully');
      return this.mongodb;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
  
  // SQLite connection
  async connectSQLite(): Promise<Database.Database> {
    try {
      this.sqlite = new Database(dbConfigs.sqlite.path);
      console.log('✅ SQLite connected successfully');
      return this.sqlite;
    } catch (error) {
      console.error('❌ SQLite connection failed:', error);
      throw error;
    }
  }
  
  // Oracle connection
  async connectOracle(): Promise<oracledb.Connection> {
    try {
      this.oracle = await oracledb.getConnection(dbConfigs.oracle);
      console.log('✅ Oracle connected successfully');
      return this.oracle;
    } catch (error) {
      console.error('❌ Oracle connection failed:', error);
      throw error;
    }
  }
  
  // Connect all databases
  async connectAll(): Promise<void> {
    const promises = [
      this.connectMySQL().catch(err => console.log('MySQL skip:', err.message)),
      this.connectPostgreSQL().catch(err => console.log('PostgreSQL skip:', err.message)),
      this.connectMongoDB().catch(err => console.log('MongoDB skip:', err.message)),
      this.connectSQLite().catch(err => console.log('SQLite skip:', err.message)),
      this.connectOracle().catch(err => console.log('Oracle skip:', err.message))
    ];
    
    await Promise.all(promises);
    console.log('🎯 Database initialization completed');
  }
  
  // Health check for all databases
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    // MySQL health
    try {
      if (this.mysql) {
        await this.mysql.ping();
        health.mysql = true;
      } else {
        health.mysql = false;
      }
    } catch {
      health.mysql = false;
    }
    
    // PostgreSQL health
    try {
      if (this.postgresql) {
        await this.postgresql.query('SELECT 1');
        health.postgresql = true;
      } else {
        health.postgresql = false;
      }
    } catch {
      health.postgresql = false;
    }
    
    // MongoDB health
    try {
      if (this.mongodb) {
        health.mongodb = this.mongodb.connection.readyState === 1;
      } else {
        health.mongodb = false;
      }
    } catch {
      health.mongodb = false;
    }
    
    // SQLite health
    try {
      if (this.sqlite) {
        this.sqlite.prepare('SELECT 1').get();
        health.sqlite = true;
      } else {
        health.sqlite = false;
      }
    } catch {
      health.sqlite = false;
    }
    
    // Oracle health
    try {
      if (this.oracle) {
        await this.oracle.ping();
        health.oracle = true;
      } else {
        health.oracle = false;
      }
    } catch {
      health.oracle = false;
    }
    
    return health;
  }
  
  // Close all connections
  async closeAll(): Promise<void> {
    if (this.mysql) {
      await this.mysql.end();
    }
    if (this.postgresql) {
      await this.postgresql.end();
    }
    if (this.mongodb) {
      await this.mongodb.disconnect();
    }
    if (this.sqlite) {
      this.sqlite.close();
    }
    if (this.oracle) {
      await this.oracle.close();
    }
    console.log('🔌 All database connections closed');
  }
}
