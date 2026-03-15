document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SchoolAuth;
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
        btnCancel: document.getElementById("btnCancel")
    };
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("id");

    if (!auth || Object.values(els).some((element) => !element)) {
        return;
    }

    auth.ensureTestUsers();
    document.querySelectorAll("[data-proposal-link]").forEach((link) => {
        link.setAttribute("href", auth.PROPOSAL_FORM_URL);
    });

    const event = auth.getEvents().find((item) => String(item.id) === String(eventId));
    if (!event) {
        renderNotFound();
        return;
    }

    const currentUser = auth.getCurrentUser();
    const userId = currentUser?.id ? String(currentUser.id) : "";
    const isStudent = currentUser?.role === "student";

    renderEvent(event);
    syncRegistrationState();

    els.btnRegister.addEventListener("click", () => {
        if (!userId) {
            window.location.href = "login.html";
            return;
        }

        if (!isStudent) {
            updateStatusUI(false, false);
            return;
        }

        const registrations = auth.getRegistrations();
        const alreadyRegistered = registrations.find(
            (registration) =>
                String(registration.eventId) === String(eventId) &&
                String(registration.userId) === userId &&
                registration.status === "active"
        );

        if (alreadyRegistered) {
            syncRegistrationState();
            return;
        }

        if (auth.getEventRegistrations(eventId).length >= event.capacity) {
            els.hint.textContent = "Свободных мест нет.";
            return;
        }

        registrations.push({
            id: createId(),
            eventId: String(eventId),
            userId,
            status: "active",
            createdAt: new Date().toISOString()
        });

        auth.setRegistrations(registrations);
        syncRegistrationState();
    });

    els.btnCancel.addEventListener("click", () => {
        if (!userId) {
            return;
        }

        const registrations = auth.getRegistrations();
        const registration = registrations.find(
            (item) =>
                String(item.eventId) === String(eventId) &&
                String(item.userId) === userId &&
                item.status === "active"
        );

        if (!registration) {
            syncRegistrationState();
            return;
        }

        registration.status = "cancelled";
        registration.cancelledAt = new Date().toISOString();
        auth.setRegistrations(registrations);
        syncRegistrationState();
    });

    function renderEvent(item) {
        const shortDescription = String(item.short || item.shortDescription || item.description || "")
            .trim()
            .slice(0, 140);

        els.image.src = item.image;
        els.image.alt = item.title;
        els.title.textContent = item.title;
        els.short.textContent = shortDescription || item.description;
        els.description.textContent = item.description;
        els.goalBadge.textContent = getEventGoalLabel(item.goal);
        els.goalBadge.className = "badge text-bg-light border rounded-pill event-meta-badge goal-badge";
        els.placeBadge.textContent = auth.getPlaceLabel(item.place);
        els.dateBadge.textContent = auth.formatDate(item.date);
        els.participants.textContent = `${auth.getEventRegistrations(item.id).length} / ${item.capacity}`;
        els.audience.textContent = item.audience;
    }

    function syncRegistrationState() {
        const registrations = auth.getRegistrations();
        const activeRegistration = userId
            ? registrations.find(
                (registration) =>
                    String(registration.eventId) === String(eventId) &&
                    String(registration.userId) === userId &&
                    registration.status === "active"
            )
            : null;

        els.participants.textContent = `${auth.getEventRegistrations(eventId).length} / ${event.capacity}`;
        updateStatusUI(Boolean(activeRegistration), isStudent);
    }

    function updateStatusUI(isRegistered, isCurrentUserStudent) {
        if (!userId) {
            els.statusText.textContent = "Нужен вход";
            els.statusBadge.textContent = "Нужен вход";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--neutral";
            els.hint.textContent = "Чтобы записаться, войдите в аккаунт.";
            els.btnRegister.classList.remove("d-none");
            els.btnCancel.classList.add("d-none");
            return;
        }

        if (!isCurrentUserStudent) {
            els.statusText.textContent = "Запись недоступна";
            els.statusBadge.textContent = "Только для учеников";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--neutral";
            els.hint.textContent = "На мероприятия записываются только ученики.";
            els.btnRegister.classList.add("d-none");
            els.btnCancel.classList.add("d-none");
            return;
        }

        if (isRegistered) {
            els.statusText.textContent = "Вы записаны";
            els.statusBadge.textContent = "Вы записаны";
            els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--active";
            els.hint.textContent = "При необходимости запись можно отменить.";
            els.btnRegister.classList.add("d-none");
            els.btnCancel.classList.remove("d-none");
            return;
        }

        els.statusText.textContent = "Вы не записаны";
        els.statusBadge.textContent = "Вы не записаны";
        els.statusBadge.className = "badge rounded-pill registration-status-badge registration-status-badge--inactive";
        els.hint.textContent = "Нажмите «Записаться», чтобы добавить мероприятие в личный кабинет.";
        els.btnRegister.classList.remove("d-none");
        els.btnCancel.classList.add("d-none");
    }

    function renderNotFound() {
        document.title = "Мероприятие не найдено";
        els.title.textContent = "Мероприятие не найдено";
        els.short.textContent = "Проверьте ссылку или вернитесь к списку мероприятий.";
        els.description.textContent = "Это мероприятие не найдено в общем списке.";
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

    function getEventGoalLabel(goal) {
        return {
            sport: "Спортивное",
            fun: "Развлекательное",
            study: "Учебное",
            ceremony: "Торжественное"
        }[goal] || "Развлекательное";
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `eventreg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
});
