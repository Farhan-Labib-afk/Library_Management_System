const incomingList = document.getElementById("incomingList");
const outgoingList = document.getElementById("outgoingList");
const transferLog = document.getElementById("transferLog");
const reportList = document.getElementById("reportList");
const successSound = document.getElementById("successSound");

let shipments = [];

// ---------- Load shipments ----------
async function loadShipments() {
  const res = await fetch("data/books.json");
  const data = await res.json();

  shipments = data.shipments?.incoming || [
    {
      shipmentId: "SH-101",
      fromBranch: "Central Branch",
      arrivalDate: "2025-10-22",
      books: [
        { id: "the-hobbit", quantity: 3 },
        { id: "gatsby", quantity: 2 }
      ],
      status: "Pending"
    },
    {
      shipmentId: "SH-102",
      fromBranch: "East Calgary Branch",
      arrivalDate: "2025-10-25",
      books: [
        { id: "mockingbird", quantity: 4 },
        { id: "1984", quantity: 3 }
      ],
      status: "Pending"
    }
  ];

  // Merge with locally saved shipments (if user already acted)
  const local = JSON.parse(localStorage.getItem("transferShipments") || "[]");
  if (local.length) shipments = local;

  renderIncoming();
  loadReports();
  loadTransferLog();
}

// ---------- Render incoming shipments ----------
function renderIncoming() {
  if (!shipments.length) {
    incomingList.innerHTML = `<p style="text-align:center;">No pending shipments.</p>`;
    return;
  }

  incomingList.innerHTML = shipments
    .filter(s => s.status === "Pending")
    .map(s => `
      <div class="transfer-card" id="ship-${s.shipmentId}">
        <div class="transfer-header">
          <h3>Shipment ${s.shipmentId}</h3>
          <span>📅 ${s.arrivalDate}</span>
        </div>
        <div class="transfer-info">
          <p><strong>From:</strong> ${s.fromBranch}</p>
          <p><strong>Books:</strong></p>
          <ul>
            ${s.books.map(b => `<li>${b.id} — ${b.quantity} copies</li>`).join("")}
          </ul>
        </div>
        <div class="action-buttons">
          <button class="action-btn accept-btn" onclick="handleAction('${s.shipmentId}', 'Accepted')">Accept</button>
          <button class="action-btn delay-btn" onclick="handleAction('${s.shipmentId}', 'Delayed')">Delay</button>
          <button class="action-btn reject-btn" onclick="handleAction('${s.shipmentId}', 'Rejected')">Reject</button>
        </div>
      </div>
    `)
    .join("");
}

// ---------- Handle actions ----------
function handleAction(id, action) {
  const ship = shipments.find(s => s.shipmentId === id);
  if (!ship) return;

  ship.status = action;
  saveShipments();
  logTransfer(ship, action);
  successSound.play();

  document.getElementById(`ship-${id}`).remove();

  if (action === "Accepted") generateShipmentReport(ship);
  if (document.querySelectorAll(".transfer-card").length === 0)
    incomingList.innerHTML = `<p style="text-align:center;">All shipments processed.</p>`;
}

// ---------- Save shipments ----------
function saveShipments() {
  localStorage.setItem("transferShipments", JSON.stringify(shipments));
}

// ---------- Log actions ----------
function logTransfer(ship, action) {
  const logs = JSON.parse(localStorage.getItem("transferLog") || "[]");
  const time = new Date().toLocaleString();
  logs.unshift({
    shipmentId: ship.shipmentId,
    branch: ship.fromBranch,
    action: action,
    time: time,
    by: "Transfer Staff"
  });
  localStorage.setItem("transferLog", JSON.stringify(logs));
  loadTransferLog();
}

// ---------- Generate Shipment Report ----------
function generateShipmentReport(ship) {
  const reports = JSON.parse(localStorage.getItem("shipmentReports") || "[]");
  const time = new Date().toLocaleString();
  const report = {
    id: ship.shipmentId,
    from: ship.fromBranch,
    books: ship.books,
    createdAt: time,
    status: "Awaiting Inventory Review"
  };
  reports.unshift(report);
  localStorage.setItem("shipmentReports", JSON.stringify(reports));
  loadReports();
}

// ---------- Load Reports ----------
function loadReports() {
  const reports = JSON.parse(localStorage.getItem("shipmentReports") || "[]");
  if (!reports.length) {
    reportList.innerHTML = `<p style="text-align:center;">No shipment reports generated yet.</p>`;
    return;
  }

  reportList.innerHTML = reports.map(r => `
    <div class="transfer-card accepted">
      <div class="transfer-header">
        <h3>Report: ${r.id}</h3>
        <span>🕒 ${r.createdAt}</span>
      </div>
      <div class="transfer-info">
        <p><strong>From:</strong> ${r.from}</p>
        <ul>${r.books.map(b => `<li>${b.id} — ${b.quantity} copies</li>`).join("")}</ul>
        <p><em>Status: ${r.status}</em></p>
      </div>
    </div>
  `).join("");
}

// ---------- Load Transfer Log ----------
function loadTransferLog() {
  const logs = JSON.parse(localStorage.getItem("transferLog") || "[]");
  if (!logs.length) {
    transferLog.innerHTML = `<li>No transfer activity yet.</li>`;
    return;
  }

  transferLog.innerHTML = logs.map(l => `
    <li class="${l.action.toLowerCase()}">
      🚚 Shipment <strong>${l.shipmentId}</strong> — ${l.action}
      <br>📍 From ${l.branch} | 🕒 ${l.time} | By ${l.by}
    </li>
  `).join("");
}

// ---------- Init ----------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadShipments);
} else {
  loadShipments();
}
