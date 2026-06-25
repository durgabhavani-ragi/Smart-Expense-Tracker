const Expense = require('../models/Expense');

const addExpense = async (req, res, next) => {
  try {
    const { title, description, amount, category, date } = req.body;

    if (!title || amount === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, and category',
      });
    }

    const expense = await Expense.create({
      user: req.user._id,
      title,
      description,
      amount,
      category,
      date: date || new Date(),
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const { title, description, amount, category, date } = req.body;

    if (title !== undefined) expense.title = title;
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;

    expense = await expense.save();

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted', data: expense });
  } catch (error) {
    next(error);
  }
};

module.exports = { addExpense, getExpenses, updateExpense, deleteExpense };
