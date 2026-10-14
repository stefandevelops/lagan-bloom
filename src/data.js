export const SHOP = {
  name: 'Lagan & Bloom',
  street: '214 Lisburn Road',
  city: 'Belfast',
  postcode: 'BT9 6GD',
  phone: '028 9649 6123',
  email: 'hello@laganandbloom.co.uk',
  lat: 54.5817,
  lon: -5.9446,
};

// 0 = Sunday. Times are Belfast local time.
export const HOURS = [
  { day: 'Sunday', open: '12:00', close: '16:00' },
  { day: 'Monday', open: '09:00', close: '18:00' },
  { day: 'Tuesday', open: '09:00', close: '18:00' },
  { day: 'Wednesday', open: '09:00', close: '18:00' },
  { day: 'Thursday', open: '09:00', close: '19:00' },
  { day: 'Friday', open: '09:00', close: '18:00' },
  { day: 'Saturday', open: '09:00', close: '17:30' },
];

export const PRODUCTS = [
  {
    id: 'lagan',
    name: 'The Lagan',
    category: 'bouquets',
    img: 'img/lagan.jpg',
    blurb: 'Our signature hand-tied in warm peach and apricot: garden roses, ranunculus, wax flower and eucalyptus.',
    badge: 'Bestseller',
    sizes: [['Standard', 38], ['Large', 48], ['Luxe', 65]],
  },
  {
    id: 'cavehill',
    name: 'Cave Hill',
    category: 'bouquets',
    img: 'img/cavehill.jpg',
    blurb: 'Loose and wild in white and green. Cosmos, chamomile, stocks and grasses, the way they grow.',
    sizes: [['Standard', 35], ['Large', 45], ['Luxe', 60]],
  },
  {
    id: 'botanic',
    name: 'Botanic',
    category: 'bouquets',
    img: 'img/botanic.jpg',
    blurb: 'Blush peonies and garden roses with silver dusty miller. Peonies May to July, then garden roses.',
    badge: 'Seasonal',
    sizes: [['Standard', 55], ['Large', 70], ['Luxe', 90]],
  },
  {
    id: 'mourne',
    name: 'Mourne',
    category: 'bouquets',
    img: 'img/mourne.jpg',
    blurb: 'Cool blues and purples: delphinium, lisianthus, stocks, thistle and a little lavender.',
    sizes: [['Standard', 40], ['Large', 50], ['Luxe', 68]],
  },
  {
    id: 'ormeau',
    name: 'Ormeau',
    category: 'bouquets',
    img: 'img/ormeau.jpg',
    blurb: 'Deep reds for anniversaries and big apologies. Roses, ranunculus, scabiosa and hypericum.',
    sizes: [['Standard', 42], ['Large', 52], ['Luxe', 70]],
  },
  {
    id: 'causeway',
    name: 'Causeway',
    category: 'dried',
    img: 'img/causeway.jpg',
    blurb: 'Dried bunny tails, pampas, honesty and wheat in coastal neutrals. Lasts a year or more.',
    sizes: [['Standard', 32], ['Large', 42]],
  },
  {
    id: 'peace',
    name: 'Peace',
    category: 'sympathy',
    img: 'img/sympathy.jpg',
    blurb: 'A calm all-white arrangement in a ceramic bowl, delivered to homes and funeral directors.',
    sizes: [['Standard', 55], ['Large', 75]],
  },
  {
    id: 'monstera',
    name: 'Monstera',
    category: 'plants',
    img: 'img/plant.jpg',
    blurb: 'A happy, well-rooted Swiss cheese plant in a terracotta pot. Around 60 cm tall.',
    sizes: [['One size', 34]],
  },
];

export const CATEGORIES = [
  ['all', 'All'],
  ['bouquets', 'Bouquets'],
  ['dried', 'Dried'],
  ['sympathy', 'Sympathy'],
  ['plants', 'Plants'],
];

export const SUBSCRIPTIONS = [
  { id: 'sub-weekly', label: 'Weekly', price: 30, note: 'Every Friday' },
  { id: 'sub-fortnightly', label: 'Fortnightly', price: 34, note: 'Every other Friday' },
  { id: 'sub-monthly', label: 'Monthly', price: 38, note: 'First Friday of the month' },
];

export const WORKSHOPS = [
  { id: 'ws-autumn', date: '2026-10-29T18:30', title: 'Autumn hand-tied bouquet', length: '2 hours', price: 55, places: 3 },
  { id: 'ws-dried', date: '2026-11-12T18:30', title: 'Dried flower wall hanging', length: '2 hours', price: 50, places: 8 },
  { id: 'ws-wreath-1', date: '2026-11-28T10:30', title: 'Christmas wreath (morning)', length: '2.5 hours', price: 68, places: 0 },
  { id: 'ws-wreath-2', date: '2026-12-03T18:30', title: 'Christmas wreath (evening)', length: '2.5 hours', price: 68, places: 5 },
  { id: 'ws-wreath-3', date: '2026-12-10T18:30', title: 'Christmas wreath (evening)', length: '2.5 hours', price: 68, places: 10 },
];

// Delivery zones by BT district number.
export const ZONES = [
  {
    id: 'city',
    name: 'Belfast',
    districts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    price: 5.95,
    freeOver: 60,
    cutoff: '14:00',
    sameDay: true,
    note: 'Same-day by van or cargo bike',
  },
  {
    id: 'greater',
    name: 'Greater Belfast',
    districts: [18, 23, 27, 28, 29, 36, 37, 38],
    price: 8.95,
    freeOver: 80,
    cutoff: '12:00',
    sameDay: true,
    note: 'Same-day to Holywood, Lisburn, Newtownabbey, Carrickfergus, Comber and the airport area',
  },
  {
    id: 'ni',
    name: 'Rest of Northern Ireland',
    districts: null,
    price: 9.95,
    freeOver: null,
    cutoff: '14:00',
    sameDay: false,
    note: 'Next-day tracked courier, Tuesday to Saturday',
  },
];
