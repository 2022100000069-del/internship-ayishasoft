
/* Ayisha Soft - JavaScript Features */


/* ==========================================
   WEEK 10: Mobile Navigation and Active Links
========================================== */

const menuButton = document.querySelector('#menu-toggle');
const mainNav = document.querySelector('#main-nav');

function closeMenu() {

    if (!menuButton || !mainNav) {
        return;
    }

    mainNav.classList.remove('is-open');

    menuButton.setAttribute('aria-expanded', 'false');

}

menuButton?.addEventListener('click', () => {

    if (!mainNav) {
        return;
    }

    const isOpen = mainNav.classList.toggle('is-open');

    menuButton.setAttribute('aria-expanded', String(isOpen));

});

mainNav?.querySelectorAll('a').forEach(link => {

    link.addEventListener('click', closeMenu);

});

document.addEventListener('click', event => {

    if (
        mainNav &&
        menuButton &&
        !mainNav.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        closeMenu();
    }

});

document.addEventListener('keydown', event => {

    if (event.key === 'Escape') {
        closeMenu();
    }

});


/* ==========================================
   WEEK 10: Back to Top Button
========================================== */

const backToTop = document.querySelector('#back-to-top');

function updateBackToTop() {

    backToTop?.classList.toggle(
        'is-visible',
        window.scrollY > 220
    );

}

window.addEventListener(
    'scroll',
    updateBackToTop,
    { passive: true }
);

updateBackToTop();

backToTop?.addEventListener('click', () => {

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

});


/* ==========================================
   WEEK 11: Dark and Light Mode
========================================== */

const themeButton = document.querySelector('#theme-toggle');

const storedTheme = localStorage.getItem('ayisha-theme');

if (storedTheme === 'dark' || storedTheme === 'light') {

    document.documentElement.dataset.theme = storedTheme;

}

function syncThemeButton() {

    if (!themeButton) {
        return;
    }

    const isDark =
        document.documentElement.dataset.theme === 'dark';

    themeButton.textContent = isDark ? '☀' : '☾';

    themeButton.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );

}

syncThemeButton();

themeButton?.addEventListener('click', () => {

    const next =
        document.documentElement.dataset.theme === 'dark'
            ? 'light'
            : 'dark';

    document.documentElement.dataset.theme = next;

    localStorage.setItem('ayisha-theme', next);

    syncThemeButton();

});


/* ==========================================
   WEEK 11: Contact Form Validation
========================================== */

// Validates in the browser, then sends the message
// to the Node.js server (POST /api/contact).

const form = document.querySelector('#contact-form');

if (form) {

    const fields = {

        name: form.elements.namedItem('name'),

        email: form.elements.namedItem('email'),

        message: form.elements.namedItem('message')

    };

    function validate(name) {

        const input = fields[name];

        if (!input) {
            return false;
        }

        const value = input.value.trim();

        let error = '';

        if (!value) {

            error = 'This field is required.';

        } else if (
            name === 'name' &&
            value.length < 2
        ) {

            error = 'Please enter at least 2 characters.';

        } else if (
            name === 'email' &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {

            error = 'Please enter a valid email address.';

        } else if (
            name === 'message' &&
            value.length < 10
        ) {

            error = 'Please enter at least 10 characters.';

        }

        const errorElement = document.getElementById(
            `${name}-error`
        );

        if (errorElement) {

            errorElement.textContent = error;

        }

        input.setAttribute(
            'aria-invalid',
            String(Boolean(error))
        );

        return !error;

    }

    Object.keys(fields).forEach(name => {

        const input = fields[name];

        if (!input) {
            return;
        }

        input.addEventListener('blur', () => {

            validate(name);

        });

        input.addEventListener('input', () => {

            if (
                input.getAttribute('aria-invalid') === 'true'
            ) {

                validate(name);

            }

            const feedback =
                document.querySelector('#feedback');

            if (feedback) {
                feedback.textContent = '';
            }

        });

    });

    form.addEventListener('submit', async event => {

        event.preventDefault();

        const results = Object.keys(fields).map(name => {

            return validate(name);

        });

        const feedback = document.querySelector('#feedback');

        if (!feedback) {
            return;
        }

        feedback.classList.remove('success');

        if (results.some(valid => !valid)) {

            feedback.textContent =
                'Please correct the highlighted fields.';

            Object.values(fields).find(input => {

                return input?.getAttribute('aria-invalid') === 'true';

            })?.focus();

            return;

        }

        // Send the message to the Node.js server
        const submitButton = form.querySelector('[type="submit"]');

        submitButton?.setAttribute('disabled', '');

        feedback.textContent = 'Sending...';

        try {

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fields.name.value,
                    email: fields.email.value,
                    message: fields.message.value,
                    website: form.elements.namedItem('website')?.value || ''
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {

                // Show any field errors returned by the server
                Object.entries(result.errors || {}).forEach(([name, error]) => {

                    const errorElement = document.getElementById(`${name}-error`);

                    if (errorElement) {
                        errorElement.textContent = error;
                    }

                    fields[name]?.setAttribute('aria-invalid', 'true');

                });

                feedback.textContent =
                    result.message || 'Sorry, your message could not be sent.';

                return;

            }

            feedback.textContent =
                result.message || 'Thank you! Your message has been sent.';

            feedback.classList.add('success');

            form.reset();

            Object.values(fields).forEach(input => {

                input?.removeAttribute('aria-invalid');

            });

        } catch (error) {

            feedback.textContent =
                'Network error. Please check your connection and try again.';

        } finally {

            submitButton?.removeAttribute('disabled');

        }

    });

}


/* ==========================================
   WEEK 12: Portfolio Project Filtering
========================================== */

const filterButtons =
    document.querySelectorAll('[data-filter]');

const projectCards =
    document.querySelectorAll('.project-card');

const emptyProjects =
    document.querySelector('#project-empty');

filterButtons.forEach(button => {

    button.addEventListener('click', () => {

        const filter = button.dataset.filter;

        let count = 0;

        filterButtons.forEach(item => {

            const selected = item === button;

            item.classList.toggle(
                'is-active',
                selected
            );

            item.setAttribute(
                'aria-pressed',
                String(selected)
            );

        });

        projectCards.forEach(card => {

            const visible =
                filter === 'all' ||
                card.dataset.category === filter;

            card.hidden = !visible;

            if (visible) {
                count++;
            }

        });

        if (emptyProjects) {

            emptyProjects.hidden = count !== 0;

        }

    });

});


/* ==========================================
   WEEK 12: Portfolio Image Fallback
========================================== */

document.querySelectorAll('img[data-fallback]').forEach(img => {

    img.addEventListener('error', () => {

        const fallback = img.dataset.fallback;

        if (
            fallback &&
            !img.src.endsWith(fallback)
        ) {

            img.src = fallback;

        }

    });

});


/* ==========================================
   WEEK 12: Portfolio Image Preview
========================================== */

const dialog =
    document.querySelector('#preview-dialog');

const previewImage =
    document.querySelector('#preview-image');

const previewTitle =
    document.querySelector('#preview-title');

document.querySelectorAll('[data-preview]').forEach(button => {

    button.addEventListener('click', () => {

        if (
            !dialog ||
            !previewImage ||
            !previewTitle
        ) {
            return;
        }

        const cardImage = button
            .closest('.project-card')
            ?.querySelector('img');

        previewImage.src =
            cardImage?.currentSrc ||
            button.dataset.preview;

        previewImage.alt =
            `${button.dataset.caption} project preview`;

        previewTitle.textContent =
            button.dataset.caption;

        dialog.showModal();

    });

});

document
    .querySelector('#close-preview')
    ?.addEventListener('click', () => {

        dialog?.close();

    });

dialog?.addEventListener('click', event => {

    if (event.target === dialog) {

        dialog.close();

    }

});


/* ==========================================
   WEEK 12: Scroll Animation
========================================== */

if (
    'IntersectionObserver' in window &&
    !window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches
) {

    const sections =
        document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add(
                    'is-revealed'
                );

                observer.unobserve(entry.target);

            }

        });

    }, {
        threshold: 0.08
    });

    sections.forEach(section => {

        observer.observe(section);

    });

    document.documentElement.classList.add(
        'js-reveal'
    );

}
