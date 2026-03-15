document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SchoolAuth;
    const title = document.getElementById("adminUserTitle");
    const eventsGrid = document.getElementById("adminEventsGrid");
    const teachersWrap = document.getElementById("teachersList");
    const studentsWrap = document.getElementById("studentsList");
    const studentsCounter = document.getElementById("studentsCounter");
    const teacherForm = document.getElementById("teacherForm");
    const eventForm = document.getElementById("eventForm");
    const studentForm = document.getElementById("studentForm");
    const eventImageInput = document.getElementById("eventImageInput");
    const teacherMessage = document.getElementById("teacherMessage");
    const eventMessage = document.getElementById("eventMessage");
    const studentMessage = document.getElementById("studentMessage");
    const proposalLink = document.querySelector("[data-proposal-link]");
    const searchInput = document.getElementById("studentSearch");
    const classDropdownButton = document.getElementById("classDropdownButton");
    const classOptions = document.querySelectorAll(".class-option");
    const eventGoalDropdownButton = document.getElementById("eventGoalDropdownButton");
    const eventPlaceDropdownButton = document.getElementById("eventPlaceDropdownButton");
    const eventTeacherDropdownButton = document.getElementById("eventTeacherDropdownButton");
    const eventTeacherMenu = document.getElementById("eventTeacherMenu");
    const resetFilters = document.getElementById("resetStudentFilters");
    const teacherFormReset = document.getElementById("teacherFormReset");

    if (
        !auth ||
        !title ||
        !eventsGrid ||
        !teachersWrap ||
        !studentsWrap ||
        !studentsCounter ||
        !teacherForm ||
        !eventForm ||
        !studentForm ||
        !eventImageInput ||
        !teacherMessage ||
        !eventMessage ||
        !studentMessage ||
        !searchInput ||
        !classDropdownButton ||
        !classOptions.length ||
        !eventGoalDropdownButton ||
        !eventPlaceDropdownButton ||
        !eventTeacherDropdownButton ||
        !eventTeacherMenu ||
        !teacherFormReset ||
        !resetFilters
    ) {
        return;
    }

    auth.ensureTestUsers();
    const currentUser = auth.getCurrentUser();

    if (!currentUser?.id) {
        window.location.href = "login.html";
        return;
    }

    if (currentUser.role !== "admin") {
        auth.redirectToUserHome(currentUser);
        return;
    }

    if (proposalLink) {
        proposalLink.href = auth.PROPOSAL_FORM_URL;
    }

    let selectedClass = "all";

    title.textContent = "Список мероприятий";

    renderAll();
    bindStudentFilters();
    bindEventDropdowns();

    teacherForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const firstName = String(document.getElementById("teacherFirstName").value || "").trim();
        const lastName = String(document.getElementById("teacherLastName").value || "").trim();
        const email = String(document.getElementById("teacherEmail").value || "").trim().toLowerCase();
        const passwordInput = String(document.getElementById("teacherPassword").value || "").trim();
        const editingTeacherId = String(document.getElementById("teacherEditingId").value || "").trim();

        if (!firstName || !lastName || !email) {
            showMessage(teacherMessage, "Заполните имя, фамилию и почту учителя.", false);
            return;
        }

        const users = auth.getUsers();
        const existing = users.find((user) => String(user.email) === email && String(user.id) !== editingTeacherId);
        if (existing) {
            showMessage(teacherMessage, "Пользователь с такой почтой уже существует.", false);
            return;
        }

        const password = passwordInput || createTempPassword();

        if (editingTeacherId) {
            const updatedUsers = users.map((user) => {
                if (String(user.id) !== editingTeacherId) {
                    return user;
                }

                return {
                    ...user,
                    firstName,
                    lastName,
                    email,
                    password: passwordInput ? password : user.password || password,
                    role: "teacher"
                };
            });

            auth.setUsers(updatedUsers);
            showMessage(
                teacherMessage,
                `Данные учителя обновлены. Логин: ${email}${passwordInput ? `, новый пароль: ${password}` : ""}`,
                true
            );
        } else {
            const newTeacher = auth.normalizeUser({
                id: createId("teacher"),
                firstName,
                lastName,
                email,
                password,
                role: "teacher"
            });

            auth.setUsers([...users, newTeacher]);
            showMessage(teacherMessage, `Учитель добавлен. Логин: ${email}, пароль: ${password}`, true);
        }

        resetTeacherForm();
        renderAll();
    });

    eventForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titleValue = String(document.getElementById("eventTitleInput").value || "").trim();
        const description = String(document.getElementById("eventDescriptionInput").value || "").trim();
        const rawDate = String(document.getElementById("eventDateInput").value || "").trim();
        const goal = String(document.getElementById("eventGoalInput").value || "fun").trim();
        const place = String(document.getElementById("eventPlaceInput").value || "assembly").trim();
        const audience = String(document.getElementById("eventAudienceInput").value || "").trim();
        const capacity = Number(document.getElementById("eventCapacityInput").value || 30);
        const responsibleTeacherId = String(document.getElementById("eventTeacherInput").value || "").trim();
        const date = parseManualDate(rawDate);
        const imageFile = eventImageInput.files?.[0] || null;

        if (!titleValue || !description || !rawDate || !responsibleTeacherId || !imageFile) {
            showMessage(eventMessage, "Заполните название, описание, дату, фото и ответственного учителя.", false);
            return;
        }

        if (!date) {
            showMessage(eventMessage, "Дата должна быть в формате ДД.ММ.ГГГГ и существовать в календаре.", false);
            return;
        }

        if (!imageFile.type.startsWith("image/")) {
            showMessage(eventMessage, "Загрузите файл изображения.", false);
            return;
        }

        const teacher = auth.getUserById(responsibleTeacherId);
        if (!teacher || teacher.role !== "teacher") {
            showMessage(eventMessage, "Выберите существующего учителя.", false);
            return;
        }

        let imageDataUrl = "";
        try {
            imageDataUrl = await readFileAsDataUrl(imageFile);
        } catch {
            showMessage(eventMessage, "Не удалось загрузить фото. Попробуйте другой файл.", false);
            return;
        }

        const events = auth.getEvents();
        const newEvent = auth.normalizeEvent({
            id: createId("event"),
            title: titleValue,
            description,
            image: imageDataUrl,
            date,
            goal,
            place,
            audience: audience || "5–11 классы",
            capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 30,
            responsibleTeacherId,
            responsibleTeacherName: `${teacher.firstName} ${teacher.lastName}`.trim()
        }, events.length);

        auth.setEvents([...events, newEvent]);
        eventForm.reset();
        resetEventDropdowns();
        showMessage(eventMessage, "Мероприятие добавлено в общий список.", true);
        renderAll();
    });

    studentForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const firstName = String(document.getElementById("studentFirstName").value || "").trim();
        const lastName = String(document.getElementById("studentLastName").value || "").trim();
        const email = String(document.getElementById("studentEmail").value || "").trim().toLowerCase();
        const isExternal = document.getElementById("studentIsExternal").checked;
        const studentClass = String(document.getElementById("studentClassInput").value || "").trim();
        const studentLetter = String(document.getElementById("studentLetterInput").value || "").trim().toUpperCase();
        const editingStudentId = String(document.getElementById("studentEditingId").value || "").trim();

        if (!firstName || !lastName || !email) {
            showMessage(studentMessage, "Заполните имя, фамилию и почту ученика.", false);
            return;
        }

        if (!isExternal) {
            const classNumber = Number(studentClass);
            if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 11) {
                showMessage(studentMessage, "Класс должен быть числом от 1 до 11.", false);
                return;
            }

            if (!/^[А-ЯЁ]$/i.test(studentLetter)) {
                showMessage(studentMessage, "Буква класса должна быть одной русской буквой.", false);
                return;
            }
        }

        const users = auth.getUsers();
        const emailConflict = users.find(
            (user) => String(user.email) === email && String(user.id) !== editingStudentId
        );
        if (emailConflict) {
            showMessage(studentMessage, "Пользователь с такой почтой уже существует.", false);
            return;
        }

        if (editingStudentId) {
            const updatedUsers = users.map((user) => {
                if (String(user.id) !== editingStudentId) {
                    return user;
                }

                return {
                    ...user,
                    firstName,
                    lastName,
                    email,
                    isExternal,
                    studentClass: isExternal ? null : Number(studentClass),
                    studentLetter: isExternal ? null : studentLetter,
                    role: "student"
                };
            });

            auth.setUsers(updatedUsers);
            showMessage(studentMessage, "Данные ученика сохранены.", true);
        } else {
            const newStudent = auth.normalizeUser({
                id: createId("student"),
                firstName,
                lastName,
                email,
                password: createTempPassword(),
                role: "student",
                isExternal,
                studentClass: isExternal ? null : Number(studentClass),
                studentLetter: isExternal ? null : studentLetter
            });

            auth.setUsers([...users, newStudent]);
            showMessage(studentMessage, `Ученик добавлен. Логин: ${email}`, true);
        }

        resetStudentForm();
        renderAll();
    });

    teacherFormReset.addEventListener("click", () => {
        resetTeacherForm();
    });

    document.getElementById("studentFormReset").addEventListener("click", () => {
        resetStudentForm();
    });

    document.getElementById("studentIsExternal").addEventListener("change", () => {
        toggleStudentSchoolFields();
    });

    function bindStudentFilters() {
        searchInput.addEventListener("input", renderStudents);

        classOptions.forEach((option) => {
            option.addEventListener("click", () => {
                selectedClass = option.dataset.value;
                classDropdownButton.textContent = option.textContent;
                classOptions.forEach((item) => item.classList.remove("active-option"));
                option.classList.add("active-option");
                renderStudents();
            });
        });

        resetFilters.addEventListener("click", () => {
            searchInput.value = "";
            selectedClass = "all";
            classDropdownButton.textContent = "Все классы";
            classOptions.forEach((item) => item.classList.remove("active-option"));
            const defaultOption = document.querySelector('.class-option[data-value="all"]');
            if (defaultOption) {
                defaultOption.classList.add("active-option");
            }
            renderStudents();
        });

        const defaultOption = document.querySelector('.class-option[data-value="all"]');
        if (defaultOption) {
            defaultOption.classList.add("active-option");
        }
    }

    function bindEventDropdowns() {
        document.addEventListener("click", (event) => {
            const goalOption = event.target.closest(".event-goal-option");
            if (goalOption) {
                event.preventDefault();

                document.getElementById("eventGoalInput").value = goalOption.dataset.value;
                eventGoalDropdownButton.textContent = goalOption.textContent.trim();
                document
                    .querySelectorAll(".event-goal-option")
                    .forEach((item) => item.classList.remove("active-option"));
                goalOption.classList.add("active-option");
                return;
            }

            const placeOption = event.target.closest(".event-place-option");
            if (placeOption) {
                event.preventDefault();

                document.getElementById("eventPlaceInput").value = placeOption.dataset.value;
                eventPlaceDropdownButton.textContent = placeOption.textContent.trim();
                document
                    .querySelectorAll(".event-place-option")
                    .forEach((item) => item.classList.remove("active-option"));
                placeOption.classList.add("active-option");
                return;
            }

            const teacherOption = event.target.closest(".event-teacher-option");
            if (teacherOption) {
                event.preventDefault();

                document.getElementById("eventTeacherInput").value = teacherOption.dataset.value;
                eventTeacherDropdownButton.textContent = teacherOption.textContent.trim();
                document
                    .querySelectorAll(".event-teacher-option")
                    .forEach((item) => item.classList.remove("active-option"));
                teacherOption.classList.add("active-option");
            }
        });

        const defaultGoal = document.querySelector('.event-goal-option[data-value="fun"]');
        const defaultPlace = document.querySelector('.event-place-option[data-value="assembly"]');
        if (defaultGoal) {
            defaultGoal.classList.add("active-option");
        }
        if (defaultPlace) {
            defaultPlace.classList.add("active-option");
        }
    }

    function renderAll() {
        renderEvents();
        renderTeachers();
        fillTeacherSelect();
        renderStudents();
    }

    function renderEvents() {
        const events = auth.getEvents().sort((a, b) => new Date(a.date) - new Date(b.date));
        const teachers = auth.getTeachers();

        eventsGrid.innerHTML = events
            .map((event) => {
                const registeredCount = auth.getEventRegistrations(event.id).length;
                const teacherOptions = teachers
                    .map((teacher) => `
                        <li>
                            <button
                                class="dropdown-item custom-filter-item event-card-teacher-option ${String(teacher.id) === String(event.responsibleTeacherId) ? "active-option" : ""}"
                                type="button"
                                data-event-id="${escapeHtml(event.id)}"
                                data-value="${escapeHtml(teacher.id)}"
                            >
                                ${escapeHtml(getUserName(teacher))}
                            </button>
                        </li>
                    `)
                    .join("");

                return `
                    <div class="col-12 col-md-6 col-xl-4">
                        <article class="event-card-custom">
                            <a class="event-card-link" href="event.html?id=${encodeURIComponent(event.id)}">
                                <div class="event-card-image-wrap">
                                    <img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" class="event-card-image">
                                    <span class="badge text-bg-light border rounded-pill goal-badge position-absolute top-0 start-0 m-3">${escapeHtml(auth.getGoalLabel(event.goal))}</span>
                                </div>
                            </a>
                            <div class="event-card-body">
                                <a class="event-card-link" href="event.html?id=${encodeURIComponent(event.id)}">
                                    <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
                                    <p class="event-card-text">${escapeHtml(event.description)}</p>
                                    <div class="event-card-meta mb-2">
                                        <span class="event-meta-pill">${escapeHtml(auth.getPlaceLabel(event.place))}</span>
                                        <span class="event-meta-pill">${escapeHtml(auth.formatDate(event.date))}</span>
                                    </div>
                                </a>
                                <div class="dashboard-card-note mb-2">Ответственный: ${escapeHtml(event.responsibleTeacherName)}</div>
                                <div class="dashboard-card-note mb-3">Записано: ${registeredCount} / ${event.capacity}</div>
                                <div class="dashboard-row-actions">
                                    <input type="hidden" data-event-teacher-input="${escapeHtml(event.id)}" value="${escapeHtml(event.responsibleTeacherId)}">
                                    <div class="dropdown custom-filter-dropdown dashboard-inline-dropdown">
                                        <button
                                            class="btn custom-filter-toggle dropdown-toggle text-start"
                                            type="button"
                                            data-event-teacher-button="${escapeHtml(event.id)}"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            ${escapeHtml(event.responsibleTeacherName || "Выберите учителя")}
                                        </button>
                                        <ul class="dropdown-menu custom-filter-menu w-100">
                                            ${teacherOptions}
                                        </ul>
                                    </div>
                                    <button type="button" class="subtle-button dashboard-action-button" data-delete-event="${escapeHtml(event.id)}">
                                        Удалить
                                    </button>
                                    <button type="button" class="subtle-button dashboard-action-button" data-save-event-teacher="${escapeHtml(event.id)}">
                                        Сохранить
                                    </button>
                                </div>
                            </div>
                        </article>
                    </div>
                `;
            })
            .join("");

        eventsGrid.querySelectorAll("[data-save-event-teacher]").forEach((button) => {
            button.addEventListener("click", () => {
                const eventId = button.getAttribute("data-save-event-teacher");
                const cardBody = button.closest(".event-card-body");
                const input = cardBody?.querySelector("[data-event-teacher-input]");
                const teacherId = String(input?.value || "").trim();
                const teacher = auth.getUserById(teacherId);

                if (!teacher || teacher.role !== "teacher") {
                    showMessage(eventMessage, "Выберите существующего учителя для мероприятия.", false);
                    return;
                }

                const updatedEvents = auth.getEvents().map((event) => {
                    if (String(event.id) !== String(eventId)) {
                        return event;
                    }

                    return auth.normalizeEvent({
                        ...event,
                        responsibleTeacherId: teacher.id,
                        responsibleTeacherName: getUserName(teacher)
                    });
                });
                const updatedEvent = updatedEvents.find((event) => String(event.id) === String(eventId));

                auth.setEvents(updatedEvents);
                showMessage(
                    eventMessage,
                    `Ответственный для мероприятия «${updatedEvent?.title || "Без названия"}» обновлен.`,
                    true
                );
                renderAll();
            });
        });

        eventsGrid.querySelectorAll("[data-delete-event]").forEach((button) => {
            button.addEventListener("click", () => {
                const eventId = button.getAttribute("data-delete-event");
                const eventToDelete = auth.getEvents().find((event) => String(event.id) === String(eventId));

                if (!eventToDelete) {
                    showMessage(eventMessage, "Мероприятие не найдено.", false);
                    return;
                }

                const shouldDelete = window.confirm(
                    `Удалить мероприятие «${eventToDelete.title}»? Это также уберет все связанные записи учеников.`
                );
                if (!shouldDelete) {
                    return;
                }

                const updatedEvents = auth
                    .getEvents()
                    .filter((event) => String(event.id) !== String(eventId));
                const updatedRegistrations = auth
                    .getRegistrations()
                    .filter((registration) => String(registration.eventId) !== String(eventId));

                auth.setEvents(updatedEvents);
                auth.setRegistrations(updatedRegistrations);
                showMessage(eventMessage, `Мероприятие «${eventToDelete.title}» удалено.`, true);
                renderAll();
            });
        });

        eventsGrid.querySelectorAll(".event-card-teacher-option").forEach((option) => {
            option.addEventListener("click", (event) => {
                event.preventDefault();

                const eventId = option.getAttribute("data-event-id");
                const teacherId = option.getAttribute("data-value");
                const teacher = auth.getUserById(teacherId);
                const cardBody = option.closest(".event-card-body");
                const input = cardBody?.querySelector("[data-event-teacher-input]");
                const button = cardBody?.querySelector("[data-event-teacher-button]");

                if (!teacher || !input || !button) {
                    return;
                }

                input.value = teacher.id;
                button.textContent = getUserName(teacher);

                eventsGrid
                    .querySelectorAll(`.event-card-teacher-option[data-event-id="${cssEscape(eventId)}"]`)
                    .forEach((item) => item.classList.remove("active-option"));
                option.classList.add("active-option");
            });
        });
    }

    function renderTeachers() {
        const teachers = auth.getTeachers();

        teachersWrap.innerHTML = teachers.length
            ? teachers
                .map((teacher) => {
                    const assignedEvents = auth
                        .getEvents()
                        .filter((event) => String(event.responsibleTeacherId) === String(teacher.id)).length;

                    return `
                        <div class="dashboard-list-row">
                            <div>
                                <div class="dashboard-list-title">${escapeHtml(getUserName(teacher))}</div>
                                <div class="dashboard-list-subtitle">${escapeHtml(teacher.email || "Почта не указана")}</div>
                                <div class="dashboard-list-subtitle">Пароль: ${escapeHtml(teacher.password || "Не указан")}</div>
                            </div>
                            <div class="dashboard-row-actions">
                                <span class="event-meta-pill">Мероприятий: ${assignedEvents}</span>
                                <button type="button" class="subtle-button dashboard-action-button" data-edit-teacher="${escapeHtml(teacher.id)}">Редактировать</button>
                                <button type="button" class="subtle-button dashboard-action-button" data-delete-teacher="${escapeHtml(teacher.id)}">Удалить</button>
                            </div>
                        </div>
                    `;
                })
                .join("")
            : `
                <div class="profile-state-card mb-0">
                    <p class="events-empty-text mb-0">Список учителей пуст.</p>
                </div>
            `;

        teachersWrap.querySelectorAll("[data-edit-teacher]").forEach((button) => {
            button.addEventListener("click", () => {
                const teacher = auth.getUserById(button.getAttribute("data-edit-teacher"));
                if (!teacher) {
                    return;
                }

                document.getElementById("teacherEditingId").value = String(teacher.id);
                document.getElementById("teacherFirstName").value = teacher.firstName || "";
                document.getElementById("teacherLastName").value = teacher.lastName || "";
                document.getElementById("teacherEmail").value = teacher.email || "";
                document.getElementById("teacherPassword").value = teacher.password || "";
                document.getElementById("teacherFormTitle").textContent = "Редактировать учителя";
                document.getElementById("teacherSubmitText").textContent = "Сохранить изменения";
                showMessage(
                    teacherMessage,
                    "Измените данные учителя и при необходимости укажите новый пароль.",
                    true
                );
            });
        });

        teachersWrap.querySelectorAll("[data-delete-teacher]").forEach((button) => {
            button.addEventListener("click", () => {
                const teacherId = button.getAttribute("data-delete-teacher");
                const teacher = auth.getUserById(teacherId);

                if (!teacher) {
                    showMessage(teacherMessage, "Учитель не найден.", false);
                    return;
                }

                const assignedEvents = auth
                    .getEvents()
                    .filter((event) => String(event.responsibleTeacherId) === String(teacherId));

                if (assignedEvents.length) {
                    showMessage(
                        teacherMessage,
                        "Сначала переназначьте мероприятия этого учителя, потом его можно удалить.",
                        false
                    );
                    return;
                }

                const shouldDelete = window.confirm(`Удалить учителя «${getUserName(teacher)}»?`);
                if (!shouldDelete) {
                    return;
                }

                const updatedUsers = auth
                    .getUsers()
                    .filter((user) => String(user.id) !== String(teacherId));

                if (String(document.getElementById("teacherEditingId").value || "") === String(teacherId)) {
                    resetTeacherForm();
                }

                auth.setUsers(updatedUsers);
                showMessage(teacherMessage, `Учитель «${getUserName(teacher)}» удален.`, true);
                renderAll();
            });
        });
    }

    function fillTeacherSelect() {
        const input = document.getElementById("eventTeacherInput");
        const currentValue = input.value;
        const teachers = auth.getTeachers();

        eventTeacherMenu.innerHTML = teachers
            .map((teacher) => `
                <li>
                    <button
                        class="dropdown-item custom-filter-item event-teacher-option ${teacher.id === currentValue ? "active-option" : ""}"
                        type="button"
                        data-value="${escapeHtml(teacher.id)}"
                    >
                        ${escapeHtml(getUserName(teacher))}
                    </button>
                </li>
            `)
            .join("");

        const selectedTeacher = teachers.find((teacher) => teacher.id === currentValue);
        eventTeacherDropdownButton.textContent = selectedTeacher
            ? getUserName(selectedTeacher)
            : "Выберите учителя";
        input.value = selectedTeacher ? selectedTeacher.id : "";
    }

    function renderStudents() {
        const searchValue = String(searchInput.value || "").trim().toLowerCase();
        const students = auth.getStudents().filter((student) => {
            const name = getUserName(student).toLowerCase();
            const classLabel = getStudentClassLabel(student).toLowerCase();
            const matchesSearch = !searchValue || name.includes(searchValue) || classLabel.includes(searchValue);
            const matchesClass =
                selectedClass === "all" ||
                (selectedClass === "external" && student.isExternal) ||
                String(student.studentClass || "") === selectedClass;

            return matchesSearch && matchesClass;
        });

        studentsCounter.textContent = `Найдено учеников: ${students.length}`;

        studentsWrap.innerHTML = students.length
            ? students
                .map((student) => `
                    <div class="dashboard-list-row">
                        <div>
                            <div class="dashboard-list-title">${escapeHtml(getUserName(student))}</div>
                            <div class="dashboard-list-subtitle">${escapeHtml(getStudentClassLabel(student))}</div>
                            <div class="dashboard-list-subtitle">Пароль: ${escapeHtml(student.password || "Не указан")}</div>
                        </div>
                        <div class="dashboard-row-actions">
                            <span class="event-meta-pill">${escapeHtml(student.email || "Почта не указана")}</span>
                            <button type="button" class="subtle-button dashboard-action-button" data-edit-student="${escapeHtml(student.id)}">Редактировать</button>
                            <button type="button" class="subtle-button dashboard-action-button" data-delete-student="${escapeHtml(student.id)}">Удалить</button>
                        </div>
                    </div>
                `)
                .join("")
            : `
                <div class="profile-state-card mb-0">
                    <p class="events-empty-text mb-0">По текущим фильтрам ученики не найдены.</p>
                </div>
            `;

        studentsWrap.querySelectorAll("[data-edit-student]").forEach((button) => {
            button.addEventListener("click", () => {
                const student = auth.getUserById(button.getAttribute("data-edit-student"));
                if (!student) {
                    return;
                }

                document.getElementById("studentEditingId").value = String(student.id);
                document.getElementById("studentFirstName").value = student.firstName || "";
                document.getElementById("studentLastName").value = student.lastName || "";
                document.getElementById("studentEmail").value = student.email || "";
                document.getElementById("studentIsExternal").checked = Boolean(student.isExternal);
                document.getElementById("studentClassInput").value = student.studentClass || "";
                document.getElementById("studentLetterInput").value = student.studentLetter || "";
                document.getElementById("studentFormTitle").textContent = "Редактировать ученика";
                document.getElementById("studentSubmitText").textContent = "Сохранить данные";
                toggleStudentSchoolFields();
                showMessage(studentMessage, "Данные ученика загружены в форму.", true);
            });
        });

        studentsWrap.querySelectorAll("[data-delete-student]").forEach((button) => {
            button.addEventListener("click", () => {
                const studentId = button.getAttribute("data-delete-student");
                const student = auth.getUserById(studentId);

                if (!student) {
                    showMessage(studentMessage, "Ученик не найден.", false);
                    return;
                }

                const shouldDelete = window.confirm(`Удалить ученика «${getUserName(student)}»?`);
                if (!shouldDelete) {
                    return;
                }

                const updatedUsers = auth
                    .getUsers()
                    .filter((user) => String(user.id) !== String(studentId));
                const updatedRegistrations = auth
                    .getRegistrations()
                    .filter((registration) => String(registration.userId) !== String(studentId));

                if (String(document.getElementById("studentEditingId").value || "") === String(studentId)) {
                    resetStudentForm();
                }

                auth.setUsers(updatedUsers);
                auth.setRegistrations(updatedRegistrations);
                showMessage(studentMessage, `Ученик «${getUserName(student)}» удален.`, true);
                renderAll();
            });
        });
    }

    function resetTeacherForm() {
        document.getElementById("teacherEditingId").value = "";
        teacherForm.reset();
        document.getElementById("teacherFormTitle").textContent = "Добавить учителя";
        document.getElementById("teacherSubmitText").textContent = "Добавить учителя";
        teacherMessage.textContent = "";
        teacherMessage.classList.add("d-none");
        teacherMessage.classList.remove("auth-form-msg--error", "auth-form-msg--success");
    }

    function resetStudentForm() {
        document.getElementById("studentEditingId").value = "";
        studentForm.reset();
        document.getElementById("studentFormTitle").textContent = "Добавить ученика";
        document.getElementById("studentSubmitText").textContent = "Добавить ученика";
        toggleStudentSchoolFields();
        studentMessage.textContent = "";
        studentMessage.classList.add("d-none");
        studentMessage.classList.remove("auth-form-msg--error", "auth-form-msg--success");
    }

    function toggleStudentSchoolFields() {
        const isExternal = document.getElementById("studentIsExternal").checked;
        const classInput = document.getElementById("studentClassInput");
        const letterInput = document.getElementById("studentLetterInput");

        classInput.disabled = isExternal;
        letterInput.disabled = isExternal;

        if (isExternal) {
            classInput.value = "";
            letterInput.value = "";
        }
    }

    function getUserName(user) {
        return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Без имени";
    }

    function getStudentClassLabel(student) {
        if (student.isExternal) {
            return "Не является учеником школы";
        }

        if (student.studentClass && student.studentLetter) {
            return `${student.studentClass} ${student.studentLetter} класс`;
        }

        return "Класс не указан";
    }

    function createTempPassword() {
        return Math.random().toString(36).slice(2, 10);
    }

    function parseManualDate(rawDate) {
        const match = String(rawDate || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
            return "";
        }

        const [, dayRaw, monthRaw, yearRaw] = match;
        const day = Number(dayRaw);
        const month = Number(monthRaw);
        const year = Number(yearRaw);
        const date = new Date(year, month - 1, day);

        if (
            Number.isNaN(date.getTime()) ||
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return "";
        }

        return `${yearRaw}-${monthRaw}-${dayRaw}`;
    }

    function resetEventDropdowns() {
        document.getElementById("eventGoalInput").value = "fun";
        document.getElementById("eventPlaceInput").value = "assembly";
        document.getElementById("eventTeacherInput").value = "";
        eventGoalDropdownButton.textContent = "Развлекательные";
        eventPlaceDropdownButton.textContent = "Актовый зал";
        eventTeacherDropdownButton.textContent = "Выберите учителя";
        document
            .querySelectorAll(".event-goal-option")
            .forEach((item) => item.classList.remove("active-option"));
        document
            .querySelectorAll(".event-place-option")
            .forEach((item) => item.classList.remove("active-option"));
        document
            .querySelectorAll(".event-teacher-option")
            .forEach((item) => item.classList.remove("active-option"));
        const defaultGoal = document.querySelector('.event-goal-option[data-value="fun"]');
        const defaultPlace = document.querySelector('.event-place-option[data-value="assembly"]');
        if (defaultGoal) {
            defaultGoal.classList.add("active-option");
        }
        if (defaultPlace) {
            defaultPlace.classList.add("active-option");
        }
    }

    function createId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}-${window.crypto.randomUUID()}`;
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === "function") {
            return window.CSS.escape(String(value));
        }

        return String(value).replace(/"/g, '\\"');
    }

    function showMessage(element, text, isSuccess) {
        element.textContent = text;
        element.classList.remove("d-none", "auth-form-msg--error", "auth-form-msg--success");
        element.classList.add(isSuccess ? "auth-form-msg--success" : "auth-form-msg--error");
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
