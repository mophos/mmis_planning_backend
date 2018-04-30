import * as express from 'express';
import BudgetModel from '../models/budget';
import ReportModel from '../models/report';
import * as moment from 'moment';
const router = express.Router();

const budgetModel = new BudgetModel();
const reportModel = new ReportModel();

router.get('/detail/:budgetYear', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  try {
    let rs: any = await budgetModel.getBudgetDetail(db, budgetYear);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/detail', async (req, res, next) => {
  let db = req.db;
  let detail: any = req.body.budgetDetail;
  try {
    let _detail: any = {};
    _detail.bg_year = detail.budgetYear;
    _detail.bgtype_id = detail.budgetTypeId;
    _detail.bgtypesub_id = detail.budgetSubTypeId;
    _detail.od_date = detail.operationDate;
    _detail.bgsource_id = detail.budgetSourceId;
    _detail.amount = detail.budgetAmount;
    _detail.create_by = req.decoded.people_user_id;

    let rs: any = await budgetModel.insertBudgetDetail(db, _detail);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/detail/:budgetDetailId', async (req, res, next) => {
  let db = req.db;
  let budgetDetailId: any = req.params.budgetDetailId;
  let detail: any = req.body.budgetDetail;
  try {
    let _detail: any = {};
    _detail.bg_year = detail.budgetYear;
    _detail.bgtype_id = detail.budgetTypeId;
    _detail.bgtypesub_id = detail.budgetSubTypeId;
    _detail.od_date = detail.operationDate;
    _detail.bgsource_id = detail.budgetSourceId;
    _detail.amount = detail.budgetAmount;
    _detail.update_by = req.decoded.people_user_id;

    let rs: any = await budgetModel.updateBudgetDetail(db, budgetDetailId, _detail);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/approve', async (req, res, next) => {
  let db = req.db;
  let budgetDetailIds = req.body.budgetDetailIds;
  try {
    let _detail: any = {};
    _detail.status = 'APPROVE';
    _detail.update_by = req.decoded.people_user_id;
    await budgetModel.approveBudget(db, budgetDetailIds, _detail);
    res.send({ ok: true });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }

});

router.get('/year', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await budgetModel.getBudgetYear(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/total/:budgetYear', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  try {
    let rs: any = await budgetModel.getTotalBudget(db, budgetYear);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/sub-total/:budgetYear', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  try {
    let rs: any = await budgetModel.getTotalSubBudget(db, budgetYear);
    res.send({ ok: true, rows: rs[0] });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/transaction/:budgetYear/:budgetDetailId?', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  let budgetDetailId = req.params.budgetDetailId;
  try {
    let rs: any = await budgetModel.getBudgetTransaction(db, budgetYear, budgetDetailId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/list/:budgetYear', async (req, res, next) => {

  let budgetYear = req.params.budgetYear;
  let db = req.db;

  try {
    const rs: any = await budgetModel.getBudgetByYear(db, budgetYear);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.messgae });
  } finally {
    db.destroy();
  }
});

router.get('/report/sub-total', (req, res, next) => {
  let budgetYear = req.query.budgetYear;
  let db = req.db;

  budgetModel.sumAmountSubBudgetDetail(db, budgetYear)
    .then((results: any) => {
      moment.locale('th');
      let year = +(moment(budgetYear).get('year') + 543);
      let today = moment(new Date()).format('DD MMMM ') + (moment(new Date()).get('year') + 543);

      results[0].forEach(v => {
        v.bg_year = +(moment(v.bg_year).get('year') + 543);
        v.amount = reportModel.comma(v.amount);
        v.order_amt = reportModel.comma(v.order_amt);
        v.total = reportModel.comma(v.total);
        v.perUsed = reportModel.comma(v.perUsed);
      });

      res.render('budgetsubtypeReport', {
        today: today,
        year: year,
        results: results[0]
      })
    })
    .catch(error => {
      res.send({ ok: false, error: error })
    })
    .finally(() => {
      db.destroy();
    });
});

export default router;