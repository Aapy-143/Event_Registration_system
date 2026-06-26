require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Event Registration API is running." });
});

app.post("/api/events", (req, res) => {
  const { title, description, eventDate, location, seats } = req.body;

  if (!title || !description || !eventDate || !location || !seats) {
    return res.status(400).json({ success: false, message: "All event fields are required." });
  }

  const seatCount = Number(seats);
  if (!Number.isInteger(seatCount) || seatCount <= 0) {
    return res.status(400).json({ success: false, message: "Seats must be a positive number." });
  }

  const query = `
    INSERT INTO events (title, description, event_date, location, seats)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [title, description, eventDate, location, seatCount], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error while creating event." });
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      eventId: this.lastID
    });
  });
});

app.get("/api/events", (req, res) => {
  const query = `
    SELECT e.*, COUNT(r.id) AS registered_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    GROUP BY e.id
    ORDER BY e.event_date ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error while fetching events." });
    }

    res.json({ success: true, events: rows });
  });
});

app.get("/api/events/:id", (req, res) => {
  const eventId = req.params.id;

  const query = `
    SELECT e.*, COUNT(r.id) AS registered_count
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    WHERE e.id = ?
    GROUP BY e.id
  `;

  db.get(query, [eventId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error while fetching event." });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    res.json({ success: true, event: row });
  });
});

app.post("/api/register", (req, res) => {
  const { name, email, eventId } = req.body;

  if (!name || !email || !eventId) {
    return res.status(400).json({ success: false, message: "Name, email and event are required." });
  }

  db.get("SELECT * FROM events WHERE id = ?", [eventId], (eventErr, event) => {
    if (eventErr) {
      return res.status(500).json({ success: false, message: "Database error while checking event." });
    }

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    db.get(
      `SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status = 'registered'`,
      [eventId],
      (countErr, result) => {
        if (countErr) {
          return res.status(500).json({ success: false, message: "Database error while checking seats." });
        }

        if (result.count >= event.seats) {
          return res.status(400).json({ success: false, message: "No seats available for this event." });
        }

        db.run(
          `INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)`,
          [name, email],
          function (userErr) {
            if (userErr) {
              return res.status(500).json({ success: false, message: "Database error while creating user." });
            }

            db.get("SELECT id FROM users WHERE email = ?", [email], (findErr, user) => {
              if (findErr || !user) {
                return res.status(500).json({ success: false, message: "User could not be found." });
              }

              db.get(
                `SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status = 'registered'`,
                [user.id, eventId],
                (checkErr, existingRegistration) => {
                  if (checkErr) {
                    return res.status(500).json({ success: false, message: "Database error while checking registration." });
                  }

                  if (existingRegistration) {
                    return res.status(400).json({ success: false, message: "User is already registered for this event." });
                  }

                  db.run(
                    `INSERT INTO registrations (user_id, event_id) VALUES (?, ?)`,
                    [user.id, eventId],
                    function (regErr) {
                      if (regErr) {
                        return res.status(500).json({ success: false, message: "Database error while registering." });
                      }

                      res.status(201).json({
                        success: true,
                        message: "Registration successful.",
                        registrationId: this.lastID
                      });
                    }
                  );
                }
              );
            });
          }
        );
      }
    );
  });
});

app.get("/api/registrations", (req, res) => {
  const query = `
    SELECT r.id AS registration_id, r.status, r.registered_at,
           u.name, u.email,
           e.title AS event_title, e.event_date, e.location
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    JOIN events e ON r.event_id = e.id
    ORDER BY r.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error while fetching registrations." });
    }

    res.json({ success: true, registrations: rows });
  });
});

app.put("/api/registrations/:id/cancel", (req, res) => {
  const registrationId = req.params.id;

  db.run(
    `UPDATE registrations SET status = 'cancelled' WHERE id = ?`,
    [registrationId],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: "Database error while cancelling registration." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: "Registration not found." });
      }

      res.json({ success: true, message: "Registration cancelled successfully." });
    }
  );
});

app.listen(PORT, () => {
  console.log("-------------------------------------");
  console.log("Event Registration Server Running");
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/events`);
  console.log("-------------------------------------");
});
