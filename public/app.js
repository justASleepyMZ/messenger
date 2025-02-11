document.getElementById("sendCodeBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("regEmail").value.trim();
  if (!email) return alert("Enter a valid email!");

  try {
    const response = await fetch("http://localhost:5000/send-verification-code", {
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

document.getElementById("verificationCode")?.addEventListener("input", async () => {
  const email = document.getElementById("regEmail").value.trim();
  const code = document.getElementById("verificationCode").value.trim();

  if (code.length !== 6) return; // Проверяем только 6-значный код

  try {
    const response = await fetch("http://localhost:5000/verify-code", {
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

document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const email = document.getElementById("regEmail").value;

  try {
    const response = await fetch("http://localhost:5000/register", {
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


// Логин
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      if (response.ok) {
        alert("Login successful!");
        response.json().then((data) => {
          localStorage.setItem("token", data.token); // Сохраняем токен
          window.location.href = "/chat.html";  // Перенаправляем на страницу чата
        });
      } else {
        response.json().then((data) => alert(data.error || "Login failed!"));
      }
    })
    .catch((err) => alert("Error: " + err));
});

document.addEventListener("DOMContentLoaded", () => {
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;

      if (!oldPassword || !newPassword) {
        return alert("Введите старый и новый пароль.");
      }

      try {
        const response = await fetch("/api/users/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });
        
        const data = await response.json(); // <- Ошибка здесь, если сервер вернул HTML        

        if (!response.ok) {
          throw new Error(data.error || "Ошибка смены пароля");
        }

        alert("Пароль успешно изменен!");
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const confirmDelete = confirm("Вы уверены, что хотите удалить аккаунт?");
      if (!confirmDelete) return;

      try {
        const response = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ошибка удаления аккаунта");
        }

        alert("Аккаунт удален!");
        localStorage.removeItem("token");
        window.location.href = "/";
      } catch (error) {
        alert(error.message);
      }
    });
  }
});

// Смена пароля
document.addEventListener("DOMContentLoaded", () => {
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;

      if (!oldPassword || !newPassword) {
        return alert("Введите старый и новый пароль.");
      }

      try {
        const response = await fetch("/api/users/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ошибка смены пароля");
        }

        alert("Пароль успешно изменен!");
      } catch (error) {
        alert(error.message);
      }
    });
  }
});

//Удаоение аккаунта
document.addEventListener("DOMContentLoaded", () => {
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const confirmDelete = confirm("Вы уверены, что хотите удалить аккаунт?");
      if (!confirmDelete) return;

      try {
        const response = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ошибка удаления аккаунта");
        }

        alert("Аккаунт успешно удалён!");
        localStorage.removeItem("token");
        window.location.href = "/";
      } catch (error) {
        alert(error.message);
      }
    });
  }
});

// Подключаемся к серверу через WebSocket
const socket = io('http://localhost:5000');

// Получаем информацию о пользователе (например, из JWT токена)
const token = localStorage.getItem("token");
let username = '';

if (token) {
  try {
    const decodedToken = jwt_decode(token);
    username = decodedToken.username;  
    document.getElementById("username").textContent = username;
  } catch (error) {
    console.error("Error decoding token:", error);
    localStorage.removeItem("token");
    window.location.href = "/";
  }
} else {
  window.location.href = "/"; // Перенаправление на страницу входа, если нет токена
}

let messagesLoaded = false;

socket.off("loadMessages", () => {});
socket.on('loadMessages', (messages) => {
  if (!messagesLoaded) {
    const messagesContainer = document.getElementById('messagesContainer');
    messages.forEach((msg) => {
      displayMessage(msg);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    messagesLoaded = true; // Сообщения загружены
  }
});

// Загружаем старые сообщения при подключении
socket.on('loadMessages', (messages) => {
  const messagesContainer = document.getElementById('messagesContainer');
  messages.forEach((msg) => {
    displayMessage(msg);
  });

  // Прокручиваем контейнер сообщений вниз после загрузки старых сообщений
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Функция для отправки сообщений без дублирования
lastMessage = null; // Сбрасываем после отправки сообщения

document.getElementById("sendMessageBtn")?.addEventListener("click", () => {
  const messageInput = document.getElementById("messageInput");
  const message = messageInput?.value?.trim(); // Убираем лишние пробелы
  
  if (!message || message === lastMessage) {
    alert("Message is empty or already sent!"); // Уведомление о пустом или повторном сообщении
    return;
  }

  // Проверяем наличие сокета и имени пользователя
  if (!socket || !username) {
    alert("Socket or username is not defined!");
    return;
  }

  // Отправляем сообщение на сервер
  socket.emit("chatMessage", { sender: username, message });

  // Сразу отображаем отправленное сообщение на экране
  const messageData = { sender: username, message, timestamp: new Date().toISOString() };
  displayMessage(messageData);

  // Сохраняем последнее отправленное сообщение для проверки дублирования
  lastMessage = message;

  // Очистка поля ввода
  messageInput.value = '';
});

// Обработка входящих сообщений от других пользователей
socket.on('chatMessage', (data) => {
  displayMessage(data);
});

// Функция для отображения сообщения
function displayMessage(data) {
  const messagesContainer = document.getElementById('messagesContainer');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  const senderElement = document.createElement('div');
  senderElement.classList.add('sender');
  senderElement.textContent = data.sender || 'User'; // Отображаем имя отправителя

  const messageText = document.createElement('div');
  messageText.textContent = data.message;

  const timeElement = document.createElement('div');
  timeElement.classList.add('time');
  timeElement.textContent = formatDate(data.timestamp);

  messageElement.appendChild(senderElement);
  messageElement.appendChild(messageText);
  messageElement.appendChild(timeElement);

  messagesContainer.appendChild(messageElement);

  // Прокручиваем контейнер сообщений вниз после отображения нового сообщения
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция для форматирования времени сообщения
function formatDate(date) {
  const now = new Date();
  const messageDate = new Date(date);

  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  if (now.toDateString() === messageDate.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return messageDate.toLocaleString('en-US', options);
  }
}

// При подключении получаем старые сообщения
socket.emit('getOldMessages'); server.js(`const express = require('express'`);