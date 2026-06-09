const titles = {
  dashboard: "Dashboard",
  harvest: "Harvest Recording",
  invoices: "Invoice Management",
  quality: "Harvest Quality Monitoring",
  search: "Record Search and Retrieval",
  reports: "Report Generation"
};

const users = {
  manager: { username: "manager", password: "rosaca123", label: "Farm Manager" },
  staff: { username: "staff", password: "rosaca123", label: "Farm Staff" }
};

const money = value => `PHP ${Number(value).toLocaleString()}`;
const kg = value => `${Number(value).toLocaleString()} kg`;

let harvests = [];
let invoices = [];
let role = "manager";
let db = null;
let dbReady = false;
let editingHarvestId = null;
let editingInvoiceId = null;

document.getElementById("loginRole").addEventListener("change", event => {
  const selected = event.target.value;
  document.getElementById("username").value = selected;
});

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  role = document.getElementById("loginRole").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const allowed = users[role];
  if (username !== allowed.username || password !== allowed.password) {
    document.getElementById("loginError").textContent = "Invalid authorized user credentials.";
    return;
  }
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginScreen").classList.add("is-hidden");
  document.getElementById("appShell").classList.remove("is-hidden");
  document.getElementById("roleLabel").textContent = allowed.label;
  applyRole();
  const connected = await initSupabase();
  if (connected) {
    renderAll();
    setNextTransactionNo();
    setNextInvoiceNo();
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  document.getElementById("appShell").classList.add("is-hidden");
  document.getElementById("loginScreen").classList.remove("is-hidden");
});

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.getElementById("harvestForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const record = { ...data, weight: Number(data.weight) };
  if (editingHarvestId) {
    const updated = await updateHarvest(editingHarvestId, record);
    if (!updated) return;
    harvests = harvests.map(row => row.id === editingHarvestId ? { ...record, id: editingHarvestId } : row);
    resetHarvestForm();
    renderAll();
    setView("harvest");
    return;
  }
  const saved = await saveHarvest(record);
  if (!saved) return;
  harvests.unshift(saved);
  resetHarvestForm();
  renderAll();
  setView("harvest");
});

document.getElementById("invoiceForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const record = {
    ...data,
    weight: Number(data.weight),
    rejected: Number(data.rejected),
    payment: Number(data.payment)
  };
  if (editingInvoiceId) {
    const updated = await updateInvoice(editingInvoiceId, record);
    if (!updated) return;
    invoices = invoices.map(row => row.id === editingInvoiceId ? { ...record, id: editingInvoiceId } : row);
    resetInvoiceForm();
    renderAll();
    setView("invoices");
    return;
  }
  const saved = await saveInvoice(record);
  if (!saved) return;
  invoices.unshift(saved);
  resetInvoiceForm();
  renderAll();
  setView("invoices");
});

document.getElementById("cancelHarvestEdit").addEventListener("click", resetHarvestForm);
document.getElementById("cancelInvoiceEdit").addEventListener("click", resetInvoiceForm);

document.getElementById("harvestTable").addEventListener("click", event => {
  const button = event.target.closest("[data-edit-harvest]");
  if (!button) return;
  startHarvestEdit(button.dataset.editHarvest);
});

document.getElementById("invoiceTable").addEventListener("click", event => {
  const button = event.target.closest("[data-edit-invoice]");
  if (!button) return;
  startInvoiceEdit(button.dataset.editInvoice);
});

document.getElementById("searchInput").addEventListener("input", renderSearch);

document.querySelectorAll(".report-card").forEach(button => {
  button.addEventListener("click", () => renderReport(button.dataset.report));
});

document.getElementById("printReport").addEventListener("click", () => {
  window.print();
});

function applyRole() {
  const managerOnly = ["quality", "reports"];
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.hidden = role === "staff" && managerOnly.includes(button.dataset.view);
  });
  if (role === "staff" && managerOnly.includes(currentView())) setView("dashboard");
}

function currentView() {
  return document.querySelector(".nav-btn.active")?.dataset.view || "dashboard";
}

function setView(view) {
  document.querySelectorAll(".nav-btn").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".view").forEach(section => section.classList.remove("active"));
  const nextView = document.getElementById(`${view}View`);
  nextView.classList.add("active");
  document.getElementById("viewTitle").textContent = titles[view];
  if (view === "search") renderSearch();
  if (view === "reports") renderReport("harvest");
}

function renderAll() {
  renderDashboard();
  renderHarvests();
  renderInvoices();
  renderQuality();
  renderSearch();
  setNextTransactionNo();
  setNextInvoiceNo();
}

function setNextTransactionNo() {
  const input = document.getElementById("transactionNo");
  if (!input || editingHarvestId) return;
  input.value = nextTransactionNo();
}

function nextTransactionNo() {
  const year = new Date().getFullYear();
  const numbers = harvests
    .map(row => String(row.transactionNo || "").match(/^HT-\d{4}-(\d+)$/))
    .filter(Boolean)
    .map(match => Number(match[1]));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `HT-${year}-${String(next).padStart(3, "0")}`;
}

function setNextInvoiceNo() {
  const input = document.getElementById("invoiceNo");
  if (!input || editingInvoiceId) return;
  input.value = nextInvoiceNo();
}

function nextInvoiceNo() {
  const year = new Date().getFullYear();
  const numbers = invoices
    .map(row => String(row.invoiceNo || "").match(/^INV-\d{4}-(\d+)$/))
    .filter(Boolean)
    .map(match => Number(match[1]));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `INV-${year}-${String(next).padStart(3, "0")}`;
}

function startHarvestEdit(id) {
  const record = harvests.find(row => String(row.id) === String(id));
  if (!record) return;
  editingHarvestId = record.id;
  const form = document.getElementById("harvestForm");
  form.transactionNo.value = record.transactionNo;
  form.harvestDate.value = record.harvestDate;
  form.batch.value = record.batch;
  form.weight.value = record.weight;
  form.deliveryDate.value = record.deliveryDate;
  form.remarks.value = record.remarks;
  document.getElementById("harvestSubmitBtn").textContent = "Update harvest record";
  document.getElementById("cancelHarvestEdit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetHarvestForm() {
  editingHarvestId = null;
  document.getElementById("harvestForm").reset();
  document.getElementById("harvestSubmitBtn").textContent = "Save harvest record";
  document.getElementById("cancelHarvestEdit").hidden = true;
  setNextTransactionNo();
}

function startInvoiceEdit(id) {
  const record = invoices.find(row => String(row.id) === String(id));
  if (!record) return;
  editingInvoiceId = record.id;
  const form = document.getElementById("invoiceForm");
  form.invoiceNo.value = record.invoiceNo;
  form.deliveryDate.value = record.deliveryDate;
  form.weight.value = record.weight;
  form.rejected.value = record.rejected;
  form.grade.value = record.grade;
  form.payment.value = record.payment;
  document.getElementById("invoiceSubmitBtn").textContent = "Update invoice";
  document.getElementById("cancelInvoiceEdit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetInvoiceForm() {
  editingInvoiceId = null;
  document.getElementById("invoiceForm").reset();
  document.getElementById("invoiceSubmitBtn").textContent = "Save invoice";
  document.getElementById("cancelInvoiceEdit").hidden = true;
  setNextInvoiceNo();
}

async function initSupabase() {
  const config = window.ROSACA_SUPABASE || {};
  const hasConfig = config.url && config.anonKey && window.supabase;
  if (!hasConfig) {
    dbReady = false;
    setDataStatus("Supabase config required");
    showConnectionError("Supabase is not configured yet. Add your Project URL and anon public key in supabase-config.js.");
    return false;
  }

  try {
    db = window.supabase.createClient(config.url, config.anonKey);
    const [harvestResult, invoiceResult] = await Promise.all([
      db.from("harvest_records").select("*").order("created_at", { ascending: false }),
      db.from("invoice_records").select("*").order("created_at", { ascending: false })
    ]);

    if (harvestResult.error) throw harvestResult.error;
    if (invoiceResult.error) throw invoiceResult.error;

    harvests = harvestResult.data.map(fromHarvestRow);
    invoices = invoiceResult.data.map(fromInvoiceRow);
    dbReady = true;
    setDataStatus("Supabase connected");
    hideConnectionError();
    return true;
  } catch (error) {
    dbReady = false;
    setDataStatus("Supabase unavailable");
    showConnectionError("Could not connect to Supabase. Check your keys, SQL schema, and Row Level Security policies.");
    console.warn("Supabase connection failed:", error.message || error);
    return false;
  }
}

async function saveHarvest(record) {
  if (!dbReady) {
    showConnectionError("Connect Supabase before saving harvest records.");
    return false;
  }
  const { data, error } = await db.from("harvest_records").insert(toHarvestRow(record)).select().single();
  if (error) {
    setDataStatus("Save failed - check Supabase");
    showConnectionError("Harvest record was not saved to Supabase. Check duplicate transaction numbers and table policies.");
    console.warn("Harvest save failed:", error.message || error);
    return false;
  }
  setDataStatus("Saved to Supabase");
  hideConnectionError();
  return fromHarvestRow(data);
}

async function saveInvoice(record) {
  if (!dbReady) {
    showConnectionError("Connect Supabase before saving invoice records.");
    return false;
  }
  const { data, error } = await db.from("invoice_records").insert(toInvoiceRow(record)).select().single();
  if (error) {
    setDataStatus("Save failed - check Supabase");
    showConnectionError("Invoice record was not saved to Supabase. Check duplicate invoice numbers and table policies.");
    console.warn("Invoice save failed:", error.message || error);
    return false;
  }
  setDataStatus("Saved to Supabase");
  hideConnectionError();
  return fromInvoiceRow(data);
}

async function updateHarvest(id, record) {
  if (!dbReady) {
    showConnectionError("Connect Supabase before editing harvest records.");
    return false;
  }
  const { error } = await db.from("harvest_records").update(toHarvestRow(record)).eq("id", id);
  if (error) {
    setDataStatus("Update failed - check Supabase");
    showConnectionError("Harvest record was not updated. Run the latest supabase-schema.sql to allow update access.");
    console.warn("Harvest update failed:", error.message || error);
    return false;
  }
  setDataStatus("Updated in Supabase");
  hideConnectionError();
  return true;
}

async function updateInvoice(id, record) {
  if (!dbReady) {
    showConnectionError("Connect Supabase before editing invoice records.");
    return false;
  }
  const { error } = await db.from("invoice_records").update(toInvoiceRow(record)).eq("id", id);
  if (error) {
    setDataStatus("Update failed - check Supabase");
    showConnectionError("Invoice record was not updated. Run the latest supabase-schema.sql to allow update access.");
    console.warn("Invoice update failed:", error.message || error);
    return false;
  }
  setDataStatus("Updated in Supabase");
  hideConnectionError();
  return true;
}

function setDataStatus(message) {
  document.getElementById("dataStatus").textContent = message;
}

function showConnectionError(message) {
  document.getElementById("connectionNotice").hidden = false;
  document.getElementById("connectionMessage").textContent = message;
}

function hideConnectionError() {
  document.getElementById("connectionNotice").hidden = true;
  document.getElementById("connectionMessage").textContent = "";
}

function toHarvestRow(row) {
  return {
    transaction_no: row.transactionNo,
    harvest_date: row.harvestDate,
    batch_information: row.batch,
    harvest_weight: row.weight,
    delivery_date: row.deliveryDate,
    remarks: row.remarks || ""
  };
}

function fromHarvestRow(row) {
  return {
    id: row.id,
    transactionNo: row.transaction_no,
    harvestDate: row.harvest_date,
    batch: row.batch_information,
    weight: Number(row.harvest_weight),
    deliveryDate: row.delivery_date,
    remarks: row.remarks || ""
  };
}

function toInvoiceRow(row) {
  return {
    invoice_no: row.invoiceNo,
    delivery_date: row.deliveryDate,
    harvest_weight: row.weight,
    rejected_quantity: row.rejected,
    quality_grade: row.grade,
    payment_amount: row.payment
  };
}

function fromInvoiceRow(row) {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    deliveryDate: row.delivery_date,
    weight: Number(row.harvest_weight),
    rejected: Number(row.rejected_quantity),
    grade: row.quality_grade,
    payment: Number(row.payment_amount)
  };
}

function renderDashboard() {
  const totalHarvest = harvests.reduce((sum, row) => sum + row.weight, 0);
  const totalRejected = invoices.reduce((sum, row) => sum + row.rejected, 0);
  const rejectionRate = totalHarvest ? (totalRejected / totalHarvest) * 100 : 0;
  document.getElementById("totalHarvest").textContent = kg(totalHarvest);
  document.getElementById("totalDeliveries").textContent = harvests.length;
  document.getElementById("totalRejected").textContent = kg(totalRejected);
  document.getElementById("averageQuality").textContent = mostCommonGrade();
  document.getElementById("rejectionRate").textContent = `${rejectionRate.toFixed(1)}% rejected`;
  document.getElementById("qualityBars").innerHTML = gradeRows();
  document.getElementById("recentInvoices").innerHTML = invoices.slice(0, 4).map(invoice => `
    <div class="list-item">
      <div><strong>${invoice.invoiceNo}</strong><br><span>${invoice.deliveryDate} | ${kg(invoice.weight)}</span></div>
      <span class="tag">${money(invoice.payment)}</span>
    </div>
  `).join("");
}

function renderHarvests() {
  document.getElementById("harvestCount").textContent = `${harvests.length} records`;
  document.getElementById("harvestTable").innerHTML = harvests.map(row => `
    <tr>
      <td>${row.transactionNo}</td>
      <td>${row.batch}</td>
      <td>${row.harvestDate}</td>
      <td>${row.deliveryDate}</td>
      <td>${kg(row.weight)}</td>
      <td><button class="table-action" type="button" data-edit-harvest="${row.id}">Edit</button></td>
    </tr>
  `).join("");
}

function renderInvoices() {
  document.getElementById("invoiceCount").textContent = `${invoices.length} records`;
  document.getElementById("invoiceTable").innerHTML = invoices.map(row => `
    <tr>
      <td>${row.invoiceNo}</td>
      <td>${row.deliveryDate}</td>
      <td>${kg(row.weight)}</td>
      <td>${kg(row.rejected)}</td>
      <td>Grade ${row.grade}</td>
      <td>${money(row.payment)}</td>
      <td><button class="table-action" type="button" data-edit-invoice="${row.id}">Edit</button></td>
    </tr>
  `).join("");
}

function renderQuality() {
  const maxRejected = Math.max(...invoices.map(row => row.rejected), 1);
  document.getElementById("rejectedTrend").innerHTML = invoices.map(row => `
    <div class="trend-row">
      <span>${row.deliveryDate}</span>
      <div class="bar-track"><div class="trend-fill" style="width:${(row.rejected / maxRejected) * 100}%"></div></div>
      <strong>${kg(row.rejected)}</strong>
    </div>
  `).join("");
  document.getElementById("gradeSummary").innerHTML = ["A", "B", "C"].map(grade => {
    const count = invoices.filter(row => row.grade === grade).length;
    return `<div class="grade-box"><span>Grade ${grade}</span><strong>${count}</strong></div>`;
  }).join("");
}

function renderSearch() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const combined = [
    ...harvests.map(row => ({ type: "Harvest", id: row.transactionNo, date: row.deliveryDate, summary: `${row.batch} | ${kg(row.weight)} | ${row.remarks}` })),
    ...invoices.map(row => ({ type: "Invoice", id: row.invoiceNo, date: row.deliveryDate, summary: `${kg(row.weight)} | rejected ${kg(row.rejected)} | Grade ${row.grade} | ${money(row.payment)}` }))
  ];
  const filtered = combined.filter(row => `${row.type} ${row.id} ${row.date} ${row.summary}`.toLowerCase().includes(query));
  document.getElementById("searchResults").innerHTML = filtered.map(row => `
    <div class="result-item">
      <div><strong>${row.id}</strong><br><span>${row.date} | ${row.summary}</span></div>
      <span class="tag">${row.type}</span>
    </div>
  `).join("") || `<p class="muted">No matching records found.</p>`;
}

function renderReport(type) {
  document.querySelectorAll(".report-card").forEach(button => button.classList.toggle("active", button.dataset.report === type));
  const totalPayment = invoices.reduce((sum, row) => sum + row.payment, 0);
  const reportMap = {
    harvest: {
      title: "Harvest Report",
      rows: harvests.map(row => `${row.transactionNo}: ${row.batch}, harvested ${row.harvestDate}, delivered ${row.deliveryDate}, ${kg(row.weight)}.`)
    },
    invoice: {
      title: "Invoice Summary Report",
      rows: [`Total invoices: ${invoices.length}.`, `Total payment recorded: ${money(totalPayment)}.`, ...invoices.map(row => `${row.invoiceNo}: ${money(row.payment)} for ${kg(row.weight)}.`)]
    },
    quality: {
      title: "Harvest Quality Report",
      rows: [`Most common quality grade: ${mostCommonGrade()}.`, `Total rejected quantity: ${kg(invoices.reduce((sum, row) => sum + row.rejected, 0))}.`, ...invoices.map(row => `${row.invoiceNo}: Grade ${row.grade}, rejected ${kg(row.rejected)}.`)]
    },
    delivery: {
      title: "Delivery Report",
      rows: harvests.map(row => `${row.deliveryDate}: ${row.transactionNo} delivered from ${row.batch}, ${kg(row.weight)}.`)
    }
  };
  document.getElementById("reportTitle").textContent = reportMap[type].title;
  document.getElementById("reportBody").innerHTML = `<ul>${reportMap[type].rows.map(row => `<li>${row}</li>`).join("")}</ul>`;
}

function gradeRows() {
  const counts = ["A", "B", "C"].map(grade => ({ grade, count: invoices.filter(row => row.grade === grade).length }));
  const max = Math.max(...counts.map(row => row.count), 1);
  return counts.map(row => `
    <div class="bar-row">
      <strong>Grade ${row.grade}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${(row.count / max) * 100}%"></div></div>
      <span>${row.count} invoices</span>
    </div>
  `).join("");
}

function mostCommonGrade() {
  if (!invoices.length) return "No grade";
  return ["A", "B", "C"].sort((a, b) =>
    invoices.filter(row => row.grade === b).length - invoices.filter(row => row.grade === a).length
  )[0] ? `Grade ${["A", "B", "C"].sort((a, b) =>
    invoices.filter(row => row.grade === b).length - invoices.filter(row => row.grade === a).length
  )[0]}` : "No grade";
}

renderAll();
