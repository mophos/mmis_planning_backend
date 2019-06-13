DROP PROCEDURE IF EXISTS `forecast_v2`;
DELIMITER ;;
CREATE PROCEDURE `forecast_v2`(IN in_forecast_year INT, IN in_warehouse_id INT)
BEGIN
DECLARE v_start_date VARCHAR(10);
DECLARE v_end_date VARCHAR(10);
DROP TEMPORARY TABLE IF EXISTS forecast_tmp;
CREATE TEMPORARY TABLE IF NOT EXISTS `forecast_tmp` (
  `generic_id` VARCHAR(15) NOT NULL,
  `warehouse_id` INT(3) NOT NULL,
  `forecast_year` CHAR(4) NOT NULL,
  `sumy3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `monthy3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `ratey3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `sumy2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `monthy2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `ratey2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `sumy1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `monthy1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `ratey1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `sumy4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `monthy4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `ratey4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q4` DECIMAL(32,16) NOT NULL DEFAULT 0,

  `min_qty` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `stock` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `buy` DECIMAL(32,16) NOT NULL DEFAULT 0,
  PRIMARY KEY (`generic_id`, `warehouse_id`,`forecast_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into forecast_tmp(generic_id, warehouse_id, forecast_year, stock, min_qty)
select mg.generic_id, in_warehouse_id, in_forecast_year, IFNULL(stock_qty, 0), IFNULL(mg.min_qty, 0)
from mm_generics mg
left join(
  select generic_id, sum(stock_qty) stock_qty
  from view_product_reserve
  where warehouse_id = in_warehouse_id
  group by generic_id
) vg on vg.generic_id = mg.generic_id
where is_active = 'Y'
and mark_deleted = 'N';

-- y3
SET v_start_date = CONCAT(in_forecast_year-1, '-10-01');
SET v_end_date = CONCAT(in_forecast_year, '-09-30');

update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) sumy3, count(distinct(month(s.stock_date))) monthy3
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 3 YEAR) and DATE_SUB(v_end_date, INTERVAL 3 YEAR)
          and s.transaction_type in ('ISS', 'IST', 'HIS', 'REQ_OUT', 'TRN_OUT', 'ADD_OUT')
          and s.ref_src = in_warehouse_id
          group by s.generic_id
) r
set t.sumy3 = r.sumy3,
t.monthy3 = r.monthy3
where t.generic_id = r.generic_id;

-- y2
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) sumy2, count(distinct(month(s.stock_date))) monthy2
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 2 YEAR) and DATE_SUB(v_end_date, INTERVAL 2 YEAR)
          and s.transaction_type in ('ISS', 'IST', 'HIS', 'REQ_OUT', 'TRN_OUT', 'ADD_OUT')
          and s.ref_src = in_warehouse_id
          group by s.generic_id
) r
set t.sumy2 = r.sumy2,
t.monthy2 = r.monthy2
where t.generic_id = r.generic_id;

-- y1
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) sumy1, count(distinct(month(s.stock_date))) monthy1
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 1 YEAR) and DATE_SUB(v_end_date, INTERVAL 1 YEAR)
          and s.transaction_type in ('ISS', 'IST', 'HIS', 'REQ_OUT', 'TRN_OUT', 'ADD_OUT')
          and s.ref_src = in_warehouse_id
          group by s.generic_id
) r
set t.sumy1 = r.sumy1,
t.monthy1 = r.monthy1
where t.generic_id = r.generic_id;

-- rate per year

-- update forecast_tmp
-- set 
-- ratey3 = IF(monthy3 = 0, 0, sumy3/monthy3) * 12,
-- ratey2 = IF(monthy3 = 0, 0, sumy2/monthy2) * 12,
-- ratey1 = IF(monthy3 = 0, 0, sumy1/monthy1) * 12;

update forecast_tmp
set 
sumy4 = sumy3 + sumy2 + sumy1,
monthy4 = monthy3 + monthy2 + monthy1;

update forecast_tmp
set 
sumy4 = IF(monthy4 = 0, 0, sumy4/monthy4) + min_qty;

update forecast_tmp
set buy = IF(sumy4-stock < 0, 0, sumy4-stock);

update forecast_tmp
set y4q1 = IF(buy MOD 4 = 0, buy DIV 4, buy DIV 4),
y4q2 = IF(buy MOD 4 = 0, buy DIV 4, buy DIV 4),
y4q3 = IF(buy MOD 4 = 0, buy DIV 4, buy DIV 4),
y4q4 = IF(buy MOD 4 = 0, buy DIV 4, buy MOD 4);

update forecast_tmp
set buy = (y4q1+y4q2+y4q3+y4q4);

insert into bm_planning_forecast(generic_id, warehouse_id, forecast_year, sumy3, sumy2, sumy1, y4q1, y4q2, y4q3, y4q4, sumy4, stock_qty, buy_qty)
select generic_id, warehouse_id, forecast_year, sumy3, sumy2, sumy1, y4q1, y4q2, y4q3, y4q4, sumy4, stock, buy from forecast_tmp t
            ON DUPLICATE KEY UPDATE
            sumy3 = t.sumy3,
            sumy2 = t.sumy2,
            sumy1 = t.sumy1, 
            y4q1 = t.y4q1, 
            y4q2 = t.y4q2, 
            y4q3 = t.y4q3, 
            y4q4 = t.y4q4, 
            sumy4 = t.sumy4,
            stock_qty = t.stock,
            buy_qty = t.buy,
            process_date = NOW();

update mm_generics t,
(
  select sc.generic_id, sc.unit_generic_id 
  from wm_stock_card sc
  join (
    select max(stock_card_id) last_id
    from wm_stock_card
    where unit_generic_id IS NOT NULL
    group by generic_id
  )lu on lu.last_id = sc.stock_card_id
) s
set t.planning_unit_generic_id = s.unit_generic_id
where t.generic_id = s.generic_id;

END;;
DELIMITER ;