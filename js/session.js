document.addEventListener("DOMContentLoaded", () => {
    const currentUser = getObjectFromStorage("currentUser");
    const isLoggedIn = Boolean(currentUser && currentUser.id);

    const loginButtons = document.querySelectorAll(".login-button");
    loginButtons.forEach((button) => {
        if (!isLoggedIn) {
            button.textContent = "Войти";
            button.setAttribute("href", "login.html");
            return;
        }

        const displayName = getDisplayName(currentUser);
        button.textContent = displayName;
        button.setAttribute("href", "profile.html");
        button.classList.add("login-button--profile");
        button.setAttribute("title", `Профиль: ${displayName}`);
    });

    const logoutButtons = document.querySelectorAll("[data-auth-logout]");
    if (!logoutButtons.length) {
        return;
    }

    logoutButtons.forEach((button) => {
        if (isLoggedIn) {
            button.classList.add("is-visible");
        }

        button.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "login.html";
        });
    });

    function getDisplayName(user) {
        const firstName = String(user.firstName || "").trim();
        const lastName = String(user.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim();

        if (fullName) {
            return fullName;
        }

        const email = String(user.email || "").trim();
        return email || "Профиль";
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
});
