// ==========================
// STATE
// ==========================
let vehicles = [];      // { type, model, reg, odometer, serviceDate, serviceKm }
let serviceLog = [];    // { vehicleIndex, date, odoAtService, notes }
let editIndex = null;
let modalVehicleIndex = null;


// ==========================
// THEME TOGGLE
// ==========================
document.getElementById('themeToggle').addEventListener('change', function () {
  const dark = this.checked;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('themeLabel').textContent = dark ? 'Dark Mode' : 'Light Mode';
});


// ==========================
// SECTION NAV
// ==========================
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${id}"]`).classList.add('active');
  if (id === 'service-section') renderServiceHistory();
}


// ==========================
// VEHICLE FORM
// ==========================
function showForm() {
  editIndex = null;
  document.getElementById('vehicleForm').reset();
  document.getElementById('formTitle').textContent = 'Add Vehicle';
  document.getElementById('vehicle-form').style.display = 'block';
  document.getElementById('vehicle-form').scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
  document.getElementById('vehicle-form').style.display = 'none';
  document.getElementById('vehicleForm').reset();
  editIndex = null;
}

document.getElementById('vehicleForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const v = {
    type:        document.getElementById('vehicleType').value,
    model:       document.getElementById('vehicleModel').value,
    reg:         document.getElementById('regNumber').value,
    serviceKm:   parseInt(document.getElementById('serviceKm').value),
    odometer:    parseInt(document.getElementById('odometer').value),
    serviceDate: fmtDate(document.getElementById('serviceDate').value),
  };

  if (editIndex !== null) {
    vehicles[editIndex] = v;
    editIndex = null;
  } else {
    vehicles.push(v);
    // Auto-create first service log entry from initial data
    serviceLog.push({
      vehicleIndex: vehicles.length - 1,
      date: v.serviceDate,
      odoAtService: v.serviceKm,
      notes: 'Initial service record',
    });
  }

  renderVehicles();
  updateVehicleFilter();
  hideForm();
});


// ==========================
// EDIT / DELETE VEHICLE
// ==========================
function editVehicle(i) {
  const v = vehicles[i];
  editIndex = i;
  document.getElementById('vehicleType').value  = v.type;
  document.getElementById('vehicleModel').value = v.model;
  document.getElementById('regNumber').value    = v.reg;
  document.getElementById('serviceKm').value    = v.serviceKm;
  document.getElementById('odometer').value     = v.odometer;
  document.getElementById('formTitle').textContent = 'Edit Vehicle';
  showSection('vehicle-section');
  document.getElementById('vehicle-form').style.display = 'block';
  document.getElementById('vehicle-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteVehicle(i) {
  if (!confirm(`Delete ${vehicles[i].model}?`)) return;
  // Remove all service log entries for this vehicle, reindex others
  serviceLog = serviceLog
    .filter(e => e.vehicleIndex !== i)
    .map(e => ({ ...e, vehicleIndex: e.vehicleIndex > i ? e.vehicleIndex - 1 : e.vehicleIndex }));
  vehicles.splice(i, 1);
  renderVehicles();
  updateVehicleFilter();
}


// ==========================
// RENDER VEHICLES
// ==========================
function renderVehicles() {
  const vl = document.getElementById('vehicle-list');

  if (!vehicles.length) {
    vl.innerHTML = `
      <div class="empty">
        <div class="empty-title">No vehicles yet</div>
        <div class="empty-desc">Add your first vehicle to start tracking.</div>
        <button class="btn btn-dark" onclick="showForm()">+ Add Vehicle</button>
      </div>`;
    return;
  }

  vl.innerHTML = '';
  vehicles.forEach((v, i) => {
    const lastLog = getLastLog(i);
    const svc     = calcService(v.type, lastLog ? lastLog.odoAtService : v.serviceKm, v.odometer);
    const st      = statusClass(svc.rem);

    vl.innerHTML += `
      <div class="vc">
        <div class="vc-top">
          <div>
            <div class="vc-model">${v.model}</div>
            <div class="vc-reg">${v.reg}</div>
          </div>
          <span class="badge">${v.type}</span>
        </div>
        <div class="meta-grid">
          <div><div class="ml">Last Service</div><div class="mv">${lastLog ? lastLog.date : v.serviceDate}</div></div>
          <div><div class="ml">Service KM</div><div class="mv">${fmt(lastLog ? lastLog.odoAtService : v.serviceKm)} km</div></div>
          <div><div class="ml">Odometer</div><div class="mv">${fmt(v.odometer)} km</div></div>
          <div><div class="ml">Remaining</div><div class="mv s-${st}">${fmt(svc.rem)} km</div></div>
        </div>
        <div class="vc-foot">
          <button class="btn btn-outline btn-sm" onclick="editVehicle(${i})">Edit</button>
          <button class="btn btn-del btn-sm" onclick="deleteVehicle(${i})">Delete</button>
        </div>
      </div>`;
  });
}


// ==========================
// SERVICE HISTORY
// ==========================
function getLastLog(vehicleIndex) {
  const logs = serviceLog.filter(e => e.vehicleIndex === vehicleIndex);
  if (!logs.length) return null;
  return logs[logs.length - 1];
}

function getLogsForVehicle(vehicleIndex) {
  return serviceLog.filter(e => e.vehicleIndex === vehicleIndex);
}

function updateVehicleFilter() {
  const sel = document.getElementById('vehicleFilter');
  const prev = sel.value;
  sel.innerHTML = '<option value="all">All Vehicles</option>';
  vehicles.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${v.model} (${v.reg})`;
    sel.appendChild(opt);
  });
  sel.value = prev && (prev === 'all' || vehicles[parseInt(prev)]) ? prev : 'all';
}

function renderServiceHistory() {
  const container = document.getElementById('service-dashboard');
  const filter    = document.getElementById('vehicleFilter').value;

  if (!vehicles.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-title">No data</div>
        <div class="empty-desc">Add a vehicle first to see service history.</div>
      </div>`;
    return;
  }

  container.innerHTML = '';

  const indicesToShow = filter === 'all'
    ? vehicles.map((_, i) => i)
    : [parseInt(filter)];

  indicesToShow.forEach(vi => {
    const v    = vehicles[vi];
    const logs = getLogsForVehicle(vi);
    const group = document.createElement('div');
    group.className = 'vehicle-group';

    // Group header
    const lastLog = logs.length ? logs[logs.length - 1] : null;
    const svc     = calcService(v.type, lastLog ? lastLog.odoAtService : v.serviceKm, v.odometer);
    const st      = statusClass(svc.rem);

    group.innerHTML = `
      <div class="vehicle-group-header">
        <div>
          <div class="vg-name">${v.model}</div>
          <div class="vg-meta">${v.type} &middot; ${v.reg} &middot; ${logs.length} service ${logs.length === 1 ? 'entry' : 'entries'}</div>
        </div>
        <span class="badge s-${st}">${statusText(svc.rem)}</span>
      </div>`;

    // Service cards row
    const row = document.createElement('div');
    row.className = 'svc-cards';

    // Render each log entry as a card
    logs.forEach((log, li) => {
      // For this log, next service is based on log's odo + interval
      const logSvc = calcService(v.type, log.odoAtService, v.odometer);
      const logSt  = statusClass(logSvc.rem);
      const p      = progressPct(logSvc.rem, logSvc.iv);
      const isLatest = li === logs.length - 1;

      const card = document.createElement('div');
      card.className = 'sc';
      card.innerHTML = `
        <div class="sc-head">
          <div class="sc-date">${log.date}</div>
          ${isLatest ? `<span class="badge s-${logSt}">${isLatest ? 'Latest' : ''}</span>` : '<span class="badge" style="opacity:.4">Past</span>'}
        </div>

        <div class="rem-block">
          <div class="rem-row">
            <span class="rem-num s-${logSt}">${fmt(logSvc.rem)}</span>
            <span class="rem-unit">km</span>
          </div>
          <div class="rem-sub">remaining until service</div>
        </div>

        <div class="next-km-block">
          <span class="nk-label">Next Service At</span>
          <span class="nk-value">${fmt(logSvc.nextAt)} km</span>
        </div>

        <div class="prog">
          <div class="prog-fill fill-${logSt}" style="width:${p}%"></div>
        </div>

        <div>
          <div class="ir"><span class="ik">Serviced At</span><span class="iv">${fmt(log.odoAtService)} km</span></div>
          <div class="ir"><span class="ik">Current Odometer</span><span class="iv">${fmt(v.odometer)} km</span></div>
          <div class="ir"><span class="ik">Interval</span><span class="iv">${fmt(logSvc.iv)} km</span></div>
        </div>

        <div class="sc-foot">
          <span class="sc-notes">${log.notes || '—'}</span>
          <button class="btn btn-del btn-sm" onclick="deleteServiceEntry(${vi}, ${li})">Remove</button>
        </div>`;
      row.appendChild(card);
    });

    // Add new service entry card (always last)
    const addCard = document.createElement('div');
    addCard.className = 'sc-add';
    addCard.onclick = () => openModal(vi);
    addCard.innerHTML = `
      <div style="font-size:22px;color:var(--text-3)">+</div>
      <div class="sc-add-label">Log Service Entry</div>`;
    row.appendChild(addCard);

    group.appendChild(row);
    container.appendChild(group);
  });
}

function deleteServiceEntry(vehicleIndex, logIndex) {
  const logs = serviceLog
    .map((e, i) => ({ ...e, _orig: i }))
    .filter(e => e.vehicleIndex === vehicleIndex);

  if (logs.length <= 1) {
    alert('Keep at least one service entry per vehicle.');
    return;
  }

  const origIndex = logs[logIndex]._orig;
  serviceLog.splice(origIndex, 1);
  renderServiceHistory();
}


// ==========================
// MODAL — LOG SERVICE ENTRY
// ==========================
function openModal(vehicleIndex) {
  modalVehicleIndex = vehicleIndex;
  const v = vehicles[vehicleIndex];
  document.getElementById('modalVehicleName').textContent = v.model;
  document.getElementById('modalVehicleMeta').textContent = `${v.type} · ${v.reg}`;
  document.getElementById('modalServiceDate').value = '';
  document.getElementById('modalOdometer').value    = '';
  document.getElementById('modalNotes').value       = '';
  document.getElementById('nextServiceModal').classList.add('open');
}

function closeModal() {
  document.getElementById('nextServiceModal').classList.remove('open');
  modalVehicleIndex = null;
}

document.getElementById('nextServiceModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

document.getElementById('nextServiceForm').addEventListener('submit', function (e) {
  e.preventDefault();
  if (modalVehicleIndex === null) return;

  const newDate = document.getElementById('modalServiceDate').value;
  const newOdo  = parseInt(document.getElementById('modalOdometer').value);
  const notes   = document.getElementById('modalNotes').value.trim();

  // Update vehicle's current odometer to latest
  if (newOdo > vehicles[modalVehicleIndex].odometer) {
    vehicles[modalVehicleIndex].odometer = newOdo;
  }

  serviceLog.push({
    vehicleIndex: modalVehicleIndex,
    date:         fmtDate(newDate),
    odoAtService: newOdo,
    notes:        notes,
  });

  renderVehicles();
  renderServiceHistory();
  closeModal();
});


// ==========================
// HELPERS
// ==========================
function interval(type) { return type === 'Bike' ? 6000 : 10000; }

function calcService(type, svcKm, currentOdo) {
  const iv    = interval(type);
  const nextAt = parseInt(svcKm) + iv;
  const rem   = nextAt - parseInt(currentOdo);
  return { iv, nextAt, rem };
}

function statusClass(rem) {
  if (rem <= 2000) return 'danger';
  if (rem <= 4000) return 'warning';
  return 'good';
}

function statusText(rem) {
  if (rem <= 2000) return 'Due Soon';
  if (rem <= 4000) return 'Monitor';
  return 'Good';
}

function progressPct(rem, iv) {
  return Math.min(100, Math.max(0, Math.round(((iv - rem) / iv) * 100)));
}

function fmt(n) { return Number(n).toLocaleString(); }

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}


// ==========================
// INIT
// ==========================
renderVehicles();
updateVehicleFilter();