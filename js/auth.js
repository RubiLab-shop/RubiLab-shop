// RubiLab — auth.js | Auth 2.0 Controller (Compat SDK)

// ---------------------------------------------------------------------------
// 1. KONFIGURACJA FIREBASE
// ---------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyD-IIBkekrJG_u6BD3iOATL-Vq8DBVP2bw",
    authDomain: "rubilab-e9195.firebaseapp.com",
    projectId: "rubilab-e9195",
    storageBucket: "rubilab-e9195.firebasestorage.app",
    messagingSenderId: "415922981126",
    appId: "1:415922981126:web:3e6669945736a8d99a3687"
};

// Inicjalizacja Firebase (Kompatybilność z file://)
let app, auth, db;
let isMockMode = false;

try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    window.db = db; // Udostępniamy globalnie dla innych skryptów
} catch (error) {
    console.error("Firebase Init Error:", error);
    isMockMode = true; // Fallback na mock mode jeśli całkowicie brak internetu
}

document.addEventListener('DOMContentLoaded', () => {

    // Sprawdzenie czy nie jesteśmy w trybie deweloperskim bez klucza
    if (!auth || !auth.app.options.apiKey || auth.app.options.apiKey === "TWÓJ_API_KEY") {
        isMockMode = true;
    }

    // -----------------------------------------------------------------------
    // 2. DOM ELEMENTS (Nagłówek i Dropdown)
    // -----------------------------------------------------------------------
    let dropdownActive = false;

    // Funkcja aktualizująca UI Nagłówka (Avatar / Zaloguj)
    const updateHeaderUI = (user) => {
        // Usuń stary dropdown jeśli istnieje
        const existingDropdown = document.getElementById('user-dropdown-menu');
        if (existingDropdown) existingDropdown.remove();

        // Znajdź obecny element przycisku użytkownika
        const currentAuthElement = document.querySelector('.user-profile-wrapper') ||
            document.getElementById('login-trigger-btn') ||
            document.querySelector('.user-session-btn');

        if (user) {
            // ZALOGOWANY
            const name = user.displayName || user.email.split('@')[0];
            const initials = name.substring(0, 2).toUpperCase();

            if (currentAuthElement) {
                currentAuthElement.outerHTML = `
                    <div class="user-profile-wrapper" style="position: relative;">
                        <button class="user-session-btn" id="user-profile-trigger" style="cursor: pointer; background: rgba(255, 0, 85, 0.15); border: 1px solid var(--primary);">
                            <div class="user-avatar-mini" style="background: var(--primary);">${initials}</div>
                            <span style="color: white; font-weight: 600;">${name}</span>
                            <span style="font-size: 0.7rem; margin-left: 4px; color: var(--primary);">▼</span>
                        </button>
                        
                        <!-- Dropdown -->
                        <div class="glass-panel" id="user-dropdown-menu" style="
                            position: absolute; top: 55px; right: 0; min-width: 200px;
                            display: none; flex-direction: column; gap: 12px; padding: 20px;
                            z-index: 102; border-top: 3px solid var(--primary);
                        ">
                            ${user.email === 'rubilab3dd@gmail.com' ? '<a href="admin.html" class="dropdown-item" style="color: var(--primary);">🛡️ Panel Admina</a>' : ''}
                            <div style="font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px; margin-bottom: 4px; word-break: break-all;">
                                ${user.email}
                            </div>
                            <a href="#" class="dropdown-item" style="color: var(--text-main); text-decoration: none; font-size: 0.95rem; transition: var(--transition);">📦 Twoje Zamówienia</a>
                            <a href="#" class="dropdown-item" style="color: var(--text-main); text-decoration: none; font-size: 0.95rem; transition: var(--transition);">⚙️ Ustawienia konta</a>
                            <button id="logout-btn" class="btn btn-outline btn-sm btn-block" style="margin-top: 10px; border-color: rgba(255,255,255,0.2);">Wyloguj się</button>
                        </div>
                    </div>
                `;
            }

            // Zdarzenia dla dropdowna
            const trigger = document.getElementById('user-profile-trigger');
            const dropdown = document.getElementById('user-dropdown-menu');
            if (trigger && dropdown) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownActive = !dropdownActive;
                    dropdown.style.display = dropdownActive ? 'flex' : 'none';
                });

                document.addEventListener('click', () => {
                    if (dropdownActive) {
                        dropdownActive = false;
                        dropdown.style.display = 'none';
                    }
                });

                document.getElementById('logout-btn').addEventListener('click', handleLogout);
            }

        } else {
            // WYLOGOWANY
            if (currentAuthElement) {
                currentAuthElement.outerHTML = `
                    <a href="login.html" class="user-session-btn" id="login-trigger-btn">
                        <div class="user-avatar-mini">R</div>
                        <span>Zaloguj</span>
                    </a>
                `;
            }

            // Jeśli jesteśmy na stronie logowania, nie musimy blokować przekierowania
        }
    };

    // -----------------------------------------------------------------------
    // 3. LISTENERY STANU (Observer)
    // -----------------------------------------------------------------------
    if (isMockMode) {
        console.warn("RubiLab Auth 2.0: Running in MOCK MODE (Firebase Offline / Missing Config)");
        const mockUser = JSON.parse(localStorage.getItem('rubilab_mock_user'));
        updateHeaderUI(mockUser);
    } else {
        auth.onAuthStateChanged((user) => {
            updateHeaderUI(user);
        });
    }


    // -----------------------------------------------------------------------
    // 4. STRONA LOGOWANIA (login.html) SPECYFICZNY KOD
    // -----------------------------------------------------------------------

    // Upewniamy się, czy to plik login.html (aby nie szukać nieistniejących formularzy)
    const isLoginPage = window.location.pathname.includes('login.html');
    if (!isLoginPage) return; // Zakończ działanie tutaj, jeśli to index.html lub products.html

    const authTabs = document.querySelectorAll('.auth-tab');
    const loginPanel = document.getElementById('login-panel');
    const registerPanel = document.getElementById('register-panel');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleBtn = document.getElementById('google-login-btn');
    const authErrorMsg = document.getElementById('auth-error-msg');

    // UI: Przełączanie logowanie/rejestracja
    authTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            authTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clearError();

            if (btn.dataset.tab === 'login') {
                loginPanel.classList.remove('hidden');
                registerPanel.classList.add('hidden');
            } else {
                loginPanel.classList.add('hidden');
                registerPanel.classList.remove('hidden');
            }
        });
    });

    const showError = (msg) => {
        if (authErrorMsg) {
            authErrorMsg.textContent = msg;
            authErrorMsg.classList.add('visible');
        }
    };

    const clearError = () => {
        if (authErrorMsg) {
            authErrorMsg.textContent = '';
            authErrorMsg.classList.remove('visible');
        }
    };

    const setBtnLoading = (form, isLoading) => {
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.dataset.original = btn.innerHTML;
            btn.innerHTML = '<span class="loader-spinner"></span> Przetwarzanie...';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.original;
        }
    };

    // Translator kodów błędów Firebase na ładny język polski
    const translateError = (error) => {
        switch (error.code) {
            case 'auth/invalid-email': return 'Niepoprawny adres e-mail.';
            case 'auth/user-disabled': return 'To konto zostało zablokowane.';
            case 'auth/user-not-found': return 'Nie znaleziono konta z tym adresem e-mail.';
            case 'auth/wrong-password': return 'Niepoprawne hasło.';
            case 'auth/invalid-credential': return 'Nieprawidłowe dane logowania. Upewnij się, że e-mail i hasło są poprawne.';
            case 'auth/email-already-in-use': return 'Ten adres e-mail jest już zajęty przez inne konto.';
            case 'auth/weak-password': return 'Hasło jest zbyt słabe. Użyj minimum 6 znaków.';
            case 'auth/network-request-failed': return 'Błąd sieci. Sprawdź swoje połączenie z internetem.';
            case 'auth/operation-not-allowed': return 'Ta metoda logowania jest wyłączona. Upewnij się, że włączyłeś Email/Hasło w konsoli Firebase.';
            default: return `Wystąpił błąd: ${error.message}`;
        }
    };

    // Akcje autoryzacyjne
    const handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        clearError();

        if (isMockMode) {
            simulateAuthFlow({ email }, "Zalogowano pomyślnie w Trybie Demo!");
            return;
        }

        setBtnLoading(loginForm, true);
        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.showToast("Zalogowano pomyślnie!", "success");
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (err) {
            console.error("Login err:", err);
            showError(translateError(err));
        } finally {
            setBtnLoading(loginForm, false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm').value;

        clearError();

        if (password !== confirmPassword) {
            showError("Hasła nie są identyczne!");
            return;
        }

        if (isMockMode) {
            simulateAuthFlow({ email, displayName: username }, "Konto utworzono (Tryb Demo)!");
            return;
        }

        setBtnLoading(registerForm, true);
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: username });
            window.showToast("Konto utworzone pomyślnie!", "success");
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (err) {
            console.error("Register err:", err);
            showError(translateError(err));
        } finally {
            setBtnLoading(registerForm, false);
        }
    };

    const handleGoogleLogin = async () => {
        clearError();
        if (isMockMode) {
            simulateAuthFlow({ email: "google@demo.com", displayName: "Google User" }, "Zalogowano via Google (Demo)!");
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
            window.showToast("Zalogowano za pomocą Google!", "success");
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (err) {
            console.error("Google auth err:", err);
            if (err.code !== 'auth/popup-closed-by-user') {
                showError(translateError(err));
            }
        }
    };

    // Symulacja (Fallback)
    const simulateAuthFlow = (props, msg) => {
        const mockUser = {
            email: props.email,
            displayName: props.displayName || props.email.split('@')[0],
            uid: "mock-" + Math.floor(Math.random() * 10000)
        };
        localStorage.setItem('rubilab_mock_user', JSON.stringify(mockUser));
        window.showToast(msg, "success");
        updateHeaderUI(mockUser);
        setTimeout(() => window.location.href = 'index.html', 1000);
    };

    // Bindowanie eventów w login.html
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (googleBtn) googleBtn.addEventListener('click', handleGoogleLogin);

    // Drobny efekt wizualny w inputach formularza (Animowane etykiety)
    const inputs = document.querySelectorAll('.auth-input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.parentElement.classList.remove('focused');
            }
        });
    });

    // Wylogowanie obsługiwane dla obu podstron
    async function handleLogout() {
        if (isMockMode) {
            localStorage.removeItem('rubilab_mock_user');
            updateHeaderUI(null);
            window.showToast("Wylogowano.", "info");
        } else {
            try {
                await auth.signOut();
                window.showToast("Wylogowano.", "info");
            } catch (error) {
                console.error(error);
                window.showToast("Błąd podczas wylogowywania.", "error");
            }
        }
    }
});
