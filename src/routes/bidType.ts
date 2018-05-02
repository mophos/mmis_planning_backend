import * as express from 'express';
import BidTypeModel from '../models/bidType';
const router = express.Router();

const bidTypeModel = new BidTypeModel();

router.get('/', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await bidTypeModel.getBidType(db);
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
    let rs: any = await bidTypeModel.insertBidType(db, data);
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
    let rs: any = await bidTypeModel.updateBidType(db, typeId, data);
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
    let rs: any = await bidTypeModel.deleteBidType(db, typeId);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/:typeId/default', async (req, res, next) => {
  let typeId = req.params.typeId;
  let db = req.db;
  try {
    await bidTypeModel.updateNonDefault(db);
    let rs: any = await bidTypeModel.updateBidType(db, typeId, { 'isdefault': 'Y' });
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;