-- ============================================================================
-- فاز ۴.۱ — دادهٔ نمایشی/تستی (DEMO / TEST DATA — نه دادهٔ واقعی شرکت)
-- ============================================================================
-- هشدار مهم: تمام اعداد این فایل (قیمت، ساعت حرکت، مدت سفر، پلاک) ساختگی و
-- فقط برای تست کارکرد جست‌وجو/نتایج فاز ۴.۱ روی دیتابیس زنده است — دقیقاً
-- همان چیزی که routesPage.priceNote در lib/i18n.ts دربارهٔ اعداد نمونه هشدار
-- می‌دهد. **این فایل توسط من روی دیتابیس شما اجرا نشده** — طبق درخواست
-- خودتان، فقط اینجا تحویل داده می‌شود تا خودتان تصمیم بگیرید کِی/کجا
-- (ترجیحاً فقط محیط توسعه) اجرایش کنید.
--
-- اجرای مجدد امن است: هر بار اول رکوردهای قبلیِ همین اسکریپت را (بر اساس
-- کد بس‌های DEMO-VIP-1 / DEMO-STD-1) پاک می‌کند و دوباره می‌سازد.
--
-- چه چیزی می‌سازد:
--   • ۲ بس نمایشی: یک وی‌آی‌پی (۳۳ چوکی، همهٔ امکانات) و یک استاندارد
--     (۴۸ چوکی، فقط تهویه+شارژر)
--   • ۴ مسیر: کابل↔هرات و کابل↔کندهار (هر جهت یک رکورد)
--   • برای هر مسیر، ۲ سفر روزانه (صبح با بس VIP، عصر با بس استاندارد) در
--     ۳ روز آینده (امروز، فردا، پس‌فردا) = ۲۴ سفر
--   • نقشهٔ کامل صندلی هر سفر، با یک الگوی «رزروشده» قطعی (نه تصادفی) تا
--     seatsLeft در نتایج جست‌وجو معنادار نمایش داده شود
-- ============================================================================

do $$
declare
  v_vip_bus_id   uuid;
  v_std_bus_id   uuid;
  v_route_id     uuid;
  v_trip_id      uuid;
  v_bus_id       uuid;
  v_bus_type     bus_type;
  v_total_seats  int;
  v_per_row      int;
  cols_left      text[];
  cols_right     text[];
  v_day          int;
  v_row          int;
  v_col          text;
  sched          record;
begin
  -- ۰. پاک‌سازی اجرای قبلیِ همین اسکریپت (idempotent)
  delete from trip_seats where trip_id in (
    select id from trips where bus_id in (select id from buses where code in ('DEMO-VIP-1', 'DEMO-STD-1'))
  );
  delete from trips where bus_id in (select id from buses where code in ('DEMO-VIP-1', 'DEMO-STD-1'));
  delete from routes r using cities o, cities d
    where r.origin_city_id = o.id
      and r.destination_city_id = d.id
      and (o.name_en, d.name_en) in
          (('Kabul', 'Herat'), ('Herat', 'Kabul'), ('Kabul', 'Kandahar'), ('Kandahar', 'Kabul'));
  delete from buses where code in ('DEMO-VIP-1', 'DEMO-STD-1');

  -- ۱. بس‌های نمایشی
  insert into buses (code, bus_type, total_seats, status, amenities)
    values ('DEMO-VIP-1', 'vip', 33, 'active', array['ac', 'wifi', 'charging', 'refreshment', 'reclining'])
    returning id into v_vip_bus_id;

  insert into buses (code, bus_type, total_seats, status, amenities)
    values ('DEMO-STD-1', 'standard', 48, 'active', array['ac', 'charging'])
    returning id into v_std_bus_id;

  -- ۲. برای هر (مبدأ، مقصد، قیمت، ساعت حرکت، مدت تقریبی) یک مسیر (در صورت
  --    نبودن) + سفرهای ۳ روز آینده + نقشهٔ صندلی می‌سازد.
  for sched in
    select * from (values
      ('Kabul',     'Herat',    900::numeric,  '06:00'::time, 600),
      ('Kabul',     'Herat',    1350::numeric, '14:00'::time, 600),
      ('Herat',     'Kabul',    900::numeric,  '06:00'::time, 600),
      ('Herat',     'Kabul',    1350::numeric, '14:00'::time, 600),
      ('Kabul',     'Kandahar', 700::numeric,  '07:00'::time, 420),
      ('Kabul',     'Kandahar', 1100::numeric, '15:00'::time, 420),
      ('Kandahar',  'Kabul',    700::numeric,  '07:00'::time, 420),
      ('Kandahar',  'Kabul',    1100::numeric, '15:00'::time, 420)
    ) as t(from_en, to_en, price, dep_time, duration_min)
  loop
    select r.id into v_route_id
    from routes r
    join cities o on o.id = r.origin_city_id
    join cities d on d.id = r.destination_city_id
    where o.name_en = sched.from_en and d.name_en = sched.to_en;

    if v_route_id is null then
      insert into routes (origin_city_id, destination_city_id, typical_duration_minutes, is_active)
      select o.id, d.id, sched.duration_min, true
      from cities o, cities d
      where o.name_en = sched.from_en and d.name_en = sched.to_en
      returning id into v_route_id;
    end if;

    -- ساعت‌های صبح (۰۶/۰۷) با بس VIP، ساعت‌های عصر (۱۴/۱۵) با بس استاندارد.
    if sched.dep_time in ('06:00', '07:00') then
      v_bus_id := v_vip_bus_id; v_bus_type := 'vip'; v_total_seats := 33;
      cols_left := array['A']; cols_right := array['B', 'C'];
    else
      v_bus_id := v_std_bus_id; v_bus_type := 'standard'; v_total_seats := 48;
      cols_left := array['A', 'B']; cols_right := array['C', 'D'];
    end if;
    v_per_row := array_length(cols_left, 1) + array_length(cols_right, 1);

    for v_day in 0..2 loop
      insert into trips (
        route_id, bus_id, service_date, departure_time, schedule_type,
        price_per_seat, total_seats_snapshot, status
      )
      values (
        v_route_id, v_bus_id, current_date + v_day, sched.dep_time, 'fixed_time',
        sched.price, v_total_seats, 'scheduled'
      )
      returning id into v_trip_id;

      for v_row in 1 .. (v_total_seats / v_per_row) loop
        foreach v_col in array (cols_left || cols_right) loop
          insert into trip_seats (trip_id, seat_number, row_number, col_label, status)
          values (
            v_trip_id,
            v_row::text || v_col,
            v_row,
            v_col,
            -- الگوی رزروشدهٔ قطعی (نه تصادفی) — حدود یک‌سوم چوکی‌ها، تا
            -- seatsLeft در هر سفر نمایشی متفاوت و معنادار باشد.
            case when (v_row + v_day) % 3 = 0 then 'booked' else 'available' end
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;
