/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const app = express();
const PORT = 3000;

// Set up directories relative to project working directory
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories and database file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial Database Seed
interface DbSchema {
  subjects: Array<{ id: string; name: string; code?: string; semesterId: number; createdAt: string }>;
  classworks: Array<{
    id: string;
    title: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    date: string;
    semesterId: number;
    subjectId: string;
    uploadedAt: string;
  }>;
}

const defaultSeed: DbSchema = {
  subjects: [
    { id: 'sub-m1', name: 'Mathematics I', code: 'MATH-101', semesterId: 1, createdAt: new Date().toISOString() },
    { id: 'sub-ic', name: 'Introduction to Computing', code: 'CS-101', semesterId: 1, createdAt: new Date().toISOString() },
    { id: 'sub-ds', name: 'Data Structures & Algorithms', code: 'CS-201', semesterId: 2, createdAt: new Date().toISOString() },
    { id: 'sub-dm', name: 'Discrete Mathematics', code: 'CS-202', semesterId: 2, createdAt: new Date().toISOString() },
    { id: 'sub-oop', name: 'Object Oriented Programming', code: 'CS-301', semesterId: 3, createdAt: new Date().toISOString() },
    { id: 'sub-dbms', name: 'Database Management Systems', code: 'CS-302', semesterId: 3, createdAt: new Date().toISOString() },
    { id: 'sub-os', name: 'Operating Systems', code: 'CS-401', semesterId: 4, createdAt: new Date().toISOString() },
    { id: 'sub-cn', name: 'Computer Networks', code: 'CS-402', semesterId: 4, createdAt: new Date().toISOString() },
    { id: 'sub-se', name: 'Software Engineering', code: 'CS-501', semesterId: 5, createdAt: new Date().toISOString() },
    { id: 'sub-ai', name: 'Artificial Intelligence', code: 'CS-502', semesterId: 5, createdAt: new Date().toISOString() },
    { id: 'sub-cd', name: 'Compiler Design', code: 'CS-601', semesterId: 6, createdAt: new Date().toISOString() },
    { id: 'sub-cc', name: 'Cloud Computing', code: 'CS-602', semesterId: 6, createdAt: new Date().toISOString() },
    { id: 'sub-ml', name: 'Machine Learning', code: 'CS-701', semesterId: 7, createdAt: new Date().toISOString() },
    { id: 'sub-is', name: 'Information Security', code: 'CS-702', semesterId: 7, createdAt: new Date().toISOString() },
    { id: 'sub-df', name: 'Digital Forensics', code: 'CS-801', semesterId: 8, createdAt: new Date().toISOString() },
    { id: 'sub-iot', name: 'Internet of Things', code: 'CS-802', semesterId: 8, createdAt: new Date().toISOString() },
  ],
  classworks: [],
};

function readDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultSeed, null, 2), 'utf-8');
    return defaultSeed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading DB, resetting to seed:', e);
    return defaultSeed;
  }
}

function writeDb(db: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Multer Config for Classwork File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Escape and clean file name to preserve safe path names
    const secureName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${secureName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum size limit
  },
});

app.use(express.json());

// API: Get all subjects (optional filtering by semester)
app.get('/api/subjects', (req, res) => {
  const db = readDb();
  let subjects = db.subjects;
  if (req.query.semesterId) {
    const semId = parseInt(req.query.semesterId as string, 10);
    subjects = subjects.filter((s) => s.semesterId === semId);
  }
  res.json(subjects);
});

// API: Create new subject folder
app.post('/api/subjects', (req, res) => {
  const { name, code, semesterId } = req.body;
  if (!name || !semesterId) {
    return res.status(400).json({ error: 'Name and semesterId are required.' });
  }

  const db = readDb();
  const newSubject = {
    id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    code: code ? code.trim() : undefined,
    semesterId: parseInt(semesterId, 10),
    createdAt: new Date().toISOString(),
  };

  db.subjects.push(newSubject);
  writeDb(db);
  res.status(201).json(newSubject);
});

// API: Delete subject folder and all of its classworks
app.delete('/api/subjects/:id', (req, res) => {
  const subjectId = req.params.id;
  const db = readDb();

  const initialSubjectLength = db.subjects.length;
  db.subjects = db.subjects.filter((s) => s.id !== subjectId);

  if (db.subjects.length === initialSubjectLength) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  // Also remove classworks belonging to this subject
  const remainingClassworks: Array<any> = [];
  const removedCount = db.classworks.length;

  for (const c of db.classworks) {
    if (c.subjectId === subjectId) {
      const fullPath = path.join(UPLOADS_DIR, c.filePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.error(`Failed to delete classwork file: ${fullPath}`, e);
        }
      }
    } else {
      remainingClassworks.push(c);
    }
  }

  db.classworks = remainingClassworks;
  writeDb(db);

  res.json({ message: 'Subject and associated files successfully annihilated.' });
});

// API: Get all classwork metadata (optional filtering by semester, subject, date)
app.get('/api/classworks', (req, res) => {
  const db = readDb();
  let classworks = db.classworks;

  if (req.query.semesterId) {
    const semId = parseInt(req.query.semesterId as string, 10);
    classworks = classworks.filter((c) => c.semesterId === semId);
  }
  if (req.query.subjectId) {
    classworks = classworks.filter((c) => c.subjectId === req.query.subjectId);
  }
  if (req.query.date) {
    classworks = classworks.filter((c) => c.date === req.query.date);
  }

  res.json(classworks);
});

// API: Create classwork with single file upload
app.post('/api/classworks', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file included in payload.' });
  }

  const { title, description, date, semesterId, subjectId } = req.body;

  if (!title || !date || !semesterId || !subjectId) {
    // Delete uploaded file if metadata request is invalid
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {}
    return res.status(400).json({ error: 'title, date, semesterId, and subjectId are required.' });
  }

  const db = readDb();
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

  const newClasswork = {
    id: `classwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: description || '',
    fileName: req.file.originalname,
    fileType: ext,
    fileSize: req.file.size,
    filePath: req.file.filename,
    date: date,
    semesterId: parseInt(semesterId, 10),
    subjectId,
    uploadedAt: new Date().toISOString(),
  };

  db.classworks.push(newClasswork);
  writeDb(db);

  res.status(201).json(newClasswork);
});

// API: Download/stream classwork file
app.get('/api/classworks/:id/download', (req, res) => {
  const db = readDb();
  const classwork = db.classworks.find((c) => c.id === req.params.id);

  if (!classwork) {
    return res.status(404).json({ error: 'Classwork not found.' });
  }

  const fileLoc = path.join(UPLOADS_DIR, classwork.filePath);

  if (!fs.existsSync(fileLoc)) {
    return res.status(404).json({ error: 'Physical classwork file missing from database storage.' });
  }

  // Set file download content headers
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(classwork.fileName)}"`);
  res.sendFile(fileLoc);
});

// API: Delete classwork
app.delete('/api/classworks/:id', (req, res) => {
  const db = readDb();
  const index = db.classworks.findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Classwork trace missing' });
  }

  const fileLoc = path.join(UPLOADS_DIR, db.classworks[index].filePath);
  if (fs.existsSync(fileLoc)) {
    try {
      fs.unlinkSync(fileLoc);
    } catch (e) {
      console.error(`Unlink failed: ${fileLoc}`, e);
    }
  }

  db.classworks.splice(index, 1);
  writeDb(db);

  res.json({ message: 'Classwork files safely deleted from storage.' });
});

// Setup Vite Development Mode / Production Static Serve Handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML entry in fallback route for Client SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Classwork Server Active] Live on: http://0.0.0.0:${PORT}`);
  });
}

startServer();
