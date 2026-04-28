const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = require('./database');

app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.json({ sporocilo: 'Pametna košarica API deluje!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Strežnik teče na portu ${PORT}`);
});

app.use('/api/listki', require('./routes/listki'));
app.use('/api/letaki', require('./routes/letaki'));