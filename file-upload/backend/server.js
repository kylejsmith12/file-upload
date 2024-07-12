const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const ExcelJS = require('exceljs');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'file-upload',
  password: 'postgres',
  port: 5432,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set upload destination
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Set unique filename
  }
});

const upload = multer({ storage: storage });

app.post('/api/submit-dropdowns', async (req, res) => {
  const { dropdown1, dropdown2, dropdown3, dropdown4, dropdown5 } = req.body;

  try {
    await pool.query(
      'INSERT INTO dropdowns (dropdown1, dropdown2, dropdown3, dropdown4, dropdown5) VALUES ($1, $2, $3, $4, $5)',
      [dropdown1, dropdown2, dropdown3, dropdown4, dropdown5]
    );
    res.status(200).json({ message: 'Dropdowns submitted successfully' });
  } catch (error) {
    console.error('Error submitting dropdowns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upload-files', upload.array('files'), async (req, res) => {
  const files = req.files;
  const filePromises = files.map(async (file) => {
    const filePath = file.path; // Get file path
    const workbook = new ExcelJS.Workbook();
    
    try {
      await workbook.xlsx.readFile(filePath); // Read Excel file
      const worksheet = workbook.getWorksheet(1);
      const rows = [];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) { // Skip header row
          const rowData = {
            dropdown1: row.getCell(1).value,
            dropdown2: row.getCell(2).value,
            dropdown3: row.getCell(3).value,
            dropdown4: row.getCell(4).value,
            dropdown5: row.getCell(5).value,
          };
          rows.push(rowData);
        }
      });

      // Insert rows into database
      await Promise.all(rows.map(async (rowData) => {
        try {
          await pool.query(
            'INSERT INTO dropdowns (dropdown1, dropdown2, dropdown3, dropdown4, dropdown5) VALUES ($1, $2, $3, $4, $5)',
            [rowData.dropdown1, rowData.dropdown2, rowData.dropdown3, rowData.dropdown4, rowData.dropdown5]
          );
        } catch (error) {
          console.error('Error inserting row:', error);
        }
      }));

      return {
        fileName: file.originalname,
        rowCount: rows.length,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    } finally {
      // Delete the uploaded file after processing
      fs.unlinkSync(filePath);
    }
  });

  Promise.all(filePromises)
    .then((results) => {
      console.log('Files uploaded and processed:', results);
      res.status(200).json({ message: 'Files uploaded and processed', results });
    })
    .catch((error) => {
      console.error('Error processing files:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
