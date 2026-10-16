import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB96kqkeFLXWMIMvld9jS9SOmbx2g2sJ98",
  authDomain: "cinehub-27129.firebaseapp.com",
  projectId: "cinehub-27129",
  storageBucket: "cinehub-27129.firebasestorage.app",
  messagingSenderId: "564236433071",
  appId: "1:564236433071:web:474301819e114c22bac65a"
};
const appName = "cinehub-public-auth";
const app = getApps().some(item => item.name === appName) ? getApp(appName) : initializeApp(firebaseConfig, appName);
const auth = getAuth(app);
const $ = id => document.getElementById(id);

let mode = "login";
const modal = $("accountModal");
const form = $("accountForm");
const message = $("accountMessage");
const submit = $("accountSubmitBtn");

function showMessage(text, ok = false) {
  message.textContent = text;
  message.style.color = ok ? "#8be0ae" : "#ffb8c0";
}
function setMode(next) {
  mode = next;
  $("accountLoginTab").classList.toggle("selected", mode === "login");
  $("accountRegisterTab").classList.toggle("selected", mode === "register");
  $("accountNameWrap").hidden = mode !== "register";
  $("accountName").required = mode === "register";
  $("accountPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
  submit.textContent = mode === "login" ? "Login" : "Create Account";
  $("accountTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  showMessage("");
}
function openModal(next = "login") {
  setMode(next);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $(mode === "register" ? "accountName" : "accountEmail").focus(), 30);
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}
$("accountOpenBtn").addEventListener("click", () => openModal("login"));
$("accountCloseBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target.dataset.accountClose === "true") closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
$("accountLoginTab").addEventListener("click", () => setMode("login"));
$("accountRegisterTab").addEventListener("click", () => setMode("register"));
$("accountLogoutBtn").addEventListener("click", async () => {
  try { await signOut(auth); showMessage("Logged out.", true); }
  catch (error) { openModal("login"); showMessage(error.message); }
});
onAuthStateChanged(auth, user => {
  $("accountOpenBtn").hidden = !!user;
  $("accountLogoutBtn").hidden = !user;
  $("accountUserLabel").hidden = !user;
  $("accountUserLabel").textContent = user ? (user.displayName || user.email || "Signed in") : "";
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  const email = $("accountEmail").value.trim();
  const password = $("accountPassword").value;
  submit.disabled = true;
  submit.textContent = mode === "login" ? "Signing in…" : "Creating account…";
  try {
    if (mode === "register") {
      const name = $("accountName").value.trim();
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(credential.user, { displayName: name });
      showMessage("Account created successfully. You are now logged in.", true);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Login successful.", true);
    }
    form.reset();
    setTimeout(closeModal, 700);
  } catch (error) {
    const errors = {
      "auth/email-already-in-use": "This email is already registered. Please log in.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Use a stronger password with at least 6 characters.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase Authentication."
    };
    showMessage(errors[error.code] || error.message || "Could not complete authentication.");
  } finally {
    submit.disabled = false;
    submit.textContent = mode === "login" ? "Login" : "Create Account";
  }
});
