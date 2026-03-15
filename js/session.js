document.addEventListener("DOMContentLoaded", () => {
    const auth = window.SchoolAuth;
    if (!auth) {
        return;
    }

    auth.ensureTestUsers();

    const currentUser = auth.getCurrentUser();
    const isLoggedIn = Boolean(currentUser && currentUser.id);
    const profileHomeHref = isLoggedIn ? auth.getHomePageForUser(currentUser) : "profile.html";

    const profileLinks = document.querySelectorAll('a[href="profile.html"]');
    profileLinks.forEach((link) => {
        link.setAttribute("href", profileHomeHref);
    });

    const proposalLinks = document.querySelectorAll("[data-proposal-link]");
    proposalLinks.forEach((link) => {
        link.setAttribute("href", auth.PROPOSAL_FORM_URL);
    });

    const loginButtons = document.querySelectorAll(".login-button");
    loginButtons.forEach((button) => {
        if (!isLoggedIn) {
            button.textContent = "Войти";
            button.setAttribute("href", "login.html");
            return;
        }

        const displayName = getDisplayName(currentUser);
        button.textContent = displayName;
        button.setAttribute("href", profileHomeHref);
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
            auth.setCurrentUser(null);
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
});
