import Lenis from 'lenis';
import { PRODUCTS, CATEGORIES, SUBSCRIPTIONS, WORKSHOPS, HOURS, ZONES } from './data.js';
import { cart } from './cart.js';
import { belfastNow, openStatus, toMinutes, minutesOf, formatCountdown, formatTime } from './time.js';
import { lookupPostcode, describeResult, deliveryDates, deliveryFee, normalisePostcode } from './delivery.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => `£${n.toFixed(2).replace(/\.00$/, '')}`;
const money2 = (n) => `£${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- smooth scroll ---------- */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = reduceMotion ? null : new Lenis({ lerp: 0.1 });
if (lenis) {
  const raf = (t) => {
    lenis.raf(t);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
function scrollToTarget(target) {
  const offset = -($('#header').offsetHeight + 12);
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'auto' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  closeMenu();
  if (a.dataset.filterLink) setFilter(a.dataset.filterLink);
  scrollToTarget(a.getAttribute('href'));
});

/* ---------- header ---------- */
const header = $('#header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const menuBtn = $('#menu-btn');
const nav = $('#nav');
function closeMenu() {
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.textContent = 'Menu';
}
menuBtn.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
});

/* ---------- announcement: same-day cut-off ---------- */
function updateCutoff() {
  const now = belfastNow();
  const city = ZONES[0];
  const left = toMinutes(city.cutoff) - minutesOf(now);
  const el = $('#cutoff-text');
  if (now.getDay() !== 0 && left > 0) {
    el.innerHTML = `Order in the next <b>${formatCountdown(left)}</b> for same-day delivery across Belfast.`;
  } else {
    const next = now.getDay() === 6 || now.getDay() === 0 ? 'Monday' : 'tomorrow';
    el.innerHTML = `Same-day delivery has closed for today. Order now for delivery <b>${next}</b> across Belfast.`;
  }
}

/* ---------- opening hours ---------- */
function renderHours() {
  const now = belfastNow();
  const order = [1, 2, 3, 4, 5, 6, 0];
  $('#hours').innerHTML = order
    .map((i) => {
      const h = HOURS[i];
      return `<tr class="${i === now.getDay() ? 'today' : ''}"><td>${h.day}</td><td>${formatTime(h.open)} – ${formatTime(h.close)}</td></tr>`;
    })
    .join('');
  const s = openStatus(now);
  const el = $('#open-status');
  el.textContent = s.text;
  el.classList.toggle('open', s.open);
}

/* ---------- products ---------- */
const grid = $('#products');
const chosen = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]));

grid.innerHTML = PRODUCTS.map(
  (p) => `
  <article class="card reveal" data-cat="${p.category}" data-id="${p.id}">
    <div class="card-media">
      <img src="${p.img}" alt="${esc(p.name)}: ${esc(p.blurb)}" loading="lazy" />
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
    </div>
    <h3>${p.name}<span class="price">${money(p.sizes[0][1])}</span></h3>
    <p>${p.blurb}</p>
    ${
      p.sizes.length > 1
        ? `<div class="sizes" role="group" aria-label="Size for ${esc(p.name)}">${p.sizes
            .map(([label], i) => `<button type="button" data-size="${i}" aria-pressed="${i === 0}">${label}</button>`)
            .join('')}</div>`
        : '<div class="sizes"></div>'
    }
    <button class="btn btn-primary" type="button" data-add="${p.id}">Add to basket</button>
  </article>`
).join('');

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const p = PRODUCTS.find((x) => x.id === card.dataset.id);
  const sizeBtn = e.target.closest('[data-size]');
  if (sizeBtn) {
    chosen[p.id] = Number(sizeBtn.dataset.size);
    $$('[data-size]', card).forEach((b) => b.setAttribute('aria-pressed', String(b === sizeBtn)));
    $('.price', card).textContent = money(p.sizes[chosen[p.id]][1]);
    return;
  }
  if (e.target.closest('[data-add]')) {
    const [option, price] = p.sizes[chosen[p.id]];
    cart.add({ id: p.id, kind: 'product', name: p.name, option, price, img: p.img });
    toast(`${p.name} (${option}) added to your basket`);
  }
});

const filters = $('#filters');
filters.innerHTML = CATEGORIES.map(
  ([id, label], i) => `<button type="button" role="tab" data-filter="${id}" aria-selected="${i === 0}">${label}</button>`
).join('');
function setFilter(cat) {
  $$('[data-filter]', filters).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === cat)));
  $$('.card', grid).forEach((c) => (c.hidden = cat !== 'all' && c.dataset.cat !== cat));
  lenis?.resize();
}
filters.addEventListener('click', (e) => {
  const b = e.target.closest('[data-filter]');
  if (b) setFilter(b.dataset.filter);
});

/* ---------- postcode checker ---------- */
$('#postcode-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#postcode-input');
  const res = lookupPostcode(input.value);
  if (res.pc) input.value = res.pc;
  const d = describeResult(res, cart.subtotal);
  $('#postcode-result').innerHTML = `<div class="result ${d.tone === 'warn' ? 'warn' : ''}">${d.html}</div>`;
  if (res.ok) sessionStorage.setItem('lb-postcode', res.pc);
});

/* ---------- subscriptions ---------- */
let subChoice = SUBSCRIPTIONS[0].id;
const subs = $('#subs');
subs.innerHTML = SUBSCRIPTIONS.map(
  (s) => `<button type="button" class="sub" role="radio" data-sub="${s.id}" aria-checked="${s.id === subChoice}">
      <b>${s.label}</b><span class="sub-price">${money(s.price)}</span><small>per delivery · ${s.note}</small></button>`
).join('');
subs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sub]');
  if (!b) return;
  subChoice = b.dataset.sub;
  $$('[data-sub]', subs).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
});
$('#sub-add').addEventListener('click', () => {
  const s = SUBSCRIPTIONS.find((x) => x.id === subChoice);
  cart.add({ id: s.id, kind: 'subscription', name: `${s.label} flower subscription`, option: 'First delivery', price: s.price, max: 1 });
  toast(`${s.label} subscription added. You'll only pay for the first delivery today.`);
});

/* ---------- workshops ---------- */
function renderWorkshops() {
  const now = belfastNow();
  $('#sessions').innerHTML = WORKSHOPS.filter((w) => new Date(w.date) > now)
    .map((w) => {
      const d = new Date(w.date);
      const day = d.toLocaleDateString('en-GB', { weekday: 'long' });
      const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '');
      const places = w.places === 0 ? 'Sold out' : w.places <= 3 ? `Only ${w.places} places left` : `${w.places} places left`;
      return `<li class="session reveal">
        <div class="session-date"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-GB', { month: 'short' })}</span></div>
        <div><h3>${w.title}</h3><p>${day}, ${time} · ${w.length} · ${money(w.price)} · <span class="places">${places}</span></p></div>
        <button class="btn ${w.places ? 'btn-primary' : 'btn-ghost'}" type="button" data-ws="${w.id}" ${w.places ? '' : 'disabled'}>${w.places ? 'Book' : 'Sold out'}</button>
      </li>`;
    })
    .join('');
}
$('#sessions').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ws]');
  if (!b) return;
  const w = WORKSHOPS.find((x) => x.id === b.dataset.ws);
  const d = new Date(w.date);
  const option = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  cart.add({ id: w.id, kind: 'workshop', name: w.title, option, price: w.price, max: w.places });
  toast(`A place on “${w.title}” added to your basket`);
});

/* ---------- forms ---------- */
function validate(form) {
  let ok = true;
  $$('[required]', form).forEach((el) => {
    const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
    el.classList.toggle('invalid', bad);
    if (bad && ok) el.focus();
    if (bad) ok = false;
  });
  return ok;
}
$('#wedding-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const status = $('#wedding-status');
  if (!validate(form)) {
    status.textContent = 'Please add your names, email and wedding date.';
    return;
  }
  const names = form.names.value.trim();
  status.textContent = `Thanks, ${names}. On the real site Niamh would reply within two working days. This is a demo, so nothing was sent.`;
  form.reset();
});
$('#newsletter').addEventListener('submit', (e) => {
  e.preventDefault();
  const status = $('#nl-status');
  if (!validate(e.currentTarget)) {
    status.textContent = 'That email address doesn\'t look quite right.';
    return;
  }
  status.textContent = 'You\'re on the list (demo only, nothing was sent).';
  e.currentTarget.reset();
});

/* ---------- toast ---------- */
const toastEl = $('#toast');
let toastTimer;
function toast(msg) {
  toastEl.innerHTML = `<span>${esc(msg)}</span><button type="button">View basket</button>`;
  $('button', toastEl).onclick = () => openDrawer();
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

/* ---------- basket drawer + checkout ---------- */
const drawer = $('#drawer');
const scrim = $('#scrim');
const body = $('#drawer-body');
const foot = $('#drawer-foot');
let step = 'basket';
const checkout = { method: 'delivery', postcode: sessionStorage.getItem('lb-postcode') || '', date: '', zone: null };

function openDrawer() {
  if (step === 'done') step = 'basket';
  render();
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('show'));
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  drawer.focus();
}
function closeDrawer() {
  scrim.classList.remove('show');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  lenis?.start();
  setTimeout(() => (scrim.hidden = true), 300);
  $('#basket-open').focus();
}
$('#basket-open').addEventListener('click', openDrawer);
$('#basket-close').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
});

function lineHtml(i) {
  const thumb = i.img ? `<img src="${i.img}" alt="" />` : `<div class="line-ph">${i.kind === 'workshop' ? '✂' : '✿'}</div>`;
  const qtyControl =
    (i.max ?? 20) > 1
      ? `<div class="qty"><button type="button" data-q="-1" aria-label="One fewer">−</button><output>${i.qty}</output><button type="button" data-q="1" aria-label="One more">+</button></div>`
      : '';
  return `<div class="line" data-key="${esc(i.key)}">${thumb}
    <div><h4>${esc(i.name)}</h4><small>${esc(i.option)}${i.kind === 'subscription' ? ' · then billed per delivery' : ''}</small>
    <button class="remove" type="button" data-remove>Remove</button></div>
    <div class="line-right"><b>${money2(i.price * i.qty)}</b>${qtyControl}</div></div>`;
}

function fee() {
  if (!cart.needsDelivery || checkout.method === 'collect' || !checkout.zone) return 0;
  return deliveryFee(checkout.zone, cart.subtotal);
}

function totalsHtml(showFee) {
  const f = fee();
  const feeRow = showFee
    ? `<div><span>${checkout.method === 'collect' ? 'Collection' : 'Delivery'}</span><span>${
        checkout.method === 'collect' || checkout.zone ? (f ? money2(f) : 'Free') : 'Add postcode'
      }</span></div>`
    : '';
  return `<div class="totals"><div><span>Subtotal</span><span>${money2(cart.subtotal)}</span></div>${feeRow}
    <div class="grand"><span>Total</span><span>${money2(cart.subtotal + (showFee ? f : 0))}</span></div></div>`;
}

function renderBasket() {
  $('#drawer-title').textContent = 'Your basket';
  if (!cart.items.length) {
    body.innerHTML = `<div class="empty"><h3>Your basket is empty</h3><p>Our bouquets are made fresh the day they go out.</p>
      <a class="btn btn-primary" href="#shop" data-close>Browse flowers</a></div>`;
    foot.innerHTML = '';
    return;
  }
  body.innerHTML = cart.items.map(lineHtml).join('');
  foot.innerHTML = `${totalsHtml(false)}<button class="btn btn-primary" type="button" data-next>Checkout</button>
    <p class="small muted" style="margin-top:10px;text-align:center">Delivery is calculated from your postcode at the next step.</p>`;
}

function renderCheckout() {
  $('#drawer-title').textContent = 'Checkout';
  const needs = cart.needsDelivery;
  const dates = checkout.zone ? deliveryDates(checkout.zone) : [];
  if (dates.length && !dates.some((d) => d.iso === checkout.date)) checkout.date = dates[0].iso;
  const zoneNote = checkout.zone
    ? `<p class="small">${checkout.zone.name}: ${checkout.zone.note}.</p>`
    : checkout.postcode
      ? '<p class="small" style="color:var(--terra)">We can\'t deliver to that postcode. Choose collection or try another.</p>'
      : '';

  const deliveryFields = `
    <label>Postcode<input name="postcode" value="${esc(checkout.postcode)}" placeholder="BT9 6GD" autocomplete="postal-code" required style="text-transform:uppercase" /></label>
    ${zoneNote}
    ${
      dates.length
        ? `<label>Delivery date<select name="date">${dates.map((d) => `<option value="${d.iso}" ${d.iso === checkout.date ? 'selected' : ''}>${d.label}</option>`).join('')}</select></label>`
        : ''
    }
    <label>Recipient's name<input name="recipient" required autocomplete="off" /></label>
    <label>Address<input name="address" required placeholder="House number and street" autocomplete="off" /></label>
    <label>Delivery note (optional)<input name="note" placeholder="e.g. leave with No. 12 if out" /></label>`;

  const collectFields = `<p class="small">Collect from <b>214 Lisburn Road</b>. We'll text you when it's ready, usually within two hours during opening times.</p>`;

  body.innerHTML = `<form class="checkout" id="checkout-form" novalidate>
    ${
      needs
        ? `<fieldset><legend>Delivery or collection</legend>
        <div class="method">
          <button type="button" data-method="delivery" aria-pressed="${checkout.method === 'delivery'}"><b>Delivery</b><small>Across Northern Ireland</small></button>
          <button type="button" data-method="collect" aria-pressed="${checkout.method === 'collect'}"><b>Click &amp; collect</b><small>Free, Lisburn Road</small></button>
        </div>
        ${checkout.method === 'delivery' ? deliveryFields : collectFields}
      </fieldset>`
        : ''
    }
    ${
      cart.items.some((i) => i.kind === 'product')
        ? `<fieldset><legend>Gift card message</legend>
        <label class="sr-only" for="card-msg">Message</label>
        <textarea id="card-msg" name="message" rows="3" maxlength="200" placeholder="Handwritten on a recycled card. Leave blank for no card."></textarea>
        <span class="char-count" id="char-count">0 / 200</span></fieldset>`
        : ''
    }
    <fieldset><legend>Your details</legend>
      <label>Your name<input name="name" required autocomplete="name" /></label>
      <label>Email<input name="email" type="email" required autocomplete="email" /></label>
      <label>Mobile<input name="phone" type="tel" required autocomplete="tel" placeholder="For delivery updates" /></label>
    </fieldset>
  </form>`;

  foot.innerHTML = `${totalsHtml(needs)}<button class="btn btn-primary" type="button" data-place>Place order · ${money2(cart.subtotal + fee())}</button>
    <button class="back-link" type="button" data-back>Back to basket</button>`;

  const form = $('#checkout-form');
  const pcInput = form.postcode;
  if (pcInput) {
    pcInput.addEventListener('change', () => {
      const res = lookupPostcode(pcInput.value);
      checkout.postcode = res.pc || normalisePostcode(pcInput.value);
      const zone = res.ok ? res.zone : null;
      if (zone?.id !== checkout.zone?.id) checkout.date = '';
      checkout.zone = zone;
      const keep = Object.fromEntries(new FormData(form));
      renderCheckout();
      restore(keep);
    });
  }
  form.date?.addEventListener('change', (e) => (checkout.date = e.target.value));
  const msg = form.message;
  msg?.addEventListener('input', () => ($('#char-count').textContent = `${msg.value.length} / 200`));
}

function restore(values) {
  const form = $('#checkout-form');
  if (!form) return;
  for (const [k, v] of Object.entries(values)) {
    if (k === 'postcode' || k === 'date') continue;
    if (form[k]) form[k].value = v;
  }
  if (form.message) $('#char-count').textContent = `${form.message.value.length} / 200`;
}

function renderDone(ref, summary) {
  $('#drawer-title').textContent = 'Order placed';
  body.innerHTML = `<div class="confirm"><div class="tick">✓</div><h3>Thank you!</h3>
    <p>Your order reference is <span class="ref">${ref}</span>.</p><p>${summary}</p>
    <p class="note">This is a demo site. No payment was taken and nothing was sent to the shop.</p>
    <button class="btn btn-primary" type="button" data-close style="margin-top:22px">Back to the shop</button></div>`;
  foot.innerHTML = '';
}

function render() {
  if (step === 'checkout' && cart.items.length) renderCheckout();
  else if (step !== 'done') {
    step = 'basket';
    renderBasket();
  }
}

drawer.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-close]')) {
    if (step === 'done') step = 'basket';
    closeDrawer();
    return;
  }
  const line = t.closest('.line');
  if (line) {
    const key = line.dataset.key;
    const it = cart.items.find((i) => i.key === key);
    if (t.closest('[data-remove]')) cart.remove(key);
    else if (t.closest('[data-q]')) cart.setQty(key, it.qty + Number(t.closest('[data-q]').dataset.q));
    return;
  }
  if (t.closest('[data-next]')) {
    step = 'checkout';
    if (checkout.postcode && !checkout.zone) {
      const res = lookupPostcode(checkout.postcode);
      checkout.zone = res.ok ? res.zone : null;
    }
    render();
    body.scrollTop = 0;
    return;
  }
  if (t.closest('[data-back]')) {
    step = 'basket';
    render();
    return;
  }
  const m = t.closest('[data-method]');
  if (m) {
    const keep = Object.fromEntries(new FormData($('#checkout-form')));
    checkout.method = m.dataset.method;
    renderCheckout();
    restore(keep);
    return;
  }
  if (t.closest('[data-place]')) placeOrder();
});

body.addEventListener('submit', (e) => {
  if (e.target.id !== 'checkout-form') return;
  e.preventDefault();
  placeOrder();
});

function placeOrder() {
  const form = $('#checkout-form');
  if (form.postcode && normalisePostcode(form.postcode.value) !== (checkout.postcode || '')) {
    form.postcode.dispatchEvent(new Event('change'));
    return;
  }
  if (!validate(form)) return;
  const needs = cart.needsDelivery;
  if (needs && checkout.method === 'delivery' && !checkout.zone) {
    form.postcode.classList.add('invalid');
    form.postcode.focus();
    return;
  }
  const ref = `LB-${Math.floor(100000 + Math.random() * 900000)}`;
  let summary = 'We\'ve emailed your receipt.';
  if (needs && checkout.method === 'delivery') {
    const d = deliveryDates(checkout.zone).find((x) => x.iso === checkout.date);
    summary = `Delivering to ${esc(form.recipient.value)} at ${esc(checkout.postcode)} <b>${d ? d.label.replace(/^(Today|Tomorrow), /, (_, w) => `${w.toLowerCase()}, `).replace(/^(?!today|tomorrow)/, 'on ') : checkout.date}</b>. We'll text you a photo when they're delivered.`;
  } else if (needs) {
    summary = 'We\'ll text you as soon as your flowers are ready to collect from 214 Lisburn Road.';
  }
  step = 'done';
  cart.clear();
  renderDone(ref, summary);
}

cart.subscribe(() => {
  const c = $('#basket-count');
  c.textContent = cart.count;
  c.classList.remove('bump');
  void c.offsetWidth;
  c.classList.add('bump');
  if (drawer.classList.contains('open') && step !== 'done') {
    if (step === 'checkout') {
      const keep = $('#checkout-form') ? Object.fromEntries(new FormData($('#checkout-form'))) : {};
      render();
      restore(keep);
    } else render();
  }
});

/* ---------- motion ---------- */
function setupReveal() {
  const targets = $$('.section-head, .split > *, .zone, .reviews blockquote, .faq, .workshops > figure, .card, .session, .facts');
  targets.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      }),
    { rootMargin: '0px 0px -8% 0px' }
  );
  targets.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
}

const heroImg = $('.hero-media img');
function parallax() {
  if (!reduceMotion && scrollY < innerHeight * 1.2) heroImg.style.transform = `translateY(${-scrollY * 0.08}px)`;
  requestAnimationFrame(parallax);
}

/* ---------- boot ---------- */
renderHours();
renderWorkshops();
updateCutoff();
setupReveal();
parallax();
setInterval(() => {
  updateCutoff();
  renderHours();
}, 30000);
if (checkout.postcode) {
  const res = lookupPostcode(checkout.postcode);
  checkout.zone = res.ok ? res.zone : null;
}
