const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function setupAnalytics() {
  try {
    console.log('🚀 Setting up Analytics Database Schema...');
    
    // Read the analytics schema file
    const schemaPath = path.join(__dirname, '../analytics-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Skip if table already exists or other non-critical errors
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`⚠️  Skipped statement ${i + 1}/${statements.length} (already exists)`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}/${statements.length}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Analytics database schema setup completed!');
    
    // Insert some sample data for testing
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error setting up analytics:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function insertSampleData() {
  try {
    console.log('📊 Inserting sample analytics data...');
    
    // Insert sample driver performance metrics
    const driverMetricsQuery = `
      INSERT INTO driver_performance_metrics 
      (driver_id, period_type, period_start, period_end, total_rides, completed_rides, 
       total_earnings, average_rating, safety_score, emergency_alerts)
      VALUES 
      (1, 'daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 25, 23, 450.00, 4.8, 95, 0),
      (1, 'weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 120, 110, 2100.00, 4.7, 92, 1),
      (2, 'daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 30, 28, 520.00, 4.9, 98, 0),
      (2, 'weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 150, 140, 2800.00, 4.8, 95, 0)
      ON CONFLICT (driver_id, period_type, period_start) DO NOTHING
    `;
    
    await pool.query(driverMetricsQuery);
    console.log('✅ Sample driver performance data inserted');
    
    // Insert sample rider analytics
    const riderAnalyticsQuery = `
      INSERT INTO rider_analytics 
      (rider_id, period_type, period_start, period_end, total_rides, completed_rides, 
       total_spent, average_ride_cost, peak_usage_hours)
      VALUES 
      (1, 'daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 15, 14, 280.00, 20.00, '{"8": 3, "12": 4, "18": 5, "22": 3}'),
      (1, 'weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 60, 55, 1100.00, 20.00, '{"8": 12, "12": 16, "18": 20, "22": 12}'),
      (2, 'daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 20, 19, 380.00, 20.00, '{"9": 4, "13": 5, "19": 6, "23": 5}'),
      (2, 'weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 80, 75, 1500.00, 20.00, '{"9": 16, "13": 20, "19": 24, "23": 20}')
      ON CONFLICT (rider_id, period_type, period_start) DO NOTHING
    `;
    
    await pool.query(riderAnalyticsQuery);
    console.log('✅ Sample rider analytics data inserted');
    
    // Insert sample system performance metrics
    const systemMetricsQuery = `
      INSERT INTO system_performance_metrics 
      (period_type, period_start, period_end, total_rides, active_drivers, active_riders, 
       new_registrations, average_response_time_ms, safety_incidents, emergency_alerts)
      VALUES 
      ('daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 500, 45, 120, 15, 2500, 3, 1),
      ('weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 2500, 50, 150, 80, 2200, 12, 3),
      ('monthly', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE, 10000, 55, 200, 300, 2000, 45, 8)
      ON CONFLICT (period_type, period_start) DO NOTHING
    `;
    
    await pool.query(systemMetricsQuery);
    console.log('✅ Sample system performance data inserted');
    
    // Insert sample revenue analytics
    const revenueQuery = `
      INSERT INTO revenue_analytics 
      (period_type, period_start, period_end, gross_revenue, net_revenue, platform_fees, 
       driver_payouts, total_transactions, successful_transactions, average_transaction_value)
      VALUES 
      ('daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 10000.00, 8500.00, 1500.00, 7000.00, 500, 485, 20.00),
      ('weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 50000.00, 42500.00, 7500.00, 35000.00, 2500, 2425, 20.00),
      ('monthly', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE, 200000.00, 170000.00, 30000.00, 140000.00, 10000, 9700, 20.00)
      ON CONFLICT (period_type, period_start) DO NOTHING
    `;
    
    await pool.query(revenueQuery);
    console.log('✅ Sample revenue analytics data inserted');
    
    // Insert sample safety analytics
    const safetyQuery = `
      INSERT INTO safety_analytics 
      (period_type, period_start, period_end, total_incidents, resolved_incidents, 
       emergency_alerts, sos_alerts, panic_alerts, average_response_time_seconds)
      VALUES 
      ('daily', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 3, 2, 1, 1, 0, 45),
      ('weekly', CURRENT_DATE - INTERVAL '4 weeks', CURRENT_DATE, 12, 10, 3, 2, 1, 42),
      ('monthly', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE, 45, 40, 8, 5, 3, 38)
      ON CONFLICT (period_type, period_start) DO NOTHING
    `;
    
    await pool.query(safetyQuery);
    console.log('✅ Sample safety analytics data inserted');
    
    // Insert sample analytics events
    const eventsQuery = `
      INSERT INTO analytics_events 
      (event_type, event_category, user_id, user_type, ride_id, metadata)
      VALUES 
      ('ride_requested', 'ride', 1, 'rider', 1, '{"origin": "123 Main St", "destination": "456 Oak Ave"}'),
      ('ride_accepted', 'ride', 1, 'driver', 1, '{"response_time": 2500}'),
      ('ride_completed', 'ride', 1, 'rider', 1, '{"duration": 1800, "distance": 5.2, "cost": 25.00}'),
      ('payment_made', 'payment', 1, 'rider', 1, '{"amount": 25.00, "method": "credit_card"}'),
      ('sos_triggered', 'safety', 1, 'driver', 2, '{"location": {"lat": 40.7128, "lng": -74.0060}}'),
      ('user_registered', 'user', 3, 'rider', NULL, '{"registration_method": "email"}'),
      ('user_logged_in', 'user', 1, 'rider', NULL, '{"login_method": "email"}')
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(eventsQuery);
    console.log('✅ Sample analytics events inserted');
    
    console.log('🎉 Sample analytics data insertion completed!');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't throw error for sample data insertion
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupAnalytics()
    .then(() => {
      console.log('✅ Analytics setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analytics setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAnalytics, insertSampleData }; 