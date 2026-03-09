document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginMessage = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");

    if (!loginForm || !signupForm || !loginMessage || !signupMessage) {
        return;
    }

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
            lastName: String(foundUser.lastName || "")
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

        const allUsers = getArrayFromStorage("users");
        const alreadyExists = allUsers.some(
            (user) => String(user.email || "").toLowerCase() === email
        );

        if (alreadyExists) {
            showMessage(signupMessage, "Почта уже зарегистрирована. Войдите в аккаунт.", false);
            return;
        }

        const newUser = {
            id: createId(),
            firstName,
            lastName,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        allUsers.push(newUser);
        localStorage.setItem("users", JSON.stringify(allUsers));

        const currentUser = {
            id: String(newUser.id),
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName
        };

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        showMessage(signupMessage, "Регистрация успешна. Перенаправляем...", true);

        setTimeout(() => {
            window.location.href = "index.html";
        }, 450);
    });

    function showMessage(el, text, isSuccess) {
        el.textContent = text;
        el.classList.remove("d-none", "auth-form-msg--error", "auth-form-msg--success");
        el.classList.add(isSuccess ? "auth-form-msg--success" : "auth-form-msg--error");
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



