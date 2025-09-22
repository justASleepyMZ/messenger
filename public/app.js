// ==== Регистрация и 2FA ====
document.getElementById("sendCodeBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("regEmail").value.trim();
  if (!email) return alert("Enter a valid email!");

  try {
    const response = await fetch("https://messenger-kkc5.onrender.com/send-verification-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error sending code!");
    alert("Verification code sent!");
    document.getElementById("verificationCode").disabled = false;
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("verificationCode")?.addEventListener("input", async (e) => {
  const email = document.getElementById("regEmail").value.trim();
  const code = document.getElementById("verificationCode").value.trim();
  if (code.length !== 6) return;

  try {
    const response = await fetch("https://messenger-kkc5.onrender.com/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Verification failed!");

    alert("Email verified! Complete your registration.");
    document.getElementById("regUsername").disabled = false;
    document.getElementById("regPassword").disabled = false;
    document.getElementById("registerBtn").disabled = false;
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("registerBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const email = document.getElementById("regEmail").value;

  try {
    const response = await fetch("https://messenger-kkc5.onrender.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Registration failed!");
    }
    alert("Registration successful!");
  } catch (err) {
    alert(err.message);
  }
});

// ==== Логин ====
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("https://messenger-kkc5.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed!");

    // Временно не сохраняем токен
    // localStorage.setItem("token", data.token);
    alert("Login successful!");

    // Для теста можно сразу показывать чат
    window.location.href = "/chat.html";
  } catch (err) {
    alert(err.message);
  }
});

// ==== Профиль: смена пароля и удаление аккаунта ====
document.addEventListener("DOMContentLoaded", () => {
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      if (!oldPassword || !newPassword) return alert("Введите старый и новый пароль.");

      try {
        const response = await fetch("https://messenger-kkc5.onrender.com/api/users/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldPassword, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ошибка смены пароля");
        alert("Пароль успешно изменен!");
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Вы уверены, что хотите удалить аккаунт?")) return;

      try {
        const response = await fetch("https://messenger-kkc5.onrender.com/api/users/delete", {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Ошибка удаления аккаунта");
        alert("Аккаунт удален!");
      } catch (err) {
        alert(err.message);
      }
    });
  }
});

// ==== Чат и WebSocket ====
const socket = io('https://messenger-kkc5.onrender.com/');

// Временно присваиваем username вручную
let username = "TestUser";
document.getElementById("username")?.textContent = username;

let messagesLoaded = false;
let lastMessage = null;

socket.on('loadMessages', (messages) => {
  if (!messagesLoaded) {
    messages.forEach(displayMessage);
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
    messagesLoaded = true;
  }
});

document.getElementById("sendMessageBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  const messageInput = document.getElementById("messageInput");
  const message = messageInput?.value?.trim();
  if (!message || message === lastMessage) return alert("Message is empty or already sent!");

  socket.emit("chatMessage", { sender: username, message });
  displayMessage({ sender: username, message, timestamp: new Date().toISOString() });
  lastMessage = message;
  messageInput.value = '';
});

socket.on('chatMessage', (data) => {
  if (data.sender !== username) displayMessage(data);
});

function displayMessage(data) {
  const container = document.getElementById('messagesContainer');
  const el = document.createElement('div');
  el.classList.add('message');

  const senderEl = document.createElement('div');
  senderEl.classList.add('sender');
  senderEl.textContent = data.sender || 'User';

  const textEl = document.createElement('div');
  textEl.textContent = data.message;

  const timeEl = document.createElement('div');
  timeEl.classList.add('time');
  timeEl.textContent = formatDate(data.timestamp);

  el.append(senderEl, textEl, timeEl);
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function formatDate(date) {
  const now = new Date();
  const d = new Date(date);
  if (now.toDateString() === d.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

socket.on("connect", () => {
  console.log("✅ Connected to server");
  socket.emit("getOldMessages");
});
