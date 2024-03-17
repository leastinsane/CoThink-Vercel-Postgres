import { OpenAI } from 'openai';
import * as pg from 'pg';
import { PgVector } from 'pg-vector';

const config = {
  user: 'your_postgres_user',
  host: 'your_postgres_host',
  database: 'your_postgres_database',
  password: 'your_postgres_password',
  port: 5432,
};

const pool = new pg.Pool(config);
const vector = new PgVector(pool);

async function createTable() {
  const res = await pool.query(`
    CREATE TABLE IF NOT EXISTS embeddings (
      id SERIAL PRIMARY KEY,
      url TEXT,
      title TEXT,
      content TEXT,
      embedding VECTOR(1536),
      UNIQUE (url)
    );
  `);
}

createTable();

async function insertEmbedding(url: string, title: string, content: string, embedding: number[]) {
  const res = await pool.query(
    'INSERT INTO embeddings (url, title, content, embedding) VALUES ($1, $2, $3, $4) ON CONFLICT (url) DO UPDATE SET embedding = $4;',
    [url, title, content, embedding]
  );
}

async function getEmbedding(url: string) {
  const res = await pool.query('SELECT embedding FROM embeddings WHERE url = $1;', [url]);
  return res.rows[0].embedding;
}

async function analyzeWebProgress(query: string) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Get embeddings for query
  const queryEmbedding = await openai.createEmbedding({
    input: query,
    model: 'text-embedding-ada-002',
  });

  // Get top5 similar embeddings from database
  const res = await pool.query(
    `
    SELECT url, title, similarity($1, embedding) as similarity
    FROM embeddings
    ORDER BY similarity DESC
    LIMIT 5;
    `,
    [queryEmbedding.data[0].embedding]
  );

  // Return results
  return res.rows.map((row) => ({
    url: row.url,
    title: row.title,
    similarity: row.similarity,
  }));
}

export { insertEmbedding, getEmbedding, analyzeWebProgress };