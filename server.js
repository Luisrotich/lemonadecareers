const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only certain file types
        const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG files are allowed'));
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Add this after your middleware
const cors = require('cors');
app.use(cors()); // This allows requests from any origin


// Create applications table when server starts
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                position VARCHAR(100) NOT NULL,
                resume TEXT NOT NULL,
                phone VARCHAR(15),
                cover_letter TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Applications table created successfully');
        
        // Create table for file references
        await pool.query(`
            CREATE TABLE IF NOT EXISTS application_files (
                id SERIAL PRIMARY KEY,
                application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50),
                file_size INTEGER,
                category VARCHAR(50),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Application files table created successfully');
    } catch (err) {
        console.error('Error creating tables', err);
    }
}

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to Lemonade Careers');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Application submission with file uploads
app.post('/api/applications', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'cover_letter_file', maxCount: 1 },
    { name: 'additional_docs', maxCount: 3 }
]), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { name, email, phone, position, cover_letter } = req.body;
        const files = req.files;
        
        // Store resume path in applications table
        const resumePath = files.resume ? files.resume[0].path : null;
        
        // Insert application
        const applicationResult = await client.query(
            `INSERT INTO applications (name, email, phone, position, cover_letter, resume) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name, email, phone, position, cover_letter, resumePath]
        );
        
        const applicationId = applicationResult.rows[0].id;
        
        // Store file references
        if (files.resume) {
            await saveFileRecord(client, applicationId, files.resume[0], 'resume');
        }
        
        if (files.cover_letter_file) {
            await saveFileRecord(client, applicationId, files.cover_letter_file[0], 'cover_letter');
        }
        
        if (files.additional_docs) {
            for (const file of files.additional_docs) {
                await saveFileRecord(client, applicationId, file, 'additional');
            }
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            id: applicationId,
            message: 'Application submitted successfully' 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating application:', err);
        res.status(500).json({ error: 'Failed to submit application' });
    } finally {
        client.release();
    }
});

async function saveFileRecord(client, applicationId, file, category) {
    await client.query(
        `INSERT INTO application_files (application_id, file_name, file_path, file_type, file_size, category) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [applicationId, file.originalname, file.path, file.mimetype, file.size, category]
    );
}

// Get all applications with their files
app.get('/api/applications', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   json_agg(json_build_object(
                       'id', af.id,
                       'file_name', af.file_name,
                       'file_path', af.file_path,
                       'file_type', af.file_type,
                       'file_size', af.file_size,
                       'category', af.category
                   )) FILTER (WHERE af.id IS NOT NULL) as files
            FROM applications a
            LEFT JOIN application_files af ON a.id = af.application_id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// Get single application with files
app.get('/api/applications/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   json_agg(json_build_object(
                       'id', af.id,
                       'file_name', af.file_name,
                       'file_path', af.file_path,
                       'file_type', af.file_type,
                       'file_size', af.file_size,
                       'category', af.category
                   )) FILTER (WHERE af.id IS NOT NULL) as files
            FROM applications a
            LEFT JOIN application_files af ON a.id = af.application_id
            WHERE a.id = $1
            GROUP BY a.id
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching application:', err);
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});

// Update application status
app.patch('/api/applications/:id/status', async (req, res) => {
    const { status } = req.body;
    
    if (!['pending', 'reviewed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Delete application (will cascade delete files)
app.delete('/api/applications/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Get file paths before deletion
        const files = await client.query(
            'SELECT file_path FROM application_files WHERE application_id = $1',
            [req.params.id]
        );
        
        // Delete from database (cascades to application_files)
        const result = await client.query(
            'DELETE FROM applications WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Application not found' });
        }
        
        // Delete physical files
        for (const file of files.rows) {
            try {
                fs.unlinkSync(file.file_path);
            } catch (err) {
                console.error('Error deleting file:', file.file_path, err);
            }
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Application deleted successfully' });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting application:', err);
        res.status(500).json({ error: 'Failed to delete application' });
    } finally {
        client.release();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch(console.error);