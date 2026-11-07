require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const flags = [
    { key: 'auth_google', enabled: true, note: 'Enable Google OAuth sign in' },
    { key: 'auth_github', enabled: true, note: 'Enable GitHub OAuth sign in' },
    { key: 'auth_discord', enabled: false, note: 'Enable Discord OAuth sign in' },
    { key: 'auth_twitter', enabled: false, note: 'Enable Twitter/X OAuth sign in' },
    { key: 'auth_linkedin', enabled: false, note: 'Enable LinkedIn OAuth sign in' },
    { key: 'auth_gitlab', enabled: false, note: 'Enable GitLab OAuth sign in' },
  ];

  for (const f of flags) {
    await pool.query(
      `INSERT INTO wisdomintech.feature_flags (flag_key, enabled, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (flag_key) DO UPDATE SET note = EXCLUDED.note`,
      [f.key, f.enabled, f.note]
    );
  }

  const { rows } = await pool.query(
    `SELECT flag_key, enabled, note FROM wisdomintech.feature_flags WHERE flag_key LIKE 'auth_%' ORDER BY flag_key`
  );
  console.log('Seeded auth flags:', rows);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
