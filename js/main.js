// /js/main.js

// ================================
// Contact Form Behavior
// ================================
//
// Intercepts the default form submission, sends the data
// asynchronously to Formspree, and updates the UI to keep
// the user informed throughout the submission process.
//

const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const status = document.getElementById('form-status');

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    status.textContent = '';
    status.className = 'form-status';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        contactForm.reset();

        status.textContent =
          '✓ Thank you for getting in touch. Your message has been sent successfully.';
        status.classList.add('success');
        status.focus();
      } else {
        status.textContent =
          'Sorry, your message could not be sent. Please try again later, or contact me via LinkedIn or WeChat below.';
        status.classList.add('error');
        status.focus();
      }
    } catch (error) {
      status.textContent =
        'Network error. Please try again later, or contact me via LinkedIn or WeChat below.';
      status.classList.add('error');
      status.focus();
    }

    submitButton.disabled = false;
    submitButton.textContent = 'Send Message';
  });
}

// Attach the event listener when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the theme toggle
  setupThemeToggle();
});

/**
 * Handles Light/Dark Theme Toggle Logic
 */
const setupThemeToggle = () => {
  const toggleButton = document.getElementById('theme-toggle');
  const body = document.body;

  // Check local storage for previous preference
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    toggleButton.querySelector('.icon').textContent = '🌞';
  }

  toggleButton.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      toggleButton.querySelector('.icon').textContent = '🌞';
    } else {
      localStorage.setItem('theme', 'light');
      toggleButton.querySelector('.icon').textContent = '🌙';
    }
  });
};

/** scroll spy */

const navLinks = document.querySelectorAll('.header__menu a');

const sectionMap = {};
navLinks.forEach((link) => {
  const id = link.getAttribute('href').replace('#', '');
  sectionMap[id] = link;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (sectionMap[id]) {
          navLinks.forEach((link) => link.classList.remove('active'));
          sectionMap[id].classList.add('active');
        }
      }
    });
  },
  {
    root: null,
    threshold: 0.3,
  },
);

// Observe all mapped sections
Object.keys(sectionMap).forEach((id) => {
  const section = document.getElementById(id);
  if (section) observer.observe(section);
});

// ================================
// PWA: Service Worker Registration
// ================================
//
// Registers the service worker (if supported by browser)
// to enable offline access, caching, and installation prompt.
//

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // 💡 Pro-tip: Use absolute path '/' instead of './'
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', reg.scope);

      // 1️⃣ If there's already a waiting SW (page loaded after update)
      if (reg.waiting) {
        promptUserToRefresh(reg);
      }

      // 2️⃣ Listen for new SW installs
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // A new version is available
            promptUserToRefresh(reg);
          }
        });
      });
    } catch (err) {
      console.warn('⚠️ Service Worker registration failed:', err);
    }
  });
}

// ==========================================================
// --- Helper: Prompt user to refresh when new SW is ready ---
// ==========================================================
const promptUserToRefresh = (registration) => {
  const shouldRefresh = confirm(
    '🚀 A new version of this website is available.\nRefresh now to see the latest updates?',
  );

  if (shouldRefresh && registration.waiting) {
    // 💡 Pro-tip: Add the listener BEFORE posting the message
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload once the new SW takes control
      window.location.reload();
    });

    // Tell the waiting service worker to activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};
