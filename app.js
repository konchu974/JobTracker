let jobs = JSON.parse(localStorage.getItem("jt_jobs") || "[]");
let editingId = null;
let dragId = null;

const STATUS = {
  spotted:   { label: "Repéré",    color: "var(--blue)"   },
  applied:   { label: "Postulé",   color: "var(--amber)"  },
  interview: { label: "Entretien", color: "var(--purple)" },
  offer:     { label: "Offre",     color: "var(--green)"  },
  refused:   { label: "Refus",     color: "var(--red)"    },
};

function save() {
  localStorage.setItem("jt_jobs", JSON.stringify(jobs));
}

// Protection injection XSS
const escHtml = (s) =>
  (s || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;");

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

// DOM
function render() {
  const statuses = Object.keys(STATUS);
  statuses.forEach((s) => {
    document.getElementById("cards-" + s).innerHTML = "";
    document.getElementById("cnt-" + s).textContent = 0;
  });
  const counts = {};
  jobs.forEach((job, i) => {
    counts[job.status] = (counts[job.status] || 0) + 1;
    const col = document.getElementById("cards-" + job.status);
    if (col) col.appendChild(buildCard(job, i));
  });
  statuses.forEach((s) => {
    document.getElementById("cnt-" + s).textContent = counts[s] || 0;
    const col = document.getElementById("cards-" + s);
    if (!counts[s]) {
      const empty = document.createElement("div");
      empty.className = "col-empty";
      empty.textContent = "+ Ajouter ici";
      empty.onclick = () => openModal();
      col.appendChild(empty);
    }
  });
  updateStats();
}

function buildCard(job, idx) {
  const card = document.createElement("article");
  card.className = "job-card";
  card.style.animationDelay = idx * 0.03 + "s";
  card.draggable = true;
  card.dataset.id = job.id;

  let reminderHTML = "";
  if (job.reminder) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(job.reminder);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff < 0)
      reminderHTML = `<div class="card-reminder reminder-overdue">En retard de ${Math.abs(diff)}j</div>`;
    else if (diff === 0)
      reminderHTML = `<div class="card-reminder reminder-soon">Relance aujourd'hui</div>`;
    else if (diff <= 7)
      reminderHTML = `<div class="card-reminder reminder-soon">Dans ${diff}j</div>`;
    else
      reminderHTML = `<div class="card-reminder reminder-ok">${formatDate(job.reminder)}</div>`;
  }

  card.innerHTML = `
    <div class="card-company">${escHtml(job.company)}</div>
    <div class="card-role">${escHtml(job.role)}</div>
    ${job.salary ? `<div class="card-tags"><span class="tag tag-salary">${escHtml(job.salary)}</span></div>` : ""}
    ${job.date ? `<div class="card-date">${formatDate(job.date)}</div>` : ""}
    ${reminderHTML}
    ${job.notes ? `<div class="card-note-preview">${escHtml(job.notes)}</div>` : ""}
    <div class="card-actions">
  <button class="card-btn" title="Modifier">
    <img src="icons/update-svgrepo-com.svg" width="13" height="13">
  </button>
  <button class="card-btn del" title="Supprimer">
    <img src="icons/delete-svgrepo-com.svg" width="13" height="13">
  </button>
</div>`;

  card.querySelector(".card-btn:not(.del)").onclick = (e) => {
    e.stopPropagation();
    openModal(job.id);
  };
  card.querySelector(".card-btn.del").onclick = (e) => {
    e.stopPropagation();
    deleteJob(job.id);
  };
  card.addEventListener("click", () => openModal(job.id));
  card.addEventListener("dragstart", (e) => {
    dragId = job.id;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  return card;
}

// MODAL
function openModal(jobId = null) {
  editingId = jobId;
  document.getElementById("modal-title-text").textContent = jobId
    ? "Modifier"
    : "Nouvelle candidature";
  if (jobId) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    ["company", "role", "salary", "location", "date", "reminder", "url", "notes"]
      .forEach((f) => (document.getElementById("f-" + f).value = job[f] || ""));
  } else {
    ["company", "role", "salary", "location", "url", "notes"].forEach(
      (f) => (document.getElementById("f-" + f).value = "")
    );
    document.getElementById("f-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("f-reminder").value = "";
  }
  document.getElementById("modal").classList.add("on");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("f-company").focus(), 150);
}

function closeModal() {
  document.getElementById("modal").classList.remove("on");
  document.body.style.overflow = "";
  editingId = null;
}

document.getElementById("modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("modal")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function saveJob() {
  const company = document.getElementById("f-company").value.trim();
  const role    = document.getElementById("f-role").value.trim();
  if (!company || !role) {
    showToast("Entreprise et poste sont obligatoires");
    return;
  }

  const data = {
    company,
    role,
    salary:   document.getElementById("f-salary").value.trim(),
    location: document.getElementById("f-location").value.trim(),
    date:     document.getElementById("f-date").value,
    reminder: document.getElementById("f-reminder").value,
    url:      document.getElementById("f-url").value.trim(),
    notes:    document.getElementById("f-notes").value.trim(),
    status:   editingId
      ? jobs.find((j) => j.id === editingId)?.status || "spotted"
      : "spotted",
  };

  if (editingId) {
    const idx = jobs.findIndex((j) => j.id === editingId);
    if (idx !== -1) jobs[idx] = { ...jobs[idx], ...data };
    showToast("Mise à jour ✓");
  } else {
    data.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    data.createdAt = new Date().toISOString();
    jobs.push(data);
    showToast("Candidature ajoutée ✓");
  }
  save();
  render();
  closeModal();
}

function deleteJob(jobId) {
  if (!confirm("Supprimer cette candidature ?")) return;
  jobs = jobs.filter((j) => j.id !== jobId);
  save();
  render();
}

function switchView(v) {
  document.getElementById("view-kanban").style.display = v === "kanban" ? "flex" : "none";
  document.getElementById("view-stats").style.display  = v === "stats"  ? "block" : "none";
  document.getElementById("vbtn-kanban").classList.toggle("active", v === "kanban");
  document.getElementById("vbtn-stats").classList.toggle("active",  v === "stats");
  if (v === "stats") updateStats();
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

function updateStats() {
  const total     = jobs.length;
  const applied   = jobs.filter((j) => j.status !== "spotted").length;
  const interview = jobs.filter((j) => ["interview", "offer"].includes(j.status)).length;
  const offer     = jobs.filter((j) => j.status === "offer").length;
  const refused   = jobs.filter((j) => j.status === "refused").length;
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = jobs.filter(
    (j) =>
      j.reminder &&
      new Date(j.reminder) < today &&
      !["offer", "refused"].includes(j.status)
  ).length;
  const rate = applied > 0 ? Math.round((interview / applied) * 100) : 0;

  document.getElementById("s-total").textContent     = total;
  document.getElementById("s-interview").textContent = interview;
  document.getElementById("s-offer").textContent     = offer;
  document.getElementById("s-overdue").textContent   = overdue;

  renderStatsView(total, applied, interview, offer, refused, rate, overdue);
}

function renderStatsView(total, applied, interview, offer, refused, rate, overdue) {
  // Cartes de stats
  const statsEl = document.getElementById("stats-cards");
  if (statsEl) {
    const stats = [
      { num: total,        label: "Total candidatures",   color: "var(--text)"   },
      { num: applied,      label: "Postulées",            color: "var(--amber)"  },
      { num: interview,    label: "Entretiens obtenus",   color: "var(--purple)" },
      { num: offer,        label: "Offres reçues",        color: "var(--green)"  },
      { num: rate + "%",   label: "Taux de réponse",      color: "var(--blue)"   },
      { num: overdue,      label: "Relances en retard",   color: overdue > 0 ? "var(--red)" : "var(--muted)" },
    ];
    statsEl.innerHTML = stats.map((s) =>
      `<div class="stat-card">
        <div class="stat-card-num" style="color:${s.color}">${s.num}</div>
        <div class="stat-card-label">${s.label}</div>
      </div>`
    ).join("");
  }

  // Entonnoir
  const funnelEl = document.getElementById("funnel-rows");
  if (funnelEl) {
    const maxVal = Math.max(total, 1);
    const funnel = [
      { label: "Repérés",    count: jobs.filter((j) => j.status === "spotted").length,   color: "var(--blue)"   },
      { label: "Postulés",   count: applied,   color: "var(--amber)"  },
      { label: "Entretiens", count: interview, color: "var(--purple)" },
      { label: "Offres",     count: offer,     color: "var(--green)"  },
      { label: "Refus",      count: refused,   color: "var(--red)"    },
    ];
    funnelEl.innerHTML = funnel.map((f) =>
      `<div class="funnel-row">
        <span class="funnel-label" style="color:${f.color}">${f.label}</span>
        <div class="funnel-track">
          <div class="funnel-fill" style="width:${Math.round((f.count / maxVal) * 100)}%;background:${f.color}">
            ${f.count > 0 ? `<span>${f.count}</span>` : ""}
          </div>
        </div>
        <span class="funnel-num">${f.count}</span>
      </div>`
    ).join("");
  }

  // Relances à venir
  const remEl = document.getElementById("reminders-list");
  if (remEl) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const upcoming = jobs
      .filter((j) => j.reminder && !["offer", "refused"].includes(j.status))
      .sort((a, b) => a.reminder.localeCompare(b.reminder))
      .slice(0, 8);
    if (!upcoming.length) {
      remEl.innerHTML = `<div style="color:var(--muted);font-size:.82rem;padding:.75rem 0">Aucune relance planifiée.</div>`;
    } else {
      remEl.innerHTML = upcoming.map((j) => {
        const d = new Date(j.reminder); d.setHours(0, 0, 0, 0);
        const diff  = Math.round((d - now) / 86400000);
        const label = diff < 0 ? `En retard de ${Math.abs(diff)}j` : diff === 0 ? "Aujourd'hui" : `Dans ${diff}j`;
        const color = diff < 0 ? "var(--red)" : diff <= 7 ? "var(--amber)" : "var(--green)";
        return `<div class="reminder-item">
          <span class="reminder-dot" style="background:${STATUS[j.status]?.color}"></span>
          <div class="reminder-info">
            <div class="reminder-company">${escHtml(j.company)}</div>
            <div class="reminder-role">${escHtml(j.role)}</div>
          </div>
          <span class="reminder-date" style="color:${color}">${label}</span>
        </div>`;
      }).join("");
    }
  }
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function onDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");
  if (!dragId) return;
  const job = jobs.find((j) => j.id === dragId);
  if (job && job.status !== newStatus) {
    job.status = newStatus;
    save();
    render();
    showToast("Déplacé vers " + STATUS[newStatus].label);
  }
  dragId = null;
}


render();