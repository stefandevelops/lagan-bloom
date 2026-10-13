import { ZONES } from './data.js';
import { belfastNow, toMinutes, minutesOf, dayLabel, isoDate, formatTime } from './time.js';

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;
const UK_OUTWARD = /^[A-Z]{1,2}\d[A-Z\d]?$/;

export function normalisePostcode(raw) {
  const s = raw.toUpperCase().replace(/\s+/g, '');
  if (s.length > 4) return `${s.slice(0, -3)} ${s.slice(-3)}`;
  return s;
}

export function lookupPostcode(raw) {
  const pc = normalisePostcode(raw.trim());
  if (!pc) return { ok: false, reason: 'empty' };
  if (!UK_POSTCODE.test(pc) && !UK_OUTWARD.test(pc)) return { ok: false, reason: 'invalid', pc };
  const m = pc.match(/^BT(\d{1,2})\b/);
  if (!m) return { ok: false, reason: 'outside', pc };
  const district = Number(m[1]);
  if (district < 1 || district > 94) return { ok: false, reason: 'invalid', pc };
  const zone = ZONES.find((z) => z.districts && z.districts.includes(district)) || ZONES[ZONES.length - 1];
  return { ok: true, pc, district, zone };
}

export function deliveryFee(zone, subtotal) {
  if (zone.freeOver && subtotal >= zone.freeOver) return 0;
  return zone.price;
}

// Monday–Saturday for local zones, Tuesday–Saturday for the courier.
export function deliveryDates(zone, count = 8, now = belfastNow()) {
  const out = [];
  const beforeCutoff = minutesOf(now) < toMinutes(zone.cutoff);
  for (let i = 0; out.length < count && i < 21; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0) continue;
    if (!zone.sameDay && dow === 1) continue;
    if (i === 0 && (!zone.sameDay || !beforeCutoff)) continue;
    if (i === 1 && !zone.sameDay && !beforeCutoff) continue;
    out.push({ iso: isoDate(d), label: dayLabel(d, now) });
  }
  return out;
}

export function describeResult(res, subtotal = 0) {
  if (!res.ok) {
    if (res.reason === 'empty') return { tone: 'warn', html: 'Pop a postcode in and we\'ll check.' };
    if (res.reason === 'invalid') return { tone: 'warn', html: `<b>${res.pc}</b> doesn't look like a full UK postcode. Try something like BT9 6GD.` };
    return {
      tone: 'warn',
      html: `Sorry, we only deliver within Northern Ireland, so <b>${res.pc}</b> is outside our area. Ring us on 028 9649 6123 and we'll recommend a florist we trust near you.`,
    };
  }
  const { zone, pc } = res;
  const first = deliveryDates(zone, 1)[0];
  const fee = deliveryFee(zone, subtotal);
  const price = fee === 0 ? 'free' : `£${fee.toFixed(2)}`;
  const free = zone.freeOver ? ` (free over £${zone.freeOver})` : '';
  const when = zone.sameDay
    ? `Order before <b>${formatTime(zone.cutoff)}</b> for same-day delivery. Earliest right now: <b>${first.label}</b>.`
    : `Earliest delivery: <b>${first.label}</b>.`;
  return { tone: 'ok', html: `Yes, we deliver to <b>${pc}</b> · <b>${zone.name}</b>, ${price}${free}.<br>${when}` };
}
