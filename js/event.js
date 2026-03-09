document.addEventListener("DOMContentLoaded", () => {
    const els = {
        image: document.getElementById("eventImage"),
        title: document.getElementById("eventTitle"),
        short: document.getElementById("eventShort"),
        description: document.getElementById("eventDescription"),
        goalBadge: document.getElementById("eventGoalBadge"),
        placeBadge: document.getElementById("eventPlaceBadge"),
        dateBadge: document.getElementById("eventDateBadge"),
        participants: document.getElementById("eventParticipants"),
        audience: document.getElementById("eventAudience"),
        statusText: document.getElementById("registrationStatusText"),
        statusBadge: document.getElementById("registrationStatusBadge"),
        hint: document.getElementById("registrationHint"),
        btnRegister: document.getElementById("btnRegister"),
        btnCancel: document.getElementById("btnCancel"),
    };

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("id");

    let events = getArrayFromStorage("events");

    const fallbackEvents = [
        {
            id: "0",
            title: "Новогодняя дискотека",
            date: "2025-12-25",
            image: "img/carousel1.png",
            description: "Праздничный вечер с музыкой, конкурсами и танцевальной программой для школьников.",
            goal: "fun",
            place: "assembly",
            capacity: 30,
            audience: "5–11 классы"
        },
        {
            id: "1",
            title: "Нормативы ГТО",
            date: "2025-11-10",
            image: "img/carousel2.png",
            description: "Проверка физической подготовки, выполнение нормативов.",
            goal: "sport",
            place: "stadium",
            capacity: 30,
            audience: "5–11 классы"
        },
        {
            id: "2",
            title: "Кинопоказ",
            date: "2025-10-15",
            image: "img/carousel3.png",
            description: "Совместный просмотр фильма в уютной атмосфере школьного актового зала.",
            goal: "fun",
            place: "assembly",
            capacity: 30,
            audience: "5–11 классы"
        },
        {
            id: "3",
            title: "Олимпиадный практикум",
            date: "2025-10-20",
            image: "img/carousel4.png",
            description: "Подготовка к предметным олимпиадам с разбором сложных заданий и мини-практикой.",
            goal: "study",
            place: "classroom",
            capacity: 30,
            audience: "5–11 классы"
        },
        {
            id: "4",
            title: "Линейка ко Дню знаний",
            date: "2025-09-01",
            image: "img/carousel5.png",
            description: "Торжественное школьное мероприятие с поздравлениями, выступлениями и награждением.",
            goal: "ceremony",
            place: "yard",
            capacity: 200,
            audience: "1–11 классы"
        }
    ];

    if (!events.length) {
        events = fallbackEvents;
        localStorage.setItem("events", JSON.stringify(events));
    }

    const event = events.find(e => String(e.id) === String(eventId));

    if (!event) {
        renderNotFound();
        return;
    }

    const normalized = normalizeEvent(event);
    els.image.src = normalized.image;
    els.image.alt = normalized.title;

    els.title.textContent = normalized.title;
    els.short.textContent = normalized.short;
    els.description.textContent = normalized.description;

    els.goalBadge.textContent = goalLabel(normalized.goal);
    els.goalBadge.className = "badge text-bg-light border rounded-pill goal-badge";
    els.placeBadge.textContent = placeLabel(normalized.place);
    els.dateBadge.textContent = formatDate(normalized.date);

    els.audience.textContent = normalized.audience;
    const currentUser = getObjectFromStorage("currentUser");
    const userId = currentUser?.id ? String(currentUser.id) : null;

    const registrations = getArrayFromStorage("registrations");
    els.participants.textContent = `${getActiveCountForEvent(registrations, eventId)} / ${normalized.capacity}`;

    const myReg = userId
        ? registrations.find(r => String(r.eventId) === String(eventId) && String(r.userId) === userId && r.status === "active")
        : null;

    updateStatusUI(!!myReg, userId);
    els.btnRegister.addEventListener("click", () => {
        if (!userId) {
            window.location.href = "login.html";
            return;
        }

        const regs = getArrayFromStorage("registrations");

        const already = regs.find(r => String(r.eventId) === String(eventId) && String(r.userId) === userId && r.status === "active");
        if (already) {
            updateStatusUI(true, userId);
            return;
        }

        const currentActive = getActiveCountForEvent(regs, eventId);
        if (currentActive >= normalized.capacity) {
            els.hint.textContent = "Мест больше нет. Попробуйте записаться позже.";
            return;
        }

        regs.push({
            id: createId(),
            eventId: String(eventId),
            userId: userId,
            status: "active",
            createdAt: new Date().toISOString()
        });

        localStorage.setItem("registrations", JSON.stringify(regs));
        const newActiveCount = regs.filter(r => String(r.eventId) === String(eventId) && r.status === "active").length;
        els.participants.textContent = `${newActiveCount} / ${normalized.capacity}`;

        updateStatusUI(true, userId);
    });

    els.btnCancel.addEventListener("click", () => {
        if (!userId) return;

        const regs = getArrayFromStorage("registrations");
        const idx = regs.findIndex(r => String(r.eventId) === String(eventId) && String(r.userId) === userId && r.status === "active");

        if (idx === -1) {
            updateStatusUI(false, userId);
            return;
        }

        regs[idx].status = "cancelled";
        regs[idx].cancelledAt = new Date().toISOString();

        localStorage.setItem("registrations", JSON.stringify(regs));

        const newActiveCount = regs.filter(r => String(r.eventId) === String(eventId) && r.status === "active").length;
        els.participants.textContent = `${newActiveCount} / ${normalized.capacity}`;

        updateStatusUI(false, userId);
    });

    function updateStatusUI(isRegistered, hasUser) {
        if (!hasUser) {
            els.statusText.textContent = "Требуется вход";
            els.statusBadge.textContent = "Требуется вход";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--neutral";
            els.hint.textContent = "Для записи войдите в аккаунт.";
            els.btnRegister.classList.remove("d-none");
            els.btnCancel.classList.add("d-none");
            return;
        }

        if (isRegistered) {
            els.statusText.textContent = "Вы записаны";
            els.statusBadge.textContent = "Вы записаны";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--active";
            els.hint.textContent = "Для отмены записи используйте кнопку выше.";
            els.btnRegister.classList.add("d-none");
            els.btnCancel.classList.remove("d-none");
        } else {
            els.statusText.textContent = "Вы не записаны";
            els.statusBadge.textContent = "Вы не записаны";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--inactive";
            els.hint.textContent = "Нажмите «Записаться», чтобы добавить мероприятие в текущие записи.";
            els.btnRegister.classList.remove("d-none");
            els.btnCancel.classList.add("d-none");
        }
    }

    function renderNotFound() {
        document.title = "Мероприятие не найдено";
        els.title.textContent = "Мероприятие не найдено";
        els.short.textContent = "Похоже, ссылка неправильная или мероприятие удалено.";
        els.description.textContent = "Вернись на главную и выбери событие из списка.";
        els.goalBadge.textContent = "—";
        els.placeBadge.textContent = "—";
        els.dateBadge.textContent = "—";
        els.participants.textContent = "—";
        els.audience.textContent = "—";
        els.statusText.textContent = "—";
        els.statusBadge.textContent = "—";
        els.btnRegister.classList.add("d-none");
        els.btnCancel.classList.add("d-none");
        els.hint.textContent = "";
    }

    function normalizeEvent(e) {
        const title = String(e.title || "Без названия").trim();
        const description = String(e.description || "Описание пока не добавлено.").trim();
        const short = String(e.short || e.shortDescription || description).trim().slice(0, 140);
        const image = String(e.image || "img/carousel1.png").trim();

        const goal = normalizeGoal(e.goal || e.category || e.purpose);
        const place = normalizePlace(e.place);

        const date = normalizeDate(e.date);
        const capacity = Number(e.capacity || e.maxParticipants || e.limit || 30) || 30;
        const audience = String(e.audience || e.forWhom || "5–11 классы").trim();

        return { title, description, short, image, goal, place, date, capacity, audience };
    }

    function normalizeDate(raw) {
        if (!raw) return "";
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function formatDate(s) {
        if (!s) return "Дата уточняется";
        const [y, m, d] = s.split("-");
        if (!y || !m || !d) return "Дата уточняется";
        return `${d}.${m}.${y}`;
    }

    function normalizeGoal(raw) {
        const v = String(raw || "").trim().toLowerCase();
        const map = {
            sport: "sport", "спорт": "sport", "спортивные": "sport",
            fun: "fun", "развлекательные": "fun", "развлечение": "fun",
            study: "study", "учебные": "study", "учеба": "study",
            ceremony: "ceremony", "торжественные": "ceremony", "торжество": "ceremony"
        };
        return map[v] || "fun";
    }

    function normalizePlace(raw) {
        const v = String(raw || "").trim().toLowerCase();
        const map = {
            assembly: "assembly", "актовый зал": "assembly",
            yard: "yard", "школьный двор": "yard", "двор": "yard",
            classroom: "classroom", "школьный класс": "classroom", "класс": "classroom",
            outside: "outside", "вне школы": "outside",
            stadium: "stadium", "стадион": "stadium"
        };
        return map[v] || "assembly";
    }

    function goalLabel(goal) {
        return {
            sport: "Спортивное",
            fun: "Развлекательное",
            study: "Учебное",
            ceremony: "Торжественное"
        }[goal] || "Развлекательное";
    }

    function placeLabel(place) {
        return {
            assembly: "Актовый зал",
            yard: "Школьный двор",
            classroom: "Школьный класс",
            outside: "Вне школы",
            stadium: "Стадион"
        }[place] || "Актовый зал";
    }

    function getArrayFromStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function getObjectFromStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
            return null;
        }
    }

    function getActiveCountForEvent(regs, eId) {
        return regs.filter(r => String(r.eventId) === String(eId) && r.status === "active").length;
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `eventreg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
});
