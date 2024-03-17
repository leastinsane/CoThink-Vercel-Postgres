import { Client } from 'pg';
import * as openai from './openai';

export const O_Keys = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })
  
const client = new Client({
  host: 'localhost',
  user: 'your_postgres_user',
  password: 'your_postgres_password',
  database: 'your_postgres_database',
  port: 5432,
});

client.connect();

openai.initialize({
  storage: {
    async get(key: string): Promise<string | null> {
      const result = await client.query('SELECT value FROM openai_keys WHERE key = $1', [key]);
      if (result.rowCount === 0) {
        return null;
      }
      return result.rows[0].value;
    },
    async set(key: string, value: string): Promise<void> {
      await client.query('INSERT INTO openai_keys (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
    },
    async delete(key: string): Promise<void> {
      await client.query('DELETE FROM openai_keys WHERE key = $1', [key]);
    },
  },
});