import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7bFyYiUJKpCqFz3jUC6PK9QZGbkehR4s",
  authDomain: "namtuam-d7be6.firebaseapp.com",
  projectId: "namtuam-d7be6",
  storageBucket: "namtuam-d7be6.firebasestorage.app",
  messagingSenderId: "321360297774",
  appId: "1:321360297774:web:59aac87ee5aa6a496d44bf",
  measurementId: "G-00X479BZD1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const elements = {
  control: document.getElementById("auth-control"),
  signIn: document.getElementById("google-sign-in"),
  signOut: document.getElementById("google-sign-out"),
  user: document.getElementById("auth-user"),
  name: document.getElementById("auth-user-name"),
  avatar: document.getElementById("auth-avatar"),
  avatarFallback: document.getElementById("auth-avatar-fallback"),
  status: document.getElementById("auth-status"),
};

function showStatus(message = "", isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
  elements.status.hidden = !message;
}

function authErrorMessage(error) {
  const messages = {
    "auth/configuration-not-found": "โปรเจกต์ Firebase ยังไม่ได้ตั้งค่า Authentication หรือเว็บกำลังใช้ config ผิดโปรเจกต์ ตรวจ Firebase Console → Authentication → Get started และเปิด Google provider ให้โปรเจกต์ namtuam-d7be6",
    "auth/unauthorized-domain": "โดเมนนี้ยังไม่ได้เพิ่มใน Firebase Authentication → Authorized domains",
    "auth/operation-not-allowed": "โปรดเปิด Google เป็นผู้ให้บริการเข้าสู่ระบบใน Firebase Console",
    "auth/popup-closed-by-user": "ยกเลิกการเข้าสู่ระบบแล้ว",
    "auth/popup-blocked": "เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ กรุณาอนุญาตป๊อปอัปแล้วลองอีกครั้ง",
    "auth/network-request-failed": "เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต",
    "auth/invalid-api-key": "Firebase API key ไม่ถูกต้อง ตรวจสอบ Web App config",
  };
  return messages[error.code] || `เข้าสู่ระบบไม่สำเร็จ: ${error.message || error.code || "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}`;
}

async function syncGoogleProfile(result) {
  const picture = getAdditionalUserInfo(result)?.profile?.picture;
  if (!result.user.photoURL && typeof picture === "string" && picture) {
    await updateProfile(result.user, { photoURL: picture });
    await result.user.reload();
  }
}

async function handleSignIn() {
  elements.signIn.disabled = true;
  showStatus("กำลังเชื่อมต่อบัญชี Google…");
  try {
    await setPersistence(auth, browserLocalPersistence);
    const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
    if (isMobile) {
      await signInWithRedirect(auth, provider);
      return;
    }
    const result = await signInWithPopup(auth, provider);
    await syncGoogleProfile(result);
    showStatus("");
  } catch (error) {
    showStatus(authErrorMessage(error), true);
  } finally {
    elements.signIn.disabled = false;
  }
}

async function handleSignOut() {
  elements.signOut.disabled = true;
  showStatus("กำลังออกจากระบบ…");
  try {
    await signOut(auth);
    showStatus("ออกจากระบบแล้ว");
  } catch (error) {
    showStatus(authErrorMessage(error), true);
  } finally {
    elements.signOut.disabled = false;
  }
}

elements.signIn.addEventListener("click", handleSignIn);
elements.signOut.addEventListener("click", handleSignOut);

onAuthStateChanged(auth, (user) => {
  elements.control.dataset.authState = user ? "signed-in" : "signed-out";
  elements.signIn.hidden = Boolean(user);
  elements.user.hidden = !user;
  if (user) {
    elements.name.textContent = user.displayName || user.email || "ผู้ใช้ Google";
    if (user.photoURL) {
      elements.avatar.src = user.photoURL;
      elements.avatar.alt = `รูปโปรไฟล์บัญชี Google ของ ${user.displayName || user.email || ""}`;
      elements.avatar.hidden = false;
      elements.avatarFallback.hidden = true;
      elements.avatar.onerror = () => {
        elements.avatar.hidden = true;
        elements.avatarFallback.textContent = (user.displayName || user.email || "G").trim().slice(0, 1).toUpperCase();
        elements.avatarFallback.hidden = false;
      };
    } else {
      elements.avatar.removeAttribute("src");
      elements.avatar.hidden = true;
      elements.avatarFallback.textContent = (user.displayName || user.email || "G").trim().slice(0, 1).toUpperCase();
      elements.avatarFallback.hidden = false;
    }
    showStatus("");
  } else {
    elements.name.textContent = "";
  }
}, (error) => {
  showStatus(authErrorMessage(error), true);
});

try {
  await auth.authStateReady();
  const result = await getRedirectResult(auth);
  if (result) await syncGoogleProfile(result);
} catch (error) {
  showStatus(authErrorMessage(error), true);
}
