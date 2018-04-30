import * as Knex from 'knex';

export default class BudgetSourceModel {

  getBudgetSource(knex: Knex) {
    return knex('bm_budget_source')
      .orderBy('bgsource_name');
  }

  insertBudgetSource(knex: Knex, data) {
    return knex('bm_budget_source')
      .insert(data);
  }

  updateBudgetSource(knex: Knex, sourceId, data) {
    return knex('bm_budget_source')
      .where('bgsource_id', sourceId)
      .update(data);
  }

  deleteBudgetSource(knex: Knex, sourceId) {
    return knex('bm_budget_source')
      .where('bgsource_id', sourceId)
      .del();
  }

}