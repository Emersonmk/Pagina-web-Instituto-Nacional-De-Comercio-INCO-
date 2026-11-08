(() => {
  const accountsKey = "inco-demo-accounts";
  const sessionKey = "inco-demo-session";
  const protectedPages = new Set([
    "index.html",
    "cursos.html",
    "admision.html",
    "calendario.html",
    "contacto.html"
  ]);
  const loginForm = document.querySelector("#login-form");
  const registerForm = document.querySelector("#register-form");
  const isLoginPage = Boolean(loginForm && registerForm);

  const showMessage = (message, isError = false) => {
    const status = document.querySelector("#auth-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  const getNextPage = () => {
    const requestedPage = new URLSearchParams(window.location.search).get("next");
    return protectedPages.has(requestedPage) ? requestedPage : "index.html";
  };

  const getSessionEmail = () => {
    try {
      return sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey);
    } catch (error) {
      console.error("No se pudo leer la sesión del portal.", error);
      return null;
    }
  };

  const saveSession = (email, remember) => {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(sessionKey);
    (remember ? localStorage : sessionStorage).setItem(sessionKey, email);
  };

  const clearSession = () => {
    sessionStorage.removeItem(sessionKey);
    localStorage.removeItem(sessionKey);
  };

  const loadAccounts = () => {
    const storedAccounts = localStorage.getItem(accountsKey);
    if (!storedAccounts) return [];
    const accounts = JSON.parse(storedAccounts);
    if (!Array.isArray(accounts)) {
      throw new Error("Los datos guardados de registro no tienen un formato válido.");
    }
    return accounts;
  };

  const passwordHash = async (password, salt) => {
    if (!window.crypto?.subtle) {
      throw new Error("El registro de demostración requiere abrir el sitio con HTTPS o localhost.");
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256"
    }, key, 256);
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const createSalt = () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(salt, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

  const decodeSalt = (salt) => new Uint8Array(salt.match(/.{2}/g).map((part) => parseInt(part, 16)));

  const enterPortal = (email, remember) => {
    saveSession(email, remember);
    window.location.replace(getNextPage());
  };

  const sessionEmail = getSessionEmail();
  if (!isLoginPage) {
    if (!sessionEmail) {
      const currentPage = window.location.pathname.split("/").pop();
      const next = protectedPages.has(currentPage) ? currentPage : "index.html";
      window.location.replace(`login.html?next=${encodeURIComponent(next)}`);
      return;
    }

    const portalButton = document.querySelector(".navbar .btn-portal");
    if (portalButton) {
      const logoutButton = document.createElement("button");
      logoutButton.type = "button";
      logoutButton.className = portalButton.className;
      logoutButton.textContent = "Cerrar sesión";
      logoutButton.addEventListener("click", () => {
        try {
          clearSession();
          window.location.replace("login.html");
        } catch (error) {
          console.error("No se pudo cerrar la sesión.", error);
          window.alert("No se pudo cerrar la sesión. Inténtalo de nuevo.");
        }
      });
      portalButton.replaceWith(logoutButton);
    }
    return;
  }

  if (sessionEmail) {
    window.location.replace(getNextPage());
    return;
  }

  const loginPassword = loginForm.elements.clave;
  const registerPassword = registerForm.elements.clave;
  const confirmationPassword = registerForm.elements.confirmar;

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.setAttribute("aria-label", showPassword ? "Ocultar contraseña" : "Mostrar contraseña");
      button.setAttribute("aria-pressed", String(showPassword));
    });
  });

  document.querySelectorAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const showRegister = button.dataset.authView === "register";
      loginForm.hidden = showRegister;
      registerForm.hidden = !showRegister;
      showMessage("");
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");
    const email = loginForm.elements.correo.value.trim().toLowerCase();
    try {
      const account = loadAccounts().find((item) => item.email === email);
      if (!account) {
        showMessage("No encontramos esa cuenta. Revisa el correo o regístrate.", true);
        return;
      }
      const hash = await passwordHash(loginPassword.value, decodeSalt(account.salt));
      if (hash !== account.passwordHash) {
        showMessage("La contraseña no es correcta.", true);
        return;
      }
      enterPortal(email, loginForm.elements.recordar.checked);
    } catch (error) {
      console.error("No se pudo iniciar sesión.", error);
      showMessage(error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.", true);
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");
    const email = registerForm.elements.correo.value.trim().toLowerCase();
    if (registerPassword.value !== confirmationPassword.value) {
      showMessage("Las contraseñas no coinciden.", true);
      return;
    }
    try {
      const accounts = loadAccounts();
      if (accounts.some((item) => item.email === email)) {
        showMessage("Ya existe una cuenta con ese correo. Inicia sesión.", true);
        return;
      }
      const salt = createSalt();
      const account = {
        email,
        salt,
        passwordHash: await passwordHash(registerPassword.value, decodeSalt(salt))
      };
      accounts.push(account);
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
      enterPortal(email, false);
    } catch (error) {
      console.error("No se pudo completar el registro.", error);
      showMessage(error.message || "No se pudo completar el registro. Inténtalo de nuevo.", true);
    }
  });
})();
