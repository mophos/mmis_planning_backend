import * as Knex from 'knex';

export default class BudgetModel {

  getBudgetDetail(knex: Knex, budgetYear: any) {
    return knex('bm_budget_detail as bd')
      .select('bd.*'
        , ' bt.bgtype_name', ' bs.bgsource_name', 'bts.bgtypesub_name')
      .join('bm_bgtype as bt', 'bt.bgtype_id', 'bd.bgtype_id')
      .join(' bm_budget_source as bs', ' bs.bgsource_id', ' bd.bgsource_id')
      .leftJoin(' bm_bgtypesub as bts', ' bts.bgtypesub_id', ' bd.bgtypesub_id')
      .where(' bd.bg_year', budgetYear)
      .orderBy('bd.update_date', 'desc');
  }

  getBudgetExport(knex: Knex, budgetYear: any) {
    return knex('bm_budget_detail as bd')
      .select('bd.*'
        , ' bt.bgtype_name', ' bs.bgsource_name', 'bts.bgtypesub_name')
      .join('bm_bgtype as bt', 'bt.bgtype_id', 'bd.bgtype_id')
      .join(' bm_budget_source as bs', ' bs.bgsource_id', ' bd.bgsource_id')
      .leftJoin(' bm_bgtypesub as bts', ' bts.bgtypesub_id', ' bd.bgtypesub_id')
      .where(' bd.bg_year', budgetYear)
      .where('bd.status', 'APPROVE')
      .orderBy('bd.update_date', 'desc');
  }

  insertBudgetDetail(knex: Knex, budgetDetail: any) {
    return knex('bm_budget_detail')
      .insert(budgetDetail);
  }

  updateBudgetDetail(knex: Knex, budgetDetailId: any, budgetDetail: any) {
    return knex('bm_budget_detail')
      .update(budgetDetail)
      .where('bgdetail_id', budgetDetailId);
  }

  approveBudget(knex: Knex, budgetDetailIds: any[], budgetDetail: any) {
    return knex('bm_budget_detail')
      .whereIn('bgdetail_id', budgetDetailIds)
      .update(budgetDetail);
  }

  getBudgetYear(knex: Knex) {
    return knex('bm_budget_detail')
      .distinct('bg_year')
      .select('bg_year');
  }

  getTotalBudget(knex: Knex, budgetYear) {
    let sql = `
      select bd.bg_year, bd.bgtype_name, bd.amount, IFNULL(ord.order_amt, 0) order_amt
      from view_budget bd
      left join (
        select bd.bgtype_id, sum(pbt.amount) order_amt
        from pc_budget_transection pbt
        join bm_budget_detail bd on bd.bgdetail_id = pbt.bgdetail_id
        where bd.bg_year = ?
        and pbt.transaction_status = 'spend'
        group by bd.bgtype_id
      ) ord on ord.bgtype_id = bd.bgtype_id
      where bd.bg_year = ?
    `;
    return knex.raw(sql, [budgetYear, budgetYear]);
  }

  getTotalSubBudget(knex: Knex, budgetYear) {
    let sql = `
      select bd.bgdetail_id, bd.bg_year, bd.bgtype_name, bd.bgtypesub_name, bd.amount, IFNULL(od.order_amt, 0) order_amt,IFNULL( bd.amount - od.order_amt, 0 ) AS total,
      IFNULL( ( 100 / bd.amount * (bd.amount - od.order_amt)) , 0 ) AS perUsed 
      from view_budget_subtype bd
      left join (
        select bd.bgtype_id, bd.bgtypesub_id, sum(pbt.amount) order_amt
        from pc_budget_transection pbt
        left join bm_budget_detail bd on bd.bgdetail_id = pbt.bgdetail_id
        where bd.bg_year = ?
        and pbt.transaction_status = 'spend'
        group by bd.bgtype_id, bd.bgtypesub_id
      ) od on od.bgtype_id = bd.bgtype_id and od.bgtypesub_id = bd.bgtypesub_id
      where bd.bg_year = ?
    `;
    return knex.raw(sql, [budgetYear, budgetYear]);
  }

  getBudgetTransaction(knex: Knex, budgetYear: any, budgetDetailId: any) {
    let query = knex('pc_budget_transection as pbt')
      .select('pbt.purchase_order_id'
        , 'pbt.date_time'
        , knex.raw(`concat(vbg.bgtype_name, ' - ', vbg.bgtypesub_name) as budget_desc`)
        , 'po.purchase_order_number'
        , 'pbt.incoming_balance'
        , knex.raw(`IF(pbt.transaction_status='SPEND', -1*pbt.amount, pbt.amount) as amount`)
        , 'pbt.balance'
        , 'pbt.remark')
      .join('view_budget_subtype as vbg', 'vbg.bgdetail_id', 'pbt.bgdetail_id')
      .leftJoin('pc_purchasing_order as po', 'po.purchase_order_id', 'pbt.purchase_order_id')
      .where('vbg.bg_year', budgetYear)
    if (budgetDetailId) {
      query.andWhere('pbt.bgdetail_id', budgetDetailId)
    }
    query.orderBy('transection_id', 'desc');
    return query;
  }

  getBudgetByYear(knex: Knex, budgetYear: any) {
    return knex('view_budget_subtype')
      .select('bgdetail_id'
        , knex.raw(`concat(bgtype_name, ' - ',bgtypesub_name) as budget_desc`))
      .where('bg_year', budgetYear)
      .orderBy('bgtype_name', 'bgtypesub_name');
  }

  sumAmountSubBudgetDetail(knex: Knex, budgetYear) {
    let sql = `
      select bd.bg_year, bd.bgtype_name, bd.bgtypesub_name, bd.amount, IFNULL(od.order_amt, 0) order_amt,IFNULL( bd.amount - od.order_amt, 0 ) AS total,
      IFNULL( ( 100 / bd.amount * (bd.amount - od.order_amt)) , 0 ) AS perUsed 
      from view_budget_subtype bd
      left join (
        select bd.bgtype_id, bd.bgtypesub_id, sum(pbt.amount) order_amt
        from pc_budget_transection pbt
        left join bm_budget_detail bd on bd.bgdetail_id = pbt.bgdetail_id
        where bd.bg_year = ?
        and pbt.transaction_status = 'spend'
        group by bd.bgtype_id, bd.bgtypesub_id
      ) od on od.bgtype_id = bd.bgtype_id and od.bgtypesub_id = bd.bgtypesub_id
      where bd.bg_year = ?
    `;
    return knex.raw(sql, [budgetYear, budgetYear]);
  }

  insertBudgetTransaction(knex: Knex, data: any) {
    return knex('pc_budget_transection')
      .insert(data);
  }

  getWarehouse(knex: Knex) {
    return knex('wm_warehouses')
  }

  getBudgetWarehouse(knex: Knex, bgdetail_id: any) {
    return knex('bm_budget_detail_warehouse as bbdw')
      .select('bbdw.bgdetail_washouers_id',
        'bbdw.bgdetail_id',
        'bbdw.warehouse_id',
        'bbt.bgtype_name',
        'bbts.bgtypesub_name',
        'ww.short_code',
        'ww.warehouse_name')
      .join('wm_warehouses as ww', 'ww.warehouse_id', 'bbdw.warehouse_id')
      .join('bm_budget_detail as bbd', 'bbd.bgdetail_id', 'bbdw.bgdetail_id')
      .join('bm_bgtype as bbt', 'bbt.bgtype_id', 'bbd.bgtype_id')
      .join('bm_bgtypesub as bbts', 'bbts.bgtypesub_id', 'bbd.bgtypesub_id')
      .where('bbdw.bgdetail_id', bgdetail_id)
  }

  insertBudgetWarehouse(knex: Knex, data: any) {
    return knex('bm_budget_detail_warehouse')
      .insert(data);
  }

  deleteBudgetWarehouse(knex: Knex, subBudget: any) {
    return knex('bm_budget_detail_warehouse')
      .whereRaw(`bgdetail_washouers_id in (${subBudget})`)
      .del()
  }

}