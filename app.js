
/* ══════════════════════════════════════════════════════════
   GUARDIAN NIGHTSAFE — APP.JS  (fixed)
══════════════════════════════════════════════════════════ */
'use strict';

/* ─── STATE ─── */
const APP = {
  location: null,
  sosActive: false,
  sosTimer: null,
  sosHoldTimer: null,
  sosElapsed: 0,
  sosInterval: null,
  nightMode: false,
  nightSecsLeft: 600,
  nightCheckTimer: null,
  stealthTaps: 0,
  stealthTapTimer: null,
  sirenActive: false,
  sirenNodes: [],
  audioCtx: null,
  mediaRecorder: null,
  mediaStream: null,
  recType: null,
  recTimer: null,
  recSecs: 0,
  evidenceCount: 0,
  fakeCallTimer: null,
  mainMap: null,
  sosMap: null,
  nearbyMap: null,
  userMarker: null,
  currentSection: 'home',
  obSlide: 0,
  theme: 'dark',
  profile: { name: '', blood: 'O+', medical: '' },
  contacts: [
    { id: 1, name: 'Mom',          phone: '+91-98765-43210', relation: 'Family' },
    { id: 2, name: 'Priya (Friend)',phone: '+91-87654-32109', relation: 'Friend' },
    { id: 3, name: 'Aunt Meera',   phone: '+91-76543-21098', relation: 'Family' },
  ],
};

/* ─── MOCK DATA ─── */
const NEARBY_PLACES = [
  { id:1, type:'police',   name:'City Police Station',   dist:'0.4 km', dir:'NE', open:'24/7',      lat:0.004,  lng:0.003,  icon:'🚔' },
  { id:2, type:'police',   name:'Women Police Outpost',  dist:'0.9 km', dir:'N',  open:'24/7',      lat:0.008,  lng:-0.002, icon:'👮' },
  { id:3, type:'hospital', name:'General Hospital',      dist:'1.1 km', dir:'E',  open:'24/7',      lat:-0.003, lng:0.010,  icon:'🏥' },
  { id:4, type:'hospital', name:'City Medical Centre',   dist:'1.8 km', dir:'SE', open:'24/7',      lat:-0.010, lng:0.008,  icon:'🏨' },
  { id:5, type:'pharmacy', name:'Apollo Pharmacy',       dist:'0.3 km', dir:'W',  open:'24/7',      lat:0.002,  lng:-0.004, icon:'💊' },
  { id:6, type:'petrol',   name:'HP Petrol Bunk',        dist:'0.6 km', dir:'SW', open:'24/7',      lat:-0.005, lng:-0.006, icon:'⛽' },
  { id:7, type:'safe',     name:'24/7 Mall Safe Zone',   dist:'0.5 km', dir:'NW', open:'24/7',      lat:0.005,  lng:-0.005, icon:'🏪' },
  { id:8, type:'safe',     name:'Metro Station',         dist:'0.7 km', dir:'S',  open:'5am-11pm',  lat:-0.007, lng:0.001,  icon:'🚇' },
];

const TEMPLATES = [
  { icon:'👁',  label:'Being Stalked',     msg:'I am being followed. Please help. My location: [LOC]' },
  { icon:'🚕',  label:'Unsafe Cab',        msg:'I am in an unsafe cab. Driver unknown. My location: [LOC]' },
  { icon:'🌙',  label:'Walking Alone',     msg:'I am walking alone at night and feel unsafe. Location: [LOC]' },
  { icon:'🏥',  label:'Medical Emergency', msg:'I need medical help urgently. My location: [LOC]' },
  { icon:'🆘',  label:'Immediate Danger',  msg:'EMERGENCY: I am in immediate danger. Location: [LOC] Time: [TIME]' },
];

const SAFETY_TIPS = [
  { icon:'📱', tip:'Keep your phone charged above 20% when traveling at night.' },
  { icon:'📍', tip:'Share your live location with a trusted contact before solo travel.' },
  { icon:'🔊', tip:'Trust your instincts — if something feels wrong, move to a public area.' },
  { icon:'🚶', tip:'Walk confidently and stay in well-lit, populated areas.' },
  { icon:'🔑', tip:'Keep your keys accessible when approaching your vehicle or home.' },
  { icon:'📞', tip:'Save emergency numbers: Police 100, Ambulance 108, Women Helpline 1091.' },
  { icon:'🎒', tip:'Carry a personal alarm or whistle in an easily accessible pocket.' },
  { icon:'🚗', tip:'Verify cab details (number plate, driver photo) before boarding.' },
];

const FAKE_CALLERS = [
  { name:'Mom',            emoji:'👩' },
  { name:'Priya',          emoji:'👧' },
  { name:'Police Officer', emoji:'👮' },
  { name:'Aunt Meera',     emoji:'👩‍🦳' },
];

/* ══════════════════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════════════════ */
function obNext() {
  APP.obSlide++;
  if (APP.obSlide >= 3) { startApp(); return; }
  document.querySelectorAll('.ob-slide').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ob-dot').forEach(d => d.classList.remove('active'));
  document.querySelector('[data-slide="' + APP.obSlide + '"]').classList.add('active');
  document.querySelector('[data-dot="'   + APP.obSlide + '"]').classList.add('active');
  if (APP.obSlide === 2) document.getElementById('obNextBtn').textContent = 'Get Started →';
}

function startApp() {
  const ob = document.getElementById('onboarding');
  ob.style.transition = 'opacity .5s';
  ob.style.opacity = '0';
  setTimeout(() => {
    ob.classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }, 520);
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
function initApp() {
  renderTemplates();
  renderTips();
  renderStatusRows();
  renderContacts();
  updateStealthClock();
  setInterval(updateStealthClock, 1000);
  getLocation();          // sets APP.location then calls initMap
  initVoiceTrigger();
  showToast('🛡 Guardian NightSafe is active');
}

/* ══════════════════════════════════════════════════════════
   NAVIGATION  ← fixed: single source of truth
══════════════════════════════════════════════════════════ */
function navTo(section) {
  /* hide all sections */
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  /* deactivate all nav links */
  document.querySelectorAll('.sb-link, .bb-btn').forEach(b => b.classList.remove('active'));

  const sec = document.getElementById('sec-' + section);
  if (!sec) return;

  sec.style.display = 'block';
  /* force reflow then add class so CSS animation fires */
  requestAnimationFrame(() => sec.classList.add('active'));

  APP.currentSection = section;

  /* highlight matching nav items */
  document.querySelectorAll('[data-section="' + section + '"]').forEach(el => el.classList.add('active'));

  /* lazy-init maps */
  if (section === 'map'  && !APP.nearbyMap) setTimeout(initNearbyMap, 120);
  if (section === 'sos'  && !APP.sosMap)    setTimeout(initSOSMap,    120);

  closeMobileMenu();
}

function toggleMobileMenu() {
  document.getElementById('mobileDrawer').classList.toggle('hidden');
}
function closeMobileMenu() {
  document.getElementById('mobileDrawer').classList.add('hidden');
}

/* ══════════════════════════════════════════════════════════
   GEOLOCATION
══════════════════════════════════════════════════════════ */
function getLocation() {
  /* always set a mock location first so map renders immediately */
  APP.location = { lat: 12.9716, lng: 77.5946, acc: 20 };
  initMap('mainMap');

  if (!navigator.geolocation) {
    showToast('⚠ Geolocation not supported — using demo location');
    updateStatusRows();
    return;
  }
  navigator.geolocation.watchPosition(onLocationUpdate, onLocationError,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
}

function onLocationUpdate(pos) {
  APP.location = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
  const { lat, lng } = APP.location;
  const el = document.getElementById('mapCoords');
  if (el) el.textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
  updateMapMarker(lat, lng);
  updateStatusRows();
  if (APP.sosActive) {
    const soaEl = document.getElementById('soaLocation');
    if (soaEl) soaEl.textContent = lat.toFixed(4) + ', ' + lng.toFixed(4);
  }
}

function onLocationError() {
  const el = document.getElementById('mapCoords');
  if (el) el.textContent = 'Demo location (12.9716, 77.5946)';
  updateStatusRows();
}

function getLocString() {
  if (!APP.location) return 'Location unavailable';
  return 'https://maps.google.com/?q=' + APP.location.lat + ',' + APP.location.lng;
}

function shareLocation() {
  const link = getLocString();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => showToast('🔗 Location link copied!'));
  } else {
    showToast('📍 ' + link);
  }
}

/* ══════════════════════════════════════════════════════════
   MAPS (Leaflet)
══════════════════════════════════════════════════════════ */
function initMap(containerId) {
  if (typeof L === 'undefined') { showToast('⚠ Map library not loaded'); return; }
  const lat = APP.location ? APP.location.lat : 12.9716;
  const lng = APP.location ? APP.location.lng : 77.5946;

  const map = L.map(containerId, { zoomControl: true, attributionControl: false })
               .setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const userIcon = L.divIcon({
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#00d4aa;border:3px solid #fff;box-shadow:0 0 12px #00d4aa"></div>',
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
  APP.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map).bindPopup('📍 You are here');

  if (containerId === 'mainMap') APP.mainMap = map;
  addNearbyMarkers(map, lat, lng);

  /* fix Leaflet tile rendering inside hidden containers */
  setTimeout(() => map.invalidateSize(), 200);
}

function initSOSMap() {
  if (typeof L === 'undefined' || APP.sosMap) return;
  const lat = APP.location ? APP.location.lat : 12.9716;
  const lng = APP.location ? APP.location.lng : 77.5946;
  APP.sosMap = L.map('sosMap', { zoomControl: false, attributionControl: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(APP.sosMap);
  const icon = L.divIcon({
    html: '<div style="width:18px;height:18px;border-radius:50%;background:#ff2d55;border:3px solid #fff;box-shadow:0 0 16px #ff2d55"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9]
  });
  L.marker([lat, lng], { icon }).addTo(APP.sosMap).bindPopup('🚨 Emergency Location').openPopup();
  addNearbyMarkers(APP.sosMap, lat, lng);
  setTimeout(() => APP.sosMap.invalidateSize(), 200);
}

function initNearbyMap() {
  if (typeof L === 'undefined' || APP.nearbyMap) return;
  const lat = APP.location ? APP.location.lat : 12.9716;
  const lng = APP.location ? APP.location.lng : 77.5946;
  APP.nearbyMap = L.map('nearbyMap', { zoomControl: true, attributionControl: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(APP.nearbyMap);
  const userIcon = L.divIcon({
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#00d4aa;border:3px solid #fff;box-shadow:0 0 12px #00d4aa"></div>',
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
  L.marker([lat, lng], { icon: userIcon }).addTo(APP.nearbyMap).bindPopup('📍 You');
  addNearbyMarkers(APP.nearbyMap, lat, lng);
  renderNearbyList('all');
  setTimeout(() => APP.nearbyMap.invalidateSize(), 200);
}

function addNearbyMarkers(map, baseLat, baseLng) {
  const colors = { police:'#3b82f6', hospital:'#ef4444', pharmacy:'#22c55e', petrol:'#f59e0b', safe:'#a855f7' };
  NEARBY_PLACES.forEach(p => {
    const c = colors[p.type] || '#fff';
    const icon = L.divIcon({
      html: '<div style="background:' + c + ';border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid rgba(255,255,255,.4);box-shadow:0 0 8px ' + c + '">' + p.icon + '</div>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    L.marker([baseLat + p.lat, baseLng + p.lng], { icon })
     .addTo(map)
     .bindPopup('<strong>' + p.name + '</strong><br>' + p.dist + ' · ' + p.open);
  });
}

function updateMapMarker(lat, lng) {
  if (APP.mainMap && APP.userMarker) {
    APP.userMarker.setLatLng([lat, lng]);
    APP.mainMap.setView([lat, lng]);
  }
}

function centerMap() {
  if (APP.mainMap && APP.location) APP.mainMap.setView([APP.location.lat, APP.location.lng], 15);
}

function refreshNearby() {
  showToast('↻ Refreshing nearby locations…');
  setTimeout(() => showToast('✅ Nearby locations updated'), 1500);
}

/* ══════════════════════════════════════════════════════════
   SOS SYSTEM  ← fixed: no double section manipulation
══════════════════════════════════════════════════════════ */
const SOS_HOLD_MS = 5000;
let sosHoldStart = null;
let sosAnimFrame = null;

function startSOSHold(e) {
  if (e) e.preventDefault();
  if (APP.sosActive) return;
  sosHoldStart = Date.now();
  const btn = document.getElementById('sosBtn');
  if (btn) btn.classList.add('holding');
  animateSOSProgress();
  APP.sosHoldTimer = setTimeout(() => {
    cancelAnimationFrame(sosAnimFrame);
    resetSOSProgress();
    showSOSCountdown();
  }, SOS_HOLD_MS);
}

function cancelSOSHold() {
  if (APP.sosActive) return;
  clearTimeout(APP.sosHoldTimer);
  cancelAnimationFrame(sosAnimFrame);
  resetSOSProgress();
  sosHoldStart = null;
}

function animateSOSProgress() {
  if (!sosHoldStart) return;
  const pct = Math.min((Date.now() - sosHoldStart) / SOS_HOLD_MS, 1);
  const fill = document.getElementById('sosFill');
  if (fill) fill.style.strokeDashoffset = 339.3 - 339.3 * pct;
  if (pct < 1) sosAnimFrame = requestAnimationFrame(animateSOSProgress);
}

function resetSOSProgress() {
  const fill = document.getElementById('sosFill');
  if (fill) fill.style.strokeDashoffset = 339.3;
  const btn = document.getElementById('sosBtn');
  if (btn) btn.classList.remove('holding');
}

function showSOSCountdown() {
  const modal = document.getElementById('sosCountdownModal');
  modal.classList.remove('hidden');
  let count = 5;
  document.getElementById('soscmNum').textContent = count;
  APP.sosTimer = setInterval(() => {
    count--;
    document.getElementById('soscmNum').textContent = count;
    if (count <= 0) {
      clearInterval(APP.sosTimer);
      modal.classList.add('hidden');
      activateSOS();
    }
  }, 1000);
}

function cancelSOS() {
  clearInterval(APP.sosTimer);
  document.getElementById('sosCountdownModal').classList.add('hidden');
  showToast('SOS cancelled');
}

function activateSOS() {
  APP.sosActive = true;
  APP.sosElapsed = 0;

  /* navigate to SOS section via the single navTo function */
  navTo('sos');

  /* update sidebar */
  const dot = document.getElementById('sbDot');
  if (dot) dot.classList.add('alert');
  const sbTxt = document.getElementById('sbStatusText');
  if (sbTxt) sbTxt.textContent = 'EMERGENCY';

  /* elapsed timer */
  APP.sosInterval = setInterval(() => {
    APP.sosElapsed++;
    const m = String(Math.floor(APP.sosElapsed / 60)).padStart(2, '0');
    const s = String(APP.sosElapsed % 60).padStart(2, '0');
    const el = document.getElementById('sosActiveTime');
    if (el) el.textContent = m + ':' + s;
  }, 1000);

  /* location */
  if (APP.location) {
    const el = document.getElementById('soaLocation');
    if (el) el.textContent = APP.location.lat.toFixed(4) + ', ' + APP.location.lng.toFixed(4);
  }

  simulateAlertDelivery();
  addTimelineEvent('alert', '🚨 SOS Activated', 'Emergency alert triggered');
  addTimelineEvent('active', '📍 Location Shared', getLocString());

  if (document.getElementById('setSiren') && document.getElementById('setSiren').checked) triggerSiren();
  if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

  setTimeout(initSOSMap, 300);
  setTimeout(() => {
    const h = document.getElementById('soaHelp');
    const st = document.getElementById('soaStatus');
    if (h) h.textContent = 'City Police (0.4 km)';
    if (st) st.textContent = 'Alerts Sent ✓';
    addTimelineEvent('done', '🗺 Help Found', 'City Police Station — 0.4 km NE');
  }, 2000);
}

function deactivateSOS() {
  APP.sosActive = false;
  clearInterval(APP.sosInterval);
  stopSiren();
  const dot = document.getElementById('sbDot');
  if (dot) dot.classList.remove('alert');
  const sbTxt = document.getElementById('sbStatusText');
  if (sbTxt) sbTxt.textContent = 'Protected';
  addTimelineEvent('done', '✅ SOS Cancelled', 'Emergency deactivated by user');
  navTo('home');
  showToast('✅ SOS deactivated');
}

/* ── Alert delivery simulation ── */
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function simulateAlertDelivery() {
  const panel = document.getElementById('alertDeliveryPanel');
  const list  = document.getElementById('deliveryList');
  if (!panel || !list) return;
  panel.classList.remove('hidden');
  list.innerHTML = '';
  const cntEl = document.getElementById('soaContacts');
  if (cntEl) cntEl.textContent = '0 / ' + APP.contacts.length;

  for (let i = 0; i < APP.contacts.length; i++) {
    const c = APP.contacts[i];
    const item = document.createElement('div');
    item.className = 'delivery-item';
    item.innerHTML =
      '<div class="di-avatar">👤</div>' +
      '<div class="di-info"><p class="di-name">' + c.name + '</p><p class="di-status">' + c.phone + '</p></div>' +
      '<span class="di-badge sending">Sending…</span>';
    list.appendChild(item);
    await delay(700 + i * 500);
    const badge = item.querySelector('.di-badge');
    badge.className = 'di-badge sent';
    badge.textContent = '✓ Sent';
    if (cntEl) cntEl.textContent = (i + 1) + ' / ' + APP.contacts.length;
    addTimelineEvent('done', '📤 ' + c.name + ' Notified', 'SMS + WhatsApp alert sent');
  }
}

/* ── Timeline ── */
function addTimelineEvent(type, title, detail) {
  const tl = document.getElementById('timeline');
  if (!tl) return;
  const empty = tl.querySelector('.empty-state');
  if (empty) empty.remove();
  const item = document.createElement('div');
  item.className = 'tl-item';
  item.innerHTML =
    '<div class="tl-dot ' + type + '"></div>' +
    '<div class="tl-text"><p>' + title + '</p><small>' + detail + ' · ' + new Date().toLocaleTimeString() + '</small></div>';
  tl.prepend(item);
}

/* ══════════════════════════════════════════════════════════
   QUICK CALLS
══════════════════════════════════════════════════════════ */
function quickCall(type) {
  const nums   = { police:'100', ambulance:'108', helpline:'1091', trusted: (APP.contacts[0] ? APP.contacts[0].phone : '100') };
  const labels = { police:'Police (100)', ambulance:'Ambulance (108)', helpline:'Women Helpline (1091)', trusted: (APP.contacts[0] ? APP.contacts[0].name : 'Contact') };
  showToast('📞 Calling ' + labels[type] + '…');
  setTimeout(() => { window.location.href = 'tel:' + nums[type]; }, 600);
}

/* ══════════════════════════════════════════════════════════
   TEMPLATES
══════════════════════════════════════════════════════════ */
function renderTemplates() {
  const list = document.getElementById('templateList');
  if (!list) return;
  list.innerHTML = TEMPLATES.map(t =>
    '<div class="template-item" onclick="useTemplate(\'' + t.label + '\',\'' + t.msg.replace(/'/g, "\\'") + '\')">' +
    '<span class="ti-icon">' + t.icon + '</span>' + t.label + '</div>'
  ).join('');
}

function useTemplate(label, msg) {
  const final = msg.replace('[LOC]', getLocString()).replace('[TIME]', new Date().toLocaleString());
  if (navigator.clipboard) {
    navigator.clipboard.writeText(final).then(() => showToast('📋 "' + label + '" message copied'));
  } else {
    showToast('📋 Template: ' + label);
  }
}

/* ══════════════════════════════════════════════════════════
   SAFETY TIPS
══════════════════════════════════════════════════════════ */
function renderTips() {
  const list = document.getElementById('tipsList');
  if (!list) return;
  list.innerHTML = SAFETY_TIPS.map(t =>
    '<div class="tip-item"><span class="tip-icon">' + t.icon + '</span>' + t.tip + '</div>'
  ).join('');
}

/* ══════════════════════════════════════════════════════════
   STATUS ROWS
══════════════════════════════════════════════════════════ */
function renderStatusRows() {
  const container = document.getElementById('statusRows');
  if (!container) return;
  const rows = [
    { label:'Location',      id:'srLoc',      val:'Acquiring…',                                                                                   cls:'warn' },
    { label:'Guardian Mode', id:'srNight',     val:'OFF',                                                                                          cls:''     },
    { label:'SOS Status',    id:'srSOS',       val:'Ready',                                                                                        cls:'ok'   },
    { label:'Contacts',      id:'srContacts',  val: APP.contacts.length + ' saved',                                                                cls:'ok'   },
    { label:'Audio API',     id:'srAudio',     val: (window.AudioContext || window.webkitAudioContext) ? 'Ready' : 'N/A',                          cls:'ok'   },
    { label:'Speech API',    id:'srSpeech',    val: ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'Ready' : 'N/A',     cls:'ok'   },
  ];
  container.innerHTML = rows.map(r =>
    '<div class="status-row-item">' +
    '<span class="sri-label">' + r.label + '</span>' +
    '<span class="sri-val ' + r.cls + '" id="' + r.id + '">' + r.val + '</span>' +
    '</div>'
  ).join('');
}

function updateStatusRows() {
  const loc = APP.location;
  const srLoc = document.getElementById('srLoc');
  if (srLoc && loc) { srLoc.textContent = loc.lat.toFixed(3) + ', ' + loc.lng.toFixed(3); srLoc.className = 'sri-val live'; }
  const srNight = document.getElementById('srNight');
  if (srNight) { srNight.textContent = APP.nightMode ? 'ACTIVE' : 'OFF'; srNight.className = 'sri-val ' + (APP.nightMode ? 'live' : ''); }
  const srContacts = document.getElementById('srContacts');
  if (srContacts) srContacts.textContent = APP.contacts.length + ' saved';
}

/* ══════════════════════════════════════════════════════════
   NEARBY PLACES
══════════════════════════════════════════════════════════ */
function renderNearbyList(filter) {
  const list = document.getElementById('nearbyList');
  if (!list) return;
  const places = (filter === 'all') ? NEARBY_PLACES : NEARBY_PLACES.filter(p => p.type === filter);
  list.innerHTML = places.map(p =>
    '<div class="nearby-card" onclick="focusPlace(' + p.id + ')">' +
    '<div class="nc-icon ' + p.type + '">' + p.icon + '</div>' +
    '<div class="nc-info"><p class="nc-name">' + p.name + '</p><p class="nc-meta">' + p.dir + ' · ' + p.open + '</p></div>' +
    '<span class="nc-dist">' + p.dist + '</span>' +
    '</div>'
  ).join('');
}

function filterNearby(type, btn) {
  document.querySelectorAll('.nf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderNearbyList(type);
}

function focusPlace(id) {
  const p = NEARBY_PLACES.find(x => x.id === id);
  if (!p || !APP.nearbyMap || !APP.location) return;
  APP.nearbyMap.setView([APP.location.lat + p.lat, APP.location.lng + p.lng], 16);
  const nm = document.getElementById('srcName');
  const mm = document.getElementById('srcMeta');
  if (nm) nm.textContent = p.name;
  if (mm) mm.textContent = p.dist + ' · ' + p.dir + ' direction · ' + p.open;
}

function navigateTo() {
  const name = (document.getElementById('srcName') || {}).textContent || 'Police Station';
  const base = 'https://www.google.com/maps/search/' + encodeURIComponent(name);
  const url  = APP.location ? base + '/@' + APP.location.lat + ',' + APP.location.lng + ',15z' : base;
  window.open(url, '_blank');
}

/* ══════════════════════════════════════════════════════════
   NIGHT GUARDIAN
══════════════════════════════════════════════════════════ */
function toggleNightMode() {
  APP.nightMode = !APP.nightMode;
  const btn   = document.getElementById('nightToggleBtn');
  const panel = document.getElementById('nightStatusPanel');

  if (APP.nightMode) {
    if (btn)   { btn.textContent = 'Deactivate Guardian'; btn.classList.add('active'); }
    if (panel) panel.classList.remove('hidden');
    const mins = parseInt((document.getElementById('nightInterval') || { value: '10' }).value);
    APP.nightSecsLeft = mins * 60;
    startNightTimer();
    addNightLog('🟢 Night Guardian activated');
    showToast('🌙 Night Guardian is now active');
  } else {
    if (btn)   { btn.textContent = 'Activate Night Guardian'; btn.classList.remove('active'); }
    if (panel) panel.classList.add('hidden');
    clearInterval(APP.nightCheckTimer);
    showToast('Night Guardian deactivated');
  }
  updateStatusRows();
}

function startNightTimer() {
  clearInterval(APP.nightCheckTimer);
  APP.nightCheckTimer = setInterval(() => {
    APP.nightSecsLeft--;
    const m = String(Math.floor(APP.nightSecsLeft / 60)).padStart(2, '0');
    const s = String(APP.nightSecsLeft % 60).padStart(2, '0');
    const el = document.getElementById('nightTimer');
    if (el) el.textContent = m + ':' + s;
    if (APP.nightSecsLeft <= 0) {
      clearInterval(APP.nightCheckTimer);
      addNightLog('⚠️ Missed check-in — escalating to SOS');
      showToast('⚠️ Missed check-in! Sending alert…');
      setTimeout(showSOSCountdown, 2000);
    }
  }, 1000);
}

function nightCheckIn() {
  const mins = parseInt((document.getElementById('nightInterval') || { value: '10' }).value);
  APP.nightSecsLeft = mins * 60;
  addNightLog('✅ Safe check-in confirmed');
  showToast('✅ Check-in confirmed — stay safe!');
}

function nightSOS() {
  addNightLog('🆘 SOS triggered from Night Guardian');
  showSOSCountdown();
}

function addNightLog(msg) {
  const log = document.getElementById('nightLog');
  if (!log) return;
  const item = document.createElement('div');
  item.className = 'nl-item';
  item.textContent = new Date().toLocaleTimeString() + ' — ' + msg;
  log.prepend(item);
}

/* ══════════════════════════════════════════════════════════
   STEALTH MODE
══════════════════════════════════════════════════════════ */
function activateStealth() {
  APP.stealthTaps = 0;
  document.getElementById('stealthOverlay').classList.remove('hidden');
  showToast('🔒 Stealth mode active — tap 5× to exit');
}

function stealthTap() {
  APP.stealthTaps++;
  clearTimeout(APP.stealthTapTimer);
  APP.stealthTapTimer = setTimeout(() => { APP.stealthTaps = 0; }, 2000);
  if (APP.stealthTaps >= 5) {
    APP.stealthTaps = 0;
    document.getElementById('stealthOverlay').classList.add('hidden');
    showToast('🔓 Stealth mode exited');
  }
}

function updateStealthClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const clk = document.getElementById('stealthClock');
  const dt  = document.getElementById('stealthDate');
  if (clk) clk.textContent = h + ':' + m;
  if (dt)  dt.textContent  = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}

function silentSOS() {
  showToast('🔕 Silent SOS sent — no sound or screen change');
  sendAlerts();
  addTimelineEvent('alert', '🔕 Silent SOS', 'Alert sent silently');
}

/* ══════════════════════════════════════════════════════════
   FAKE CALL
══════════════════════════════════════════════════════════ */
function triggerFakeCall() {
  const caller = FAKE_CALLERS[Math.floor(Math.random() * FAKE_CALLERS.length)];
  const av = document.getElementById('fcallAvatar');
  const nm = document.getElementById('fcallName');
  const st = document.getElementById('fcallStatus');
  if (av) av.textContent = caller.emoji;
  if (nm) nm.textContent = caller.name;
  if (st) st.textContent = 'Incoming Call…';
  document.getElementById('fakeCallOverlay').classList.remove('hidden');
}

function acceptFakeCall() {
  const st = document.getElementById('fcallStatus');
  if (st) st.textContent = 'Connected · 00:00';
  let sec = 0;
  APP.fakeCallTimer = setInterval(() => {
    sec++;
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    const el = document.getElementById('fcallStatus');
    if (el) el.textContent = 'Connected · ' + m + ':' + s;
    else clearInterval(APP.fakeCallTimer);
  }, 1000);
}

function endFakeCall() {
  clearInterval(APP.fakeCallTimer);
  document.getElementById('fakeCallOverlay').classList.add('hidden');
}

/* ══════════════════════════════════════════════════════════
   SIREN  (Web Audio API)
══════════════════════════════════════════════════════════ */
function triggerSiren() {
  if (APP.sirenActive) { stopSiren(); return; }
  try {
    APP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    APP.sirenActive = true;
    showToast('🔊 Siren activated — tap again to stop');
    playSirenLoop();
  } catch (e) { showToast('❌ Audio not supported'); }
}

function playSirenLoop() {
  if (!APP.sirenActive || !APP.audioCtx) return;
  const osc  = APP.audioCtx.createOscillator();
  const gain = APP.audioCtx.createGain();
  osc.connect(gain);
  gain.connect(APP.audioCtx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, APP.audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(440, APP.audioCtx.currentTime + 0.5);
  osc.frequency.linearRampToValueAtTime(880, APP.audioCtx.currentTime + 1.0);
  gain.gain.setValueAtTime(0.4, APP.audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, APP.audioCtx.currentTime + 1.0);
  osc.start();
  osc.stop(APP.audioCtx.currentTime + 1.0);
  APP.sirenNodes.push(osc);
  if (APP.sirenActive) setTimeout(playSirenLoop, 1100);
}

function stopSiren() {
  APP.sirenActive = false;
  APP.sirenNodes.forEach(n => { try { n.stop(); } catch (e) {} });
  APP.sirenNodes = [];
  if (APP.audioCtx) { APP.audioCtx.close(); APP.audioCtx = null; }
}

/* ══════════════════════════════════════════════════════════
   STROBE
══════════════════════════════════════════════════════════ */
function triggerStrobe() {
  showToast('💡 Strobe active for 3 seconds');
  let on = true, count = 0;
  const iv = setInterval(() => {
    document.body.style.background = on ? '#fff' : '';
    on = !on; count++;
    if (count > 20) { clearInterval(iv); document.body.style.background = ''; }
  }, 150);
}

/* ══════════════════════════════════════════════════════════
   EVIDENCE CAPTURE
══════════════════════════════════════════════════════════ */
async function toggleAudioRec() {
  if (APP.mediaRecorder && APP.recType === 'audio') { stopRecording(); return; }
  try {
    APP.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording('audio');
  } catch (e) { showToast('❌ Microphone access denied'); }
}

async function toggleVideoRec() {
  if (APP.mediaRecorder && APP.recType === 'video') { stopRecording(); return; }
  try {
    APP.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const preview = document.getElementById('evVideoPreview');
    if (preview) { preview.srcObject = APP.mediaStream; preview.classList.remove('hidden'); }
    startRecording('video');
  } catch (e) { showToast('❌ Camera access denied'); }
}

function startRecording(type) {
  APP.recType = type;
  APP.mediaRecorder = new MediaRecorder(APP.mediaStream);
  const chunks = [];
  APP.mediaRecorder.ondataavailable = e => chunks.push(e.data);
  APP.mediaRecorder.onstop = () => saveEvidence(chunks, type);
  APP.mediaRecorder.start();
  APP.recSecs = 0;
  const evSt = document.getElementById('evStatus');
  const evTx = document.getElementById('evStatusText');
  if (evSt) evSt.classList.remove('hidden');
  if (evTx) evTx.textContent = 'Recording ' + type + '…';
  const btnId = type === 'audio' ? 'audioRecBtn' : 'videoRecBtn';
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = '⏹ Stop ' + (type === 'audio' ? 'Audio' : 'Video'); btn.classList.add('recording'); }
  APP.recTimer = setInterval(() => {
    APP.recSecs++;
    const m = String(Math.floor(APP.recSecs / 60)).padStart(2, '0');
    const s = String(APP.recSecs % 60).padStart(2, '0');
    const el = document.getElementById('evTimer');
    if (el) el.textContent = m + ':' + s;
  }, 1000);
}

function stopRecording() {
  if (APP.mediaRecorder && APP.mediaRecorder.state !== 'inactive') APP.mediaRecorder.stop();
  if (APP.mediaStream) APP.mediaStream.getTracks().forEach(t => t.stop());
  clearInterval(APP.recTimer);
  const evSt = document.getElementById('evStatus');
  const evVid = document.getElementById('evVideoPreview');
  if (evSt) evSt.classList.add('hidden');
  if (evVid) { evVid.classList.add('hidden'); evVid.srcObject = null; }
  const aBtn = document.getElementById('audioRecBtn');
  const vBtn = document.getElementById('videoRecBtn');
  if (aBtn) { aBtn.textContent = '🎙 Start Audio Recording'; aBtn.classList.remove('recording'); }
  if (vBtn) { vBtn.textContent = '🎥 Start Video Recording'; vBtn.classList.remove('recording'); }
  APP.mediaRecorder = null; APP.recType = null;
}

function saveEvidence(chunks, type) {
  const mime = type === 'video' ? 'video/webm' : 'audio/webm';
  const blob = new Blob(chunks, { type: mime });
  const url  = URL.createObjectURL(blob);
  APP.evidenceCount++;
  const id   = APP.evidenceCount;
  const time = new Date().toLocaleString();
  const list = document.getElementById('evidenceList');
  if (!list) return;
  const empty = list.querySelector('.empty-state');
  if (empty) empty.remove();
  const item = document.createElement('div');
  item.className = 'ev-item';
  item.innerHTML =
    '<span>' + (type === 'video' ? '🎥' : '🎙') + '</span>' +
    '<div><p style="font-weight:600">' + (type === 'video' ? 'Video' : 'Audio') + ' #' + id + '</p>' +
    '<p style="color:var(--muted);font-size:11px">' + time + '</p></div>' +
    '<a href="' + url + '" download="evidence_' + id + '.webm">⬇ Save</a>';
  list.prepend(item);
  showToast('✅ ' + (type === 'video' ? 'Video' : 'Audio') + ' evidence saved');
}

/* ══════════════════════════════════════════════════════════
   CONTACTS & PROFILE
══════════════════════════════════════════════════════════ */
function renderContacts() {
  const list = document.getElementById('contactsList');
  if (!list) return;
  if (!APP.contacts.length) { list.innerHTML = '<p class="empty-state">No contacts added yet</p>'; return; }
  list.innerHTML = APP.contacts.map(c =>
    '<div class="contact-card">' +
    '<div class="cc-avatar">👤</div>' +
    '<div class="cc-info">' +
    '<p class="cc-name">' + c.name + '</p>' +
    '<p class="cc-phone">' + c.phone + '</p>' +
    '<span class="cc-relation">' + c.relation + '</span>' +
    '</div>' +
    '<button class="cc-del" onclick="deleteContact(' + c.id + ')">✕</button>' +
    '</div>'
  ).join('');
  updateStatusRows();
}

function showAddContact() {
  const f = document.getElementById('addContactForm');
  if (f) f.classList.remove('hidden');
}
function hideAddContact() {
  const f = document.getElementById('addContactForm');
  if (f) f.classList.add('hidden');
}

function saveContact() {
  const name     = (document.getElementById('cName')     || {}).value || '';
  const phone    = (document.getElementById('cPhone')    || {}).value || '';
  const relation = (document.getElementById('cRelation') || {}).value || 'Contact';
  if (!name.trim() || !phone.trim()) { showToast('⚠️ Enter name and phone'); return; }
  APP.contacts.push({ id: Date.now(), name: name.trim(), phone: phone.trim(), relation: relation.trim() });
  renderContacts();
  hideAddContact();
  document.getElementById('cName').value = '';
  document.getElementById('cPhone').value = '';
  document.getElementById('cRelation').value = '';
  showToast('✅ ' + name + ' added');
}

function deleteContact(id) {
  APP.contacts = APP.contacts.filter(c => c.id !== id);
  renderContacts();
  showToast('Contact removed');
}

function saveProfile() {
  APP.profile.name    = (document.getElementById('pName')    || {}).value || '';
  APP.profile.blood   = (document.getElementById('pBlood')   || {}).value || 'O+';
  APP.profile.medical = (document.getElementById('pMedical') || {}).value || '';
  showToast('✅ Profile saved');
}

/* ══════════════════════════════════════════════════════════
   MOCK INTEGRATION ADAPTERS
   Replace these with real API calls when backend is ready
══════════════════════════════════════════════════════════ */
function sendAlerts() {
  const loc = getLocString();
  APP.contacts.forEach(c => {
    sendSMS(c.phone, 'EMERGENCY: ' + (APP.profile.name || 'User') + ' needs help! Location: ' + loc);
    sendWhatsApp(c.phone, '🆘 EMERGENCY from Guardian NightSafe\nLocation: ' + loc);
  });
  sendEmailAlert('guardian@nightsafe.app', 'Emergency Alert', 'SOS at ' + loc);
  notifyAuthorities({ lat: APP.location && APP.location.lat, lng: APP.location && APP.location.lng, time: new Date().toISOString() });
}

/* TODO: connect Twilio / AWS SNS */
function sendSMS(phone, message)          { console.log('[SMS]       To:', phone, '|', message); }
/* TODO: connect Meta WhatsApp Business API */
function sendWhatsApp(phone, message)     { console.log('[WHATSAPP]  To:', phone, '|', message); }
/* TODO: connect SendGrid / AWS SES */
function sendEmailAlert(to, subj, body)   { console.log('[EMAIL]     To:', to, '| Subject:', subj); }
/* TODO: connect ERSS / Police API */
function notifyAuthorities(data)          { console.log('[POLICE]    Emergency data:', data); }

/* ══════════════════════════════════════════════════════════
   VOICE TRIGGER  (Web Speech API)
══════════════════════════════════════════════════════════ */
function initVoiceTrigger() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = 'en-US';
  rec.onresult = e => {
    const t = e.results[e.results.length - 1][0].transcript.toLowerCase();
    if (['help me','help','sos','save me','emergency','danger'].some(k => t.includes(k))) {
      showToast('🎤 Voice SOS triggered!');
      showSOSCountdown();
    }
  };
  rec.onerror = () => {};
  rec.onend   = () => { const v = document.getElementById('setVoice'); if (v && v.checked) setTimeout(() => rec.start(), 1000); };
  const voiceToggle = document.getElementById('setVoice');
  if (voiceToggle) {
    voiceToggle.addEventListener('change', e => {
      if (e.target.checked) { rec.start(); showToast('🎤 Voice trigger enabled'); }
      else { rec.stop(); showToast('Voice trigger disabled'); }
    });
  }
}

/* ══════════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════════ */
function toggleTheme() {
  APP.theme = APP.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', APP.theme);
  const sb  = document.querySelector('.sb-theme-btn');
  const top = document.querySelector('.topbar-theme');
  const chk = document.getElementById('setDark');
  if (sb)  sb.textContent  = APP.theme === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode';
  if (top) top.textContent = APP.theme === 'dark' ? '☀' : '🌙';
  if (chk) chk.checked = APP.theme === 'dark';
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
let _toastTimer;
function showToast(msg, dur) {
  dur = dur || 3200;
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('hidden'), dur);
}

/* ══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    endFakeCall();
    document.getElementById('stealthOverlay').classList.add('hidden');
    document.getElementById('sosCountdownModal').classList.add('hidden');
    cancelSOS();
  }
  if (e.key === 'F1') { e.preventDefault(); showSOSCountdown(); }
});
