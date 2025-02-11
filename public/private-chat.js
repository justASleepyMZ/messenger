document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input_privatchat');
    const sendMessageBtn = document.getElementById('send-message_privatchat');
    const contactList = document.getElementById('contact-list');
    const addContactBtn = document.getElementById('add-contact');
    const chatMessagesContainer = document.getElementById('chat-messages_privatchat');

    // Слушатель на кнопку отправки сообщения
    sendMessageBtn.addEventListener('click', function() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            sendMessage(messageText);
            messageInput.value = ''; // Очистить поле ввода после отправки
        }
    });

    // Слушатель на Enter для отправки сообщения
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessageBtn.click(); // Симулировать клик по кнопке
        }
    });

    // Функция для отправки сообщения
    function sendMessage(messageText) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message_privatchat');
        messageElement.innerHTML = `
            <span class="sender_privatchat">Вы:</span>
            <p>${messageText}</p>
            <span class="time_privatchat">${new Date().toLocaleTimeString()}</span>
        `;
        chatMessagesContainer.appendChild(messageElement);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Прокручивать чат вниз
    }

    // Слушатель на добавление контакта
    addContactBtn.addEventListener('click', function() {
        const contactName = prompt('Введите имя нового контакта:');
        if (contactName) {
            addContact(contactName);
        }
    });

    // Функция для добавления нового контакта
    function addContact(contactName) {
        const contactElement = document.createElement('li');
        contactElement.textContent = contactName;
        contactList.appendChild(contactElement);

        // Обработчик для перехода в чат с контактом
        contactElement.addEventListener('click', function() {
            startPrivateChat(contactName);
        });
    }

    // Функция для начала приватного чата
    function startPrivateChat(contactName) {
        chatMessagesContainer.innerHTML = ''; // Очистить чат перед началом
        const chatHeader = document.getElementById('chat-header_privatchat');
        chatHeader.textContent = `Чат с ${contactName}`;
    }
});
