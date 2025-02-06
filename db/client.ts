import { Pool, PoolConfig } from 'pg';

const dbConfig: PoolConfig = {
    user: process.env.DB_USER, 
    host: process.env.DB_HOST,     
    database: process.env.DB_DB, 
    password: process.env.DB_PASS, 
    port: 5432
  };
  
export const pool = new Pool(dbConfig);

export const connectDB =  async function() {
  try {
    await pool.connect();
    console.log('db connected..');
  }
  catch (err) {
      console.error(err);
      throw err;
  }
}

export const disconnectDB = async function() {
  try {
    await pool.end();
    console.log('db disconnected..');
  }
  catch (err) {
      console.error(err);
      throw err;
  }
}

 
  