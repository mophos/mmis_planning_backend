import * as Knex from 'knex';

export default class BudgetSubTypeModel {

  getBudgetSubType(knex: Knex) {
    return knex('bm_bgtypesub')
      .orderBy('bgtypesub_name');
  }

  insertBudgetSubType(knex: Knex, data: any) {
    return knex('bm_bgtypesub')
      .insert(data);
  }

  updateBudgetSubType(knex: Knex, subTypeId, data) {
    return knex('bm_bgtypesub')
      .where('bgtypesub_id', subTypeId)
      .update(data);
  }

  deleteBudgetSubType(knex: Knex, subTypeId) {
    return knex('bm_bgtypesub')
      .where('bgtypesub_id', subTypeId)
      .del();
  }

}