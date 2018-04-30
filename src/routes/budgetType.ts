import * as express from 'express';
import BudgetTypeModel from '../models/budgetType';
const router = express.Router();

const budgetTypeModel = new BudgetTypeModel();

router.get('/', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await budgetTypeModel.getBudgetType(db);
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
    let rs: any = await budgetTypeModel.insertBudgetType(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/:typeId', async (req, res, next) => {
  let typeId = req.params.typeId;
  let data = req.body.data;
  let db = req.db;
  try {
    let rs: any = await budgetTypeModel.updateBudgetType(db, typeId, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.delete('/:typeId', async (req, res, next) => {
  let typeId = req.params.typeId;
  let db = req.db;
  try {
    let rs: any = await budgetTypeModel.deleteBudgetType(db, typeId);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;