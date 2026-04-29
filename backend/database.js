const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./koskarica.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Baza povezana!');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS uporabniki (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ime TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    geslo TEXT NOT NULL,
    kraj TEXT,
    ustvarjen DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS listki (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uporabnik_id INTEGER NOT NULL,
  ime TEXT NOT NULL,
  status TEXT DEFAULT 'aktiven',
  skupna_cena REAL,
  skupni_prihranek REAL DEFAULT 0,
  max_trgovine INTEGER DEFAULT 2,
  max_km INTEGER DEFAULT 5,
  potece DATETIME,
  ustvarjen DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uporabnik_id) REFERENCES uporabniki(id)
)`);

  db.run(`CREATE TABLE IF NOT EXISTS izdelki (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listek_id INTEGER NOT NULL,
    ime TEXT NOT NULL,
    cena REAL,
    trgovina TEXT,
    FOREIGN KEY (listek_id) REFERENCES listki(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS letaki (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trgovina TEXT NOT NULL,
    veljaven_do DATE,
    ustvarjen DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cene (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letak_id INTEGER NOT NULL,
  izdelek TEXT NOT NULL,
  cena REAL NOT NULL,
  redna_cena REAL,
  FOREIGN KEY (letak_id) REFERENCES letaki(id)
  )`);
});

module.exports = db;