const express = require('express');
const router = express.Router();
const db = require('../database');
const preveriToken = require('../middleware/auth');

// Mock funkcija ki simulira Claude API branje letaka
function simulirajBranjeLetaka(trgovina) {
  const mock = {
    'hofer': [
      { izdelek: 'banane', cena: 1.20 },
      { izdelek: 'jagode', cena: 3.15 },
      { izdelek: 'mleko', cena: 0.99 },
      { izdelek: 'kruh', cena: 1.29 },
      { izdelek: 'jogurt', cena: 0.79 },
      { izdelek: 'maslo', cena: 2.49 },
      { izdelek: 'jajca', cena: 2.99 },
      { izdelek: 'sir', cena: 3.49 },
      { izdelek: 'piščanec', cena: 4.99 },
      { izdelek: 'moka', cena: 0.89 },
    ],
    'spar': [
      { izdelek: 'banane', cena: 1.49 },
      { izdelek: 'jagode', cena: 3.49 },
      { izdelek: 'sladoled', cena: 1.40 },
      { izdelek: 'mačja hrana', cena: 5.10 },
      { izdelek: 'mleko', cena: 1.09 },
      { izdelek: 'kruh', cena: 1.49 },
      { izdelek: 'jogurt', cena: 0.89 },
      { izdelek: 'maslo', cena: 2.79 },
      { izdelek: 'jajca', cena: 3.19 },
      { izdelek: 'sir', cena: 3.99 },
    ],
    'lidl': [
      { izdelek: 'banane', cena: 1.09 },
      { izdelek: 'jagode', cena: 2.99 },
      { izdelek: 'sladoled', cena: 1.69 },
      { izdelek: 'mačja hrana', cena: 4.79 },
      { izdelek: 'mleko', cena: 0.95 },
      { izdelek: 'kruh', cena: 1.19 },
      { izdelek: 'jogurt', cena: 0.75 },
      { izdelek: 'maslo', cena: 2.29 },
      { izdelek: 'jajca', cena: 2.79 },
      { izdelek: 'sir', cena: 3.29 },
    ]
  };
  return mock[trgovina.toLowerCase()] || [];
}

// Dodaj letak (mock)
router.post('/dodaj', preveriToken, (req, res) => {
  const { trgovina, veljaven_do } = req.body;
  if (!trgovina) return res.status(400).json({ napaka: 'Trgovina je obvezna' });

  db.run(
    'INSERT INTO letaki (trgovina, veljaven_do) VALUES (?, ?)',
    [trgovina, veljaven_do || null],
    function(err) {
      if (err) return res.status(500).json({ napaka: err.message });

      const letak_id = this.lastID;
      const cene = simulirajBranjeLetaka(trgovina);

      const stmt = db.prepare('INSERT INTO cene (letak_id, izdelek, cena) VALUES (?, ?, ?)');
      cene.forEach(c => stmt.run(letak_id, c.izdelek, c.cena));
      stmt.finalize();

      res.json({ 
        sporocilo: `Letak za ${trgovina} dodan!`, 
        id: letak_id,
        stevilo_artiklov: cene.length
      });
    }
  );
});

// Pridobi vse letake
router.get('/', preveriToken, (req, res) => {
  db.all('SELECT * FROM letaki ORDER BY ustvarjen DESC', [], (err, letaki) => {
    if (err) return res.status(500).json({ napaka: err.message });
    res.json(letaki);
  });
});

// Izračunaj najcenejše cene za listek
router.post('/izracunaj/:listek_id', preveriToken, (req, res) => {
  const { listek_id } = req.params;

  db.get(
    'SELECT * FROM listki WHERE id = ? AND uporabnik_id = ?',
    [listek_id, req.uporabnik.id],
    (err, listek) => {
      if (err || !listek) return res.status(404).json({ napaka: 'Listek ne obstaja' });

      db.all('SELECT * FROM izdelki WHERE listek_id = ?', [listek_id], (err, izdelki) => {
        if (err) return res.status(500).json({ napaka: err.message });

        const imenaMakelov = izdelki.map(i => i.ime);

        db.all(`
          SELECT c.izdelek, c.cena, l.trgovina 
          FROM cene c 
          JOIN letaki l ON c.letak_id = l.id
        `, [], (err, vseCene) => {
          if (err) return res.status(500).json({ napaka: err.message });

          const rezultat = {};
          let skupna_cena = 0;
          const trgovine_v_uporabi = new Set();

          imenaMakelov.forEach(ime => {
            const ujemanja = vseCene.filter(c => 
              c.izdelek.toLowerCase().includes(ime.toLowerCase()) ||
              ime.toLowerCase().includes(c.izdelek.toLowerCase())
            );

            if (!ujemanja.length) return;

            const dostopne = ujemanja.filter(c => 
              trgovine_v_uporabi.size < listek.max_trgovine || 
              trgovine_v_uporabi.has(c.trgovina)
            );

            const vir = dostopne.length ? dostopne : ujemanja;
            const najboljsa = vir.reduce((min, c) => c.cena < min.cena ? c : min);

            trgovine_v_uporabi.add(najboljsa.trgovina);
            if (!rezultat[najboljsa.trgovina]) rezultat[najboljsa.trgovina] = [];
            rezultat[najboljsa.trgovina].push({ 
              izdelek: ime, 
              cena: najboljsa.cena 
            });
            skupna_cena += najboljsa.cena;
          });

          db.run('UPDATE listki SET skupna_cena = ? WHERE id = ?', 
            [Math.round(skupna_cena * 100) / 100, listek_id]);

          res.json({
            listek: listek.ime,
            trgovine: rezultat,
            skupna_cena: Math.round(skupna_cena * 100) / 100,
            stevilo_trgovin: trgovine_v_uporabi.size
          });
        });
      });
    }
  );
});

module.exports = router;