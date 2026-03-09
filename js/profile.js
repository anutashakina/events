document.addEventListener("DOMContentLoaded", () => {
    const profileUserText = document.getElementById("profileUserText");
    const profileCounter = document.getElementById("profileCounter");
    const profileEventsGrid = document.getElementById("profileEventsGrid");
    const profileStateCard = document.getElementById("profileStateCard");
    const profileStateTitle = document.getElementById("profileStateTitle");
    const profileStateText = document.getElementById("profileStateText");
    const profileStateAction = document.getElementById("profileStateAction");

    if (
        !profileUserText ||
        !profileCounter ||
        !profileEventsGrid ||
        !profileStateCard ||
        !profileStateTitle ||
        !profileStateText ||
        !profileStateAction
    ) {
        return;
    }

    const currentUser = getObjectFromStorage("currentUser");
    if (!currentUser?.id) {
        profileUserText.textContent = "Чтобы увидеть записи, войдите в аккаунт.";
        showState(
            "Требуется вход",
            "Список ваших мероприятий доступен после авторизации.",
            "Войти",
            "login.html"
        );
        profileCounter.textContent = "Записей: 0";
        return;
    }

    const firstName = String(currentUser.firstName || "").trim();
    profileUserText.textContent = firstName
        ? `Пользователь: ${firstName}`
        : "Пользователь авторизован";

    const events = getEventsForDisplay();
    const registrations = getArrayFromStorage("registrations");
    const userId = String(currentUser.id);

    const activeRegistrations = registrations.filter(
        (reg) => String(reg.userId) === userId && reg.status === "active"
    );

    const activeEventIds = [...new Set(activeRegistrations.map((reg) => String(reg.eventId)))];
    const myEvents = activeEventIds
        .map((id) => events.find((event) => String(event.id) === id))
        .filter(Boolean);

    profileCounter.textContent = `Записей: ${myEvents.length}`;

    if (!myEvents.length) {
        showState(
            "Пока нет записей",
            "Вы еще не записались ни на одно мероприятие.",
            "Перейти к мероприятиям",
            "index.html"
        );
        return;
    }

    hideState();
    renderEvents(sortByDate(myEvents));

    function renderEvents(items) {
        profileEventsGrid.innerHTML = "";

        items.forEach((event) => {
            profileEventsGrid.insertAdjacentHTML(
                "beforeend",
                `
                <div class="col-12 col-md-6 col-xl-4">
                    <a class="event-card-link" href="event.html?id=${encodeURIComponent(event.id)}">
                        <article class="event-card-custom">
                            <div class="event-card-image-wrap">
                                <img
                                    src="${escapeHtml(event.image)}"
                                    alt="${escapeHtml(event.title)}"
                                    class="event-card-image"
                                >
                                <span class="badge text-bg-light border rounded-pill goal-badge position-absolute top-0 start-0 m-3">${escapeHtml(getGoalLabel(event.goal))}</span>
                            </div>

                            <div class="event-card-body">
                                <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
                                <p class="event-card-text">${escapeHtml(event.description)}</p>

                                <div class="event-card-meta">
                                    <span class="event-meta-pill">${escapeHtml(getPlaceLabel(event.place))}</span>
                                    <span class="event-meta-pill">${escapeHtml(formatDate(event.date))}</span>
                                </div>
                            </div>
                        </article>
                    </a>
                </div>
                `
            );
        });
    }

    function showState(title, text, actionLabel, actionHref) {
        profileStateTitle.textContent = title;
        profileStateText.textContent = text;
        profileStateAction.textContent = actionLabel;
        profileStateAction.href = actionHref;
        profileStateCard.classList.remove("d-none");
        profileEventsGrid.innerHTML = "";
    }

    function hideState() {
        profileStateCard.classList.add("d-none");
    }

    function getEventsForDisplay() {
        const fallbackEvents = [
            {
                id: "0",
                title: "Новогодняя дискотека",
                date: "2025-12-25",
                image: "img/carousel1.png",
                description: "Праздничный вечер с музыкой, конкурсами и танцевальной программой для школьников.",
                goal: "fun",
                place: "assembly"
            },
            {
                id: "1",
                title: "Нормативы ГТО",
                date: "2025-11-10",
                image: "img/carousel2.png",
                description: "Проверка физической подготовки, выполнение нормативов.",
                goal: "sport",
                place: "stadium"
            },
            {
                id: "2",
                title: "Кинопоказ",
                date: "2025-10-15",
                image: "img/carousel3.png",
                description: "Совместный просмотр фильма в уютной атмосфере школьного актового зала.",
                goal: "fun",
                place: "assembly"
            },
            {
                id: "3",
                title: "Олимпиадный практикум",
                date: "2025-10-20",
                image: "img/carousel4.png",
                description: "Подготовка к предметным олимпиадам с разбором сложных заданий и мини-практикой.",
                goal: "study",
                place: "classroom"
            },
            {
                id: "4",
                title: "Линейка ко Дню знаний",
                date: "2025-09-01",
                image: "img/carousel5.png",
                description: "Торжественное школьное мероприятие с поздравлениями, выступлениями и награждением.",
                goal: "ceremony",
                place: "yard"
            }
        ];

        const stored = getArrayFromStorage("events")
            .map((event, index) => normalizeEvent(event, index))
            .filter(Boolean);

        if (stored.length) {
            return stored;
        }

        const normalizedFallback = fallbackEvents
            .map((event, index) => normalizeEvent(event, index))
            .filter(Boolean);

        localStorage.setItem("events", JSON.stringify(normalizedFallback));
        return normalizedFallback;
    }

    function normalizeEvent(event, index = 0) {
        if (!event || typeof event !== "object") {
            return null;
        }

        const title = String(event.title || "").trim() || "Без названия";
        const description = String(event.description || "").trim() || "Описание мероприятия пока не добавлено.";
        const image = String(event.image || "").trim() || "img/carousel1.png";
        const date = normalizeDate(event.date);
        const goal = normalizeGoal(event.goal || event.category || event.purpose);
        const place = normalizePlace(event.place);

        return {
            id: event.id || `event-${index}-${title}`,
            title,
            description,
            image,
            date,
            goal,
            place
        };
    }

    function normalizeDate(rawDate) {
        if (!rawDate) {
            return "";
        }

        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function normalizeGoal(rawGoal) {
        const value = String(rawGoal || "").trim().toLowerCase();

        const goalMap = {
            sport: "sport",
            sports: "sport",
            "спортивные": "sport",
            "спортивное": "sport",
            "спорт": "sport",

            fun: "fun",
            entertainment: "fun",
            "развлекательные": "fun",
            "развлекательное": "fun",
            "развлечение": "fun",

            study: "study",
            education: "study",
            "учебные": "study",
            "учебное": "study",
            "учеба": "study",

            ceremony: "ceremony",
            "торжественные": "ceremony",
            "торжественное": "ceremony",
            "торжество": "ceremony"
        };

        return goalMap[value] || "fun";
    }

    function normalizePlace(rawPlace) {
        const value = String(rawPlace || "").trim().toLowerCase();

        const placeMap = {
            assembly: "assembly",
            "актовый зал": "assembly",
            yard: "yard",
            "школьный двор": "yard",
            двор: "yard",
            classroom: "classroom",
            "школьный класс": "classroom",
            класс: "classroom",
            outside: "outside",
            "вне школы": "outside",
            stadium: "stadium",
            стадион: "stadium"
        };

        return placeMap[value] || "assembly";
    }

    function getGoalLabel(goal) {
        const labels = {
            sport: "Спортивные",
            fun: "Развлекательные",
            study: "Учебные",
            ceremony: "Торжественные"
        };

        return labels[goal] || "Развлекательные";
    }

    function getPlaceLabel(place) {
        const labels = {
            assembly: "Актовый зал",
            yard: "Школьный двор",
            classroom: "Школьный класс",
            outside: "Вне школы",
            stadium: "Стадион"
        };

        return labels[place] || "Актовый зал";
    }

    function formatDate(dateString) {
        if (!dateString) {
            return "Дата уточняется";
        }

        const [year, month, day] = dateString.split("-");
        if (!year || !month || !day) {
            return "Дата уточняется";
        }

        return `${day}.${month}.${year}`;
    }

    function sortByDate(events) {
        return [...events].sort((a, b) => {
            if (!a.date && !b.date) {
                return 0;
            }
            if (!a.date) {
                return 1;
            }
            if (!b.date) {
                return -1;
            }

            return new Date(a.date) - new Date(b.date);
        });
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

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});

