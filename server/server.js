import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';

const db = new Database('./server.db');
const app = express();
const upload = multer();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Patients (exclude deleted patients)
app.get('/api/patients', (req, res) => {
  const stmt = db.prepare('SELECT * FROM patients WHERE archived = 0 AND deleted_at IS NULL');
  const rows = stmt.all();
  rows.forEach(r => {
    r.attachments = [];
    if (r.tests) r.tests = JSON.parse(r.tests);
  });
  res.json(rows);
});

// All patients (including deleted, for exports/audit)
app.get('/api/patients/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients WHERE deleted_at IS NULL').all();
  rows.forEach(r => {
    if (r.tests) r.tests = JSON.parse(r.tests);
  });
  res.json(rows);
});

// Include deleted patients
app.get('/api/patients/include-deleted/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients').all();
  rows.forEach(r => {
    if (r.tests) r.tests = JSON.parse(r.tests);
  });
  res.json(rows);
});

app.post('/api/patients', (req, res) => {
  const p = req.body;
  const stmt = db.prepare(`INSERT INTO patients (id,name,age,gender,bloodType,email,phone,address,lastVisit,status,comments,tests,archived) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const commentsValue = (p.comments && typeof p.comments === 'string' && p.comments.trim()) ? p.comments.trim() : null;
  stmt.run(p.id,p.name,p.age,p.gender,p.bloodType,p.email,p.phone,p.address,p.lastVisit,p.status,commentsValue, p.tests ? JSON.stringify(p.tests) : null, p.archived ? 1 : 0);
  // attachments
  if (Array.isArray(p.attachments)) {
    const aStmt = db.prepare('INSERT INTO attachments (id,patientId,name,dataUrl) VALUES (?,?,?,?)');
    const trans = db.transaction((at) => {
      for (const att of at) aStmt.run(att.id, p.id, att.name, att.dataUrl);
    });
    trans(p.attachments);
  }
  res.json({ ok: true });
});

app.put('/api/patients/:id/archive', (req, res) => {
  const id = req.params.id;
  db.prepare('UPDATE patients SET archived = 1 WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  const id = req.params.id;
  const u = req.body;
  const updates = [];
  const values = [];
  
  if (u.name !== undefined) { updates.push('name = ?'); values.push(u.name); }
  if (u.age !== undefined) { updates.push('age = ?'); values.push(u.age); }
  if (u.gender !== undefined) { updates.push('gender = ?'); values.push(u.gender); }
  if (u.bloodType !== undefined) { updates.push('bloodType = ?'); values.push(u.bloodType); }
  if (u.email !== undefined) { updates.push('email = ?'); values.push(u.email); }
  if (u.phone !== undefined) { updates.push('phone = ?'); values.push(u.phone); }
  if (u.address !== undefined) { updates.push('address = ?'); values.push(u.address); }
  if (u.status !== undefined) { updates.push('status = ?'); values.push(u.status); }
  if (u.comments !== undefined) { updates.push('comments = ?'); values.push(u.comments || null); }
  if (u.tests !== undefined) { updates.push('tests = ?'); values.push(u.tests ? JSON.stringify(u.tests) : null); }
  
  if (updates.length > 0) {
    values.push(id);
    const sql = `UPDATE patients SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
  }
  
  res.json({ ok: true });
});

// Soft-delete patient (hide but keep records for audit/export)
app.delete('/api/patients/:id', (req, res) => {
  const id = req.params.id;
  const now = new Date().toISOString();
  db.prepare('UPDATE patients SET deleted_at = ? WHERE id = ?').run(now, id);
  res.json({ ok: true });
});

// Records
app.get('/api/patients/:id/records', (req,res) => {
  const rows = db.prepare('SELECT * FROM records WHERE patientId = ?').all(req.params.id);
  res.json(rows.map(r => ({...r, medications: r.medications ? r.medications.split('|') : []}))); 
});

app.post('/api/patients/:id/records', (req,res) => {
  const id = req.params.id;
  const r = req.body;
  db.prepare('INSERT INTO records (id,patientId,date,doctor,diagnosis,notes,comment,medications,vitals,archived) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(r.id, id, r.date, r.doctor, r.diagnosis, r.notes, r.comment || null, (r.medications||[]).join('|'), r.vitals ? JSON.stringify(r.vitals) : null, r.archived ? 1 : 0);
  res.json({ ok: true });
});

app.put('/api/patients/:id/records/:rid/archive', (req,res) => {
  db.prepare('UPDATE records SET archived = 1 WHERE id = ? AND patientId = ?').run(req.params.rid, req.params.id);
  res.json({ ok: true });
});

// Attachments download
app.get('/api/patients/:id/attachments', (req,res) => {
  const rows = db.prepare('SELECT id,name,dataUrl FROM attachments WHERE patientId = ?').all(req.params.id);
  res.json(rows);
});

// Export all records (including deleted patients) for CSV
app.get('/api/export/records', (req,res) => {
  const patients = db.prepare('SELECT * FROM patients').all();
  const records = db.prepare('SELECT * FROM records').all();
  const merged = patients.flatMap(p => 
    records.filter(r => r.patientId === p.id).map(r => ({
      patientId: p.id,
      patientName: p.name,
      recordId: r.id,
      date: r.date,
      doctor: r.doctor,
      diagnosis: r.diagnosis,
      notes: r.notes,
      comment: r.comment,
      medications: r.medications,
      archived: r.archived,
      patientDeleted: p.deleted_at ? 1 : 0
    }))
  );
  res.json(merged);
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log('Server listening on', PORT));
