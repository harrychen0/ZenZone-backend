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
  );`;

  const createGoalsQuery = `
  CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT
  );`;

  const createIntermediaryTableQuery = `
  CREATE TABLE IF NOT EXISTS entry_goals (
    entry_id INT,
    goal_id INT,
    PRIMARY KEY (entry_id, goal_id),
    FOREIGN KEY (entry_id) REFERENCES journal(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id)
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

  // Create the intermediary table if it doesn't exist
  db.execute(createIntermediaryTableQuery, (err, results) => {
    if (err) throw err;
    console.log("Intermediary table is ready");
  });
});

//Routes for CRUD operations: Create, Read, Update, Delete

// Route to CREATE a journal entry
// app.post("/entry", (req, res) => {
//   // Get the title and content from the request body
//   const { title, content } = req.body;

//   // Setup the SQL query to insert a new journal entry
//   const query = "INSERT INTO journal (title, content) VALUES (?, ?)";

//   // Insert the new journal entry into the database using the query
//   db.execute(query, [title, content], (err, results) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ success: false, message: "Add failed" });
//     } else {
//       res.json({ success: true, message: "Entry added successfully" });
//     }
//   });
// });

app.post("/entry", (req, res) => {
  // Get the title, content, and goals from the request body
  const { title, content, goals } = req.body;

  // Setup the SQL query to insert a new journal entry
  const insertEntryQuery = "INSERT INTO journal (title, content) VALUES (?, ?)";

  // Insert the new journal entry into the database using the query
  db.execute(insertEntryQuery, [title, content], (err, entryResult) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Entry creation failed" });
    } else {
      // Get the ID of the newly created entry and insert its associated goals into intermediary table
      const entryId = entryResult.insertId;
      const insertEntryGoalsQuery =
        "INSERT INTO entry_goals (entry_id, goal_id) VALUES ?";
      const values = goals.map((goalId) => [entryId, goalId]);

      // Insert associated goals into the intermediary table
      db.query(insertEntryGoalsQuery, [values], (err) => {
        if (err) {
          console.log(err);
          res
            .status(500)
            .json({ success: false, message: "Goal association failed" });
        } else {
          res.json({
            success: true,
            message: "Entry and goals associated successfully",
          });
        }
      });
    }
  });
});

// Route to READ all journal entries
// app.get("/entries", (req, res) => {
//   // Setup the SQL query to retrieve all journal entries
//   const query = "SELECT * FROM journal";

//   // Retrieve all journal entries from the database using the query
//   db.execute(query, (err, results) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ success: false, message: "Retrieval failed" });
//     } else {
//       res.json({
//         success: true,
//         data: results,
//         message: "Entries retrieved successfully",
//       });
//     }
//   });
// });

// Route to READ all journal entries with associated goals
app.get("/entries", (req, res) => {
  // Setup the SQL query to retrieve all journal entries
  const query = `
    SELECT j.*, GROUP_CONCAT(g.id) AS goal_ids, GROUP_CONCAT(g.title) AS goal_titles
    FROM journal j
    LEFT JOIN entry_goals eg ON j.id = eg.entry_id
    LEFT JOIN goals g ON eg.goal_id = g.id
    GROUP BY j.id;
  `;
  // Retrieve all journal entries from the database using the query
  db.query(query, (err, results) => {
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
// app.put("/entry/:id", (req, res) => {
//   // Get the id, title, and content from the request parameters and body
//   const { id } = req.params;
//   const { title, content } = req.body;

//   // Setup the SQL query to update the journal entry
//   const query = "UPDATE journal SET title = ?, content = ? WHERE id = ?";

//   // Update the journal entry in the database using the query
//   db.execute(query, [title, content, id], (err, results) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ success: false, message: "Update failed" });
//     } else {
//       res.json({ success: true, message: "Entry updated successfully" });
//     }
//   });
// });

// Route to UPDATE a journal entry and its associated goals
app.put("/entry/:id", (req, res) => {
  // Get the id, title, content, and goals from the request parameters and body
  const { id } = req.params;
  const { title, content, goals } = req.body;

  // Setup the SQL query to update the journal entry
  const updateEntryQuery =
    "UPDATE journal SET title = ?, content = ? WHERE id = ?";
  // Update the journal entry in the database using the query
  db.execute(updateEntryQuery, [title, content, id], (err) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Update failed" });
    } else {
      // Delete the existing goal associations
      const deleteEntryGoalsQuery =
        "DELETE FROM entry_goals WHERE entry_id = ?";
      db.execute(deleteEntryGoalsQuery, [id], (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            success: false,
            message: "Goal association deletion failed",
          });
        } else {
          // Insert the new goal associations
          const insertEntryGoalsQuery =
            "INSERT INTO entry_goals (entry_id, goal_id) VALUES ?";
          const values = goals.map((goalId) => [id, goalId]);
          db.query(insertEntryGoalsQuery, [values], (err) => {
            if (err) {
              console.log(err);
              res.status(500).json({
                success: false,
                message: "Goal association update failed",
              });
            } else {
              res.json({
                success: true,
                message: "Entry and goals updated successfully",
              });
            }
          });
        }
      });
    }
  });
});

// Route to DELETE a journal entry
// app.delete("/entry/:id", (req, res) => {
//   // Get the id from the request parameters
//   const { id } = req.params;

//   // Setup the SQL query to delete the journal entry
//   const query = "DELETE FROM journal WHERE id = ?";

//   // Delete the journal entry from the database using the query
//   db.execute(query, [id], (err, results) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ success: false, message: "Delete failed" });
//     } else {
//       res.json({ success: true, message: "Entry deleted successfully" });
//     }
//   });
// });

// Route to DELETE a journal entry and its associated goals
app.delete("/entry/:id", (req, res) => {
  // Get the id from the request parameters
  const { id } = req.params;

  // Setup the SQL query to delete the journal entry
  const deleteEntryQuery = "DELETE FROM journal WHERE id = ?";

  // Delete the journal entry from the database using the query
  db.execute(deleteEntryQuery, [id], (err) => {
    if (err) {
      console.log(err);
      res.status(500).json({ success: false, message: "Delete failed" });
    } else {
      // Delete the associated goals from the intermediary table
      const deleteEntryGoalsQuery =
        "DELETE FROM entry_goals WHERE entry_id = ?";
      db.execute(deleteEntryGoalsQuery, [id], (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            success: false,
            message: "Goal association deletion failed",
          });
        } else {
          res.json({
            success: true,
            message: "Entry and associated goals deleted successfully",
          });
        }
      });
    }
  });
});

//Routes for CRUD operations for goals: Create, Read, Update, Delete
//Goals are not associated with journal entries on creation, must be
//associated on journal entry page

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
app.delete("/goal/:id", (req, res) => {
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
