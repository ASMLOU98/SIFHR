const pool = require('./db');
(async () => {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('DB OK', r.rows);
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR', err);
    process.exit(1);
  }
})();