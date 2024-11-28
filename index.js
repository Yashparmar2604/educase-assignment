const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

// Middleware for parsing JSON
app.use(bodyParser.json());

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost', // replace with your MySQL host
    user: 'root',      // replace with your MySQL username
    password: '', // replace with your MySQL password
    database: 'school_management'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// API: Add School
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validate the input data
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert the new school into the database
    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    connection.query(sql, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        res.status(200).json({ message: 'School added successfully', id: result.insertId });
    });
});

// API: List Schools sorted by proximity
app.get('/listSchools', (req, res) => {
    const lat=req.query.latitude;
    const lon=req.query.longitude;
   

    // Validate user location
   if (!lat || !lon) {
        return res.status(400).json({ error: 'User latitude and longitude are required.' });
    }

    // Fetch all schools from the database
    const sql = 'SELECT * FROM schools';
    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }

        //Sort schools by proximity to user location
       results.forEach((school) => {
           school.distance = calculateDistance(lat, lon ,school.latitude, school.longitude);
       });

        // Sort schools by distance
        results.sort((a, b) => a.distance - b.distance);

        res.status(200).json(results);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
