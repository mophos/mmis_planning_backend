import * as express from 'express';
import BudgetSubTypeModel from '../models/budgetSubType';
const router = express.Router();

const subTypeModel = new BudgetSubTypeModel();

router.get('/', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await subTypeModel.getBudgetSubType(db);
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
    let rs: any = await subTypeModel.insertBudgetSubType(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/:subTypeId', async (req, res, next) => {
  let subTypeId = req.params.subTypeId;
  let data = req.body.data;
  let db = req.db;
  try {
    let rs: any = await subTypeModel.updateBudgetSubType(db, subTypeId, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.delete('/:subTypeId', async (req, res, next) => {
  let subTypeId = req.params.subTypeId;
  let db = req.db;
  try {
    let rs: any = await subTypeModel.deleteBudgetSubType(db, subTypeId);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;