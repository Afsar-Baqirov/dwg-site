// ===== Helpers =====
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const STORE = {
  user: "dwg_user",
  unis: "dwg_unis",
  dormFavs: "dwg_dorm_favs",
  docs: "dwg_docs",
  activity: "dwg_activity"
};

function readJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{ return fallback; }
}
function writeJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}
function addActivity(text){
  const items = readJSON(STORE.activity, []);
  items.unshift({ text, at: new Date().toISOString() });
  writeJSON(STORE.activity, items.slice(0, 12));
}
function fmtTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString();
  }catch{ return ""; }
}
function go(to){ window.location.href = to; }

// ===== Landing: auth modal =====
const modal = qs("#authModal");
const backdrop = qs("#modalBackdrop");
const openLoginBtn = qs("#openLogin");
const openSignupBtn = qs("#openSignup");
const getStartedBtn = qs("#getStarted");
const closeModalBtn = qs("#closeModal");

const tabLogin = qs("#tabLogin");
const tabSignup = qs("#tabSignup");
const confirmWrap = qs("#confirmWrap");
const confirmPassword = qs("#confirmPassword");
const submitBtn = qs("#submitBtn");
const authForm = qs("#authForm");
const forgotBtn = qs("#forgotBtn");

function setAuthMode(mode){
  const isSignup = mode === "signup";
  tabLogin?.classList.toggle("active", !isSignup);
  tabSignup?.classList.toggle("active", isSignup);
  confirmWrap?.classList.toggle("hidden", !isSignup);

  if(confirmPassword){
    confirmPassword.required = isSignup;
    if(!isSignup) confirmPassword.value = "";
  }
  if(submitBtn) submitBtn.textContent = isSignup ? "Create account" : "Log in";
}
function openModal(mode="login"){
  if(!modal || !backdrop) return;
  modal.classList.add("open");
  backdrop.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  backdrop.setAttribute("aria-hidden", "false");
  setAuthMode(mode);
  setTimeout(() => qs("#email")?.focus(), 40);
}
function closeModal(){
  modal?.classList.remove("open");
  backdrop?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  backdrop?.setAttribute("aria-hidden", "true");
}

openLoginBtn?.addEventListener("click", () => openModal("login"));
openSignupBtn?.addEventListener("click", () => openModal("signup"));
getStartedBtn?.addEventListener("click", () => openModal("signup"));
closeModalBtn?.addEventListener("click", closeModal);
backdrop?.addEventListener("click", closeModal);

tabLogin?.addEventListener("click", () => setAuthMode("login"));
tabSignup?.addEventListener("click", () => setAuthMode("signup"));
forgotBtn?.addEventListener("click", () => alert("Demo: reset flow not connected."));

authForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = qs("#email")?.value?.trim();
  const pass = qs("#password")?.value ?? "";
  const isSignup = tabSignup?.classList.contains("active");

  if(!email || !pass){ alert("Please enter email and password."); return; }
  if(isSignup){
    const c = qs("#confirmPassword")?.value ?? "";
    if(c !== pass){ alert("Passwords do not match."); return; }
  }

  writeJSON(STORE.user, { name: "John Doe", email, country: "Turkey" });
  addActivity(`Signed in as ${email}`);
  go("dashboard.html");
});

window.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});

// ===== Dashboard: layout + pages =====
const sidebar = qs("#sidebar");
const toggleSidebar = qs("#toggleSidebar");
const toggleSidebar2 = qs("#toggleSidebar2");
const sideNav = qs("#sideNav");

function toggleSide(){ sidebar?.classList.toggle("open"); }
toggleSidebar?.addEventListener("click", toggleSide);
toggleSidebar2?.addEventListener("click", toggleSide);

function showPage(id){
  qsa(".page").forEach(p => p.classList.remove("active"));
  qs("#" + id)?.classList.add("active");
  // close on mobile
  if(window.matchMedia("(max-width: 820px)").matches){
    sidebar?.classList.remove("open");
  }
  // refresh export view if opened
  if(id === "page-export") renderExport();
}

sideNav?.addEventListener("click", (e) => {
  const btn = e.target.closest("button.side-item");
  if(!btn) return;

  qsa("button.side-item").forEach(i => i.classList.remove("active"));
  btn.classList.add("active");

  const target = btn.getAttribute("data-target");
  if(target) showPage(target);
});

// ===== Demo data + state =====
const defaultDocs = [
  "Passport (valid)",
  "Transcript of Records",
  "Motivation Letter",
  "Language Certificate",
  "Health Insurance Proof",
  "Financial Proof (Blocked Account)"
];

function ensureDefaults(){
  if(!localStorage.getItem(STORE.unis)) writeJSON(STORE.unis, [
    { name:"Technical University of Munich", city:"Munich", field:"Engineering", type:"Public" },
    { name:"Free University of Berlin", city:"Berlin", field:"Research", type:"Public" }
  ]);
  if(!localStorage.getItem(STORE.dormFavs)) writeJSON(STORE.dormFavs, []);
  if(!localStorage.getItem(STORE.docs)) writeJSON(STORE.docs, defaultDocs.map(t => ({ text:t, done:false })));
  if(!localStorage.getItem(STORE.activity)) writeJSON(STORE.activity, [
    { text:"Bookmarked a university", at:new Date(Date.now()-3600*1000).toISOString() },
    { text:"Updated checklist", at:new Date(Date.now()-2*3600*1000).toISOString() },
  ]);
}
ensureDefaults();

// ===== Hydrate user in export =====
function getUser(){
  return readJSON(STORE.user, { name:"John Doe", email:"john.doe@example.com", country:"Turkey" });
}

// ===== KPIs + Activity =====
const kpiSavedUnis = qs("#kpiSavedUnis");
const kpiDormFavs = qs("#kpiDormFavs");
const kpiDocs = qs("#kpiDocs");
const activityEl = qs("#activity");

function refreshKPIs(){
  const unis = readJSON(STORE.unis, []);
  const dormFavs = readJSON(STORE.dormFavs, []);
  const docs = readJSON(STORE.docs, []);

  if(kpiSavedUnis) kpiSavedUnis.textContent = String(unis.length);
  if(kpiDormFavs) kpiDormFavs.textContent = String(dormFavs.length);

  const done = docs.filter(d => d.done).length;
  if(kpiDocs) kpiDocs.textContent = `${done}/${docs.length}`;

  if(activityEl){
    const items = readJSON(STORE.activity, []);
    activityEl.innerHTML = items.map(x => `
      <li>
        <div><strong>${x.text}</strong></div>
        <div class="muted tiny">${fmtTime(x.at)}</div>
      </li>
    `).join("") || `<li class="muted">No activity yet</li>`;
  }
}

// ===== Universities =====
const uniName = qs("#uniName");
const uniCity = qs("#uniCity");
const uniField = qs("#uniField");
const uniType = qs("#uniType");
const addUniBtn = qs("#addUniBtn");
const uniList = qs("#uniList");

function renderUnis(filterText=""){
  if(!uniList) return;
  const unis = readJSON(STORE.unis, []);
  const ft = filterText.trim().toLowerCase();

  const shown = ft
    ? unis.filter(u => (u.name+u.city+u.field+u.type).toLowerCase().includes(ft))
    : unis;

  uniList.innerHTML = shown.length ? shown.map((u, idx) => `
    <div class="item">
      <div class="meta">
        <div><strong>${u.name}</strong></div>
        <div class="muted tiny">${u.city} • ${u.field} • ${u.type}</div>
        <div class="pills">
          <span class="pill small">${u.city}</span>
          <span class="pill small">${u.type}</span>
        </div>
      </div>
      <div>
        <button class="btn btn-outline" data-del-uni="${idx}">Remove</button>
      </div>
    </div>
  `).join("") : `<div class="muted">No universities found.</div>`;
}

addUniBtn?.addEventListener("click", () => {
  const name = uniName?.value?.trim();
  const city = uniCity?.value?.trim();
  const field = uniField?.value?.trim();
  const type = uniType?.value || "Public";

  if(!name || !city || !field){
    alert("Please fill name, city, and field.");
    return;
  }

  const unis = readJSON(STORE.unis, []);
  unis.unshift({ name, city, field, type });
  writeJSON(STORE.unis, unis);

  uniName.value = ""; uniCity.value = ""; uniField.value = "";
  addActivity(`Saved university: ${name}`);
  renderUnis(qs("#quickSearch")?.value || "");
  refreshKPIs();
});

uniList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del-uni]");
  if(!btn) return;

  const idx = Number(btn.getAttribute("data-del-uni"));
  const unis = readJSON(STORE.unis, []);
  const removed = unis.splice(idx, 1);
  writeJSON(STORE.unis, unis);

  if(removed[0]) addActivity(`Removed university: ${removed[0].name}`);
  renderUnis(qs("#quickSearch")?.value || "");
  refreshKPIs();
});

// ===== Dorms =====
const dormCity = qs("#dormCity");
const dormMax = qs("#dormMax");
const searchDormBtn = qs("#searchDormBtn");
const dormResults = qs("#dormResults");
const dormFavList = qs("#dormFavList");

const dormDB = [
  { id:"b1", name:"Student Housing Mitte", city:"Berlin", price:390 },
  { id:"b2", name:"Campus Residence", city:"Berlin", price:450 },
  { id:"b3", name:"Cozy Dorm Near U-Bahn", city:"Berlin", price:520 },
  { id:"m1", name:"Munich Studentheim A", city:"Munich", price:560 },
  { id:"m2", name:"Munich Studentheim B", city:"Munich", price:690 },
  { id:"h1", name:"Hamburg Hafen Dorm", city:"Hamburg", price:480 },
];

function isDormFav(id){
  const favs = readJSON(STORE.dormFavs, []);
  return favs.some(x => x.id === id);
}
function toggleDormFav(item){
  const favs = readJSON(STORE.dormFavs, []);
  const exists = favs.some(x => x.id === item.id);
  const next = exists ? favs.filter(x => x.id !== item.id) : [item, ...favs];
  writeJSON(STORE.dormFavs, next);
  addActivity(`${exists ? "Removed dorm favorite" : "Saved dorm favorite"}: ${item.name}`);
  renderDormFavs();
  refreshKPIs();
}

function renderDormResults(){
  if(!dormResults) return;
  const city = dormCity?.value ?? "Berlin";
  const max = Number(dormMax?.value ?? 550);

  const results = dormDB.filter(d => d.city === city && d.price <= max);

  dormResults.innerHTML = results.length ? results.map(d => `
    <article class="card glass">
      <div class="card-title">${d.name}</div>
      <div class="muted tiny">${d.city} • from <b>€${d.price}</b>/month</div>
      <div style="height:10px"></div>
      <button class="btn ${isDormFav(d.id) ? "btn-outline" : "btn-primary"} btn-block" data-fav-dorm="${d.id}">
        ${isDormFav(d.id) ? "Remove Favorite" : "Save Favorite"}
      </button>
    </article>
  `).join("") : `<div class="muted">No results for ${city} under €${max}.</div>`;
}

function renderDormFavs(){
  if(!dormFavList) return;
  const favs = readJSON(STORE.dormFavs, []);
  dormFavList.innerHTML = favs.length ? favs.map(d => `
    <div class="item">
      <div class="meta">
        <div><strong>${d.name}</strong></div>
        <div class="muted tiny">${d.city} • €${d.price}/month</div>
      </div>
      <button class="btn btn-outline" data-unfav="${d.id}">Remove</button>
    </div>
  `).join("") : `<div class="muted">No favorites yet.</div>`;
}

searchDormBtn?.addEventListener("click", renderDormResults);

dormResults?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fav-dorm]");
  if(!btn) return;
  const id = btn.getAttribute("data-fav-dorm");
  const item = dormDB.find(x => x.id === id);
  if(item) toggleDormFav(item);
  renderDormResults();
});

dormFavList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-unfav]");
  if(!btn) return;
  const id = btn.getAttribute("data-unfav");
  const favs = readJSON(STORE.dormFavs, []);
  const item = favs.find(x => x.id === id);
  writeJSON(STORE.dormFavs, favs.filter(x => x.id !== id));
  if(item) addActivity(`Removed dorm favorite: ${item.name}`);
  renderDormFavs();
  renderDormResults();
  refreshKPIs();
});

// ===== Documents =====
const docsList = qs("#docsList");
const docsProgressText = qs("#docsProgressText");
const docsProgressFill = qs("#docsProgressFill");
const markAllDocs = qs("#markAllDocs");
const clearDocs = qs("#clearDocs");

function renderDocs(){
  if(!docsList) return;
  const docs = readJSON(STORE.docs, []);
  docsList.innerHTML = docs.map((d, idx) => `
    <label class="check">
      <input type="checkbox" data-doc="${idx}" ${d.done ? "checked":""}>
      ${d.text}
    </label>
  `).join("");
  updateDocsProgress();
}

function updateDocsProgress(){
  const docs = readJSON(STORE.docs, []);
  const done = docs.filter(d => d.done).length;
  const total = docs.length;
  const pct = total ? Math.round((done/total) * 100) : 0;

  if(docsProgressText) docsProgressText.textContent = `${done}/${total} completed`;
  if(docsProgressFill) docsProgressFill.style.width = pct + "%";

  refreshKPIs();
}

docsList?.addEventListener("change", (e) => {
  const cb = e.target.closest("input[type='checkbox'][data-doc]");
  if(!cb) return;

  const idx = Number(cb.getAttribute("data-doc"));
  const docs = readJSON(STORE.docs, []);
  if(!docs[idx]) return;

  docs[idx].done = cb.checked;
  writeJSON(STORE.docs, docs);
  addActivity(`${cb.checked ? "Completed" : "Unchecked"} document: ${docs[idx].text}`);
  updateDocsProgress();
});

markAllDocs?.addEventListener("click", () => {
  const docs = readJSON(STORE.docs, []);
  docs.forEach(d => d.done = true);
  writeJSON(STORE.docs, docs);
  addActivity("Marked all documents as completed");
  renderDocs();
});

clearDocs?.addEventListener("click", () => {
  const docs = readJSON(STORE.docs, []);
  docs.forEach(d => d.done = false);
  writeJSON(STORE.docs, docs);
  addActivity("Cleared all document checks");
  renderDocs();
});

// ===== Export View =====
const exportUserLine = qs("#exportUserLine");
const exportUniCount = qs("#exportUniCount");
const exportDormCount = qs("#exportDormCount");
const exportDocsCount = qs("#exportDocsCount");
const exportUniList = qs("#exportUniList");
const exportDormList = qs("#exportDormList");
const exportDocsList = qs("#exportDocsList");
const printExport = qs("#printExport");

function renderExport(){
  const user = getUser();
  const unis = readJSON(STORE.unis, []);
  const dormFavs = readJSON(STORE.dormFavs, []);
  const docs = readJSON(STORE.docs, []);
  const done = docs.filter(d => d.done);

  if(exportUserLine) exportUserLine.textContent = `${user.name} • ${user.email} • ${user.country}`;
  if(exportUniCount) exportUniCount.textContent = `${unis.length} saved`;
  if(exportDormCount) exportDormCount.textContent = `${dormFavs.length} saved`;
  if(exportDocsCount) exportDocsCount.textContent = `${done.length}/${docs.length} completed`;

  if(exportUniList) exportUniList.textContent = unis.slice(0,6).map(u => `${u.name} (${u.city})`).join(" • ") || "—";
  if(exportDormList) exportDormList.textContent = dormFavs.slice(0,6).map(d => `${d.name} (€${d.price})`).join(" • ") || "—";
  if(exportDocsList) exportDocsList.textContent = done.slice(0,8).map(d => d.text).join(" • ") || "—";
}

printExport?.addEventListener("click", () => window.print());

// ===== Quick controls =====
const quickSearch = qs("#quickSearch");
quickSearch?.addEventListener("input", () => renderUnis(quickSearch.value));

qs("#quickAddUni")?.addEventListener("click", () => {
  showPage("page-unis");
  qsa("button.side-item").forEach(i => i.classList.remove("active"));
  qsa("button.side-item[data-target='page-unis']")[0]?.classList.add("active");
  uniName?.focus();
});
qs("#goExport")?.addEventListener("click", () => {
  showPage("page-export");
  qsa("button.side-item").forEach(i => i.classList.remove("active"));
  qsa("button.side-item[data-target='page-export']")[0]?.classList.add("active");
});

function resetAll(){
  localStorage.removeItem(STORE.unis);
  localStorage.removeItem(STORE.dormFavs);
  localStorage.removeItem(STORE.docs);
  localStorage.removeItem(STORE.activity);
  ensureDefaults();
  addActivity("Reset demo data");
  boot();
}
qs("#resetDemo")?.addEventListener("click", resetAll);
qs("#resetDemo2")?.addEventListener("click", resetAll);

// ===== Boot dashboard UI if present =====
function boot(){
  renderUnis(quickSearch?.value || "");
  renderDormResults();
  renderDormFavs();
  renderDocs();
  refreshKPIs();
  renderExport();
}
boot();
