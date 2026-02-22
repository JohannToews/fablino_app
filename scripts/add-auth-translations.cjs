const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../src/lib/translations.ts');

const keys = {
  // --- Auth common ---
  authError: { de:'Fehler', en:'Error', fr:'Erreur', es:'Error', nl:'Fout', it:'Errore', bs:'Greška' },
  authFillAllFields: { de:'Bitte alle Felder ausfüllen.', en:'Please fill in all fields.', fr:'Veuillez remplir tous les champs.', es:'Por favor, rellena todos los campos.', nl:'Vul alle velden in.', it:'Compila tutti i campi.', bs:'Molimo popunite sva polja.' },
  authInvalidEmail: { de:'Bitte eine gültige E-Mail-Adresse eingeben.', en:'Please enter a valid email address.', fr:'Veuillez entrer une adresse e-mail valide.', es:'Introduce un correo electrónico válido.', nl:'Voer een geldig e-mailadres in.', it:'Inserisci un indirizzo e-mail valido.', bs:'Unesite važeću e-mail adresu.' },
  authPasswordMin6: { de:'Passwort muss mindestens 6 Zeichen lang sein.', en:'Password must be at least 6 characters.', fr:'Le mot de passe doit contenir au moins 6 caractères.', es:'La contraseña debe tener al menos 6 caracteres.', nl:'Wachtwoord moet minimaal 6 tekens bevatten.', it:'La password deve contenere almeno 6 caratteri.', bs:'Lozinka mora imati najmanje 6 znakova.' },
  authPasswordsNoMatch: { de:'Die Passwörter stimmen nicht überein.', en:'Passwords do not match.', fr:'Les mots de passe ne correspondent pas.', es:'Las contraseñas no coinciden.', nl:'Wachtwoorden komen niet overeen.', it:'Le password non corrispondono.', bs:'Lozinke se ne poklapaju.' },
  authGenericError: { de:'Ein Fehler ist aufgetreten.', en:'An error occurred.', fr:'Une erreur est survenue.', es:'Ha ocurrido un error.', nl:'Er is een fout opgetreden.', it:'Si è verificato un errore.', bs:'Došlo je do greške.' },
  authTryAgain: { de:'Bitte erneut versuchen.', en:'Please try again.', fr:'Veuillez réessayer.', es:'Inténtalo de nuevo.', nl:'Probeer opnieuw.', it:'Riprova.', bs:'Pokušajte ponovo.' },

  // --- Welcome / Combined Auth Page ---
  authWelcomeSubtitle: { de:'Magische Geschichten für junge Leser ✨', en:'Magical stories for young readers ✨', fr:'Des histoires magiques pour jeunes lecteurs ✨', es:'Historias mágicas para jóvenes lectores ✨', nl:'Magische verhalen voor jonge lezers ✨', it:'Storie magiche per giovani lettori ✨', bs:'Magične priče za mlade čitaoce ✨' },
  authTabRegister: { de:'Registrieren', en:'Register', fr:"S'inscrire", es:'Registrarse', nl:'Registreren', it:'Registrati', bs:'Registracija' },
  authTabLogin: { de:'Anmelden', en:'Sign In', fr:'Se connecter', es:'Iniciar sesión', nl:'Inloggen', it:'Accedi', bs:'Prijava' },
  authEmailLabel: { de:'E-Mail', en:'Email', fr:'E-mail', es:'Correo electrónico', nl:'E-mail', it:'E-mail', bs:'E-mail' },
  authEmailPlaceholder: { de:'deine@email.com', en:'your@email.com', fr:'votre@email.com', es:'tu@email.com', nl:'jouw@email.com', it:'tua@email.com', bs:'tvoj@email.com' },
  authPasswordLabel: { de:'Passwort', en:'Password', fr:'Mot de passe', es:'Contraseña', nl:'Wachtwoord', it:'Password', bs:'Lozinka' },
  authPasswordPlaceholderNew: { de:'Mindestens 6 Zeichen...', en:'At least 6 characters...', fr:'Au moins 6 caractères...', es:'Al menos 6 caracteres...', nl:'Minimaal 6 tekens...', it:'Almeno 6 caratteri...', bs:'Najmanje 6 znakova...' },
  authPasswordPlaceholderExisting: { de:'Dein Passwort...', en:'Your password...', fr:'Votre mot de passe...', es:'Tu contraseña...', nl:'Je wachtwoord...', it:'La tua password...', bs:'Tvoja lozinka...' },
  authRememberMe: { de:'Angemeldet bleiben', en:'Remember me', fr:'Rester connecté', es:'Recordarme', nl:'Onthoud mij', it:'Ricordami', bs:'Zapamti me' },
  authForgotPassword: { de:'Passwort vergessen?', en:'Forgot password?', fr:'Mot de passe oublié ?', es:'¿Contraseña olvidada?', nl:'Wachtwoord vergeten?', it:'Password dimenticata?', bs:'Zaboravljena lozinka?' },
  authCreateAccount: { de:'Konto erstellen 🚀', en:'Create Account 🚀', fr:'Créer un compte 🚀', es:'Crear cuenta 🚀', nl:'Account aanmaken 🚀', it:'Crea account 🚀', bs:'Kreiraj račun 🚀' },
  authSignInButton: { de:'Anmelden →', en:'Sign In →', fr:'Se connecter →', es:'Iniciar sesión →', nl:'Inloggen →', it:'Accedi →', bs:'Prijava →' },
  authLegalPrefix: { de:'Mit der Anmeldung akzeptierst du unsere', en:'By signing up you accept our', fr:'En vous inscrivant, vous acceptez nos', es:'Al registrarte, aceptas nuestra', nl:'Door je aan te melden accepteer je onze', it:'Registrandoti accetti la nostra', bs:'Registracijom prihvatate naše' },
  authPrivacyPolicy: { de:'Datenschutzerklärung', en:'Privacy Policy', fr:'Politique de confidentialité', es:'Política de Privacidad', nl:'Privacybeleid', it:'Informativa sulla privacy', bs:'Politiku privatnosti' },
  authAnd: { de:'und', en:'and', fr:'et', es:'y', nl:'en', it:'e', bs:'i' },
  authTerms: { de:'AGB', en:'Terms of Service', fr:'CGU', es:'Términos de servicio', nl:'Algemene voorwaarden', it:'Termini di servizio', bs:'Uslove korištenja' },
  authRegFailed: { de:'Registrierung fehlgeschlagen.', en:'Registration failed.', fr:"Échec de l'inscription.", es:'Registro fallido.', nl:'Registratie mislukt.', it:'Registrazione fallita.', bs:'Registracija neuspješna.' },
  authEmailAlreadyRegistered: { de:'Diese E-Mail ist bereits registriert.', en:'This email is already registered.', fr:'Cet e-mail est déjà enregistré.', es:'Este correo ya está registrado.', nl:'Dit e-mailadres is al geregistreerd.', it:'Questa e-mail è già registrata.', bs:'Ovaj e-mail je već registriran.' },
  authEmailAlreadyRegisteredTitle: { de:'E-Mail bereits registriert', en:'Email already registered', fr:'E-mail déjà enregistré', es:'Correo ya registrado', nl:'E-mail al geregistreerd', it:'E-mail già registrata', bs:'E-mail već registriran' },
  authEmailAlreadyRegisteredHint: { de:'Melde dich einfach mit deinem Passwort an.', en:'Simply sign in with your password.', fr:'Connectez-vous avec votre mot de passe.', es:'Inicia sesión con tu contraseña.', nl:'Log gewoon in met je wachtwoord.', it:'Accedi con la tua password.', bs:'Prijavite se sa svojom lozinkom.' },
  authWrongCredentials: { de:'E-Mail oder Passwort falsch.', en:'Email or password incorrect.', fr:'E-mail ou mot de passe incorrect.', es:'Correo o contraseña incorrectos.', nl:'E-mail of wachtwoord onjuist.', it:'E-mail o password errata.', bs:'E-mail ili lozinka neispravni.' },

  // --- Email confirmation ---
  authConfirmEmailTitle: { de:'E-Mail bestätigen', en:'Confirm your email', fr:'Confirmez votre e-mail', es:'Confirma tu correo', nl:'Bevestig je e-mail', it:'Conferma la tua e-mail', bs:'Potvrdi e-mail' },
  authConfirmEmailSent: { de:'Wir haben eine Bestätigungs-E-Mail an', en:"We've sent a confirmation email to", fr:'Nous avons envoyé un e-mail de confirmation à', es:'Hemos enviado un correo de confirmación a', nl:'We hebben een bevestigingsmail gestuurd naar', it:"Abbiamo inviato un'e-mail di conferma a", bs:'Poslali smo e-mail za potvrdu na' },
  authConfirmEmailClick: { de:'Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren. ✨', en:"Click the link in the email to activate your account. ✨", fr:"Cliquez sur le lien dans l'e-mail pour activer votre compte. ✨", es:'Haz clic en el enlace del correo para activar tu cuenta. ✨', nl:'Klik op de link in de e-mail om je account te activeren. ✨', it:"Clicca il link nell'e-mail per attivare il tuo account. ✨", bs:'Klikni na link u e-mailu da aktiviraš račun. ✨' },
  authConfirmEmailSpam: { de:'Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.', en:"Didn't receive the email? Check your spam folder.", fr:"Pas reçu d'e-mail ? Vérifiez votre dossier spam.", es:'¿No recibiste el correo? Revisa tu carpeta de spam.', nl:'Geen e-mail ontvangen? Controleer je spammap.', it:"Non hai ricevuto l'e-mail? Controlla la cartella spam.", bs:'Niste primili e-mail? Provjerite spam folder.' },

  // --- Register page ---
  authRegisterSubtitle: { de:'Erstelle dein Konto ✨', en:'Create your account ✨', fr:'Créez votre compte ✨', es:'Crea tu cuenta ✨', nl:'Maak je account aan ✨', it:'Crea il tuo account ✨', bs:'Kreiraj svoj račun ✨' },
  authNameLabel: { de:'Name', en:'Name', fr:'Nom', es:'Nombre', nl:'Naam', it:'Nome', bs:'Ime' },
  authNamePlaceholder: { de:'Dein Name...', en:'Your name...', fr:'Votre nom...', es:'Tu nombre...', nl:'Je naam...', it:'Il tuo nome...', bs:'Tvoje ime...' },
  authConfirmPasswordLabel: { de:'Passwort bestätigen', en:'Confirm Password', fr:'Confirmer le mot de passe', es:'Confirmar contraseña', nl:'Wachtwoord bevestigen', it:'Conferma password', bs:'Potvrdi lozinku' },
  authRepeatPasswordPlaceholder: { de:'Passwort wiederholen...', en:'Repeat password...', fr:'Répéter le mot de passe...', es:'Repetir contraseña...', nl:'Wachtwoord herhalen...', it:'Ripeti password...', bs:'Ponovi lozinku...' },
  authRegCreateButton: { de:'Konto erstellen', en:'Create Account', fr:'Créer un compte', es:'Crear cuenta', nl:'Account aanmaken', it:'Crea account', bs:'Kreiraj račun' },
  authRegAlreadyHaveAccount: { de:'Bereits ein Konto?', en:'Already have an account?', fr:'Déjà un compte ?', es:'¿Ya tienes una cuenta?', nl:'Al een account?', it:'Hai già un account?', bs:'Već imate račun?' },
  authRegWelcome: { de:'Willkommen!', en:'Welcome!', fr:'Bienvenue !', es:'¡Bienvenido!', nl:'Welkom!', it:'Benvenuto!', bs:'Dobrodošli!' },
  authRegSuccess: { de:'Registrierung erfolgreich.', en:'Registration successful.', fr:'Inscription réussie.', es:'Registro exitoso.', nl:'Registratie geslaagd.', it:'Registrazione riuscita.', bs:'Registracija uspješna.' },
  authRegInvalidEmail: { de:'Ungültige E-Mail-Adresse.', en:'Invalid email address.', fr:'Adresse e-mail invalide.', es:'Correo no válido.', nl:'Ongeldig e-mailadres.', it:'Indirizzo e-mail non valido.', bs:'Neispravna e-mail adresa.' },
  authRegPasswordReq: { de:'Passwort erfüllt nicht die Anforderungen.', en:'Password does not meet requirements.', fr:'Le mot de passe ne répond pas aux exigences.', es:'La contraseña no cumple los requisitos.', nl:'Wachtwoord voldoet niet aan de vereisten.', it:'La password non soddisfa i requisiti.', bs:'Lozinka ne ispunjava zahtjeve.' },

  // --- Login page ---
  authBackToSignIn: { de:'Zurück zur Anmeldung', en:'Back to Sign In', fr:'Retour à la connexion', es:'Volver a iniciar sesión', nl:'Terug naar inloggen', it:"Torna all'accesso", bs:'Nazad na prijavu' },
  authEmailOrUsername: { de:'E-Mail oder Benutzername', en:'Email or Username', fr:"E-mail ou nom d'utilisateur", es:'Correo o nombre de usuario', nl:'E-mail of gebruikersnaam', it:'E-mail o nome utente', bs:'E-mail ili korisničko ime' },
  authLoginWelcome: { de:'Willkommen!', en:'Welcome!', fr:'Bienvenue !', es:'¡Bienvenido!', nl:'Welkom!', it:'Benvenuto!', bs:'Dobrodošli!' },
  authLoginSuccess: { de:'Anmeldung erfolgreich.', en:'Login successful.', fr:'Connexion réussie.', es:'Inicio de sesión exitoso.', nl:'Inloggen geslaagd.', it:'Accesso riuscito.', bs:'Prijava uspješna.' },
  authLoginFailed: { de:'Anmeldung fehlgeschlagen.', en:'Login failed.', fr:'Connexion échouée.', es:'Inicio de sesión fallido.', nl:'Inloggen mislukt.', it:'Accesso fallito.', bs:'Prijava neuspješna.' },
  authLoginEnterCredentials: { de:'Bitte E-Mail und Passwort eingeben.', en:'Please enter email and password.', fr:"Entrez votre e-mail et mot de passe.", es:'Introduce tu correo y contraseña.', nl:'Voer e-mail en wachtwoord in.', it:'Inserisci e-mail e password.', bs:'Unesite e-mail i lozinku.' },
  authNoAccount: { de:'Noch kein Konto?', en:"Don't have an account?", fr:'Pas encore de compte ?', es:'¿Aún no tienes cuenta?', nl:'Nog geen account?', it:'Non hai un account?', bs:'Nemate račun?' },
  authRegisterNow: { de:'Jetzt registrieren', en:'Register now', fr:"S'inscrire maintenant", es:'Registrarse ahora', nl:'Nu registreren', it:'Registrati ora', bs:'Registruj se sada' },

  // --- Reset password ---
  authResetTitle: { de:'Passwort vergessen?', en:'Forgot password?', fr:'Mot de passe oublié ?', es:'¿Contraseña olvidada?', nl:'Wachtwoord vergeten?', it:'Password dimenticata?', bs:'Zaboravljena lozinka?' },
  authResetDescription: { de:'Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.', en:"No problem! Enter your email and we'll send you a reset link.", fr:'Pas de problème ! Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.', es:'¡Sin problema! Introduce tu correo y te enviaremos un enlace.', nl:'Geen probleem! Vul je e-mail in en we sturen je een resetlink.', it:'Nessun problema! Inserisci la tua e-mail e ti invieremo un link.', bs:'Nema problema! Unesite e-mail i poslat ćemo vam link.' },
  authResetEmailLabel: { de:'E-Mail-Adresse', en:'Email address', fr:'Adresse e-mail', es:'Correo electrónico', nl:'E-mailadres', it:'Indirizzo e-mail', bs:'E-mail adresa' },
  authResetSend: { de:'Link senden', en:'Send link', fr:'Envoyer le lien', es:'Enviar enlace', nl:'Link versturen', it:'Invia link', bs:'Pošalji link' },
  authResetBackToLogin: { de:'Zurück zum Login', en:'Back to login', fr:'Retour à la connexion', es:'Volver al inicio de sesión', nl:'Terug naar inloggen', it:'Torna al login', bs:'Nazad na prijavu' },
  authResetSentTitle: { de:'E-Mail gesendet', en:'Email sent', fr:'E-mail envoyé', es:'Correo enviado', nl:'E-mail verzonden', it:'E-mail inviata', bs:'E-mail poslan' },
  authResetSentDesc: { de:'Falls ein Konto existiert, haben wir dir einen Reset-Link gesendet.', en:"If an account exists, we've sent you a reset link.", fr:'Si un compte existe, nous vous avons envoyé un lien.', es:'Si existe una cuenta, te hemos enviado un enlace.', nl:'Als er een account bestaat, hebben we je een link gestuurd.', it:'Se esiste un account, ti abbiamo inviato un link.', bs:'Ako postoji račun, poslali smo vam link.' },
  authResetClickLink: { de:'Klicke auf den Link in der E-Mail, um dein neues Passwort festzulegen.', en:'Click the link in the email to set your new password.', fr:"Cliquez sur le lien dans l'e-mail pour définir votre nouveau mot de passe.", es:'Haz clic en el enlace del correo para establecer tu nueva contraseña.', nl:'Klik op de link in de e-mail om je nieuwe wachtwoord in te stellen.', it:"Clicca il link nell'e-mail per impostare la nuova password.", bs:'Klikni na link u e-mailu da postaviš novu lozinku.' },
  authResetNoEmail: { de:'Keine E-Mail erhalten?', en:"Didn't receive the email?", fr:"Pas reçu d'e-mail ?", es:'¿No recibiste el correo?', nl:'Geen e-mail ontvangen?', it:"Non hai ricevuto l'e-mail?", bs:'Niste primili e-mail?' },
  authResetCheckSpam: { de:'Überprüfe deinen Spam-Ordner.', en:'Check your spam folder.', fr:'Vérifiez votre dossier spam.', es:'Revisa tu carpeta de spam.', nl:'Controleer je spammap.', it:'Controlla la cartella spam.', bs:'Provjerite spam folder.' },
  authResetEnterEmail: { de:'Bitte E-Mail-Adresse eingeben.', en:'Please enter your email address.', fr:'Veuillez entrer votre adresse e-mail.', es:'Introduce tu correo electrónico.', nl:'Voer je e-mailadres in.', it:'Inserisci il tuo indirizzo e-mail.', bs:'Unesite e-mail adresu.' },

  // --- Update password ---
  authUpdateTitle: { de:'Neues Passwort festlegen', en:'Set new password', fr:'Définir un nouveau mot de passe', es:'Establecer nueva contraseña', nl:'Nieuw wachtwoord instellen', it:'Imposta nuova password', bs:'Postavi novu lozinku' },
  authUpdateDescription: { de:'Wähle ein sicheres Passwort für dein Konto.', en:'Choose a secure password for your account.', fr:'Choisissez un mot de passe sûr pour votre compte.', es:'Elige una contraseña segura para tu cuenta.', nl:'Kies een veilig wachtwoord voor je account.', it:'Scegli una password sicura per il tuo account.', bs:'Izaberite sigurnu lozinku za vaš račun.' },
  authUpdateNewPw: { de:'Neues Passwort', en:'New password', fr:'Nouveau mot de passe', es:'Nueva contraseña', nl:'Nieuw wachtwoord', it:'Nuova password', bs:'Nova lozinka' },
  authUpdateSave: { de:'Passwort speichern', en:'Save password', fr:'Enregistrer le mot de passe', es:'Guardar contraseña', nl:'Wachtwoord opslaan', it:'Salva password', bs:'Sačuvaj lozinku' },
  authUpdateSuccess: { de:'Passwort aktualisiert!', en:'Password updated!', fr:'Mot de passe mis à jour !', es:'¡Contraseña actualizada!', nl:'Wachtwoord bijgewerkt!', it:'Password aggiornata!', bs:'Lozinka ažurirana!' },
  authUpdateSuccessDesc: { de:'Dein Passwort wurde erfolgreich geändert.', en:'Your password has been changed successfully.', fr:'Votre mot de passe a été changé.', es:'Tu contraseña ha sido cambiada.', nl:'Je wachtwoord is gewijzigd.', it:'La tua password è stata cambiata.', bs:'Vaša lozinka je promijenjena.' },
  authUpdateFailed: { de:'Passwort konnte nicht aktualisiert werden.', en:'Password could not be updated.', fr:"Le mot de passe n'a pas pu être mis à jour.", es:'La contraseña no pudo ser actualizada.', nl:'Wachtwoord kon niet worden bijgewerkt.', it:'Impossibile aggiornare la password.', bs:'Lozinka nije mogla biti ažurirana.' },
  authUpdateEnterPw: { de:'Bitte neues Passwort eingeben.', en:'Please enter a new password.', fr:'Veuillez entrer un nouveau mot de passe.', es:'Introduce una nueva contraseña.', nl:'Voer een nieuw wachtwoord in.', it:'Inserisci una nuova password.', bs:'Unesite novu lozinku.' },
  authLinkInvalid: { de:'Link ungültig', en:'Invalid link', fr:'Lien invalide', es:'Enlace no válido', nl:'Link ongeldig', it:'Link non valido', bs:'Link nevažeći' },
  authLinkExpired: { de:'Der Reset-Link ist ungültig oder abgelaufen.', en:'The reset link is invalid or has expired.', fr:'Le lien est invalide ou expiré.', es:'El enlace no es válido o ha caducado.', nl:'De link is ongeldig of verlopen.', it:'Il link non è valido o è scaduto.', bs:'Link je nevažeći ili je istekao.' },
  authRequestNewLink: { de:'Neuen Link anfordern', en:'Request new link', fr:'Demander un nouveau lien', es:'Solicitar nuevo enlace', nl:'Nieuwe link aanvragen', it:'Richiedi nuovo link', bs:'Zatraži novi link' },

  // --- Onboarding Kind page ---
  onboardingWelcomeTitle: { de:'Willkommen bei Fablino! 🦊', en:'Welcome to Fablino! 🦊', fr:'Bienvenue sur Fablino ! 🦊', es:'¡Bienvenido a Fablino! 🦊', nl:'Welkom bij Fablino! 🦊', it:'Benvenuto su Fablino! 🦊', bs:'Dobrodošli na Fablino! 🦊' },
  onboardingProfileTitle: { de:'Wer liest mit Fablino? 🦊', en:'Who reads with Fablino? 🦊', fr:'Qui lit avec Fablino ? 🦊', es:'¿Quién lee con Fablino? 🦊', nl:'Wie leest met Fablino? 🦊', it:'Chi legge con Fablino? 🦊', bs:'Ko čita sa Fablinom? 🦊' },
  onboardingStoryTypeTitle: { de:'Was für eine Geschichte? 📖', en:'What kind of story? 📖', fr:"Quel genre d'histoire ? 📖", es:'¿Qué tipo de historia? 📖', nl:'Wat voor verhaal? 📖', it:'Che tipo di storia? 📖', bs:'Kakva priča? 📖' },
  onboardingAdminLangSub: { de:'In welcher Sprache möchtest du Fablino verwalten?', en:'In which language do you want to manage Fablino?', fr:'Dans quelle langue souhaitez-vous gérer Fablino ?', es:'¿En qué idioma quieres gestionar Fablino?', nl:'In welke taal wil je Fablino beheren?', it:'In che lingua vuoi gestire Fablino?', bs:'Na kojem jeziku želite upravljati Fablinom?' },
  onboardingProfileSub: { de:'Erstelle ein Profil für dein Kind', en:'Create a profile for your child', fr:'Créez un profil pour votre enfant', es:'Crea un perfil para tu hijo/a', nl:'Maak een profiel aan voor je kind', it:'Crea un profilo per tuo figlio/a', bs:'Kreirajte profil za vaše dijete' },
  onboardingAdminLangLabel: { de:'🌐 Sprache für App-Administration', en:'🌐 App admin language', fr:"🌐 Langue d'administration", es:'🌐 Idioma de administración', nl:'🌐 Beheertaal', it:'🌐 Lingua di amministrazione', bs:'🌐 Jezik administracije' },
  onboardingAdminLangHint: { de:'In dieser Sprache siehst du Menüs, Einstellungen und Benachrichtigungen', en:'Menus, settings and notifications will be in this language', fr:'Les menus, paramètres et notifications seront dans cette langue', es:'Los menús, ajustes y notificaciones estarán en este idioma', nl:"Menu's, instellingen en meldingen verschijnen in deze taal", it:'Menu, impostazioni e notifiche saranno in questa lingua', bs:'Meniji, postavke i obavijesti će biti na ovom jeziku' },
  onboardingSelectLang: { de:'Sprache auswählen...', en:'Select language...', fr:'Choisir la langue...', es:'Seleccionar idioma...', nl:'Taal kiezen...', it:'Seleziona lingua...', bs:'Izaberi jezik...' },
  onboardingNext: { de:'Weiter →', en:'Next →', fr:'Suivant →', es:'Siguiente →', nl:'Volgende →', it:'Avanti →', bs:'Dalje →' },
  onboardingBack: { de:'← Zurück', en:'← Back', fr:'← Retour', es:'← Atrás', nl:'← Terug', it:'← Indietro', bs:'← Nazad' },
  onboardingChildName: { de:'Name des Kindes', en:"Child's name", fr:"Nom de l'enfant", es:'Nombre del niño/a', nl:'Naam van het kind', it:'Nome del bambino/a', bs:'Ime djeteta' },
  onboardingChildNamePlaceholder: { de:'Vorname...', en:'First name...', fr:'Prénom...', es:'Nombre...', nl:'Voornaam...', it:'Nome...', bs:'Ime...' },
  onboardingAge: { de:'Alter', en:'Age', fr:'Âge', es:'Edad', nl:'Leeftijd', it:'Età', bs:'Starost' },
  onboardingGender: { de:'Geschlecht', en:'Gender', fr:'Genre', es:'Género', nl:'Geslacht', it:'Genere', bs:'Spol' },
  onboardingGenderGirl: { de:'Mädchen', en:'Girl', fr:'Fille', es:'Niña', nl:'Meisje', it:'Ragazza', bs:'Djevojčica' },
  onboardingGenderBoy: { de:'Junge', en:'Boy', fr:'Garçon', es:'Niño', nl:'Jongen', it:'Ragazzo', bs:'Dječak' },
  onboardingGenderOther: { de:'Divers', en:'Other', fr:'Autre', es:'Otro', nl:'Anders', it:'Altro', bs:'Ostalo' },
  onboardingSchoolLang: { de:'Schulsprache 📚', en:'School language 📚', fr:'Langue scolaire 📚', es:'Idioma escolar 📚', nl:'Schooltaal 📚', it:'Lingua scolastica 📚', bs:'Školski jezik 📚' },
  onboardingSchoolLangHint: { de:'Die Hauptsprache, in der dein Kind liest', en:'The main language your child reads in', fr:'La langue principale dans laquelle votre enfant lit', es:'El idioma principal en el que lee tu hijo/a', nl:'De hoofdtaal waarin je kind leest', it:'La lingua principale in cui legge tuo figlio/a', bs:'Glavni jezik na kojem vaše dijete čita' },
  onboardingExtraLangs: { de:'Weitere Lesesprachen', en:'Additional reading languages', fr:'Autres langues de lecture', es:'Otros idiomas de lectura', nl:'Extra leestalen', it:'Altre lingue di lettura', bs:'Dodatni jezici čitanja' },
  onboardingExtraLangsOptional: { de:'(optional)', en:'(optional)', fr:'(optionnel)', es:'(opcional)', nl:'(optioneel)', it:'(opzionale)', bs:'(opcionalno)' },
  onboardingExtraLangsHint: { de:'Mehrere Sprachen möglich', en:'Multiple languages possible', fr:'Plusieurs langues possibles', es:'Varios idiomas posibles', nl:'Meerdere talen mogelijk', it:'Più lingue possibili', bs:'Moguće više jezika' },
  onboardingExtraLangsPlaceholder: { de:'Weitere Sprachen...', en:'More languages...', fr:'Autres langues...', es:'Más idiomas...', nl:'Meer talen...', it:'Altre lingue...', bs:'Više jezika...' },
  onboardingSelectName: { de:'Bitte einen Namen eingeben.', en:'Please enter a name.', fr:'Veuillez entrer un nom.', es:'Introduce un nombre.', nl:'Voer een naam in.', it:'Inserisci un nome.', bs:'Unesite ime.' },
  onboardingSelectAge: { de:'Bitte ein Alter auswählen.', en:'Please select an age.', fr:'Veuillez sélectionner un âge.', es:'Selecciona una edad.', nl:'Selecteer een leeftijd.', it:"Seleziona un'età.", bs:'Izaberite starost.' },
  onboardingSelectGender: { de:'Bitte ein Geschlecht auswählen.', en:'Please select a gender.', fr:'Veuillez sélectionner un genre.', es:'Selecciona un género.', nl:'Selecteer een geslacht.', it:'Seleziona un genere.', bs:'Izaberite spol.' },
  onboardingSelectSchoolLang: { de:'Bitte eine Schulsprache auswählen.', en:'Please select a school language.', fr:'Veuillez sélectionner une langue scolaire.', es:'Selecciona un idioma escolar.', nl:'Selecteer een schooltaal.', it:'Seleziona una lingua scolastica.', bs:'Izaberite školski jezik.' },
  onboardingSelectLangFirst: { de:'Bitte eine Sprache auswählen.', en:'Please select a language.', fr:'Veuillez choisir une langue.', es:'Selecciona un idioma.', nl:'Selecteer een taal.', it:'Seleziona una lingua.', bs:'Izaberite jezik.' },
  onboardingSelectStory: { de:'Bitte eine Geschichte wählen.', en:'Please choose a story.', fr:'Veuillez choisir une histoire.', es:'Elige una historia.', nl:'Kies een verhaal.', it:'Scegli una storia.', bs:'Izaberite priču.' },
  onboardingProfileSaveError: { de:'Profil konnte nicht gespeichert werden.', en:'Profile could not be saved.', fr:"Le profil n'a pas pu être sauvegardé.", es:'No se pudo guardar el perfil.', nl:'Profiel kon niet worden opgeslagen.', it:'Impossibile salvare il profilo.', bs:'Profil nije mogao biti sačuvan.' },
  onboardingLetsGo: { de:"Los geht's! 🦊", en:"Let's go! 🦊", fr:"C'est parti ! 🦊", es:'¡Vamos! 🦊', nl:'Aan de slag! 🦊', it:'Andiamo! 🦊', bs:'Hajde! 🦊' },
  onboardingStoryLang: { de:'📚 Sprache der Geschichte', en:'📚 Story language', fr:"📚 Langue de l'histoire", es:'📚 Idioma de la historia', nl:'📚 Verhaaltaal', it:'📚 Lingua della storia', bs:'📚 Jezik priče' },
  onboardingStoryLangHint: { de:'In welcher Sprache soll die erste Geschichte sein?', en:'In which language should the first story be?', fr:'Dans quelle langue la première histoire doit-elle être ?', es:'¿En qué idioma debe ser la primera historia?', nl:'In welke taal moet het eerste verhaal zijn?', it:'In che lingua deve essere la prima storia?', bs:'Na kojem jeziku treba biti prva priča?' },
  onboardingNotSupported: { de:'Nicht unterstützt', en:'Not supported', fr:'Non pris en charge', es:'No soportado', nl:'Niet ondersteund', it:'Non supportato', bs:'Nije podržano' },
  onboardingSpeechNotSupported: { de:'Spracheingabe wird von diesem Browser nicht unterstützt.', en:'Speech input is not supported by this browser.', fr:"La saisie vocale n'est pas prise en charge par ce navigateur.", es:'La entrada de voz no es compatible con este navegador.', nl:'Spraakinvoer wordt niet ondersteund door deze browser.', it:"L'input vocale non è supportato da questo browser.", bs:'Glasovni unos nije podržan u ovom pregledniku.' },
  onboardingNoMicAccess: { de:'Kein Zugriff', en:'No access', fr:"Pas d'accès", es:'Sin acceso', nl:'Geen toegang', it:'Nessun accesso', bs:'Nema pristupa' },
  onboardingMicDenied: { de:'Mikrofon-Berechtigung verweigert.', en:'Microphone permission denied.', fr:'Permission du microphone refusée.', es:'Permiso de micrófono denegado.', nl:'Microfoontoestemming geweigerd.', it:'Permesso microfono negato.', bs:'Dozvola za mikrofon odbijena.' },
  onboardingListening: { de:'Zuhören…', en:'Listening…', fr:'Écoute…', es:'Escuchando…', nl:'Luisteren…', it:'Ascolto…', bs:'Slušam…' },
  onboardingStopRecording: { de:'Aufnahme stoppen', en:'Stop recording', fr:"Arrêter l'enregistrement", es:'Detener grabación', nl:'Opname stoppen', it:'Ferma registrazione', bs:'Zaustavi snimanje' },
  onboardingStartRecording: { de:'Spracheingabe starten', en:'Start voice input', fr:'Démarrer la saisie vocale', es:'Iniciar entrada de voz', nl:'Spraakinvoer starten', it:'Avvia input vocale', bs:'Pokreni glasovni unos' },

  // --- Onboarding story page ---
  onboardingStoryDone: { de:'Die Geschichte ist fertig! 🎉', en:'The story is ready! 🎉', fr:"L'histoire est prête ! 🎉", es:'¡La historia está lista! 🎉', nl:'Het verhaal is klaar! 🎉', it:'La storia è pronta! 🎉', bs:'Priča je gotova! 🎉' },
  onboardingStoryCreatingFor: { de:'Fablino erstellt eine Geschichte für {name}! ✨', en:'Fablino is creating a story for {name}! ✨', fr:'Fablino crée une histoire pour {name} ! ✨', es:'¡Fablino está creando una historia para {name}! ✨', nl:'Fablino maakt een verhaal voor {name}! ✨', it:'Fablino sta creando una storia per {name}! ✨', bs:'Fablino kreira priču za {name}! ✨' },
  onboardingStoryCreating: { de:'Fablino erstellt eine Geschichte... ✨', en:'Fablino is creating a story... ✨', fr:'Fablino crée une histoire... ✨', es:'Fablino está creando una historia... ✨', nl:'Fablino maakt een verhaal... ✨', it:'Fablino sta creando una storia... ✨', bs:'Fablino kreira priču... ✨' },
  onboardingStoryReady: { de:'Bereit zum Lesen! Viel Spaß beim Abtauchen in die Geschichte.', en:'Ready to read! Enjoy diving into the story.', fr:"Prêt à lire ! Bonne plongée dans l'histoire.", es:'¡Listo para leer! Disfruta sumergiéndote en la historia.', nl:'Klaar om te lezen! Veel plezier met het verhaal.', it:'Pronto da leggere! Buon divertimento con la storia.', bs:'Spremno za čitanje! Uživaj u priči.' },
  onboardingStoryRead: { de:'Geschichte lesen! 📖', en:'Read the story! 📖', fr:"Lire l'histoire ! 📖", es:'¡Leer la historia! 📖', nl:'Verhaal lezen! 📖', it:'Leggi la storia! 📖', bs:'Čitaj priču! 📖' },
  onboardingStoryError: { de:'Es gab ein Problem beim Erstellen der Geschichte. 😕', en:'There was a problem creating the story. 😕', fr:"Un problème est survenu lors de la création. 😕", es:'Hubo un problema al crear la historia. 😕', nl:'Er was een probleem bij het maken van het verhaal. 😕', it:'Si è verificato un problema nella creazione. 😕', bs:'Došlo je do problema pri kreiranju priče. 😕' },
  onboardingStoryTryAgain: { de:'Bitte versuche es nochmal.', en:'Please try again.', fr:'Veuillez réessayer.', es:'Inténtalo de nuevo.', nl:'Probeer het opnieuw.', it:'Riprova.', bs:'Pokušaj ponovo.' },
  onboardingStoryRetry: { de:'Nochmal versuchen', en:'Try again', fr:'Réessayer', es:'Intentar de nuevo', nl:'Opnieuw proberen', it:'Riprova', bs:'Pokušaj ponovo' },
  onboardingStep2of2: { de:'Schritt 2 von 2', en:'Step 2 of 2', fr:'Étape 2 sur 2', es:'Paso 2 de 2', nl:'Stap 2 van 2', it:'Passo 2 di 2', bs:'Korak 2 od 2' },
  onboardingProgress1: { de:'Fablino denkt sich eine Geschichte aus... 🦊', en:'Fablino is thinking of a story... 🦊', fr:'Fablino invente une histoire... 🦊', es:'Fablino está pensando una historia... 🦊', nl:'Fablino bedenkt een verhaal... 🦊', it:'Fablino sta inventando una storia... 🦊', bs:'Fablino smišlja priču... 🦊' },
  onboardingProgress2: { de:'Die Charaktere werden lebendig... 🌟', en:'The characters are coming alive... 🌟', fr:'Les personnages prennent vie... 🌟', es:'Los personajes cobran vida... 🌟', nl:'De personages komen tot leven... 🌟', it:'I personaggi prendono vita... 🌟', bs:'Likovi oživljavaju... 🌟' },
  onboardingProgress3: { de:'Fablino malt die Bilder... 🎨', en:'Fablino is painting the pictures... 🎨', fr:'Fablino peint les images... 🎨', es:'Fablino está pintando las imágenes... 🎨', nl:'Fablino schildert de plaatjes... 🎨', it:'Fablino sta dipingendo le immagini... 🎨', bs:'Fablino crta slike... 🎨' },
  onboardingProgress4: { de:'Fast fertig! 🎉', en:'Almost done! 🎉', fr:'Presque fini ! 🎉', es:'¡Casi listo! 🎉', nl:'Bijna klaar! 🎉', it:'Quasi finito! 🎉', bs:'Skoro gotovo! 🎉' },
};

// Read file
let file = fs.readFileSync(FILE, 'utf-8');
const lines = file.split('\n');
const keyNames = Object.keys(keys);

console.log(`Adding ${keyNames.length} keys to translations.ts`);

// STEP 1: Find interface closing brace (line with just "}")
// Interface starts at line 5. Find the closing "}" before "const translations"
let interfaceEndLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '}' && i < 400) {
    // Check if next non-empty line is "const translations..."
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue;
      if (lines[j].includes('const translations')) {
        interfaceEndLine = i;
        break;
      }
      break;
    }
    if (interfaceEndLine !== -1) break;
  }
}

if (interfaceEndLine === -1) {
  console.error('Could not find interface end');
  process.exit(1);
}
console.log(`Interface ends at line ${interfaceEndLine + 1}`);

// Insert interface properties before the closing brace
const interfaceProps = keyNames.map(k => `  ${k}: string;`).join('\n');
const interfaceInsert = '\n  // Auth & Onboarding\n' + interfaceProps + '\n';
lines.splice(interfaceEndLine, 0, interfaceInsert);

// Re-join and re-split to get updated line numbers
file = lines.join('\n');

// STEP 2: For each language block, insert key-value pairs before the block's closing brace
const coreLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs'];
const allLangs = ['de', 'en', 'fr', 'es', 'nl', 'it', 'bs', 'tr', 'bg', 'ro', 'pl', 'lt', 'hu', 'ca', 'sl', 'pt', 'sk'];

// Process from bottom to top so line numbers don't shift
const langBlocks = [];
for (const lang of allLangs) {
  const regex = new RegExp(`^  ${lang}: \\{`, 'm');
  const match = file.match(regex);
  if (!match) {
    console.log(`Block not found: ${lang}`);
    continue;
  }
  const startIdx = match.index;
  
  // Find the matching closing brace
  let depth = 0;
  let closeIdx = -1;
  const firstBrace = file.indexOf('{', startIdx);
  for (let i = firstBrace; i < file.length; i++) {
    if (file[i] === '{') depth++;
    if (file[i] === '}') {
      depth--;
      if (depth === 0) { closeIdx = i; break; }
    }
  }
  if (closeIdx === -1) {
    console.log(`Close not found: ${lang}`);
    continue;
  }
  langBlocks.push({ lang, closeIdx });
}

// Sort by closeIdx descending so we insert bottom-up
langBlocks.sort((a, b) => b.closeIdx - a.closeIdx);

for (const { lang, closeIdx } of langBlocks) {
  let entries = '\n    // Auth & Onboarding\n';
  for (const [key, translations] of Object.entries(keys)) {
    const value = coreLangs.includes(lang)
      ? (translations[lang] || translations.en)
      : translations.en;
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    entries += `    ${key}: '${escaped}',\n`;
  }
  
  file = file.substring(0, closeIdx) + entries + '  ' + file.substring(closeIdx);
}

fs.writeFileSync(FILE, file, 'utf-8');
console.log(`Done! File now has ${file.split('\n').length} lines`);
