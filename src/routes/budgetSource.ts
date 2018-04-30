import * as express from 'express';
import BudgetSourceModel from '../models/budgetSource';
const router = express.Router();

const budgetSourceModel = new BudgetSourceModel();

router.get('/', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await budgetSourceModel.getBudgetSource(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/', async (req, res, next) => {
  let data = req.body.data;
  let db = req.db;
  try {
    let rs: any = await budgetSourceModel.insertBudgetSource(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/:budgetSourceId', async (req, res, next) => {
  let budgetSourceId = req.params.budgetSourceId;
  let data = req.body.data;
  let db = req.db;
  try {
    let rs: any = await budgetSourceModel.updateBudgetSource(db, budgetSourceId, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.delete('/:budgetSourceId', async (req, res, next) => {
  let budgetSourceId = req.params.budgetSourceId;
  let db = req.db;
  try {
    let rs: any = await budgetSourceModel.deleteBudgetSource(db, budgetSourceId);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;