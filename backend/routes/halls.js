const express = require('express');
const router = express.Router();
const Hall = require('../models/Hall');
const { requireAdmin } = require('../middleware/auth');

// Solo el ADMIN puede crear salas
router.post('/', checkRole(['admin']), hallController.create);

// El ADMIN y el CAJERO pueden ver las salas
router.get('/', checkRole(['admin', 'cajero']), hallController.getAll);

// GET all halls
router.get('/', async (req, res) => {
  try {
    const halls = await Hall.find().sort({ HallName: 1 });
    res.json(halls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single hall
router.get('/:id', async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(hall);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new hall
router.post('/', requireAdmin, async (req, res) => {
  try {
    const hall = new Hall(req.body);
    await hall.save();
    res.status(201).json(hall);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update hall
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const hall = await Hall.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json(hall);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE hall
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }
    res.json({ message: 'Hall deleted successfully', hall });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
