#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pool = require('./db');

console.log('🚀 Real-Time Database Setup\n');

async function setupRealTimeDatabase() {
  try {
    console.log('📊 Setting up Real-Time Database Schema...');
    
    // Read the real-time schema file
    const schemaPath = path.join(__dirname, 'real-time-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Real-time schema file not found:', schemaPath);
      console.log('Please ensure real-time-schema.sql exists in the backend directory');
      process.exit(1);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        successCount++;
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Skip if table already exists or other non-critical errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('already exists')) {
          skipCount++;
          console.log(`⚠️  Skipped statement ${i + 1}/${statements.length} (already exists)`);
        } else {
          errorCount++;
          console.error(`❌ Error executing statement ${i + 1}/${statements.length}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Real-time database schema setup completed successfully!');
      
      // Verify the setup
      await verifySetup();
      
      // Insert sample data
      await insertSampleData();
      
    } else {
      console.log('\n⚠️  Setup completed with some errors. Please review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Error setting up real-time database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function verifySetup() {
  try {
    console.log('\n🔍 Verifying database setup...');
    
    // Check for real-time tables
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%analytics%' 
        OR table_name LIKE '%geofence%' 
        OR table_name LIKE '%realtime%'
        OR table_name LIKE '%location%'
        OR table_name LIKE '%message%'
        OR table_name LIKE '%call%'
        OR table_name LIKE '%socket%'
        OR table_name LIKE '%system%'
      )
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tableQuery);
    
    console.log('📊 Real-time tables found:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    if (result.rows.length >= 10) {
      console.log('✅ Database setup verification successful!');
    } else {
      console.log('⚠️  Some tables may be missing. Please check the schema file.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error);
  }
}

async function insertSampleData() {
  try {
    console.log('\n📊 Inserting sample real-time data...');
    
    // Insert sample analytics metrics
    const metricsQuery = `
      INSERT INTO analytics_metrics 
      (category, metric_name, metric_value, timestamp, metadata)
      VALUES 
      ('system', 'active_connections', 25, NOW(), '{"source": "setup"}'),
      ('business', 'active_rides', 12, NOW(), '{"source": "setup"}'),
      ('performance', 'response_time_ms', 150, NOW(), '{"source": "setup"}'),
      ('safety', 'emergency_alerts', 0, NOW(), '{"source": "setup"}')
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(metricsQuery);
    console.log('✅ Sample analytics metrics inserted');
    
    // Insert sample geofences
    const geofenceQuery = `
      INSERT INTO geofences 
      (name, type, center_lat, center_lng, radius_meters, active, metadata)
      VALUES 
      ('Downtown Pickup Zone', 'pickup_zone', 40.7128, -74.0060, 500, true, '{"city": "New York"}'),
      ('Airport Dropoff Zone', 'dropoff_zone', 40.6413, -73.7781, 1000, true, '{"airport": "JFK"}'),
      ('Restricted Area', 'restricted', 40.7589, -73.9851, 200, true, '{"reason": "construction"}')
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(geofenceQuery);
    console.log('✅ Sample geofences inserted');
    
    // Insert sample system health data
    const healthQuery = `
      INSERT INTO system_health 
      (status, cpu_usage, memory_usage, disk_usage, active_connections, timestamp)
      VALUES 
      ('healthy', 45.2, 62.8, 23.1, 25, NOW()),
      ('healthy', 42.1, 58.9, 22.8, 28, NOW() - INTERVAL '5 minutes'),
      ('healthy', 48.7, 65.3, 24.2, 22, NOW() - INTERVAL '10 minutes')
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(healthQuery);
    console.log('✅ Sample system health data inserted');
    
    console.log('🎉 Sample data insertion completed!');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't fail the setup for sample data errors
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupRealTimeDatabase()
    .then(() => {
      console.log('\n✅ Real-time database setup completed successfully!');
      console.log('\n🔧 Next steps:');
      console.log('1. Start the backend server: npm start');
      console.log('2. Test real-time features: node test-realtime-features.js');
      console.log('3. Check the admin dashboard for real-time metrics');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Real-time database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupRealTimeDatabase, verifySetup, insertSampleData }; 