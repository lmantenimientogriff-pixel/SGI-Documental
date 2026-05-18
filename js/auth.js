// ============================================================
// Sistema de autenticación SGI — Transporte Griffouliere
// ============================================================

const USERS = [
  { usuario: "galeo",         password: "Aleo123",   nombre: "Aleo Gustavo",           rol: "Lectura" },
  { usuario: "vanci",         password: "Anci123",   nombre: "Anci Valeria",            rol: "Lectura" },
  { usuario: "wantonio",      password: "Anton123",  nombre: "Antonio Walter",          rol: "Lectura" },
  { usuario: "pbalmaceda",    password: "Balma123",  nombre: "Balmaceda Pablo",         rol: "Lectura" },
  { usuario: "mblanco",       password: "Blanc123",  nombre: "Blanco Maria Paz",        rol: "Responsable" },
  { usuario: "ebuttini",      password: "Butti123",  nombre: "Buttini Enrique",         rol: "Lectura" },
  { usuario: "dcaceres",      password: "Cacer123",  nombre: "Caceres Denise",          rol: "Responsable" },
  { usuario: "fcaneva",       password: "Canev123",  nombre: "Caneva Franco",           rol: "Admin" },
  { usuario: "jcordoba",      password: "Cordo123",  nombre: "Cordoba Jonathan",        rol: "Responsable" },
  { usuario: "jdaminato",     password: "Damin123",  nombre: "Daminato Juan Luis",      rol: "Responsable" },
  { usuario: "mfassi",        password: "Fassi123",  nombre: "Fassi Maria Eugenia",     rol: "Lectura" },
  { usuario: "fflores",       password: "Flore123",  nombre: "Flores Eric Franco",      rol: "Responsable" },
  { usuario: "ogullo",        password: "Gullo123",  nombre: "Gullo Omar",              rol: "Responsable" },
  { usuario: "airrera",       password: "Irrer123",  nombre: "Irrera Ana Maria",        rol: "Responsable" },
  { usuario: "virrera",       password: "Irrer123",  nombre: "Irrera Viviana",          rol: "Responsable" },
  { usuario: "julieta",       password: "Julie123",  nombre: "Olivencia Julieta",       rol: "Lectura" },
  { usuario: "fkoryl",        password: "Koryl123",  nombre: "Koryl Fabian",            rol: "Responsable" },
  { usuario: "clatrompette",  password: "Latro123",  nombre: "Latrompette Hernan",      rol: "Responsable" },
  { usuario: "clisotti",      password: "Lisot123",  nombre: "Lisotti Christian",       rol: "Lectura" },
  { usuario: "blopez",        password: "Lopez123",  nombre: "Lopez Badino Ignacio",    rol: "Lectura" },
  { usuario: "slucero",       password: "Lucer123",  nombre: "Lucero Martin",           rol: "Lectura" },
  { usuario: "vmartinez",     password: "Marti123",  nombre: "Martinez Rocio",          rol: "Responsable" },
  { usuario: "lmendoza",      password: "Mendo123",  nombre: "Mendoza Luis Ivan",       rol: "Lectura" },
  { usuario: "npacheco",      password: "Pache123",  nombre: "Pacheco Nicolas",         rol: "Lectura" },
  { usuario: "jsalvatella",   password: "Salva123",  nombre: "Salvatella Jaime",        rol: "Responsable" },
  { usuario: "esanchez",      password: "Sanch123",  nombre: "Sanchez Ernesto",         rol: "Lectura" },
  { usuario: "mserrano",      password: "Serra123",  nombre: "Serrano Maria Victoria",  rol: "Lectura" },
  { usuario: "psoto",         password: "Soto123",   nombre: "Soto Paula",              rol: "Responsable" },
  { usuario: "ftoso",         password: "Toso123",   nombre: "Toso Federico",           rol: "Responsable" },
  { usuario: "jzaina",        password: "Zaina123",  nombre: "Zaina Jorge",             rol: "Admin" },
  { usuario: "ggriffouliere", password: "Griff123",  nombre: "Griffouliere German",     rol: "Admin" },
];

const ROL_BADGE = {
  Admin:       { label: "Admin",       color: "#b91c1c", bg: "#fff0f0" },
  Responsable: { label: "Responsable", color: "#92400e", bg: "#fffbeb" },
  Lectura:     { label: "Lectura",     color: "#1d4ed8", bg: "#eff6ff" },
};

// Estado de sesión en memoria
let currentUser = null;

// ──────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────
function initAuth() {
  // Verificar sesión guardada
  const saved = sessionStorage.getItem("sgi_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showApp();
      return;
    } catch { sessionStorage.removeItem("sgi_user"); }
  }
  showLogin();
}

function showLogin() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-screen").style.display = "none";
  document.getElementById("login-usuario").focus();
  document.getElementById("login-error").style.display = "none";
}

function showApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "flex";

  // Actualizar header con info del usuario
  const badge = ROL_BADGE[currentUser.rol] || ROL_BADGE.Lectura;
  document.getElementById("user-nombre").textContent = currentUser.nombre;
  const rolEl = document.getElementById("user-rol");
  rolEl.textContent = badge.label;
  rolEl.style.color = badge.color;
  rolEl.style.background = badge.bg;
}

function tryLogin() {
  const usuario = document.getElementById("login-usuario").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value.trim();
  const errorEl = document.getElementById("login-error");

  if (!usuario || !password) {
    showError("Completá usuario y contraseña.");
    return;
  }

  const user = USERS.find(u => u.usuario === usuario && u.password === password);

  if (!user) {
    showError("Usuario o contraseña incorrectos.");
    document.getElementById("login-password").value = "";
    document.getElementById("login-password").focus();
    return;
  }

  currentUser = user;
  sessionStorage.setItem("sgi_user", JSON.stringify(user));
  showApp();

  // Inicializar la app principal después del login
  if (typeof init === "function") init();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("sgi_user");
  showLogin();
  document.getElementById("login-usuario").value = "";
  document.getElementById("login-password").value = "";
}

function showError(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.style.display = "block";
  el.style.animation = "none";
  el.offsetHeight; // reflow
  el.style.animation = "shake .3s ease";
}

// Enter en los campos
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-usuario")?.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("login-password").focus();
  });
  document.getElementById("login-password")?.addEventListener("keydown", e => {
    if (e.key === "Enter") tryLogin();
  });
  initAuth();
});
