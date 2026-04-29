const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Registracija
router.post('/registracija', (req, res) => {
  const { uporabnisko_ime, email, geslo, kraj } = req.body;
  
  if (!uporabnisko_ime || !email || !geslo) {
    return res.status(400).json({ napaka: 'Vsa polja so obvezna' });
  }

  const hash = bcrypt.hashSync(geslo, 10);
  
  db.run(
    'INSERT INTO uporabniki (ime, email, geslo, kraj) VALUES (?, ?, ?, ?)',
    [uporabnisko_ime, email, hash, kraj],
    function(err) {
      if (err) return res.status(400).json({ napaka: 'Email ali uporabniško ime že obstaja' });
      res.json({ sporocilo: 'Registracija uspešna!', id: this.lastID });
    }
  );
});

// Prijava z emailom ali uporabniškim imenom
router.post('/prijava', (req, res) => {
  const { email, geslo } = req.body;

  // Preveri ali je email ali uporabniško ime
  const jeEmail = email.includes('@');
  const query = jeEmail 
    ? 'SELECT * FROM uporabniki WHERE email = ?'
    : 'SELECT * FROM uporabniki WHERE ime = ?';

  db.get(query, [email], (err, uporabnik) => {
    if (err || !uporabnik) return res.status(400).json({ napaka: 'Napačni podatki' });
    
    const veljavno = bcrypt.compareSync(geslo, uporabnik.geslo);
    if (!veljavno) return res.status(400).json({ napaka: 'Napačni podatki' });

    const token = jwt.sign(
      { id: uporabnik.id, email: uporabnik.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, ime: uporabnik.ime, email: uporabnik.email });
  });
});

module.exports = router;