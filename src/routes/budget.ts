import * as express from 'express';
import BudgetModel from '../models/budget';
import ReportModel from '../models/report';
import * as moment from 'moment';
import * as json2xls from 'json2xls';
import * as co from 'co-express';
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

router.get('/export/:budgetYear', async (req, res, next) => {
  let db = req.db;
  let budgetYear = req.params.budgetYear;
  const data = [];
  try {
    let rs: any = await budgetModel.getBudgetExport(db, budgetYear);
    rs.forEach(v => {
      const obj = {
        "ปีงบประมาณ": (+v.bg_year + 543),
        "แหล่งงบประมาณ": v.bgsource_name,
        "งบประมาณ": v.bgtype_name,
        "งบประมาณย่อย": v.bgtypesub_name,
        "วันที่รับงบประมาณ": moment(v.od_date).format('DD-MM-') + (+moment(v.od_date).format('YYYY') + 543),
        "จำนวนเงิน": v.amount,
        "หมายเหตุ": v.remark
      }
      data.push(obj);
    });
    let fileName = `สรุปการเปลี่ยนแปลงงบประมาณ_${budgetYear + 543}`;
    let xls = json2xls(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileName)}.xlsx`);
    res.end(xls, 'binary');

    // res.send({ ok: true, rows: rs });
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
    _detail.remark = detail.budgetRemark;
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
    _detail.remark = detail.budgetRemark;
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
    for (const detailid of budgetDetailIds) {
      await budgetModel.approveBudget(db, [detailid], _detail);
      var bgDetail = await budgetModel.getBudgetDetail2(db, detailid)
      if (bgDetail.length > 0) {
        var bgdId = await budgetModel.getMainBudgetDetail(db, bgDetail[0].bgtype_id, bgDetail[0].bgtypesub_id, bgDetail[0].bg_year)
        var rs = await budgetModel.getTransactionBalance(db, bgdId[0].view_bgdetail_id)
        let _trx: any = {};
        _trx.view_bgdetail_id = bgdId[0].view_bgdetail_id;
        _trx.bgdetail_id = bgdId[0].bgdetail_id;
        _trx.appropriation_budget = bgdId[0].amount - bgDetail[0].amount;
        _trx.incoming_balance = bgdId[0].amount - bgDetail[0].amount - rs[0].total_purchase || 0;
        _trx.amount = (bgDetail[0].amount);
        _trx.balance = _trx.incoming_balance + bgDetail[0].amount;
        _trx.date_time = moment().format('YYYY-MM-DD HH:mm:ss');
        _trx.transaction_status = 'ADDED';
        _trx.remark = (_trx.view_bgdetail_id == _trx.bgdetail_id ? 'เพิ่มงบประมาณใหม่' : 'เพิ่มงบประมาณ') + (!bgDetail[0].remark ? '' : '(' + bgDetail[0].remark + ')');
        await budgetModel.insertBudgetTransaction(db, _trx);
        // await budgetModel.insertBudgetTransactionLog(db, _trx);
      }
    }
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
// ต้องแก้
router.post('/sub-total', async (req, res, next) => {
  let db = req.db;
  let transactionData = req.body.data;
  try {
    var viewBg = await budgetModel.getBgTransaction(db, transactionData.bugdetDetailId)
    let _trx: any = {};
    _trx.view_bgdetail_id = viewBg[0].view_bgdetail_id;
    _trx.bgdetail_id = viewBg[0].bgdetail_id;
    _trx.incoming_balance = transactionData.incomingBalance || 0;
    _trx.amount = transactionData.spendAmount;
    _trx.appropriation_budget = viewBg[0].amount;
    _trx.balance = _trx.incoming_balance - _trx.amount;
    _trx.date_time = moment().format('YYYY-MM-DD HH:mm:ss');
    _trx.transaction_status = 'SPEND';
    _trx.remark = transactionData.remark;
    await budgetModel.insertBudgetTransaction(db, _trx);
    res.send({ ok: true });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/get-warehouse', async (req, res, next) => {
  let db = req.db;

  try {
    let rs = await budgetModel.getWarehouse(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    console.log(error)
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});


router.get('/get-budget-warehouse/:bgdetail_id', async (req, res, next) => {
  let bgdetail_id = req.params.bgdetail_id;
  let db = req.db;

  try {
    let rs = await budgetModel.getBudgetWarehouse(db, bgdetail_id);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/save-subbudget-warehouse', co(async (req, res, next) => {
  let db = req.db;
  let subbudgetWarehouse = req.body.data;
  try {
    let _trx: any = {};
    _trx.view_bgdetail_id = subbudgetWarehouse.view_bgdetail_id;
    _trx.warehouse_id = subbudgetWarehouse.warehouse_id;
    await budgetModel.insertBudgetWarehouse(db, _trx);
    res.send({ ok: true });
  } catch (error) {
    throw error;
    // console.log(error)
    // res.send({ ok: false, error: error });
  } finally {
    db.destroy();
  }
}));

router.delete('/delete-subbudget-warehouse', async (req, res, next) => {
  let subBudget = req.query.subBudget;
  let db = req.db;
  try {
    await budgetModel.deleteBudgetWarehouse(db, subBudget);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

export default router;