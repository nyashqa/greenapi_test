const output = document.getElementById('response');

function show(value) {
    output.value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function field(id) {
    return document.getElementById(id).value.trim();
}

// у инстансов разные хосты, поэтому apiUrl вводится вручную
function connection() {
    const apiUrl = field('apiUrl').replace(/\/+$/, '');
    const idInstance = field('idInstance');
    const apiTokenInstance = field('apiTokenInstance');

    if (!apiUrl || !idInstance || !apiTokenInstance) {
        show('Заполните apiUrl, idInstance и ApiTokenInstance. Все три значения есть на странице инстанса в личном кабинете GREEN-API.');
        return null;
    }

    // если поля перепутаны, fetch отправит запрос относительно текущей страницы
    if (!/^https?:\/\//.test(apiUrl) || !/^\d+$/.test(idInstance)) {
        show('Похоже, значения перепутаны местами: idInstance состоит только из цифр, apiUrl начинается с https://');
        return null;
    }

    return { apiUrl, idInstance, apiTokenInstance };
}

// +7 776 153-60-75 -> 77761536075@c.us
function chatId(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits ? digits + '@c.us' : '';
}

// fileName обязателен, а поля под него в макете нет, берем из ссылки
function fileNameFrom(url) {
    const path = url.split(/[?#]/)[0];
    return path.slice(path.lastIndexOf('/') + 1) || 'file';
}

function pretty(text) {
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text;
    }
}

async function request(method, body) {
    const conn = connection();
    if (!conn) return;

    const url = `${conn.apiUrl}/waInstance${conn.idInstance}/${method}/${conn.apiTokenInstance}`;
    const options = body
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : { method: 'GET' };

    show('Запрос...');

    try {
        const response = await fetch(url, options);
        const text = await response.text();
        show(response.ok ? pretty(text) : `HTTP ${response.status}\n\n${pretty(text) || '(пустой ответ)'}`);
    } catch (error) {
        show(`Запрос не дошел до сервера: ${error.message}\n\nПроверьте apiUrl и соединение.`);
    }
}

function onClick(id, handler) {
    const button = document.getElementById(id);

    button.addEventListener('click', async () => {
        button.disabled = true;
        try {
            await handler();
        } finally {
            button.disabled = false;
        }
    });
}

onClick('getSettings', () => request('getSettings'));

onClick('getStateInstance', () => request('getStateInstance'));

onClick('sendMessage', () => {
    const to = chatId(field('messagePhone'));
    const message = field('messageText');

    if (!to || !message) {
        show('Укажите номер получателя и текст сообщения.');
        return;
    }

    return request('sendMessage', { chatId: to, message });
});

onClick('sendFileByUrl', () => {
    const to = chatId(field('filePhone'));
    const urlFile = field('fileUrl');

    if (!to || !urlFile) {
        show('Укажите номер получателя и ссылку на файл.');
        return;
    }

    return request('sendFileByUrl', { chatId: to, urlFile, fileName: fileNameFrom(urlFile) });
});
