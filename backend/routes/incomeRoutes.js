const express = require('express');
const { protect } = require('../middleware/auth');
const { addIncome, getIncomes } = require('../controllers/incomeController');

const router = express.Router();

router.use(protect);

router.route('/').post(addIncome).get(getIncomes);

module.exports = router;
