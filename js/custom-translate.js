/**
 * Gestionnaire de traduction multilingue (Français / Anglais)
 * Avec deux boutons distincts : FR et EN
 * Portfolio SEYE Ndeye Seynabou
 */

let currentLang = localStorage.getItem("lang") || "fr";
let translateInitialized = false;
let translateInterval = null;

// Initialisation officielle du composant Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: "fr",
            includedLanguages: "en,fr",
            autoDisplay: false
        },
        "google_translate_element"
    );

    waitForGoogleTranslate();
}

// Mise à jour de l'état visuel actif des deux boutons séparés
function updateLangButtons() {
    const btnFr = document.getElementById("btnLangFr");
    const btnEn = document.getElementById("btnLangEn");

    const isFr = currentLang === "fr";
    const isEn = currentLang === "en";

    if (btnFr) {
        btnFr.classList.toggle("active", isFr);
        btnFr.setAttribute("aria-pressed", isFr ? "true" : "false");
    }

    if (btnEn) {
        btnEn.classList.toggle("active", isEn);
        btnEn.setAttribute("aria-pressed", isEn ? "true" : "false");
    }

    // Synchronisation de l'attribut lang du document HTML
    if (document.documentElement) {
        document.documentElement.lang = currentLang;
    }
}

// Nettoyage complet des cookies Google Translate
function clearGoogleTranslateCookie() {
    const hostname = window.location.hostname;
    const domainList = ["", hostname, "." + hostname];
    const pathList = ["/", window.location.pathname];

    domainList.forEach((domain) => {
        pathList.forEach((path) => {
            const domainStr = domain ? `; domain=${domain}` : "";
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domainStr}`;
        });
    });

    try {
        localStorage.removeItem("googtrans");
    } catch (e) {}
}

// Tente de déclencher le bouton natif de restauration Google Translate si disponible
function tryRestoreGoogleBanner() {
    try {
        const banner = document.querySelector(".goog-te-banner-frame");
        if (banner) {
            const innerDoc = banner.contentDocument || banner.contentWindow?.document;
            if (innerDoc) {
                const restoreBtn =
                    innerDoc.getElementById(":1.restore") ||
                    innerDoc.querySelector("button[id*='restore']") ||
                    innerDoc.querySelector(".goog-te-banner-restore-button");
                if (restoreBtn) {
                    restoreBtn.click();
                    return true;
                }
            }
        }
    } catch (e) {
        // En cas de restriction d'accès iframe inter-domaines
    }
    return false;
}

// Attendre que Google Translate ait injecté son sélecteur dans le DOM
function waitForGoogleTranslate() {
    if (translateInterval) {
        clearInterval(translateInterval);
    }

    let attempts = 0;

    translateInterval = setInterval(() => {
        const select = document.querySelector(".goog-te-combo");

        if (select) {
            clearInterval(translateInterval);
            translateInterval = null;
            translateInitialized = true;

            // Appliquer la langue mémorisée si c'est l'anglais
            if (currentLang === "en") {
                applyLanguage("en");
            }
            return;
        }

        attempts++;

        if (attempts >= 40) {
            clearInterval(translateInterval);
            translateInterval = null;
            console.warn(
                "Google Translate n'a pas pu être chargé (vérifier la connexion internet)."
            );
        }
    }, 250);
}

// Appliquer une langue au sélecteur Google Translate
function applyLanguage(langCode) {
    const select = document.querySelector(".goog-te-combo");

    if (!select) {
        console.warn("Le sélecteur Google Translate est introuvable.");
        return false;
    }

    if (langCode === "fr") {
        // Retour au français (langue originale du site)
        const hasFr = Array.from(select.options).some((opt) => opt.value === "fr");
        if (hasFr) {
            select.value = "fr";
        } else {
            // Google Translate utilise le premier choix par défaut/vide pour restaurer l'original
            select.selectedIndex = 0;
            select.value = "";
        }

        clearGoogleTranslateCookie();
        tryRestoreGoogleBanner();
    } else {
        select.value = langCode;
        // Poser le cookie googtrans
        document.cookie = `googtrans=/fr/${langCode}; path=/;`;
    }

    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
}

// Changer explicitement vers une langue cible ("fr" ou "en")
function setLanguage(targetLang) {
    if (currentLang === targetLang && translateInitialized) {
        // Déjà dans la langue demandée
        return;
    }

    currentLang = targetLang;

    try {
        localStorage.setItem("lang", currentLang);
    } catch (e) {}

    // Mise à jour immédiate de l'interface des deux boutons
    updateLangButtons();

    // Application via Google Translate si déjà initialisé
    if (translateInitialized) {
        applyLanguage(currentLang);
    }

    // Déclencher l'événement pour la machine à écrire et autres composants dynamiques
    window.dispatchEvent(
        new CustomEvent("languageChanged", {
            detail: { lang: currentLang }
        })
    );
}

// Initialisation au chargement du document
document.addEventListener("DOMContentLoaded", () => {
    // État visuel initial des boutons
    updateLangButtons();

    // Écouteurs de clics distincts pour chaque bouton
    const btnFr = document.getElementById("btnLangFr");
    const btnEn = document.getElementById("btnLangEn");

    if (btnFr) {
        btnFr.addEventListener("click", () => setLanguage("fr"));
    }

    if (btnEn) {
        btnEn.addEventListener("click", () => setLanguage("en"));
    }
});
