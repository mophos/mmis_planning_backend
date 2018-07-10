import * as Knex from 'knex';
import * as moment from 'moment';

export default class PlanningModel {

  getPlanningHeader(knex: Knex, planningYaer: any, planningStatus: any, planningName: any) {
    let sql = knex('bm_planning_header as ph')
      .where('ph.is_active', 'Y');
    if (planningYaer) {
      sql.andWhere('ph.planning_year', planningYaer);
    }
    if (planningStatus) {
      sql.andWhere('confirmed', planningStatus);
    }
    if (planningName) {
      let _name = `${planningName}%`;
      sql.andWhere('ph.planning_name', 'like', _name)
    }
    return sql.orderBy('ph.planning_year', 'desc');
  }

  getPlanningHeaderInfo(knex: Knex, planningHeaderId: any) {
    return knex('bm_planning_header as ph')
      .where('planning_hdr_id', planningHeaderId);
  }

  insertPlanningHeader(knex: Knex, data: any) {
    return knex('bm_planning_header')
      .insert(data);
  }

  updatePlanningHeader(knex: Knex, headerId, data) {
    return knex('bm_planning_header')
      .where('planning_hdr_id', headerId)
      .update(data);
  }

  checkPlanningConfirm(knex: Knex, planningYear: any, planningName: any) {
    return knex('bm_planning_header as ph')
      .select('confirmed')
      .where('planning_year', planningYear)
      .andWhere('planning_name', planningName)
      .whereNull('history_hdr_id');
  }

  updatePlanningInactive(knex: Knex, planningYear: any, planningName: any, planningHeaderId: any) {
    return knex('bm_planning_header as ph')
      .update({
        'is_active': 'N',
        'history_hdr_id': planningHeaderId
      })
      .whereNot('planning_hdr_id', planningHeaderId)
      .andWhere('planning_year', planningYear)
      .andWhere('planning_name', planningName);
  }

  changePlanningInactive(knex: Knex, headerIds: any) {
    var _ids = headerIds.split(',');
    return knex('bm_planning_header as ph')
      .update({
        'is_active': 'N'
      })
      .whereIn('planning_hdr_id', _ids);
  }

  deletePlanningHeader(knex: Knex, headerId) {
    return knex('bm_planning_header')
      .where('planning_hdr_id', headerId)
      .del();
  }

  getPlanningDetail(knex: Knex, headerId: any) {
    return knex('bm_planning_detail as pd')
      .select('pd.*', 'mg.generic_name', 'mg.generic_type_id'
        // , 'bt.bid_name as bid_type_name'
        // , knex.raw(`CONCAT(uf.unit_name, ' (', ug.qty, ' ', ut.unit_name, ')') as unit_desc`)
        , 'uf.unit_name as from_unit_name', 'ut.unit_name as to_unit_name', 'ug.qty as conversion_qty'
        , 'gt.generic_type_name', 'ga.account_name')
      .join('mm_generics as mg', 'mg.generic_id', 'pd.generic_id')
      // .join('l_bid_type as bt', 'bt.bid_id', 'pd.bid_type_id')
      .join('mm_unit_generics as ug', 'ug.unit_generic_id', 'pd.unit_generic_id')
      .join('mm_units as uf', 'uf.unit_id', 'ug.from_unit_id')
      .join('mm_units as ut', 'ut.unit_id', 'ug.to_unit_id')
      .join('mm_generic_types as gt', 'gt.generic_type_id', 'mg.generic_type_id')
      .leftJoin('mm_generic_accounts as ga', 'ga.account_id', 'mg.account_id')
      .where('planning_hdr_id', headerId);
  }

  getPlanningForCopy(knex: Knex, headerId: any, planningYear: any) {
    return knex('bm_planning_detail as pd')
      .select('mg.generic_name', 'mg.generic_type_id'
      , 'pd.generic_id', 'pd.unit_generic_id', 'pd.unit_cost', 'pd.primary_unit_id'
      , 'pd.q1', 'pd.q2', 'pd.q3', 'pd.q4', 'pd.qty', 'pd.freeze'
        , 'pf.sumy1', 'pf.sumy2', 'pf.sumy3', 'pf.sumy4', 'pf.stock_qty', 'pf.process_date', 'pf.buy_qty'
        // , 'bt.bid_name as bid_type_name'
        // , knex.raw(`CONCAT(uf.unit_name, ' (', ug.qty, ' ', ut.unit_name, ')') as unit_desc`)
        , 'uf.unit_name as from_unit_name', 'ut.unit_name as to_unit_name', 'ug.qty as conversion_qty'
        , 'gt.generic_type_name', 'ga.account_name')
      .join('mm_generics as mg', 'mg.generic_id', 'pd.generic_id')
      // .join('l_bid_type as bt', 'bt.bid_id', 'pd.bid_type_id')
      .join('mm_unit_generics as ug', 'ug.unit_generic_id', 'pd.unit_generic_id')
      .join('mm_units as uf', 'uf.unit_id', 'ug.from_unit_id')
      .join('mm_units as ut', 'ut.unit_id', 'ug.to_unit_id')
      .join('mm_generic_types as gt', 'gt.generic_type_id', 'mg.generic_type_id')
      .joinRaw(`join bm_planning_forecast as pf on pf.generic_id = pd.generic_id and pf.forecast_year = '${planningYear}' `)
      .leftJoin('mm_generic_accounts as ga', 'ga.account_id', 'mg.account_id')
      .where('planning_hdr_id', headerId);
  }

  insertPlanningDetail(knex: Knex, data: any) {
    return knex('bm_planning_detail')
      .insert(data);
  }

  insertPlanningDetailFromTmp(knex: Knex, headerId: any, _uuid: any) {
    let sql = `
      insert into bm_planning_detail (
        planning_hdr_id, generic_id, unit_generic_id, unit_cost, primary_unit_id
        , rate_1_year, rate_2_year, rate_3_year, estimate_qty, stock_qty
        , inventory_date, estimate_buy, q1, q2, q3
        , q4, qty, amount, freeze
        , create_date, update_date, create_by, update_by
      )
      select ?, generic_id, unit_generic_id, unit_cost, primary_unit_id
            , (rate_1_year*conversion_qty), (rate_2_year*conversion_qty), (rate_3_year*conversion_qty), (estimate_qty*conversion_qty), (stock_qty*conversion_qty)
            , inventory_date, (estimate_buy*conversion_qty), (q1*conversion_qty), (q2*conversion_qty), (q3*conversion_qty)
            , (q4*conversion_qty), (qty*conversion_qty), amount, freeze
            , create_date, update_date, create_by, update_by
      from bm_planning_tmp
      where uuid = ?
    `;
    return knex.raw(sql, [headerId, _uuid]);
  }

  updatePlanningDetail(knex: Knex, detailId, data) {
    return knex('bm_planning_detail')
      .where('planning_dtl_id', detailId)
      .update(data);
  }

  deletePlanningDetail(knex: Knex, headerId) {
    return knex('bm_planning_detail')
      .where('planning_hdr_id', headerId)
      .del();
  }

  getPlanningYear(knex: Knex) {
    return knex('bm_planning_header')
      .distinct('planning_year')
      .select('planning_year');
  }

  getForecast(knex: Knex, genericId: any, forecastYear: any, tmpId: any) {
    if (tmpId) { //edit row
      return knex('bm_planning_forecast as pf')
        .select('pf.*', knex.raw('IFNULL(pt.q1 * pt.conversion_qty, pf.y4q1) as y4q1')
          , knex.raw('IFNULL(pt.q2 * pt.conversion_qty, pf.y4q2) as y4q2')
          , knex.raw('IFNULL(pt.q3 * pt.conversion_qty, pf.y4q3) as y4q3')
          , knex.raw('IFNULL(pt.q4 * pt.conversion_qty, pf.y4q4) as y4q4'))
        .joinRaw(`left join bm_planning_tmp as pt on pt.generic_id = pf.generic_id and pt.tmp_id = ${tmpId}`)
        .where('pf.generic_id', genericId)
        .andWhere('pf.forecast_year', forecastYear);
    } else { //new row
      return knex('bm_planning_forecast as pf')
        .where('pf.generic_id', genericId)
        .andWhere('pf.forecast_year', forecastYear);
    }
  }

  getPlanningHistory(knex: Knex, headerId: any) {
    return knex('bm_planning_header as ph')
      .whereNot('ph.planning_hdr_id', headerId)
      .andWhere('ph.history_hdr_id', headerId)
      .orderBy('ph.planning_hdr_id', 'desc');
  }

  callForecast(knex: Knex, planningYear: any) {
    return knex.raw(`call forecast_v2(${planningYear})`);
  }

  getForecastList(knex: Knex, forecastYear: any, _genericGroups: any[]) {
    let query = knex('bm_planning_forecast as pf')
      .select('pf.*', 'mg.generic_name', 'ug.to_unit_id', 'mg.generic_type_id'
        , 'uf.unit_name as from_unit_name', 'ut.unit_name as to_unit_name', 'ug.qty as conversion_qty'
        , 'ug.cost', 'mg.planning_freeze', 'mg.planning_unit_generic_id', 'mg.planning_method')
      .join('mm_generics as mg', 'mg.generic_id', 'pf.generic_id')
      // .join('l_bid_type as bt', 'bt.bid_id', 'mg.planning_method')
      .join('mm_unit_generics as ug', 'ug.unit_generic_id', 'mg.planning_unit_generic_id')
      .join('mm_units as uf', 'uf.unit_id', 'ug.from_unit_id')
      .join('mm_units as ut', 'ut.unit_id', 'ug.to_unit_id')
      .where('pf.forecast_year', forecastYear)
      .andWhere('mg.is_planning', 'Y');
    if (_genericGroups) {
      query.whereIn('mg.generic_type_id', _genericGroups);
    }
    return query;
  }

  insertPlanningTmp(knex: Knex, data: any) {
    return knex('bm_planning_tmp')
      .insert(data);
  }

  updatePlanningTmp(knex: Knex, id: any, data: any) {
    return knex('bm_planning_tmp')
      .where('tmp_id', id)
      .update(data);
  }

  deletePlanningTmp(knex: Knex, id: any[]) {
    return knex('bm_planning_tmp')
      .whereIn('tmp_id', id)
      .delete();
  }

  clearPlanningTmp(knex: Knex, _uuid: any) {
    return knex('bm_planning_tmp')
      .where('uuid', _uuid)
      .delete();
  }

  getPlanningTmp(knex: Knex, _uuid: any, query: any, genericType: any, limit: number, offset: number = 0) {
    let sql = knex('bm_planning_tmp')
      .where('uuid', _uuid);
    if (query) {
      let _query = `%${query}%`;
      sql.andWhere('generic_name', 'like', _query);
    }
    if (genericType) {
      sql.andWhere('generic_type_id', genericType);
    }
    if (limit) {
      sql.limit(limit);
    }
    sql.offset(offset);
    return sql;
  }

  countPlanningTmp(knex: Knex, _uuid: any, query: any, genericType: any) {
    let sql = knex('bm_planning_tmp')
      .count('* as total')
      .sum('amount as amount')
      .where('uuid', _uuid);
    if (query) {
      let _query = `%${query}%`;
      sql.andWhere('generic_name', 'like', _query);
    }
    if (genericType) {
      sql.andWhere('generic_type_id', genericType);
    }
    return sql;
  }

  getPlanningForAdjust(knex: Knex, _uuid: any) {
    return knex('bm_planning_tmp')
      .where('uuid', _uuid)
      .andWhere('freeze', 'N');
  }

  getPlanningFreezeAmount(knex: Knex, _uuid: any) {
    return knex('bm_planning_tmp')
      .sum('amount as amount')
      .where('uuid', _uuid)
      .andWhere('freeze', 'Y');
  }

  updatePlanningTmpAfterUpload(knex: Knex, _uuid: any) {
    let sql = `
    update bm_planning_tmp t,
    (
      select tmp.tmp_id, mg.generic_id, unt.unit_generic_id, unt.to_unit_id, unt.qty
      from bm_planning_tmp tmp
      join mm_generics mg on mg.generic_name = tmp.generic_name
      join (
        select ug.unit_generic_id, ug.to_unit_id, ug.generic_id, ug.qty, concat(fu.unit_name, ' ', '(', ug.qty, ' ', tu.unit_name, ')') unit_desc
        from mm_unit_generics ug
        join mm_units fu on fu.unit_id = ug.from_unit_id
        join mm_units tu on tu.unit_id = ug.to_unit_id
      ) unt on unt.generic_id = mg.generic_id and unt.unit_desc = tmp.unit_desc
      where uuid = ?
    ) s
    set t.generic_id = s.generic_id,
        t.unit_generic_id = s.unit_generic_id,
        t.primary_unit_id = s.to_unit_id,
        t.conversion_qty = s.qty
    where t.tmp_id = s.tmp_id
    `;
    return knex.raw(sql, [_uuid])
  }

  getPlanningDetailForMerge(knex: Knex, headerIds: any[]) {
    return knex('bm_planning_detail as pd')
      .select('pd.*', knex.raw('sum(pd.q1) as q1'), knex.raw('sum(pd.q2) as q2')
        , knex.raw('sum(pd.q3) as q3'), knex.raw('sum(pd.q4) as q4')
        , knex.raw('sum(pd.qty) as qty'), knex.raw('sum(pd.amount) as amount')
        , 'mg.generic_name', 'mg.generic_type_id'
        , 'uf.unit_name as from_unit_name', 'ut.unit_name as to_unit_name', 'ug.qty as conversion_qty')
      .join('mm_generics as mg', 'mg.generic_id', 'pd.generic_id')
      // .join('l_bid_type as bt', 'bt.bid_id', 'pd.bid_type_id')
      .join('mm_unit_generics as ug', 'ug.unit_generic_id', 'pd.unit_generic_id')
      .join('mm_units as uf', 'uf.unit_id', 'ug.from_unit_id')
      .join('mm_units as ut', 'ut.unit_id', 'ug.to_unit_id')
      .whereIn('planning_hdr_id', headerIds)
      .groupBy('pd.generic_id');
  }

  getPlanningReport(knex: Knex, headerId: any) {
    let sql = `SELECT
            bph.planning_year,
            mg.generic_id,
            mg.generic_name,
            mga.account_id,
            mga.account_name,
            mug.qty as qty_unit,
            fct.invqty as inventory,
	          mug.qty as converse_qty,
            bpd.rate_3_year,
            bpd.rate_2_year,
            bpd.rate_1_year,
            bpd.estimate_qty,
            bpd.unit_cost,
            bpd.q1,
            bpd.q2,
            bpd.q3,
            bpd.q4,
            bpd.qty,
            bpd.amount
        FROM
            bm_planning_header bph
        JOIN bm_planning_detail bpd ON bph.planning_hdr_id = bpd.planning_hdr_id
        JOIN bm_planning_forcast as fct on fct.forcast_year = bph.planning_year and fct.generic_id = bpd.generic_id
        JOIN mm_generics mg ON bpd.generic_id = mg.generic_id
        JOIN mm_unit_generics mug ON mug.unit_generic_id = bpd.unit_generic_id
        LEFT JOIN mm_generic_accounts mga ON mga.account_id = mg.account_id
        WHERE 
            bph.planning_hdr_id = ?
        ORDER BY mg.generic_name`;
    return knex.raw(sql, headerId);
  }

}