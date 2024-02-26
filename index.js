const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// Enable CORS and Express JSON parsing
app.use(express.json());
app.use(cors());

// Set up MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log(`Connected to the database ${db.config.database}`);

  // Journal and Goals table creation queries
  const createJournalQuery = `
  CREATE TABLE IF NOT EXISTS journal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

  const createGoalsQuery = `
  CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT
  );`;

  // Create the journal table if it doesn't exist
  db.execute(createJournalQuery, (err, results) => {
    if (err) throw err;
    console.log("Journal table is ready");
  });

  // Create the goals table if it doesn't exist
  db.execute(createGoalsQuery, (err, results) => {
    if (err) throw err;
    console.log("Goals table is ready");
  });
});

//Routes for CRUD operations: Create, Read, Update, Delete

// Route to CREATE a journal entry
app.post("/entry", (req, res) => {
  // Get the title and content from the request body
  const { title, content } = req.body;

  // Setup the SQL query to insert a new journal entry
  const query = "INSERT INTO journal (title, content) VALUES (?, ?)";

  // Insert the new journal entry into the database using the query
  db.execute(query, [title, content], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Add failed" });
    } else {
      res.json({ success: true, message: "Entry added successfully" });
    }
  });
});

// Route to READ all journal entries
app.get("/entries", (req, res) => {
  // Setup the SQL query to retrieve all journal entries
  const query = "SELECT * FROM journal";

  // Retrieve all journal entries from the database using the query
  db.execute(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Retrieval failed" });
    } else {
      res.json({
        success: true,
        data: results,
        message: "Entries retrieved successfully",
      });
    }
  });
});

// Route to UPDATE a journal entry
app.put("/entry/:id", (req, res) => {
  // Get the id, title, and content from the request parameters and body
  const { id } = req.params;
  const { title, content } = req.body;

  // Setup the SQL query to update the journal entry
  const query = "UPDATE journal SET title = ?, content = ? WHERE id = ?";

  // Update the journal entry in the database using the query
  db.execute(query, [title, content, id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Update failed" });
    } else {
      res.json({ success: true, message: "Entry updated successfully" });
    }
  });
});

// Route to DELETE a journal entry
app.delete("/entry/:id", (req, res) => {
  // Get the id from the request parameters
  const { id } = req.params;

  // Setup the SQL query to delete the journal entry
  const query = "DELETE FROM journal WHERE id = ?";

  // Delete the journal entry from the database using the query
  db.execute(query, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Delete failed" });
    } else {
      res.json({ success: true, message: "Entry deleted successfully" });
    }
  });
});

//Routes for CRUD operations for goals: Create, Read, Update, Delete

// Route to CREATE a goal
app.post("/goal", (req, res) => {
  // Get the title and content from the request body
  const { title, content } = req.body;

  // Setup the SQL query to insert a new goal
  const query = "INSERT INTO goals (title, content) VALUES (?, ?)";

  // Insert the new goal into the database using the query
  db.execute(query, [title, content], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Add failed" });
    } else {
      res.json({ success: true, message: "Entry added successfully" });
    }
  });
});

// Route to READ all goals
app.get("/goals", (req, res) => {
  // Setup the SQL query to retrieve all goals
  const query = "SELECT * FROM goals";

  // Retrieve all goals from the database using the query
  db.execute(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Retrieval failed" });
    } else {
      res.json({
        success: true,
        data: results,
        message: "Entries retrieved successfully",
      });
    }
  });
});

// Route to UPDATE a goal
app.put("/goal/:id", (req, res) => {
  // Get the id, title, and content from the request parameters and body
  const { id } = req.params;
  const { title, content } = req.body;

  // Setup the SQL query to update the goal
  const query = "UPDATE goal SET title = ?, content = ? WHERE id = ?";

  // Update the goal in the database using the query
  db.execute(query, [title, content, id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Update failed" });
    } else {
      res.json({ success: true, message: "Entry updated successfully" });
    }
  });
});

// Route to DELETE a goal
app.delete("/entry/:id", (req, res) => {
  // Get the id from the request parameters
  const { id } = req.params;

  // Setup the SQL query to delete the goal
  const query = "DELETE FROM goal WHERE id = ?";

  // Delete the goal from the database using the query
  db.execute(query, [id], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Delete failed" });
    } else {
      res.json({ success: true, message: "Entry deleted successfully" });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
