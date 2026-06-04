import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'hospital.db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
let db;
async function initDb() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create bookings table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      patient_area TEXT NOT NULL,
      patient_phone TEXT NOT NULL,
      date TEXT NOT NULL,
      department TEXT NOT NULL,
      row_number INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      booking_type TEXT NOT NULL, -- 'Online' or 'Physical'
      price_paid INTEGER NOT NULL, -- 100 for Online, 0 for Physical
      timestamp TEXT NOT NULL,
      transaction_id TEXT
    )
  `);

  console.log(`SQLite Database initialized at ${dbPath}`);
}

// Map database row (snake_case) to client booking (camelCase)
function mapRowToBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientName: row.patient_name,
    patientArea: row.patient_area,
    patientPhone: row.patient_phone,
    date: row.date,
    department: row.department,
    rowNumber: row.row_number,
    slotNumber: row.slot_number,
    bookingType: row.booking_type,
    pricePaid: row.price_paid,
    timestamp: row.timestamp,
    transactionId: row.transaction_id,
  };
}

// REST API Routes

// 1. Get bookings (all or filtered by date & department)
app.get('/api/bookings', async (req, res) => {
  const { date, department } = req.query;

  try {
    let rows;
    if (date && department) {
      rows = await db.all(
        'SELECT * FROM bookings WHERE date = ? AND department = ?',
        [date, department]
      );
    } else {
      // Get all bookings, sorted by latest booking date first
      rows = await db.all(
        'SELECT * FROM bookings ORDER BY timestamp DESC LIMIT 150'
      );
    }
    const bookings = rows.map(mapRowToBooking);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 1b. Get specific bookings by a list of comma-separated IDs (for local device appointments history)
app.get('/api/bookings/user-list', async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.json([]);
  }

  const idArray = ids.split(',').filter(id => id.trim().length > 0);
  if (idArray.length === 0) {
    return res.json([]);
  }

  try {
    const placeholders = idArray.map(() => '?').join(',');
    const rows = await db.all(
      `SELECT * FROM bookings WHERE id IN (${placeholders})`,
      idArray
    );
    const bookings = rows.map(mapRowToBooking);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user-list bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Book a slot
app.post('/api/bookings', async (req, res) => {
  const {
    patientName,
    patientArea,
    patientPhone,
    date,
    department,
    rowNumber,
    slotNumber,
    bookingType,
    pricePaid,
    transactionDetails,
  } = req.body;

  // Enforce validation
  if (!patientName || !patientArea || !patientPhone || !date || !department || !rowNumber || !slotNumber || !bookingType) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  try {
    // Check if slot is already occupied
    const existing = await db.get(
      'SELECT id FROM bookings WHERE date = ? AND department = ? AND row_number = ? AND slot_number = ?',
      [date, department, rowNumber, slotNumber]
    );

    if (existing) {
      return res.status(409).json({ error: 'This seat/slot is already booked. Please choose another slot.' });
    }

    // Verify Walk-in Slot restriction for online bookings
    const isWalkInSlot = [2, 4, 6].includes(Number(slotNumber));
    if (isWalkInSlot && bookingType === 'Online') {
      return res.status(403).json({ error: 'Slots 2, 4, and 6 are reserved for physical walk-ins only.' });
    }

    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();
    const transactionId = transactionDetails?.transactionId || null;

    // Insert booking
    await db.run(
      `INSERT INTO bookings (
        id, patient_name, patient_area, patient_phone, date, department, row_number, slot_number, booking_type, price_paid, timestamp, transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        patientName,
        patientArea,
        patientPhone,
        date,
        department,
        rowNumber,
        slotNumber,
        bookingType,
        pricePaid,
        timestamp,
        transactionId,
      ]
    );

    const createdBooking = {
      id: bookingId,
      patientName,
      patientArea,
      patientPhone,
      date,
      department,
      rowNumber,
      slotNumber,
      bookingType,
      pricePaid,
      timestamp,
      transactionId,
    };

    console.log(`Successfully booked slot: ${bookingId} - Row ${rowNumber}, Slot ${slotNumber} (${bookingType})`);
    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal database insertion error' });
  }
});

// 3. Cancel a booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT id FROM bookings WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Booking reservation not found' });
    }

    await db.run('DELETE FROM bookings WHERE id = ?', [id]);
    console.log(`Cancelled booking: ${id}`);
    res.json({ success: true, message: `Booking reservation ${id} cancelled successfully` });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Internal database deletion error' });
  }
});

// Start Server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`E-Hospital Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start database & server:', err);
  });
