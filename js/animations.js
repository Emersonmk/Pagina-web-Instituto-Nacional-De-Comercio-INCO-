(() => {
  const themeStorageKey = "inco-theme";
  let currentTheme = "light";

  try {
    currentTheme = localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("No se pudo leer la preferencia de tema guardada.", error);
  }

  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.className = "theme-toggle";

  const updateTheme = (theme) => {
    currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "☀ Modo claro" : "☾ Modo oscuro";
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  };

  updateTheme(currentTheme);

  const navbar = document.querySelector(".navbar");
  const portalLink = navbar?.querySelector(".btn-portal");

  if (navbar && portalLink) {
    navbar.insertBefore(themeToggle, portalLink);
    themeToggle.addEventListener("click", () => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      updateTheme(nextTheme);

      try {
        localStorage.setItem(themeStorageKey, nextTheme);
      } catch (error) {
        console.error("No se pudo guardar la preferencia de tema.", error);
      }
    });
  }

  if (!("IntersectionObserver" in window)) {
    return;
  }

  const revealSelector = [
    "main h1",
    "main h2",
    "main h3",
    "main p",
    "main .hero-texto",
    "main .card",
    "main .career-coming",
    "main .contact-option",
    "main .faq-item",
    "main .galeria figure",
    "main .galeria figcaption",
    "main .hero-logo",
    "main .form",
    "main .table-wrap",
    "main .map-card"
  ].join(", ");
  const elements = document.querySelectorAll(revealSelector);

  if (elements.length === 0) {
    return;
  }

  document.documentElement.classList.add("js-motion");

  elements.forEach((element) => {
    const siblings = Array.from(element.parentElement.children)
      .filter((sibling) => sibling.matches(revealSelector));
    const delay = Math.min(siblings.indexOf(element), 5) * 90;

    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  }, {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.08
  });

  elements.forEach((element) => observer.observe(element));
})();
