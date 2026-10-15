import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('./001_catalog_seed.sql', import.meta.url), 'utf8');
const rows = (table) => {
  const marker = 'INSERT INTO '+table;
  const start = sql.indexOf(marker);
  assert.ok(start>=0, `missing ${table} seed`);
  const block = sql.slice(start).split(String.fromCharCode(13,10,13,10))[0].split(String.fromCharCode(10,10))[0];
  const columns = block.slice(block.indexOf('(')+1,block.indexOf(')')).split(',').map(value=>value.trim());
  const entries = block.slice(block.indexOf('VALUES')+6).split(String.fromCharCode(10)).filter(line=>line.trim().startsWith('('));
  return entries.map(line => {
    const values = [...line.matchAll(/'((?:[^']|'')*)'|\bNULL\b|\btrue\b|\bfalse\b|\b\d+\b|CURRENT_TIMESTAMP/gi)].map(item => item[1] ?? item[0]);
    assert.equal(values.length, columns.length, `${table}: malformed row ${line}`);
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
};
const ids = list => new Set(list.map(row => row.id));

test('demo seed is explicit, one-shot and isolated behind a separate target gate', () => {
  assert.match(sql, /current_setting\('stayfinder\.target_schema', true\).*current_schema\(\)/s);
  assert.match(sql, /current_setting\('stayfinder\.demo_seed_approved', true\).*'true'/s);
  assert.match(sql, /BEGIN;[\s\S]*COMMIT;/);
  assert.doesNotMatch(sql, /\b(?:DELETE|TRUNCATE|DROP|ON CONFLICT)\b/i);
  assert.doesNotMatch(sql, /INSERT INTO (?:reward_wallets|reward_ledger_entries|users|bookings)\b/i);
  assert.equal(rows('accommodations')[0].base_price, undefined);
  assert.equal(rows('room')[0].price, undefined);
});

test('catalog seed IDs, FKs, fee basis and offer terms are self-consistent', () => {
  const locations=rows('locations'), types=rows('accommodation_type'), features=rows('features');
  const stays=rows('accommodations'), rooms=rows('room'), images=rows('images');
  const links=rows('accommodation_features'), comparisons=rows('demo_price_comparisons'), rewards=rows('reward_offers');
  assert.deepEqual([locations.length,types.length,features.length,stays.length,rooms.length,images.length,links.length,comparisons.length,rewards.length],[4,4,8,4,5,4,10,7,4]);
  const all=[...locations,...types,...features,...stays,...rooms,...images,...comparisons,...rewards].map(row=>row.id);
  assert.equal(new Set(all).size,all.length);
  for(const stay of stays){assert.ok(ids(locations).has(stay.location_id));assert.ok(ids(types).has(stay.type_id));assert.equal(stay.status,'active');assert.equal(stay.timezone,'Asia/Ho_Chi_Minh');}
  for(const room of rooms){assert.ok(ids(stays).has(room.accommodation_id));assert.equal(room.status,'available');assert.ok(Number(room.nightly_price_cents)>0);assert.ok(Number(room.stock_total)>0);}
  for(const image of images)assert.ok(ids(stays).has(image.accommodation_id));
  for(const link of links){assert.ok(ids(stays).has(link.accommodation_id));assert.ok(ids(features).has(link.features_id));}
  for(const offer of comparisons){
    const room=rooms.find(row=>row.id===offer.room_id), stay=stays.find(row=>row.id===offer.accommodation_id);
    assert.ok(room&&stay);assert.equal(room.accommodation_id,stay.id);
    assert.equal(offer.currency,'USD');assert.equal(offer.includes_fees,'true');assert.equal(offer.cancellation_code,'free_before_checkin');
    assert.equal(offer.cleaning_fee_cents,stay.cleaning_fee_cents);assert.equal(offer.service_fee_cents,stay.service_fee_cents);
    assert.ok(Number(offer.nightly_price_cents)>0);
  }
  assert.deepEqual(Object.fromEntries(rewards.map(row=>[row.kind,Number(row.points_cost)])),{breakfast:5000,room_upgrade:12000,spa_credit:8500,discount_voucher:1000});
  const voucher=rewards.find(row=>row.kind==='discount_voucher');
  assert.equal(voucher.discount_percent,'5');assert.equal(voucher.discount_cap_cents,'2500');assert.equal(voucher.minimum_room_subtotal_cents,'10000');
  assert.equal(rewards.find(row=>row.kind==='spa_credit').benefit_value_cents,'5000');
});
