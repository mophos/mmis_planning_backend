import * as Knex from 'knex';

export default class AccountPayableModel {

  getList(knex: Knex, warehouseId, query) {

    const _query = `%${query}%`;
    const payableId = knex('ar_payable_details as pd')
      .select('pd.payable_id')
      .join('wm_receives as r', 'pd.receive_id', 'r.receive_id')
      .where(w => {
        w.where('r.receive_code', 'like', _query)
          .orWhere('r.delivery_code', 'like', _query)
      });
    return knex('ar_payables')
      .where('warehouse_id', warehouseId)
      .where(w => {
        w.where('payable_code', 'like', _query)
          .orWhereIn('payable_id', payableId)
      })

      .orderBy('payable_id', 'DESC')
  }

  getHead(knex: Knex, payableId) {
    return knex('ar_payables as p')
      .select('p.payable_code', 'p.payable_date', 'p.payable_id')
      .where('p.payable_id', payableId)
  }

  getInfo(knex: Knex, payableId) {
    let totalPrice = knex('wm_receive_detail as rd')
      .select(knex.raw('sum(rd.cost*rd.receive_qty)')).as('total_price')
      .whereRaw('rd.receive_id = r.receive_id')

    return knex('ar_payables as p')
      .select('r.receive_date', 'r.receive_id', 'r.receive_code',
        'r.delivery_code', 'po.purchase_order_number', 'po.purchase_order_book_number', totalPrice)
      .join('ar_payable_details as pd', 'p.payable_id', 'pd.payable_id')
      .join('wm_receives as r', 'r.receive_id', 'pd.receive_id')
      .join('pc_purchasing_order as po', 'r.purchase_order_id', 'po.purchase_order_id')
      .where('p.payable_id', payableId)
      .orderBy('p.payable_id', 'DESC')
  }

  getReceive(knex: Knex, query) {
    const _q = `%${query}%`
    let totalPrice = knex('wm_receive_detail as rd')
      .select(knex.raw('sum(rd.cost*rd.receive_qty)')).as('total_price')
      .whereRaw('rd.receive_id = r.receive_id')

    return knex('wm_receives as r')
      .select('r.receive_id', 'r.receive_code', 'r.receive_date', 'r.delivery_code',
        'po.purchase_order_number', 'po.purchase_order_book_number', totalPrice)
      .join('pc_purchasing_order as po', 'r.purchase_order_id', 'po.purchase_order_id')
      .join('wm_receive_approve as ra', 'r.receive_id', 'ra.receive_id')
      .where((w) => {
        w.where('r.receive_code', 'like', _q)
          .orWhere('r.delivery_code', 'like', _q)
          .orWhere('po.purchase_order_number', 'like', _q)
          .orWhere('po.purchase_order_book_number', 'like', _q)
      })
      // .where('po.purchase_order_status', 'COMPLETED')
      .where('po.is_cancel', 'N')
      .where('r.is_cancel', 'N');
  }

  getDetail(knex: Knex, payableId) {
    let totalPrice = knex('wm_receive_detail as rd')
      .select(knex.raw('sum(rd.cost*rd.receive_qty)')).as('total_price')
      .whereRaw('rd.receive_id = r.receive_id')

    return knex('ar_payable_details as pd')
      .select('r.receive_id', 'r.receive_code', 'r.receive_date', 'r.delivery_code', totalPrice)
      .join('wm_receives as r', 'r.receive_id', 'pd.receive_id')
      .where('pd.payable_id', payableId)
  }

  saveHead(knex: Knex, obj) {
    return knex('ar_payables')
      .insert(obj, 'payable_id');
  }

  saveDetail(knex: Knex, obj) {
    return knex('ar_payable_details')
      .insert(obj);
  }

  deleteDetail(knex: Knex, payableId) {
    return knex('ar_payable_details')
      .delete()
      .where('payable_id', payableId)
  }

  accountPayableByPayableId(knex: Knex, payableId) {
    return knex('ar_payables as p')
      .select('r.delivery_code', 'r.delivery_date', 'po.purchase_order_id', 'po.purchase_order_number', 'po.purchase_order_book_number',
        'r.receive_code', 'r.delivery_code', 'ml.labeler_id', knex.raw('sum(rd.cost*rd.receive_qty) as cost'),
        'ml.labeler_name', 'p.payable_date', 'p.payable_code')
      .join('ar_payable_details as pd', 'p.payable_id', 'pd.payable_id')
      .join('wm_receives as r', 'r.receive_id', 'pd.receive_id')
      .join('wm_receive_detail as rd', 'rd.receive_id', 'r.receive_id')
      .join('wm_receive_approve as ra', 'r.receive_id', 'ra.receive_id')
      .join('pc_purchasing_order as po', 'r.purchase_order_id', 'po.purchase_order_id')
      .join('mm_labelers as ml', 'ml.labeler_id', 'po.labeler_id')
      .join('mm_products as mp', 'mp.product_id', 'rd.product_id')
      .join('mm_generics as mg', 'mg.generic_id', 'mp.generic_id')
      .where('p.payable_id', payableId)
      .groupBy('r.receive_id')
      .orderBy('pd.payable_detail_id');
  }
  comma(num) {
    if (num === null) { return ('0.00'); }
    let minus = false;
    if (num < 0) {
      minus = true;
      num = Math.abs(num);
    }
    var number = +num
    num = number.toFixed(2);
    let deci = num.substr(num.length - 2, num.length);
    num = num.substr(0, num.length - 3);

    var l = num.toString().length
    var num2 = '';
    var c = 0;
    for (var i = l - 1; i >= 0; i--) {
      c++;
      if (c == 3 && num[i - 1] != null) { c = 0; num2 = ',' + num[i] + num2 }
      else num2 = num[i] + num2
    }
    if (minus) {
      return '-' + num2 + '.' + deci;
    } else {
      return num2 + '.' + deci;
    }

  }
}