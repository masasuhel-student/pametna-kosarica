const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');

// Middleware za preverjanje tokena
function preveriToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ napaka: 'Ni tokena' });
  
  try {
    req.uporabnik = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ napaka: 'Neveljaven token' });
  }
}

// Ustvari nov listek
router.post('/', preveriToken, (req, res) => {
  const { ime, izdelki, max_trgovine, max_km } = req.body;
  
  if (!ime) return res.status(400).json({ napaka: 'Ime listka je obvezno' });

  db.run(
    'INSERT INTO listki (uporabnik_id, ime, max_trgovine, max_km) VALUES (?, ?, ?, ?)',
    [req.uporabnik.id, ime, max_trgovine || 2, max_km || 5],
    function(err) {
      if (err) return res.status(500).json({ napaka: err.message });
      
      const listek_id = this.lastID;

      if (!izdelki || !izdelki.length) {
        return res.json({ sporocilo: 'Listek ustvarjen!', id: listek_id });
      }

      const stmt = db.prepare('INSERT INTO izdelki (listek_id, ime) VALUES (?, ?)');
      izdelki.forEach(izdelek => stmt.run(listek_id, izdelek));
      stmt.finalize();

      res.json({ sporocilo: 'Listek ustvarjen!', id: listek_id });
    }
  );
});

// Pridobi vse listke uporabnika
router.get('/', preveriToken, (req, res) => {
  db.all(
    'SELECT * FROM listki WHERE uporabnik_id = ? ORDER BY ustvarjen DESC',
    [req.uporabnik.id],
    (err, listki) => {
      if (err) return res.status(500).json({ napaka: err.message });
      res.json(listki);
    }
  );
});

// Pridobi en listek z izdelki
router.get('/:id', preveriToken, (req, res) => {
  db.get(
    'SELECT * FROM listki WHERE id = ? AND uporabnik_id = ?',
    [req.params.id, req.uporabnik.id],
    (err, listek) => {
      if (err || !listek) return res.status(404).json({ napaka: 'Listek ne obstaja' });
      
      db.all(
        'SELECT * FROM izdelki WHERE listek_id = ?',
        [listek.id],
        (err, izdelki) => {
          res.json({ ...listek, izdelki });
        }
      );
    }
  );
});

// Izbriši listek
router.delete('/:id', preveriToken, (req, res) => {
  db.run(
    'DELETE FROM listki WHERE id = ? AND uporabnik_id = ?',
    [req.params.id, req.uporabnik.id],
    function(err) {
      if (err) return res.status(500).json({ napaka: err.message });
      res.json({ sporocilo: 'Listek izbrisan!' });
    }
  );
});

module.exports = router;