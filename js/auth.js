document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginMessage = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");
    const isExternalStudent = document.getElementById("isExternalStudent");
    const schoolFields = document.getElementById("schoolFields");
    const studentClassInput = document.getElementById("studentClass");
    const studentLetterInput = document.getElementById("studentLetter");

    if (
        !loginForm ||
        !signupForm ||
        !loginMessage ||
        !signupMessage ||
        !isExternalStudent ||
        !schoolFields ||
        !studentClassInput ||
        !studentLetterInput
    ) {
        return;
    }

    toggleSchoolFields();

    const forms = document.querySelectorAll(".needs-validation");
    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add("was-validated");
        });
    });

    isExternalStudent.addEventListener("change", () => {
        toggleSchoolFields();
        signupForm.classList.remove("was-validated");
        hideMessage(signupMessage);
    });

    studentLetterInput.addEventListener("input", () => {
        const normalizedLetter = String(studentLetterInput.value || "")
            .trim()
            .toUpperCase()
            .slice(0, 1);

        studentLetterInput.value = normalizedLetter;
        studentLetterInput.setCustomValidity("");
    });

    studentClassInput.addEventListener("input", () => {
        studentClassInput.setCustomValidity("");
    });

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!loginForm.checkValidity()) {
            showMessage(loginMessage, "Проверьте почту и пароль.", false);
            return;
        }

        const email = String(document.getElementById("loginEmail")?.value || "")
            .trim()
            .toLowerCase();
        const password = String(document.getElementById("loginPass")?.value || "");

        const allUsers = getArrayFromStorage("users");
        const foundUser = allUsers.find(
            (user) => String(user.email || "").toLowerCase() === email
        );

        if (!foundUser) {
            showMessage(loginMessage, "Пользователь с такой почтой не найден.", false);
            return;
        }

        if (String(foundUser.password || "") !== password) {
            showMessage(loginMessage, "Неверный пароль.", false);
            return;
        }

        const currentUser = {
            id: String(foundUser.id),
            email: String(foundUser.email),
            firstName: String(foundUser.firstName || ""),
            lastName: String(foundUser.lastName || ""),
            isExternal: Boolean(foundUser.isExternal),
            studentClass: foundUser.studentClass ?? null,
            studentLetter: foundUser.studentLetter ?? null
        };

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        showMessage(loginMessage, "Вход выполнен. Перенаправляем...", true);

        setTimeout(() => {
            window.location.href = "index.html";
        }, 450);
    });

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!signupForm.checkValidity()) {
            showMessage(signupMessage, "Заполните все обязательные поля корректно.", false);
            return;
        }

        const firstName = String(document.getElementById("firstName")?.value || "").trim();
        const lastName = String(document.getElementById("lastName")?.value || "").trim();
        const email = String(document.getElementById("signupEmail")?.value || "")
            .trim()
            .toLowerCase();
        const password = String(document.getElementById("signupPass")?.value || "");
        const isExternal = isExternalStudent.checked;
        const studentClass = studentClassInput.value.trim();
        const studentLetter = studentLetterInput.value.trim().toUpperCase();

        const allUsers = getArrayFromStorage("users");
        const alreadyExists = allUsers.some(
            (user) => String(user.email || "").toLowerCase() === email
        );

        if (alreadyExists) {
            showMessage(signupMessage, "Почта уже зарегистрирована. Войдите в аккаунт.", false);
            return;
        }

        if (!isExternal) {
            const classNumber = Number(studentClass);

            if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 11) {
                studentClassInput.setCustomValidity("Укажите класс от 1 до 11.");
                signupForm.classList.add("was-validated");
                showMessage(signupMessage, "Класс должен быть числом от 1 до 11.", false);
                return;
            }

            if (!/^[А-ЯЁ]$/.test(studentLetter)) {
                studentLetterInput.setCustomValidity("Укажите одну русскую заглавную букву.");
                signupForm.classList.add("was-validated");
                showMessage(signupMessage, "Буква класса должна быть одной русской заглавной буквой.", false);
                return;
            }
        }

        const newUser = {
            id: createId(),
            firstName,
            lastName,
            email,
            password,
            isExternal,
            studentClass: isExternal ? null : Number(studentClass),
            studentLetter: isExternal ? null : studentLetter,
            createdAt: new Date().toISOString()
        };

        allUsers.push(newUser);
        localStorage.setItem("users", JSON.stringify(allUsers));

        const currentUser = {
            id: String(newUser.id),
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isExternal: newUser.isExternal,
            studentClass: newUser.studentClass,
            studentLetter: newUser.studentLetter
        };

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        showMessage(signupMessage, "Регистрация успешна. Перенаправляем...", true);

        setTimeout(() => {
            window.location.href = "index.html";
        }, 450);
    });

    function toggleSchoolFields() {
        const shouldHideSchoolFields = isExternalStudent.checked;

        schoolFields.classList.toggle("d-none", shouldHideSchoolFields);
        studentClassInput.disabled = shouldHideSchoolFields;
        studentLetterInput.disabled = shouldHideSchoolFields;
        studentClassInput.required = !shouldHideSchoolFields;
        studentLetterInput.required = !shouldHideSchoolFields;

        resetSchoolFieldValidity();

        if (shouldHideSchoolFields) {
            studentClassInput.value = "";
            studentLetterInput.value = "";
        }
    }

    function resetSchoolFieldValidity() {
        studentClassInput.setCustomValidity("");
        studentLetterInput.setCustomValidity("");
    }

    function showMessage(el, text, isSuccess) {
        el.textContent = text;
        el.classList.remove("d-none", "auth-form-msg--error", "auth-form-msg--success");
        el.classList.add(isSuccess ? "auth-form-msg--success" : "auth-form-msg--error");
    }

    function hideMessage(el) {
        el.textContent = "";
        el.classList.add("d-none");
        el.classList.remove("auth-form-msg--error", "auth-form-msg--success");
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

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
});



