const express = require('express');
const { protect } = require('../middleware/auth');
const {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const router = express.Router();

router.use(protect);

router.route('/').post(addExpense).get(getExpenses);
router.route('/:id').put(updateExpense).patch(updateExpense).delete(deleteExpense);

module.exports = router;
