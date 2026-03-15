document.addEventListener("DOMContentLoaded", () => {
    const carouselInner = document.getElementById("carouselInner");
    const carouselIndicators = document.getElementById("carouselIndicators");

    const eventSearch = document.getElementById("eventSearch");
    const goalDropdownButton = document.getElementById("goalDropdownButton");
    const placeDropdownButton = document.getElementById("placeDropdownButton");
    const goalOptions = document.querySelectorAll(".goal-option");
    const placeOptions = document.querySelectorAll(".place-option");
    const resetFilters = document.getElementById("resetFilters");
    const eventsGrid = document.getElementById("eventsGrid");
    const eventsCounter = document.getElementById("eventsCounter");
    const eventsEmpty = document.getElementById("eventsEmpty");

    let selectedGoal = "all";
    let selectedPlace = "all";

    if (
        !carouselInner ||
        !carouselIndicators ||
        !eventSearch ||
        !goalDropdownButton ||
        !placeDropdownButton ||
        !goalOptions.length ||
        !placeOptions.length ||
        !resetFilters ||
        !eventsGrid ||
        !eventsCounter ||
        !eventsEmpty
    ) {
        return;
    }

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

    const allEvents = getDisplayEvents();

    seedEventsIfEmpty(allEvents);
    renderCarousel(getTopEvents(allEvents));
    renderEvents(sortByDate(allEvents));
    bindFilters();

    function bindFilters() {
        eventSearch.addEventListener("input", applyFilters);

        goalOptions.forEach((option) => {
            option.addEventListener("click", () => {
                selectedGoal = option.dataset.value;
                goalDropdownButton.textContent = option.textContent;
                setActiveOption(goalOptions, option);
                applyFilters();
            });
        });

        placeOptions.forEach((option) => {
            option.addEventListener("click", () => {
                selectedPlace = option.dataset.value;
                placeDropdownButton.textContent = option.textContent;
                setActiveOption(placeOptions, option);
                applyFilters();
            });
        });

        resetFilters.addEventListener("click", () => {
            eventSearch.value = "";
            selectedGoal = "all";
            selectedPlace = "all";

            goalDropdownButton.textContent = "Все категории";
            placeDropdownButton.textContent = "Все места";

            clearActiveOptions(goalOptions);
            clearActiveOptions(placeOptions);

            const defaultGoal = document.querySelector('.goal-option[data-value="all"]');
            const defaultPlace = document.querySelector('.place-option[data-value="all"]');

            if (defaultGoal) {
                defaultGoal.classList.add("active-option");
            }

            if (defaultPlace) {
                defaultPlace.classList.add("active-option");
            }

            applyFilters();
        });

        const defaultGoal = document.querySelector('.goal-option[data-value="all"]');
        const defaultPlace = document.querySelector('.place-option[data-value="all"]');

        if (defaultGoal) {
            defaultGoal.classList.add("active-option");
        }

        if (defaultPlace) {
            defaultPlace.classList.add("active-option");
        }
    }

    function applyFilters() {
        const searchValue = eventSearch.value.trim().toLowerCase();

        const filteredEvents = allEvents.filter((event) => {
            const haystack = `${event.title} ${event.description}`.toLowerCase();

            const matchesSearch = !searchValue || haystack.includes(searchValue);
            const matchesGoal = selectedGoal === "all" || event.goal === selectedGoal;
            const matchesPlace = selectedPlace === "all" || event.place === selectedPlace;

            return matchesSearch && matchesGoal && matchesPlace;
        });

        renderEvents(sortByDate(filteredEvents));
    }

    function getDisplayEvents() {
        const storedEvents = getStoredEvents()
            .map((e, i) => normalizeEvent(e, i))
            .filter(Boolean);

        return storedEvents.length ? storedEvents : fallbackEvents.map(normalizeEvent).filter(Boolean);
    }

    function getStoredEvents() {
        try {
            const raw = localStorage.getItem("events");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Не удалось прочитать events из localStorage:", error);
            return [];
        }
    }

    function seedEventsIfEmpty(events) {
        try {
            const raw = localStorage.getItem("events");
            const parsed = raw ? JSON.parse(raw) : null;

            if (!Array.isArray(parsed) || parsed.length === 0) {
                localStorage.setItem("events", JSON.stringify(events));
            }
        } catch {
            localStorage.setItem("events", JSON.stringify(events));
        }
    }

    function normalizeEvent(event, index = 0) {
        if (!event || typeof event !== "object") {
            return null;
        }

        const title = String(event.title || "").trim() || "Без названия";
        const description =
            String(event.description || "").trim() || "Описание мероприятия пока не добавлено.";
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

    function setActiveOption(optionList, activeOption) {
        optionList.forEach((item) => item.classList.remove("active-option"));
        activeOption.classList.add("active-option");
    }

    function clearActiveOptions(optionList) {
        optionList.forEach((item) => item.classList.remove("active-option"));
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

    function getTopEvents(events) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = events
            .filter((event) => {
                if (!event.date || !event.title || !event.image) {
                    return false;
                }

                const eventDate = new Date(event.date);
                return !Number.isNaN(eventDate.getTime()) && eventDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        return upcoming.length ? upcoming : sortByDate(events).slice(0, 3);
    }

    function renderCarousel(eventsToRender) {
        carouselIndicators.innerHTML = "";
        carouselInner.innerHTML = "";

        eventsToRender.forEach((event, index) => {
            const isActive = index === 0 ? "active" : "";

            carouselIndicators.insertAdjacentHTML(
                "beforeend",
                `
                    <button type="button"
                            data-bs-target="#carouselExampleCaptions"
                            data-bs-slide-to="${index}"
                            class="${isActive}"
                            ${index === 0 ? 'aria-current="true"' : ""}
                            aria-label="Слайд ${index + 1}"></button>
                `
            );

            carouselInner.insertAdjacentHTML(
                "beforeend",
                `
                    <div class="carousel-item ${isActive}">
                        <a class="carousel-slide-link" href="event.html?id=${encodeURIComponent(event.id)}" aria-label="Открыть мероприятие ${escapeHtml(event.title)}">
                            <img src="${escapeHtml(event.image)}" class="d-block w-100" alt="${escapeHtml(event.title)}">
                            <div class="carousel-caption">
                                <div class="carousel-caption-card">
                                    <h2>${escapeHtml(event.title)}</h2>
                                </div>
                            </div>
                        </a>
                    </div>
                `
            );
        });
    }

    function renderEvents(eventsToRender) {
        eventsGrid.innerHTML = "";

        if (!eventsToRender.length) {
            eventsEmpty.classList.remove("d-none");
            eventsCounter.textContent = "Показано мероприятий: 0";
            return;
        }

        eventsEmpty.classList.add("d-none");
        eventsCounter.textContent = `Показано мероприятий: ${eventsToRender.length}`;

        eventsToRender.forEach((event) => {
            eventsGrid.insertAdjacentHTML(
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

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});



