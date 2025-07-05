const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
    try {
        const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir).sort();
        
        for (const file of migrationFiles) {
            if (file.endsWith('.sql')) {
                console.log(`Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                const { error } = await supabase.rpc('exec_sql', { sql });
                
                if (error) {
                    console.error(`Error applying ${file}:`, error);
                    throw error;
                }
                
                console.log(`✓ Applied ${file}`);
            }
        }
        
        console.log('All migrations applied successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

applyMigrations();