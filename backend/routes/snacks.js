const express = require('express');
const router = express.Router();

const SnackCategory = require('../models/SnackCategory');
const SnackProduct = require('../models/SnackProduct');
const SnackSale = require('../models/SnackSale');
const { requireAuth, requireAdminOrCajero, requireAdmin } = require('../middleware/auth');

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

router.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await SnackCategory.find().sort({ Name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const category = await SnackCategory.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const category = await SnackCategory.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const hasProducts = await SnackProduct.exists({ Category: req.params.id });
    if (hasProducts) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }
    const category = await SnackCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PRODUCTS ──────────────────────────────────────────────────────────────

router.get('/products', requireAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.Category = req.query.category;
    if (req.query.active !== undefined) filter.IsActive = req.query.active === 'true';
    const products = await SnackProduct.find(filter).populate('Category').sort({ Name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', requireAuth, async (req, res) => {
  try {
    const product = await SnackProduct.findById(req.params.id).populate('Category');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', requireAdmin, async (req, res) => {
  try {
    const product = await SnackProduct.create(req.body);
    const populated = await SnackProduct.findById(product._id).populate('Category');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/products/:id', requireAdminOrCajero, async (req, res) => {
  try {
    const product = await SnackProduct.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('Category');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const product = await SnackProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SALES ──────────────────────────────────────────────────────────────────

router.get('/sales', requireAdminOrCajero, async (req, res) => {
  try {
    const sales = await SnackSale.find()
      .populate('SoldBy', 'Username Email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', requireAdminOrCajero, async (req, res) => {
  try {
    const { Items, PaymentMethod, Notes, CustomerID } = req.body;

    if (!Items || Items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    let total = 0;
    const resolvedItems = [];

    for (const item of Items) {
      const product = await SnackProduct.findById(item.ProductID);
      if (!product || !product.IsActive) {
        return res.status(404).json({ error: `Product not found: ${item.ProductID}` });
      }
      if (product.Stock < item.Quantity) {
        return res.status(400).json({ error: `Stock insuficiente para: ${product.Name}` });
      }

      resolvedItems.push({
        ProductID: product._id,
        ProductName: product.Name,
        Quantity: item.Quantity,
        UnitPrice: product.Price
      });

      total += product.Price * item.Quantity;
      product.Stock -= item.Quantity;
      await product.save();
    }

    const sale = await SnackSale.create({
      Items: resolvedItems,
      TotalAmount: parseFloat(total.toFixed(2)),
      PaymentMethod: PaymentMethod || 'Cash',
      Status: 'COMPLETED',
      SoldBy: req.user._id,
      CustomerID: CustomerID || null,
      Notes: Notes || ''
    });

    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
