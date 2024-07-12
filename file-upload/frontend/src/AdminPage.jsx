import React, { useState } from 'react';
import { Container, Typography, MenuItem, Select, Button, Box, IconButton, List, ListItem, ListItemSecondaryAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExcelJS from 'exceljs';

const AdminPage = () => {
  const [dropdowns, setDropdowns] = useState({
    dropdown1: '',
    dropdown2: '',
    dropdown3: '',
    dropdown4: '',
    dropdown5: '',
  });

  const [files, setFiles] = useState([]);

  const handleDropdownChange = (e) => {
    setDropdowns({
      ...dropdowns,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  };

  const handleFileDelete = (fileToDelete) => {
    setFiles(files.filter((file) => file !== fileToDelete));
  };

  const handleBulkDelete = () => {
    setFiles([]);
  };

  const handleSubmitDropdowns = () => {
    fetch('http://localhost:3001/api/submit-dropdowns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dropdowns),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error('Error:', error));
  };

  const handleSubmitFiles = async () => {
    const formData = new FormData();
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        console.log(`Row ${rowNumber} = ${JSON.stringify(row.values)}`);
      });

      formData.append('files', file);
    }

    fetch('http://localhost:3001/api/upload-files', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error('Error:', error));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Page
      </Typography>
      {[...Array(5).keys()].map((i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <Select
            fullWidth
            value={dropdowns[`dropdown${i + 1}`]}
            name={`dropdown${i + 1}`}
            onChange={handleDropdownChange}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="Option1">Option1</MenuItem>
            <MenuItem value="Option2">Option2</MenuItem>
            <MenuItem value="Option3">Option3</MenuItem>
          </Select>
        </Box>
      ))}
      <Button variant="contained" onClick={handleSubmitDropdowns} sx={{ mb: 4 }}>
        Submit Dropdowns
      </Button>
      <Box sx={{ mb: 2 }}>
        <input type="file" multiple accept=".xlsx" onChange={handleFileUpload} />
      </Box>
      <List>
        {files.map((file, index) => (
          <ListItem key={index}>
            {file.name}
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="delete" onClick={() => handleFileDelete(file)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {files.length > 0 && (
        <>
          <Button variant="contained" onClick={handleBulkDelete} sx={{ mb: 2 }}>
            Delete All Files
          </Button>
          <Button variant="contained" onClick={handleSubmitFiles}>
            Upload Files
          </Button>
        </>
      )}
    </Container>
  );
};

export default AdminPage;
