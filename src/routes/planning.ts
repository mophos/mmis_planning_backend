import * as express from 'express';
import * as Knex from 'knex';
import * as moment from 'moment';
import * as path from 'path';
import * as os from 'os';
import * as xlsx from 'node-xlsx';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as json2xls from 'json2xls';
import * as multer from 'multer';
import * as rimraf from 'rimraf';

import PlanningModel from '../models/planning';
import ReportModel from '../models/report';

const router = express.Router();

const planningModel = new PlanningModel();
const reportModel = new ReportModel();

router.get('/', async (req, res, next) => {
  let db = req.db;
  let planningYear = req.query.year;
  let planningStatus = req.query.status;
  let planningName = req.query.name;

  try {
    let _planningName = planningName == 'undefined' || planningName == 'null' ? '' : planningName;
    let rs: any = await planningModel.getPlanningHeader(db, planningYear, planningStatus, _planningName);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/info/:headerId', async (req, res, next) => {
  let db = req.db;
  let planningHeaderId = req.params.headerId;

  try {
    let rs: any = await planningModel.getPlanningHeaderInfo(db, planningHeaderId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/', async (req, res, next) => {
  let _header = req.body.header;
  let _uuid = req.body.uuid;
  let db = req.db;
  if (_uuid && _header) {
    try {
      await insertPlanning(db, _header, _uuid, req.decoded.people_user_id);
      await planningModel.clearPlanningTmp(db, _uuid);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ไม่พบข้อมูลที่ต้องการบันทึก' });
  }
});

router.put('/', async (req, res, next) => {
  let _header = req.body.header;
  let _uuid = req.body.uuid;
  let db = req.db;
  if (_uuid && _header) {
    try {
      let result: any = await planningModel.checkPlanningConfirm(db, _header.planningYear, _header.planningName);
      if (result[0].confirmed === 'Y') {
        let planningHeaderId = await insertPlanning(db, _header, _uuid, req.decoded.people_user_id);
        await planningModel.updatePlanningInactive(db, _header.planningYear, _header.planningName, planningHeaderId);
      } else {
        await updatePlanning(db, _header, _uuid, req.decoded.people_user_id);
      }
      await planningModel.clearPlanningTmp(db, _uuid);
      res.send({ ok: true });
    } catch (error) {
      res.send({ ok: false, error: error.message });
    } finally {
      db.destroy();
    }
  } else {
    res.send({ ok: false, error: 'ไม่พบข้อมูลที่ต้องการบันทึก' });
  }
});

router.get('/detail/:headerId', async (req, res, next) => {
  let db = req.db;
  let planningHeaderId = req.params.headerId;
  let _uuid = req.query.uuid;

  try {
    let rs: any = await planningModel.getPlanningDetail(db, planningHeaderId);
    let data = [];
    for (const r of rs) {
      let obj: any = {};
      obj.uuid = _uuid;
      obj.generic_id = r.generic_id;
      obj.generic_name = r.generic_name;
      obj.unit_generic_id = r.unit_generic_id;
      obj.unit_desc = `${r.from_unit_name} (${r.conversion_qty} ${r.to_unit_name})`;
      obj.unit_cost = r.unit_cost;
      obj.conversion_qty = r.conversion_qty;
      obj.primary_unit_id = r.primary_unit_id;
      obj.rate_1_year = Math.round(r.rate_1_year / r.conversion_qty);
      obj.rate_2_year = Math.round(r.rate_2_year / r.conversion_qty);
      obj.rate_3_year = Math.round(r.rate_3_year / r.conversion_qty);
      obj.estimate_qty = Math.round(r.estimate_qty / r.conversion_qty);
      obj.stock_qty = Math.round(r.stock_qty / r.conversion_qty);
      obj.inventory_date = moment(r.inventory_date).format('YYYY-MM-DD HH:mm:ss');
      obj.estimate_buy = Math.round(r.estimate_buy / r.conversion_qty);
      obj.q1 = Math.round(r.q1 / r.conversion_qty);
      obj.q2 = Math.round(r.q2 / r.conversion_qty);
      obj.q3 = Math.round(r.q3 / r.conversion_qty);
      obj.q4 = Math.round(r.q4 / r.conversion_qty);
      obj.qty = obj.q1 + obj.q2 + obj.q3 + obj.q4;
      obj.amount = obj.qty * obj.unit_cost;
      obj.bid_type_id = r.bid_type_id;
      obj.bid_type_name = r.bid_type_name;
      obj.freeze = r.freeze;
      obj.create_date = moment(r.create_date).format('YYYY-MM-DD HH:mm:ss');
      obj.update_date = moment(r.update_date).format('YYYY-MM-DD HH:mm:ss');
      obj.create_by = r.create_by;
      obj.update_by = r.update_by;
      obj.generic_type_name = r.generic_type_name === 'ยา' ? r.account_name : r.generic_type_name;
      data.push(obj);
    }
    await planningModel.insertPlanningTmp(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/year', async (req, res, next) => {
  let db = req.db;
  try {
    let rs: any = await planningModel.getPlanningYear(db);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/forecast/:genericId/:year', async (req, res, next) => {
  let db = req.db;
  let genericId = req.params.genericId;
  let forecastYear = req.params.year;

  try {
    let rs: any = await planningModel.getForecast(db, genericId, forecastYear);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/process', async (req, res, next) => {
  let db = req.db;
  let planningYear = req.body.year;
  let _uuid = req.body.uuid;

  try {
    await planningModel.callForecast(db, planningYear);
    let rs: any = await planningModel.getForecastList(db, planningYear);
    let data = [];
    for (const r of rs) {
      let obj: any = {};
      obj.uuid = _uuid;
      obj.generic_id = r.generic_id;
      obj.generic_name = r.generic_name;
      obj.unit_generic_id = r.planning_unit_generic_id;
      obj.unit_desc = `${r.from_unit_name} (${r.conversion_qty} ${r.to_unit_name})`;
      obj.unit_cost = r.cost;
      obj.conversion_qty = r.conversion_qty;
      obj.primary_unit_id = r.to_unit_id;
      obj.rate_1_year = Math.round(r.sumy1 / r.conversion_qty);
      obj.rate_2_year = Math.round(r.sumy2 / r.conversion_qty);
      obj.rate_3_year = Math.round(r.sumy3 / r.conversion_qty);
      obj.estimate_qty = Math.round(r.sumy4 / r.conversion_qty);
      obj.stock_qty = Math.round(r.stock_qty / r.conversion_qty);
      obj.inventory_date = moment(r.process_date).format('YYYY-MM-DD HH:mm:ss');
      obj.estimate_buy = Math.round(r.buy_qty / r.conversion_qty);
      obj.q1 = Math.round(r.y4q1 / r.conversion_qty);
      obj.q2 = Math.round(r.y4q2 / r.conversion_qty);
      obj.q3 = Math.round(r.y4q3 / r.conversion_qty);
      obj.q4 = Math.round(r.y4q4 / r.conversion_qty);
      obj.qty = obj.q1 + obj.q2 + obj.q3 + obj.q4;
      obj.amount = obj.qty * obj.unit_cost;
      obj.bid_type_id = r.planning_method;
      obj.bid_type_name = r.bid_type_name;
      obj.freeze = r.planning_freeze ? 'Y' : 'N';
      obj.create_date = moment().format('YYYY-MM-DD HH:mm:ss');
      obj.create_by = req.decoded.people_user_id;
      data.push(obj);
    }
    await planningModel.clearPlanningTmp(db, _uuid);
    await planningModel.insertPlanningTmp(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/tmp', async (req, res, next) => {
  let db = req.db;
  let _uuid = req.query.uuid;
  let query = req.query.query
  let limit = +req.query.limit || 5;
  let offset = +req.query.offset || 0;

  try {
    let _query = query === 'undefined' || query === null ? '' : query;
    let rs = await planningModel.getPlanningTmp(db, _uuid, _query, limit, offset);
    let header = await planningModel.countPlanningTmp(db, _uuid, _query);
    res.send({ ok: true, rows: rs, total: header[0].total, amount: header[0].amount });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/tmp', async (req, res, next) => {
  let db = req.db;
  let _uuid = req.body.uuid;
  let data = req.body.data;

  try {
    data.uuid = _uuid;
    data.create_date = moment().format('YYYY-MM-DD HH:mm:ss');
    data.create_by = req.decoded.people_user_id;
    await planningModel.insertPlanningTmp(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.put('/tmp', async (req, res, next) => {
  let db = req.db;
  let _uuid = req.body.uuid;
  let data = req.body.data;

  try {
    data.uuid = _uuid;
    data.update_date = moment().format('YYYY-MM-DD HH:mm:ss');
    data.update_by = req.decoded.people_user_id;
    await planningModel.updatePlanningTmp(db, data.tmp_id, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.delete('/tmp/:tmpId', async (req, res, next) => {
  let db = req.db;
  let tmpId = +req.params.tmpId;

  try {
    let rs = await planningModel.deletePlanningTmp(db, [tmpId]);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/history/:headerId', async (req, res, next) => {
  let db = req.db;
  let planningHeaderId = req.params.headerId;

  try {
    let rs: any = await planningModel.getPlanningHistory(db, planningHeaderId);
    res.send({ ok: true, rows: rs });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

const insertPlanning = (async (db: Knex, _header: any, _uuid: any, peopleUserId: any) => {
  let refHeaderId = _header.refHeaderId ? _header.refHeaderId.toString() : null;
  let header = {
    planning_year: _header.planningYear,
    planning_amount: _header.totalAmount,
    planning_name: _header.planningName,
    planning_memo: _header.planningMemo,
    planning_qty: _header.planningQty,
    ref_hdr_id: refHeaderId,
    create_date: moment().format('YYYY-MM-DD HH:mm:ss'),
    create_by: peopleUserId
  }
  let rs: any = await planningModel.insertPlanningHeader(db, header);
  let headerId = rs[0];
  await planningModel.insertPlanningDetailFromTmp(db, headerId, _uuid);

  if (refHeaderId) await planningModel.changePlanningInactive(db, refHeaderId);

  return headerId;
});

const updatePlanning = (async (db: Knex, _header: any, _uuid: any, peopleUserId: any) => {
  let _headerId = _header.planningHeaderId;
  let refHeaderId = _header.refHeaderId ? _header.refHeaderId.toString() : null;
  let header = {
    planning_year: _header.planningYear,
    planning_amount: _header.totalAmount,
    planning_name: _header.planningName,
    planning_memo: _header.planningMemo,
    confirmed: _header.confirmed,
    planning_qty: _header.planningQty,
    ref_hdr_id: refHeaderId,
    update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
    update_by: peopleUserId
  }
  await planningModel.updatePlanningHeader(db, _headerId, header);
  await planningModel.deletePlanningDetail(db, _headerId);
  await planningModel.insertPlanningDetailFromTmp(db, _headerId, _uuid);

  if (refHeaderId) await planningModel.changePlanningInactive(db, refHeaderId);
});

router.post('/adjust-amount', async (req, res, next) => {
  let db = req.db;
  let _uuid = req.body.uuid;
  let _adjust = req.body.amount;

  try {
    let rs1 = await planningModel.countPlanningTmp(db, _uuid, null);
    let _total = rs1[0].amount || 0;
    let rs2 = await planningModel.getPlanningFreezeAmount(db, _uuid);
    let _freeze = rs2[0].amount || 0;
    let totalAmount = _total - _freeze;
    let adjustAmount = _adjust - _freeze;

    const percent = (+adjustAmount / +totalAmount * 100) - 100;
    const _ratio = percent / 100;
    let rows: any = await planningModel.getPlanningForAdjust(db, _uuid);

    let tmpIds = [];

    for (const r of rows) {
      if (adjustAmount < 0) {
        r.q1 = 0;
        r.q2 = 0;
        r.q3 = 0;
        r.q4 = 0;
        r.qty = 0;
        r.amount = 0;
      } else {
        let _amountQ1 = r.q1 * r.unit_cost;
        let _amountQ2 = r.q2 * r.unit_cost;
        let _amountQ3 = r.q3 * r.unit_cost;
        let _amountQ4 = r.q4 * r.unit_cost;
        r.q1 = Math.floor((_amountQ1 + _amountQ1 * _ratio) / r.unit_cost);
        r.q2 = Math.floor((_amountQ2 + _amountQ2 * _ratio) / r.unit_cost);
        r.q3 = Math.floor((_amountQ3 + _amountQ3 * _ratio) / r.unit_cost);
        r.q4 = Math.floor((_amountQ4 + _amountQ4 * _ratio) / r.unit_cost);
        r.qty = r.q1 + r.q2 + r.q3 + r.q4;
        r.amount = r.qty * r.unit_cost;
      }
      tmpIds.push(r.tmp_id);
    }
    await planningModel.deletePlanningTmp(db, tmpIds);
    await planningModel.insertPlanningTmp(db, rows);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/adjust-percent', async (req, res, next) => {
  let db = req.db;
  let _uuid = req.body.uuid;
  let percent = req.body.percent;

  try {
    let rows: any = await planningModel.getPlanningForAdjust(db, _uuid);
    await processAdjustPercent(db, rows, percent);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.post('/copy', async (req, res, next) => {
  let db = req.db;
  let planningHeaderId = req.body.headerId;
  let adjustPercent = req.body.percent || 0;
  let _uuid = req.body.uuid;

  try {
    let rs: any = await planningModel.getPlanningDetail(db, planningHeaderId);
    let data = [];
    for (const r of rs) {
      let obj: any = {};
      obj.uuid = _uuid;
      obj.generic_id = r.generic_id;
      obj.generic_name = r.generic_name;
      obj.unit_generic_id = r.unit_generic_id;
      obj.unit_desc = `${r.from_unit_name} (${r.conversion_qty} ${r.to_unit_name})`;
      obj.unit_cost = r.unit_cost;
      obj.conversion_qty = r.conversion_qty;
      obj.primary_unit_id = r.primary_unit_id;
      obj.rate_1_year = Math.round(r.rate_1_year / r.conversion_qty);
      obj.rate_2_year = Math.round(r.rate_2_year / r.conversion_qty);
      obj.rate_3_year = Math.round(r.rate_3_year / r.conversion_qty);
      obj.estimate_qty = Math.round(r.estimate_qty / r.conversion_qty);
      obj.stock_qty = Math.round(r.stock_qty / r.conversion_qty);
      obj.inventory_date = moment(r.inventory_date).format('YYYY-MM-DD HH:mm:ss');
      obj.estimate_buy = Math.round(r.estimate_buy / r.conversion_qty);
      obj.q1 = Math.round(r.q1 / r.conversion_qty);
      obj.q2 = Math.round(r.q2 / r.conversion_qty);
      obj.q3 = Math.round(r.q3 / r.conversion_qty);
      obj.q4 = Math.round(r.q4 / r.conversion_qty);
      obj.qty = obj.q1 + obj.q2 + obj.q3 + obj.q4;
      obj.amount = obj.qty * obj.unit_cost;
      obj.bid_type_id = r.bid_type_id;
      obj.bid_type_name = r.bid_type_name;
      obj.freeze = r.freeze;
      obj.create_date = moment(r.create_date).format('YYYY-MM-DD HH:mm:ss');
      obj.update_date = moment(r.update_date).format('YYYY-MM-DD HH:mm:ss');
      obj.create_by = r.create_by;
      obj.update_by = r.update_by;
      data.push(obj);
    }
    await planningModel.clearPlanningTmp(db, _uuid);
    await planningModel.insertPlanningTmp(db, data);
    let rows = await planningModel.getPlanningTmp(db, _uuid, null, null, null);
    await processAdjustPercent(db, rows, adjustPercent);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

const processAdjustPercent = (async (db: Knex, data: any, percent: any) => {
  const _ratio = percent / 100;
  let tmpIds = [];

  for (const d of data) {
    d.q1 = Math.floor(d.q1 + (d.q1 * _ratio));
    d.q2 = Math.floor(d.q2 + (d.q2 * _ratio));
    d.q3 = Math.floor(d.q3 + (d.q3 * _ratio));
    d.q4 = Math.floor(d.q4 + (d.q4 * _ratio));
    d.qty = d.q1 + d.q2 + d.q3 + d.q4;
    d.amount = d.qty * d.unit_cost;
    tmpIds.push(d.tmp_id);
  }
  await planningModel.deletePlanningTmp(db, tmpIds);
  await planningModel.insertPlanningTmp(db, data);
});

router.get('/excel/:headerId', async (req, res, next) => {
  let db = req.db;
  let headerId = req.params.headerId;
  let _uuid = req.query.uuid;
  let header = await planningModel.getPlanningHeaderInfo(db, headerId);
  let rows = await planningModel.getPlanningTmp(db, _uuid, null, null, null);
  let data = [];
  let i = 1;
  for (const r of rows) {
    let obj = {
      '#': i++,
      'รายการ': r.generic_name,
      'หน่วย': r.unit_desc,
      'ราคาต่อหน่วย': r.unit_cost,
      'ย้อนหลัง3ปี': r.rate_3_year,
      'ย้อนหลัง2ปี': r.rate_2_year,
      'ย้อนหลัง1ปี': r.rate_1_year,
      'ประมาณการใช้': r.estimate_qty,
      'ยอดคงคลัง': r.stock_qty,
      'ประมาณการซื้อ': r.estimate_buy,
      'งวดที่1': r.q1,
      'งวดที่2': r.q2,
      'งวดที่3': r.q3,
      'งวดที่4': r.q4,
      'จำนวนรวม': r.qty,
      'มูลค่ารวม': r.amount,
      'การจัดซื้อ': r.bid_type_name,
      'Freeze': r.freeze
    };
    data.push(obj);
  }
  let fileName = `${header[0].planning_name} ${+header[0].planning_year + 543}`;
  let xls = json2xls(data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader('Content-Disposition', `attachment; filename=${encodeURI(fileName)}.xlsx`);
  res.end(xls, 'binary');
});

let uploadDir = './uploads';
fse.ensureDirSync(uploadDir);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    let _ext = path.extname(file.originalname);
    cb(null, Date.now() + _ext)
  }
});
let upload = multer({ storage: storage });

router.post('/excel', upload.single('file'), async (req, res, next) => {
  let db = req.db;
  let _uuid = req.query.uuid;
  let filePath = req.file.path;

  const workSheetsFromFile = xlsx.parse(`${filePath}`);

  let excelData = workSheetsFromFile[0].data;
  let maxRecord = excelData.length;

  let header = excelData[0];

  if (header[0] === '#' &&
    header[1] === 'รายการ' &&
    header[2] === 'หน่วย' &&
    header[3] === 'ราคาต่อหน่วย' &&
    header[4] === 'ย้อนหลัง3ปี' &&
    header[5] === 'ย้อนหลัง2ปี' &&
    header[6] === 'ย้อนหลัง1ปี' &&
    header[7] === 'ประมาณการใช้' &&
    header[8] === 'ยอดคงคลัง' &&
    header[9] === 'ประมาณการซื้อ' &&
    header[10] === 'งวดที่1' &&
    header[11] === 'งวดที่2' &&
    header[12] === 'งวดที่3' &&
    header[13] === 'งวดที่4' &&
    header[14] === 'จำนวนรวม' &&
    header[15] === 'มูลค่ารวม' &&
    header[16] === 'การจัดซื้อ' &&
    header[17] === 'Freeze') {

    let _data: any = [];
    for (let x = 1; x < maxRecord; x++) {
      let obj: any = {
        uuid: _uuid,
        generic_name: excelData[x][1],
        unit_desc: excelData[x][2],
        unit_cost: excelData[x][3],
        rate_3_year: excelData[x][4],
        rate_2_year: excelData[x][5],
        rate_1_year: excelData[x][6],
        estimate_qty: excelData[x][7],
        stock_qty: excelData[x][8],
        estimate_buy: excelData[x][9],
        q1: excelData[x][10],
        q2: excelData[x][11],
        q3: excelData[x][12],
        q4: excelData[x][13],
        qty: excelData[x][14],
        amount: excelData[x][15],
        bid_type_name: excelData[x][16],
        freeze: excelData[x][17],
        create_by: req.decoded.people_user_id
      }
      _data.push(obj);
    }

    if (_data.length) {
      try {
        await planningModel.clearPlanningTmp(db, _uuid);
        await planningModel.insertPlanningTmp(db, _data);
        await planningModel.updatePlanningTmpAfterUpload(db, _uuid);
        rimraf.sync(filePath);
        res.send({ ok: true });
      } catch (error) {
        res.send({ ok: false, error: error.message })
      } finally {
        db.destroy();
      }
    } else {
      res.send({ ok: false, error: 'ไม่พบข้อมูลที่ต้องการนำเข้า' })
    }
  } else {
    res.send({ ok: false, error: 'Header ไม่ถูกต้อง' })
  }

});

router.post('/merge', async (req, res, next) => {
  let db = req.db;
  let planningHeaderIds = req.body.headerIds;
  let _uuid = req.body.uuid;

  try {
    let rs: any = await planningModel.getPlanningDetailForMerge(db, planningHeaderIds);
    let data = [];
    for (const r of rs) {
      let obj: any = {};
      obj.uuid = _uuid;
      obj.generic_id = r.generic_id;
      obj.generic_name = r.generic_name;
      obj.unit_generic_id = r.unit_generic_id;
      obj.unit_desc = `${r.from_unit_name} (${r.conversion_qty} ${r.to_unit_name})`;
      obj.unit_cost = r.unit_cost;
      obj.conversion_qty = r.conversion_qty;
      obj.primary_unit_id = r.primary_unit_id;
      obj.rate_1_year = Math.round(r.rate_1_year / r.conversion_qty);
      obj.rate_2_year = Math.round(r.rate_2_year / r.conversion_qty);
      obj.rate_3_year = Math.round(r.rate_3_year / r.conversion_qty);
      obj.estimate_qty = Math.round(r.estimate_qty / r.conversion_qty);
      obj.stock_qty = Math.round(r.stock_qty / r.conversion_qty);
      obj.inventory_date = moment(r.inventory_date).format('YYYY-MM-DD HH:mm:ss');
      obj.estimate_buy = Math.round(r.estimate_buy / r.conversion_qty);
      obj.q1 = Math.round(r.q1 / r.conversion_qty);
      obj.q2 = Math.round(r.q2 / r.conversion_qty);
      obj.q3 = Math.round(r.q3 / r.conversion_qty);
      obj.q4 = Math.round(r.q4 / r.conversion_qty);
      obj.qty = obj.q1 + obj.q2 + obj.q3 + obj.q4;
      obj.amount = obj.qty * obj.unit_cost;
      obj.bid_type_id = r.bid_type_id;
      obj.bid_type_name = r.bid_type_name;
      obj.freeze = r.freeze;
      obj.create_date = moment(r.create_date).format('YYYY-MM-DD HH:mm:ss');
      obj.update_date = moment(r.update_date).format('YYYY-MM-DD HH:mm:ss');
      obj.create_by = r.create_by;
      obj.update_by = r.update_by;
      data.push(obj);
    }
    await planningModel.clearPlanningTmp(db, _uuid);
    await planningModel.insertPlanningTmp(db, data);
    res.send({ ok: true });
  } catch (error) {
    res.send({ ok: false, error: error.message });
  } finally {
    db.destroy();
  }
});

router.get('/report/:headerId', async (req, res, next) => {
  let db = req.db;
  let headerId = req.params.headerId;
  let _uuid = req.query.uuid;

  let hosdetail = await reportModel.hospital(db);
  let hospitalName = hosdetail[0].hospname;
  // let planning = await planningModel.getPlanningReport(db, headerId);
  let header = await planningModel.getPlanningHeaderInfo(db, headerId);
  let rs = await planningModel.getPlanningTmp(db, _uuid, null, null, null);
  moment.locale('th');

  rs.forEach(value => {
    value.unit_cost = reportModel.comma(value.unit_cost);
    value.amount = reportModel.comma(value.amount);

    value.estimate_qty = reportModel.commaQty(value.estimate_qty);
    value.stock_qty = reportModel.commaQty(value.stock_qty);
    value.estimate_buy = reportModel.commaQty(value.estimate_buy);
    value.rate_3_year = reportModel.commaQty(value.rate_3_year);
    value.rate_2_year = reportModel.commaQty(value.rate_2_year);
    value.rate_1_year = reportModel.commaQty(value.rate_1_year);
    value.q1 = reportModel.commaQty(value.q1);
    value.q2 = reportModel.commaQty(value.q2);
    value.q3 = reportModel.commaQty(value.q3);
    value.q4 = reportModel.commaQty(value.q4);
    value.qty = reportModel.commaQty(value.qty);
  })
  
  let today = moment(new Date()).format('D MMMM ') + (moment(new Date()).get('year') + 543);
  let todayAmount = moment(new Date()).format('MMM ') + (moment(new Date()).get('year') + 543);
  res.render('planning', {
    hospitalName: hospitalName,
    planningYear: +header[0].planning_year+543,
    today: today,
    planning: rs,
    todayAmount: todayAmount
  });
});

export default router;