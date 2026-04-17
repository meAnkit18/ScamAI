/**
 * App Entry Point — Initialize router and start the SPA
 */
document.addEventListener('DOMContentLoaded', () => {
    const router = new Router();

    router
        .on('/', () => pages.dashboard())
        .on('/register', () => pages.register())
        .on('/attendance', () => pages.attendance())
        .on('/people', () => pages.people())
        .on('/phishing', () => pages.phishing());

    router.start();
});
