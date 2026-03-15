document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SchoolAuth;
    const profileCounter = document.getElementById("profileCounter");
    const profileEventsGrid = document.getElementById("profileEventsGrid");
    const profileStateCard = document.getElementById("profileStateCard");
    const profileStateTitle = document.getElementById("profileStateTitle");
    const profileStateText = document.getElementById("profileStateText");
    const profileStateAction = document.getElementById("profileStateAction");

    if (
        !auth ||
        !profileCounter ||
        !profileEventsGrid ||
        !profileStateCard ||
        !profileStateTitle ||
        !profileStateText ||
        !profileStateAction
    ) {
        return;
    }

    auth.ensureTestUsers();
    document.querySelectorAll("[data-proposal-link]").forEach((link) => {
        link.setAttribute("href", auth.PROPOSAL_FORM_URL);
    });

    const currentUser = auth.getCurrentUser();
    if (!currentUser?.id) {
        showState(
            "Вход не выполнен",
            "Список ваших мероприятий доступен после входа в аккаунт.",
            "Войти",
            "login.html",
            "guest"
        );
        profileCounter.textContent = "Записей: 0";
        return;
    }

    if (currentUser.role !== "student") {
        auth.redirectToUserHome(currentUser);
        return;
    }

    const events = auth.getEvents();
    const registrations = auth.getRegistrations();
    const userId = String(currentUser.id);
    const activeRegistrations = registrations.filter(
        (registration) => String(registration.userId) === userId && registration.status === "active"
    );
    const activeEventIds = [...new Set(activeRegistrations.map((registration) => String(registration.eventId)))];
    const myEvents = activeEventIds
        .map((id) => events.find((event) => String(event.id) === id))
        .filter(Boolean)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    profileCounter.textContent = `Записей: ${myEvents.length}`;

    if (!myEvents.length) {
        showState(
            "Записей нет",
            "Вы еще не выбрали ни одного мероприятия.",
            "Перейти к мероприятиям",
            "index.html",
            "empty"
        );
        return;
    }

    hideState();
    renderEvents(myEvents);

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
                                    <span class="badge text-bg-light border rounded-pill goal-badge position-absolute top-0 start-0 m-3">${escapeHtml(auth.getGoalLabel(event.goal))}</span>
                                </div>

                                <div class="event-card-body">
                                    <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
                                    <p class="event-card-text">${escapeHtml(event.description)}</p>

                                    <div class="event-card-meta">
                                        <span class="event-meta-pill">${escapeHtml(auth.getPlaceLabel(event.place))}</span>
                                        <span class="event-meta-pill">${escapeHtml(auth.formatDate(event.date))}</span>
                                    </div>
                                </div>
                            </article>
                        </a>
                    </div>
                `
            );
        });
    }

    function showState(title, text, actionLabel, actionHref, stateType = "empty") {
        profileStateTitle.textContent = title;
        profileStateText.textContent = text;
        profileStateAction.textContent = actionLabel;
        profileStateAction.href = actionHref;
        profileStateCard.classList.remove("d-none", "profile-state-card--guest");
        if (stateType === "guest") {
            profileStateCard.classList.add("profile-state-card--guest");
        }
        profileEventsGrid.innerHTML = "";
    }

    function hideState() {
        profileStateCard.classList.add("d-none");
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
