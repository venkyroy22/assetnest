const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Venkyroy%4022102004@lrjukybomzrjyrihzjgr.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

client.connect()
    .then(() => {
        console.log('Connected successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error', err.stack);
        process.exit(1);
    });
