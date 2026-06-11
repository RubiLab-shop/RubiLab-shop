// RubiLab — admin-guard.js | Zabezpieczenie panelu administracyjnego

document.addEventListener('DOMContentLoaded', () => {
    // Sprawdzamy co się dzieje z obiektem auth z auth.js
    // Ponieważ admin-guard.js będzie wczytywany PO auth.js, mamy dostęp do globalnego auth
    
    if (typeof auth === 'undefined') {
        console.error("Brak obiektu auth! Upewnij się, że auth.js ładuje się przed admin-guard.js");
        window.location.href = 'index.html';
        return;
    }

    // Dodaj loader przyciemniający stronę, dopóki nie sprawdzimy uprawnień
    const shield = document.createElement('div');
    shield.style.position = 'fixed';
    shield.style.top = '0';
    shield.style.left = '0';
    shield.style.width = '100vw';
    shield.style.height = '100vh';
    shield.style.backgroundColor = 'var(--bg-dark)';
    shield.style.zIndex = '9999';
    shield.style.display = 'flex';
    shield.style.flexDirection = 'column';
    shield.style.alignItems = 'center';
    shield.style.justifyContent = 'center';
    shield.style.color = 'white';
    shield.innerHTML = `
        <span class="loader-spinner" style="width: 40px; height: 40px; border-width: 4px; border-top-color: var(--primary);"></span>
        <h3 style="margin-top: 20px;">Weryfikacja uprawnień...</h3>
    `;
    document.body.appendChild(shield);

    // Czekamy na ustalenie stanu logowania
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (!user) {
            // Niezalogowany
            window.location.href = 'login.html';
        } else if (user.email !== 'rubilab3dd@gmail.com') {
            // Zalogowany, ale to nie admin
            alert("Odmowa dostępu. Ta strona jest zarezerwowana wyłącznie dla Administratora.");
            window.location.href = 'index.html';
        } else {
            // To nasz admin! Zdejmujemy blokadę.
            shield.style.opacity = '0';
            setTimeout(() => shield.remove(), 300);
        }
    });
});
