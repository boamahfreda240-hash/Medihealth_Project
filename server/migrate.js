import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = './server.db';
if (!fs.existsSync(DB_PATH)) {
  const db = new Database(DB_PATH);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE patients (
      id TEXT PRIMARY KEY,
      name TEXT,
      age INTEGER,
      gender TEXT,
      bloodType TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      lastVisit TEXT,
      status TEXT,
      comments TEXT,
      tests TEXT,
      archived INTEGER DEFAULT 0,
      deleted_at TEXT
    );

    CREATE TABLE records (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      date TEXT,
      doctor TEXT,
      diagnosis TEXT,
      notes TEXT,
      comment TEXT,
      medications TEXT,
      vitals TEXT,
      archived INTEGER DEFAULT 0,
      FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE attachments (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      name TEXT,
      dataUrl TEXT,
      FOREIGN KEY(patientId) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);
  console.log('Database created at', DB_PATH);
  db.close();
} else {
  const db = new Database(DB_PATH);
  try {
    db.exec('ALTER TABLE patients ADD COLUMN deleted_at TEXT');
    console.log('Added deleted_at column to patients table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('deleted_at column already exists');
    } else {
      console.warn('Migration warning:', e.message);
    }
  }
  try {
    db.exec('ALTER TABLE records ADD COLUMN comment TEXT');
    console.log('Added comment column to records table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('comment column already exists');
    } else {
      console.warn('Migration warning:', e.message);
    }
  }
  try {
    db.exec('ALTER TABLE patients ADD COLUMN tests TEXT');
    console.log('Added tests column to patients table');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('tests column already exists');
    } else {
      console.warn('Migration warning:', e.message);
    }
  }
  db.close();
  console.log('Database migration completed at', DB_PATH);
}
