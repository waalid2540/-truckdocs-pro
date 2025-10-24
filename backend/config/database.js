const { Pool } = require('pg');

// Create PostgreSQL connection pool (for Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Required for Render PostgreSQL
    } : false,
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

// Graceful error handling - log errors but don't crash server
pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    console.error('Database connection will be automatically retried by the pool');
    // TODO: Send alert to monitoring service (e.g., Sentry, LogRocket)
    // In production, you should implement proper error monitoring here
});

// Helper function to execute queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function to get a client from pool (for transactions)
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;

    // Set timeout of 5 seconds for transactions
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
    }, 5000);

    // Monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
    };

    client.release = () => {
        clearTimeout(timeout);
        // Reset query method
        client.query = query;
        client.release = release;
        return release.apply(client);
    };

    return client;
};

// Test database connection on startup
const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        console.error('Server will continue running but database operations will fail');
        return false;
    }
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection
};
