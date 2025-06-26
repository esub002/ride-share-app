#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connection established');
      client.release();
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async readSQLFile(filename) {
    try {
      const filePath = path.join(__dirname, '..', filename);
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Error reading ${filename}:`, error.message);
      return null;
    }
  }

  async executeSQL(sql, description) {
    try {
      console.log(`🔄 Executing: ${description}`);
      await this.pool.query(sql);
      console.log(`✅ Success: ${description}`);
      return true;
    } catch (error) {
      console.error(`❌ Error executing ${description}:`, error.message);
      return false;
    }
  }

  async checkTableExists(tableName) {
    try {
      const result = await this.pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      return result.rows[0].exists;
    } catch (error) {
      console.error(`❌ Error checking table ${tableName}:`, error.message);
      return false;
    }
  }

  async migrate() {
    console.log('🚀 Starting database migration...');
    
    // Check database connection
    if (!(await this.connect())) {
      process.exit(1);
    }

    // Read SQL files
    const coreSchema = await this.readSQLFile('schema.sql');
    const safetySchema = await this.readSQLFile('safety-schema.sql');

    if (!coreSchema || !safetySchema) {
      console.error('❌ Failed to read SQL files');
      process.exit(1);
    }

    // Execute core schema
    if (!(await this.executeSQL(coreSchema, 'Core schema'))) {
      process.exit(1);
    }

    // Execute safety schema
    if (!(await this.executeSQL(safetySchema, 'Safety schema'))) {
      process.exit(1);
    }

    // Verify tables were created
    const tablesToCheck = [
      'users', 'drivers', 'rides', 'emergency_contacts', 
      'safety_settings', 'incident_reports', 'emergency_alerts',
      'communication_history', 'location_sharing', 'trip_sharing',
      'voice_commands_log', 'safety_metrics', 'driver_verification'
    ];

    console.log('🔍 Verifying table creation...');
    for (const table of tablesToCheck) {
      const exists = await this.checkTableExists(table);
      if (exists) {
        console.log(`✅ Table ${table} exists`);
      } else {
        console.error(`❌ Table ${table} missing`);
      }
    }

    // Create indexes for performance
    console.log('🔍 Creating performance indexes...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id)',
      'CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id)',
      'CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)',
      'CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status)',
      'CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status)',
      'CREATE INDEX IF NOT EXISTS idx_communication_history_sent_at ON communication_history(sent_at)'
    ];

    for (const query of indexQueries) {
      await this.executeSQL(query, 'Performance index');
    }

    console.log('🎉 Database migration completed successfully!');
    await this.pool.end();
  }

  async rollback() {
    console.log('🔄 Starting database rollback...');
    
    if (!(await this.connect())) {
      process.exit(1);
    }

    const dropQueries = [
      'DROP TABLE IF EXISTS driver_verification CASCADE',
      'DROP TABLE IF EXISTS safety_metrics CASCADE',
      'DROP TABLE IF EXISTS voice_commands_log CASCADE',
      'DROP TABLE IF EXISTS trip_sharing CASCADE',
      'DROP TABLE IF EXISTS location_sharing CASCADE',
      'DROP TABLE IF EXISTS communication_history CASCADE',
      'DROP TABLE IF EXISTS emergency_alerts CASCADE',
      'DROP TABLE IF EXISTS incident_reports CASCADE',
      'DROP TABLE IF EXISTS safety_settings CASCADE',
      'DROP TABLE IF EXISTS emergency_contacts CASCADE',
      'DROP TABLE IF EXISTS rides CASCADE',
      'DROP TABLE IF EXISTS drivers CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const query of dropQueries) {
      await this.executeSQL(query, 'Drop table');
    }

    console.log('🎉 Database rollback completed!');
    await this.pool.end();
  }
}

// CLI interface
const migrator = new DatabaseMigrator();

if (process.argv.includes('--rollback')) {
  migrator.rollback();
} else {
  migrator.migrate();
} 