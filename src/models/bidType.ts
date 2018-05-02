import * as Knex from 'knex';

export default class BidTypeModel {

  getBidType(knex: Knex) {
    return knex('l_bid_type')
      .orderBy('bid_name');
  }

  insertBidType(knex: Knex, data: any) {
    return knex('l_bid_type')
      .insert(data);
  }

  updateBidType(knex: Knex, bidId, data) {
    return knex('l_bid_type')
      .where('bid_id', bidId)
      .update(data);
  }

  deleteBidType(knex: Knex, bidId) {
    return knex('l_bid_type')
      .where('bid_id', bidId)
      .del();
  }

  updateNonDefault(knex: Knex) {
    return knex('l_bid_type')
      .update('isdefault', 'N');
  }

}