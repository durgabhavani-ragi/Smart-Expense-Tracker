const Income = require('../models/Income');

const addIncome = async (req, res, next) => {
  try {
    const { source, description, amount, date } = req.body;

    if (!source || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide source and amount',
      });
    }

    const income = await Income.create({
      user: req.user._id,
      source,
      description,
      amount,
      date: date || new Date(),
    });

    res.status(201).json({ success: true, data: income });
  } catch (error) {
    next(error);
  }
};

const getIncomes = async (req, res, next) => {
  try {
    const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });
    res.json({ success: true, count: incomes.length, data: incomes });
  } catch (error) {
    next(error);
  }
};

module.exports = { addIncome, getIncomes };
