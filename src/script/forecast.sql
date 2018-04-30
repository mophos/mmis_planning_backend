DROP PROCEDURE IF EXISTS `forecast`;
DELIMITER ;;
CREATE PROCEDURE `forecast`(IN in_forecast_year INT)
BEGIN
DECLARE v_start_date VARCHAR(10);
DECLARE v_end_date VARCHAR(10);
DROP TEMPORARY TABLE IF EXISTS forecast_tmp;
CREATE TEMPORARY TABLE IF NOT EXISTS `forecast_tmp` (
  `generic_id` VARCHAR(15) NOT NULL,
  `forecast_year` char(4) NOT NULL,
  `y3q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y3q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y3q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y3q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `sumy3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `avgy3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy3q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy3q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy3q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy3q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `y2q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y2q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y2q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y2q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `sumy2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `avgy2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy2q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy2q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy2q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy2q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `y1q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y1q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y1q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y1q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `sumy1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `avgy1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy1q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy1q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy1q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy1q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  
  `y4q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `y4q4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `sumy4` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy4q1` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy4q2` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy4q3` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `idxy4q4` DECIMAL(32,16) NOT NULL DEFAULT 0,

  `stock` DECIMAL(32,16) NOT NULL DEFAULT 0,
  `buy` DECIMAL(32,16) NOT NULL DEFAULT 0,
  PRIMARY KEY (`generic_id`, `forecast_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

insert into forecast_tmp(generic_id, forecast_year, stock)
select mg.generic_id, in_forecast_year, stock_qty 
from mm_generics mg
left join(
  select generic_id, sum(stock_qty) stock_qty
  from view_product_reserve
  group by generic_id
) vg on vg.generic_id = mg.generic_id;

-- y3q1
SET v_start_date = CONCAT(in_forecast_year-1, '-10-01');
SET v_end_date = CONCAT(in_forecast_year-1, '-12-31');

update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y3q1
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 3 YEAR) and DATE_SUB(v_end_date, INTERVAL 3 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y3q1 = r.y3q1
where t.generic_id = r.generic_id;

-- y2q1
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y2q1
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 2 YEAR) and DATE_SUB(v_end_date, INTERVAL 2 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y2q1 = r.y2q1
where t.generic_id = r.generic_id;

-- y1q1
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y1q1
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 1 YEAR) and DATE_SUB(v_end_date, INTERVAL 1 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y1q1 = r.y1q1
where t.generic_id = r.generic_id;

-- y3q2
SET v_start_date = CONCAT(in_forecast_year, '-01-01');
SET v_end_date = CONCAT(in_forecast_year, '-03-31');

update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y3q2
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 3 YEAR) and DATE_SUB(v_end_date, INTERVAL 3 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y3q2 = r.y3q2
where t.generic_id = r.generic_id;

-- y2q2
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y2q2
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 2 YEAR) and DATE_SUB(v_end_date, INTERVAL 2 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y2q2 = r.y2q2
where t.generic_id = r.generic_id;

-- y1q2
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y1q2
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 1 YEAR) and DATE_SUB(v_end_date, INTERVAL 1 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y1q2 = r.y1q2
where t.generic_id = r.generic_id;

-- y3q3
SET v_start_date = CONCAT(in_forecast_year, '-04-01');
SET v_end_date = CONCAT(in_forecast_year, '-06-30');

update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y3q3
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 3 YEAR) and DATE_SUB(v_end_date, INTERVAL 3 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y3q3 = r.y3q3
where t.generic_id = r.generic_id;

-- y2q3
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y2q3
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 2 YEAR) and DATE_SUB(v_end_date, INTERVAL 2 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y2q3 = r.y2q3
where t.generic_id = r.generic_id;

-- y1q3
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y1q3
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 1 YEAR) and DATE_SUB(v_end_date, INTERVAL 1 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y1q3 = r.y1q3
where t.generic_id = r.generic_id;

-- y3q4
SET v_start_date = CONCAT(in_forecast_year, '-07-01');
SET v_end_date = CONCAT(in_forecast_year, '-09-30');

update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y3q4
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 3 YEAR) and DATE_SUB(v_end_date, INTERVAL 3 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y3q4 = r.y3q4
where t.generic_id = r.generic_id;

-- y2q4
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y2q4
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 2 YEAR) and DATE_SUB(v_end_date, INTERVAL 2 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y2q4 = r.y2q4
where t.generic_id = r.generic_id;

-- y1q4
update forecast_tmp t,
(
select s.generic_id, sum(s.out_qty) y1q4
          from wm_stock_card s
          where s.stock_date between DATE_SUB(v_start_date, INTERVAL 1 YEAR) and DATE_SUB(v_end_date, INTERVAL 1 YEAR)
          and s.transaction_type in ('ISS', 'HIS')
          group by s.generic_id
) r
set t.y1q4 = r.y1q4
where t.generic_id = r.generic_id;

-- y3
update forecast_tmp
set 
sumy3 = y3q1+y3q2+y3q3+y3q4,
avgy3 = (y3q1+y3q2+y3q3+y3q4)/4;

update forecast_tmp
set 
idxy3q1 = IF(avgy3 = 0, 0, y3q1/avgy3),
idxy3q2 = IF(avgy3 = 0, 0, y3q2/avgy3),
idxy3q3 = IF(avgy3 = 0, 0, y3q3/avgy3),
idxy3q4 = IF(avgy3 = 0, 0, y3q4/avgy3);

-- y2
update forecast_tmp
set 
sumy2 = y2q1+y2q2+y2q3+y2q4,
avgy2 = (y2q1+y2q2+y2q3+y2q4)/4;

update forecast_tmp
set 
idxy2q1 = IF(avgy2 = 0, 0, y2q1/avgy2),
idxy2q2 = IF(avgy2 = 0, 0, y2q2/avgy2),
idxy2q3 = IF(avgy2 = 0, 0, y2q3/avgy2),
idxy2q4 = IF(avgy2 = 0, 0, y2q4/avgy2);

-- y1
update forecast_tmp
set 
sumy1 = y1q1+y1q2+y1q3+y1q4,
avgy1 = (y1q1+y1q2+y1q3+y1q4)/4;

update forecast_tmp
set 
idxy1q1 = IF(avgy1 = 0, 0, y1q1/avgy1),
idxy1q2 = IF(avgy1 = 0, 0, y1q2/avgy1),
idxy1q3 = IF(avgy1 = 0, 0, y1q3/avgy1),
idxy1q4 = IF(avgy1 = 0, 0, y1q4/avgy1);

-- y4
update forecast_tmp
set 
idxy4q1 = (idxy3q1+idxy2q1+idxy1q1)/3,
idxy4q2 = (idxy3q2+idxy2q2+idxy1q2)/3,
idxy4q3 = (idxy3q3+idxy2q3+idxy1q3)/3,
idxy4q4 = (idxy3q4+idxy2q4+idxy1q4)/3;

update forecast_tmp
set 
y4q1 = idxy4q1*avgy3,
y4q2 = idxy4q2*avgy3,
y4q3 = idxy4q3*avgy3,
y4q4 = idxy4q4*avgy3;

update forecast_tmp
set sumy4 = (y4q1+y4q2+y4q3+y4q4);

update forecast_tmp
set buy = IF(sumy4-stock < 0, 0, sumy4-stock);

update forecast_tmp
set 
y4q1 = y4q1 - (y4q1 * (buy/sumy4)),
y4q2 = y4q2 - (y4q2 * (buy/sumy4)),
y4q3 = y4q3 - (y4q3 * (buy/sumy4)),
y4q4 = y4q4 - (y4q4 * (buy/sumy4));

update forecast_tmp
set buy = (y4q1+y4q2+y4q3+y4q4);

insert into bm_planning_forecast(generic_id, forecast_year, sumy3, sumy2, sumy1, y4q1, y4q2, y4q3, y4q4, sumy4, stock_qty, buy_qty)
select generic_id, forecast_year, sumy3, sumy2, sumy1, y4q1, y4q2, y4q3, y4q4, sumy4, stock, buy from forecast_tmp t
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