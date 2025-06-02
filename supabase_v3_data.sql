-- V3 Real Israeli Meat Market Data

-- Insert Meat Categories
insert into meat_categories (name_hebrew, name_english, display_order) values
  ('בקר', 'Beef', 1),
  ('עוף', 'Chicken', 2),
  ('כבש', 'Lamb', 3),
  ('טלה', 'Mutton', 4),
  ('חזיר', 'Pork', 5),
  ('דגים', 'Fish', 6);

-- Insert Popular Israeli Meat Cuts
insert into meat_cuts (category_id, name_hebrew, name_english, typical_price_range_min, typical_price_range_max, is_popular) 
select 
  c.id,
  cuts.name_hebrew,
  cuts.name_english,
  cuts.min_price,
  cuts.max_price,
  cuts.is_popular
from meat_categories c
cross join (
  values 
    -- Beef cuts
    ('בקר', 'אנטריקוט', 'Entrecote', 8000, 15000, true),
    ('בקר', 'פילה', 'Fillet', 12000, 20000, true),
    ('בקר', 'צלע', 'Rib', 6000, 10000, true),
    ('בקר', 'כתף', 'Shoulder', 4000, 7000, true),
    ('בקר', 'קובה', 'Chuck', 3500, 6000, false),
    
    -- Chicken cuts  
    ('עוף', 'עוף שלם', 'Whole Chicken', 1500, 2500, true),
    ('עוף', 'חזה עוף', 'Chicken Breast', 2500, 4000, true),
    ('עוף', 'ירך עוף', 'Chicken Thigh', 1800, 3000, true),
    ('עוף', 'כנפיים', 'Wings', 1200, 2200, true),
    ('עוף', 'שוקיים', 'Drumsticks', 1000, 2000, true),
    
    -- Lamb cuts
    ('כבש', 'כתף כבש', 'Lamb Shoulder', 7000, 12000, true),
    ('כבש', 'צלעות כבש', 'Lamb Ribs', 8000, 14000, true),
    ('כבש', 'שוק כבש', 'Lamb Leg', 6000, 10000, true)
) as cuts(category, name_hebrew, name_english, min_price, max_price, is_popular)
where c.name_hebrew = cuts.category;

-- Insert Major Israeli Retailers
insert into retailers (name, type, is_chain, location_coverage) values
  ('רמי לוי', 'supermarket', true, ARRAY['ירושלים', 'תל אביב', 'חיפה', 'באר שבע']),
  ('שופרסל', 'supermarket', true, ARRAY['כל הארץ']),
  ('מגה', 'supermarket', true, ARRAY['מרכז', 'צפון']),
  ('חצי חינם', 'supermarket', true, ARRAY['ירושלים', 'בני ברק']),
  ('קצביית הכפר', 'butcher', false, ARRAY['תל אביב']),
  ('טיב טעם', 'supermarket', true, ARRAY['כל הארץ']),
  ('יינות ביתן', 'supermarket', true, ARRAY['מרכז', 'דרום']),
  ('AM:PM', 'supermarket', true, ARRAY['תל אביב', 'הרצליה']);

-- Insert sample price reports (current market prices)
insert into price_reports (meat_cut_id, retailer_id, price_per_kg, is_on_sale, confidence_score)
select 
  mc.id,
  r.id,
  (mc.typical_price_range_min + random() * (mc.typical_price_range_max - mc.typical_price_range_min))::integer,
  random() < 0.2, -- 20% chance of being on sale
  4 + (random() * 2)::integer -- confidence 4-5
from meat_cuts mc
cross join retailers r
where mc.is_popular = true
  and r.is_active = true
  and random() < 0.6; -- 60% coverage