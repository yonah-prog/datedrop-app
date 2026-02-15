const fs = require('fs');
const path = require('path');
const pool = require('../src/db');
require('dotenv').config();

async function runMigrations() {
  const schemaFile = path.join(__dirname, '001_initial_schema.sql');
  const sql = fs.readFileSync(schemaFile, 'utf8');

  try {
    console.log('Running database migrations...');
    await pool.query(sql);
    console.log('✓ Migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();
