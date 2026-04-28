const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Registracija
router.post('/registracija', (req, res) => {
  const { ime, email, geslo, kraj } = req.body;
  
  if (!ime || !email || !geslo) {
    return res.status(400).json({ napaka: 'Vsa polja so obvezna' });
  }

  const hash = bcrypt.hashSync(geslo, 10);
  
  db.run(
    'INSERT INTO uporabniki (ime, email, geslo, kraj) VALUES (?, ?, ?, ?)',
    [ime, email, hash, kraj],
    function(err) {
      if (err) return res.status(400).json({ napaka: 'Email že obstaja' });
      res.json({ sporocilo: 'Registracija uspešna!', id: this.lastID });
    }
  );
});

// Prijava
router.post('/prijava', (req, res) => {
  const { email, geslo } = req.body;

  db.get('SELECT * FROM uporabniki WHERE email = ?', [email], (err, uporabnik) => {
    if (err || !uporabnik) return res.status(400).json({ napaka: 'Napačen email ali geslo' });
    
    const veljavno = bcrypt.compareSync(geslo, uporabnik.geslo);
    if (!veljavno) return res.status(400).json({ napaka: 'Napačen email ali geslo' });

    const token = jwt.sign(
      { id: uporabnik.id, email: uporabnik.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, ime: uporabnik.ime, email: uporabnik.email });
  });
});

module.exports = router;