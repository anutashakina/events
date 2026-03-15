(function () {
    const TEST_USERS = [
        {
            id: "student-1",
            firstName: "Тестовый",
            lastName: "Ученик",
            email: "student@test.ru",
            password: "12345678",
            role: "student",
            isExternal: false,
            studentClass: 9,
            studentLetter: "А"
        },
        {
            id: "teacher-1",
            firstName: "Тестовый",
            lastName: "Учитель",
            email: "teacher@test.ru",
            password: "12345678",
            role: "teacher"
        },
        {
            id: "admin-1",
            firstName: "Главный",
            lastName: "Администратор",
            email: "admin@test.ru",
            password: "12345678",
            role: "admin"
        }
    ];

    const ROLE_HOME_MAP = {
        student: "profile.html",
        teacher: "teacher.html",
        admin: "admin.html"
    };

    const PROPOSAL_FORM_URL = "#";

    const FALLBACK_EVENTS = [
        {
            id: "0",
            title: "Новогодняя дискотека",
            date: "2025-12-25",
            image: "img/carousel1.png",
            description: "Праздничный вечер с музыкой, конкурсами и танцевальной программой для школьников.",
            goal: "fun",
            place: "assembly",
            capacity: 30,
            audience: "7–11 классы",
            responsibleTeacherId: "teacher-1"
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
            audience: "5–11 классы",
            responsibleTeacherId: "teacher-1"
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
            audience: "5–11 классы",
            responsibleTeacherId: "teacher-1"
        },
        {
            id: "3",
            title: "Олимпиадный практикум",
            date: "2025-10-20",
            image: "img/carousel4.png",
            description: "Подготовка к предметным олимпиадам с разбором сложных заданий и мини-практикой.",
            goal: "study",
            place: "classroom",
            capacity: 24,
            audience: "8–11 классы",
            responsibleTeacherId: "teacher-1"
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
            audience: "1–11 классы",
            responsibleTeacherId: "teacher-1"
        }
    ];

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

    function normalizeRole(role) {
        const normalizedRole = String(role || "").trim().toLowerCase();
        return ROLE_HOME_MAP[normalizedRole] ? normalizedRole : "student";
    }

    function normalizeUser(user) {
        if (!user || typeof user !== "object") {
            return null;
        }

        return {
            ...user,
            id: String(user.id || ""),
            email: String(user.email || "").trim().toLowerCase(),
            firstName: String(user.firstName || "").trim(),
            lastName: String(user.lastName || "").trim(),
            role: normalizeRole(user.role),
            isExternal: Boolean(user.isExternal),
            studentClass: user.studentClass ?? null,
            studentLetter: user.studentLetter ?? null
        };
    }

    function getPreferredUser(existingUser, nextUser) {
        if (!existingUser) {
            return nextUser;
        }

        if (!nextUser) {
            return existingUser;
        }

        const defaultTestUser = TEST_USERS.find(
            (testUser) => String(testUser.id || "") === String(existingUser.id || nextUser.id || "")
        );
        const defaultEmail = String(defaultTestUser?.email || "").toLowerCase();
        const existingEmail = String(existingUser.email || "").toLowerCase();
        const nextEmail = String(nextUser.email || "").toLowerCase();

        if (defaultEmail) {
            const existingIsDefault = existingEmail === defaultEmail;
            const nextIsDefault = nextEmail === defaultEmail;

            if (existingIsDefault && !nextIsDefault) {
                return nextUser;
            }

            if (!existingIsDefault && nextIsDefault) {
                return existingUser;
            }
        }

        return nextUser;
    }

    function setUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    function setEvents(events) {
        localStorage.setItem("events", JSON.stringify(events));
    }

    function setRegistrations(registrations) {
        localStorage.setItem("registrations", JSON.stringify(registrations));
    }

    function setCurrentUser(user) {
        if (!user) {
            localStorage.removeItem("currentUser");
            return null;
        }

        const normalizedUser = normalizeUser(user);
        const sessionUser = {
            id: normalizedUser.id,
            email: normalizedUser.email,
            firstName: normalizedUser.firstName,
            lastName: normalizedUser.lastName,
            role: normalizedUser.role,
            isExternal: normalizedUser.isExternal,
            studentClass: normalizedUser.studentClass,
            studentLetter: normalizedUser.studentLetter
        };

        localStorage.setItem("currentUser", JSON.stringify(sessionUser));
        return sessionUser;
    }

    function ensureTestUsers() {
        const storedUsers = getArrayFromStorage("users")
            .map((user) => normalizeUser(user))
            .filter(Boolean);

        const usersById = new Map();
        const usersByEmail = new Map();

        storedUsers.forEach((user) => {
            const userId = String(user.id || "");
            const email = String(user.email || "").toLowerCase();
            const existingById = userId ? usersById.get(userId) : null;
            const preferredUser = getPreferredUser(existingById, user);

            if (
                existingById &&
                existingById !== preferredUser &&
                existingById.email &&
                existingById.email !== preferredUser.email
            ) {
                usersByEmail.delete(existingById.email);
            }

            if (userId) {
                usersById.set(userId, preferredUser);
            }

            if (preferredUser.email) {
                usersByEmail.set(preferredUser.email, preferredUser);
            }
        });

        TEST_USERS.forEach((testUser) => {
            const normalizedTestUser = normalizeUser(testUser);
            const userId = String(normalizedTestUser.id || "");
            const email = normalizedTestUser.email;

            if (userId && usersById.has(userId)) {
                return;
            }

            if (email && usersByEmail.has(email)) {
                return;
            }

            if (userId) {
                usersById.set(userId, normalizedTestUser);
            }

            if (email) {
                usersByEmail.set(email, normalizedTestUser);
            }
        });

        const mergedUsers = Array.from(usersById.values());
        setUsers(mergedUsers);

        const currentUser = normalizeUser(getObjectFromStorage("currentUser"));
        if (currentUser?.id) {
            setCurrentUser(currentUser);
        }

        return mergedUsers;
    }

    function getUsers() {
        return ensureTestUsers();
    }

    function getCurrentUser() {
        return normalizeUser(getObjectFromStorage("currentUser"));
    }

    function getTeachers() {
        return getUsers().filter((user) => user.role === "teacher");
    }

    function getStudents() {
        return getUsers().filter((user) => user.role === "student");
    }

    function getUserById(userId) {
        const normalizedId = String(userId || "");
        return getUsers().find((user) => String(user.id) === normalizedId) || null;
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
            стадион: "stadium",
            gym1: "gym1",
            "спортивный зал №1": "gym1",
            "спортзал №1": "gym1",
            gym2: "gym2",
            "спортивный зал №2": "gym2",
            "спортзал №2": "gym2"
        };

        return placeMap[value] || "assembly";
    }

    function normalizeEvent(event, index = 0) {
        if (!event || typeof event !== "object") {
            return null;
        }

        const responsibleTeacherId = String(
            event.responsibleTeacherId || FALLBACK_EVENTS[index]?.responsibleTeacherId || "teacher-1"
        );
        const responsibleTeacher = getUserById(responsibleTeacherId);

        return {
            ...event,
            id: String(event.id || `event-${index}`),
            title: String(event.title || "").trim() || "Без названия",
            description: String(event.description || "").trim() || "Описание мероприятия пока не добавлено.",
            image: String(event.image || "").trim() || "img/carousel1.png",
            date: normalizeDate(event.date),
            goal: normalizeGoal(event.goal || event.category || event.purpose),
            place: normalizePlace(event.place),
            capacity: Number(event.capacity || event.maxParticipants || event.limit || 30) || 30,
            audience: String(event.audience || event.forWhom || "5–11 классы").trim(),
            responsibleTeacherId,
            responsibleTeacherName: responsibleTeacher
                ? `${responsibleTeacher.firstName} ${responsibleTeacher.lastName}`.trim()
                : String(event.responsibleTeacherName || "Не назначен")
        };
    }

    function getEvents() {
        const storedEvents = getArrayFromStorage("events")
            .map((event, index) => normalizeEvent(event, index))
            .filter(Boolean);

        if (storedEvents.length) {
            setEvents(storedEvents);
            return storedEvents;
        }

        const fallbackEvents = FALLBACK_EVENTS
            .map((event, index) => normalizeEvent(event, index))
            .filter(Boolean);

        setEvents(fallbackEvents);
        return fallbackEvents;
    }

    function getRegistrations() {
        return getArrayFromStorage("registrations");
    }

    function getEventRegistrations(eventId) {
        const normalizedEventId = String(eventId || "");
        return getRegistrations().filter(
            (registration) =>
                String(registration.eventId) === normalizedEventId && registration.status === "active"
        );
    }

    function getRegisteredStudentsForEvent(eventId) {
        return getEventRegistrations(eventId)
            .map((registration) => getUserById(registration.userId))
            .filter((user) => user && user.role === "student");
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
            stadium: "Стадион",
            gym1: "Спортивный зал №1",
            gym2: "Спортивный зал №2"
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

    function getHomePageByRole(role) {
        return ROLE_HOME_MAP[normalizeRole(role)];
    }

    function getHomePageForUser(user) {
        return getHomePageByRole(user?.role);
    }

    function redirectToUserHome(user) {
        const destination = getHomePageForUser(user);
        if (destination) {
            window.location.href = destination;
        }
    }

    window.SchoolAuth = {
        TEST_USERS,
        ensureTestUsers,
        getArrayFromStorage,
        getObjectFromStorage,
        getUsers,
        getCurrentUser,
        getTeachers,
        getStudents,
        getUserById,
        getEvents,
        getRegistrations,
        getEventRegistrations,
        getRegisteredStudentsForEvent,
        getHomePageByRole,
        getHomePageForUser,
        getGoalLabel,
        getPlaceLabel,
        formatDate,
        normalizeRole,
        normalizeUser,
        normalizeEvent,
        redirectToUserHome,
        PROPOSAL_FORM_URL,
        FALLBACK_EVENTS,
        setCurrentUser,
        setUsers,
        setEvents,
        setRegistrations
    };
})();
