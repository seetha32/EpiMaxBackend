// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err);
    } else {
        console.log('Connected to the database');
    }
});

// Use body-parser middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});
//app.use(bodyParser.json());

// Define routes

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    console.log('Server is shutting down...');
    server.close(() => {
        console.log('Server is stopped.');
        db.close((err) => {
            if (err) {
                console.error('Failed to close the database connection:', err);
            } else {
                console.log('Database connection closed.');
                process.exit(0);
            }
        });
    });
});

// Create Users table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password_hash TEXT
    )`);
    
    // Create Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS Tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        status TEXT,
        assignee_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(assignee_id) REFERENCES Users(id)
    )`);
});
app.post('/tasks', (req, res) => {
    const { title, description, status, assignee_id } = req.body;
    const sql = `INSERT INTO Tasks (title, description, status, assignee_id) VALUES (?, ?, ?, ?)`;
    db.run(sql, [title, description, status, assignee_id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Send a success response
        res.status(201).json({ message: 'Task created successfully', taskId: this.lastID });
    });
});

// Implementation for retrieving all tasks
app.get('/tasks', (req, res) => {
    const sql = `SELECT * FROM Tasks`;

    // Execute the SQL query
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows); // Send the retrieved tasks as JSON response
    });
});

// Implementation for retrieving a specific task by ID
app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = `SELECT * FROM Tasks WHERE id = ?`;

    // Execute the SQL query with taskId as parameter
    db.get(sql, [taskId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(row); // Send the retrieved task as JSON response
    });
});

// Implementation for updating a specific task by ID
app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status, assignee_id } = req.body;
    const sql = `
        UPDATE Tasks
        SET title = ?, description = ?, status = ?, assignee_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    // Execute the SQL query with task data and taskId as parameters
    db.run(sql, [title, description, status, assignee_id, taskId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    });
});

// Implementation for deleting a specific task by ID
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = 'DELETE FROM Tasks WHERE id = ?';

    // Execute the SQL query with taskId as a parameter
    db.run(sql, taskId, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});


module.exports= app;