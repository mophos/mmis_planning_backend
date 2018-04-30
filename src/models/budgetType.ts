import * as Knex from 'knex';

export default class BudgetTypeModel {

  getBudgetType(knex: Knex) {
    return knex('bm_bgtype as bg')
      .orderBy('bg.bgtype_name');
  }

  insertBudgetType(knex: Knex, data: any) {
    return knex('bm_bgtype')
      .insert(data);
  }

  updateBudgetType(knex: Knex, typeId, data) {
    return knex('bm_bgtype')
      .where('bgtype_id', typeId)
      .update(data);
  }

  deleteBudgetType(knex: Knex, typeId) {
    return knex('bm_bgtype')
      .where('bgtype_id', typeId)
      .del();
  }

}