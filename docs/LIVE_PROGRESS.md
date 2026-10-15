# AFTER HOURS — live voortgangsbord

**Laatst bijgewerkt:** 13 oktober 2026  
**Werkbranch:** `audit/daily-lovense-camera-status`  
**Live volg-link:** https://github.com/melgabbana-ops/AfterHours/blob/audit/daily-lovense-camera-status/docs/LIVE_PROGRESS.md  
**Volledige scope/checklist:** https://github.com/melgabbana-ops/AfterHours/blob/audit/daily-lovense-camera-status/docs/APPROVED_FEATURE_CHECKLIST.md  
**Implementatiematrix:** https://github.com/melgabbana-ops/AfterHours/blob/audit/daily-lovense-camera-status/docs/FEATURE_IMPLEMENTATION_MATRIX.md  
**Lovense-integratieplan:** https://github.com/melgabbana-ops/AfterHours/blob/audit/daily-lovense-camera-status/docs/LOVENSE_INTEGRATION.md  
**Dagelijks gebruik & inkomstenplan:** https://github.com/melgabbana-ops/AfterHours/blob/audit/daily-lovense-camera-status/docs/DAILY_RETENTION_AND_MEMBERSHIP.md

> **Wat betekent “live”?** Dit bord staat in de repository en kan na iedere commit worden bijgewerkt. Het ververst niet automatisch op je telefoon en ik kan geen pushmelding sturen vanuit een gewone chat. GitHub Actions toont de actuele buildstatus. Percentages hieronder zijn voortgangsschattingen van de goedgekeurde scope, geen percentage van productie-gereedheid.

## Hoofdoverzicht

| Werkstroom | Voortgang | Status | Wat telt nog mee |
|---|---:|---|---|
| Volledige masterprompt en scope doorzoeken | 90% | 🟡 Audit loopt | Elk onderdeel koppelen aan code, tests, backend en echte device-checks |
| Kernapp, navigatie en bestaande functies behouden | 70% | 🟡 Gedeeltelijk | End-to-end controle van alle schermen, auth, foutpaden en data |
| Dagelijks gebruik / Daily After Hours | 45% | 🟡 In code, verificatie nodig | Accountgebonden servervoortgang, echte dagelijkse contentrotatie, reminders/notifications, cross-device sync |
| Terugkerende inkomsten / AFTER HOURS Club | 25% | 🟠 Concept + UI | Provider-goedkeuring, backend-checkout, subscriptions, webhook, entitlements, refunds, opzeggen en juridische controle |
| Eenmalige games / credits / betaalverwerking | 20% | 🟠 Niet verkoopklaar | Prijsconsistentie, server-side orders/credits, webhooktests en provider-goedkeuring |
| Lovense-koppeling | 40% | 🟠 Code voorbereid, externe setup blokkeert | Developer approval/token/platformnaam, Supabase secrets/deploy, actuele SDK-contracten en echte toy-tests |
| AH camera-overlay voor foto's en video's | 65% | 🟡 Code aanwezig, apparaat-tests nodig | iPhone/Android Safari/Chrome, camera/microfoonrechten, audio in composited video, retake/preview/save, bestandsgrootte en foutafhandeling |
| Missies, XP, ranks en achievements | 45% | 🟡 Gedeeltelijk | Servermigraties controleren/toepassen, idempotente XP voor events, combo en badge-integratie |
| Consent, limits, PAUSE/PASS/STOP en aftercare | 60% | 🟡 Gedeeltelijk | Volledige flowtest in elk gamemode, timer/STOP race conditions en media-opdrachten |
| Admin, Supabase/RLS en accountbeheer | 35% | 🟠 Backend-verificatie nodig | Elke tabel/RPC, rollen, delete/export, audit, productieconfiguratie |
| PWA, onboarding, trailer en mobiele toegankelijkheid | 50% | 🟡 Verificatie nodig | Echte iOS/Android install, onboardingfirst-run, iconen, safe areas en schermlezer |
| Muziek/radio/SFX/haptics | 25% | 🟠 Gedeeltelijk / rechtencheck | Werkende player, fade/duck/stop, radio, licenties en browser-haptics |
| Tarot, Oracle, astrologie en archief | 35% | 🟡 Gedeeltelijk | Inhoud, datakwaliteit, dagelijks/wekelijkse rotatie en echte persistentie |
| Social Studio / promo assets | 50% | 🟡 Tekstfuncties aanwezig | Branded beeld/video export, assets, templates opslaan en publicatie-integraties |
| Juridische documenten, 18+ en klachten | 35% | 🟠 Concept, niet juridisch goedgekeurd | Operatorgegevens, echte klachtenroute, privacy/export/delete en lokale wetgeving |
| QA, toegankelijkheid, beveiliging en release | 20% | 🔴 Niet release-klaar | Geautomatiseerde tests + echte device/security tests, secrets, migraties, payment test suite |

**Globale voortgangsschatting: 42%.** Dit is een ruwe, ongewogen inschatting van code + documentatie binnen de volledige masterprompt. Het betekent nadrukkelijk niet dat de app 42% productieklaar is. Productiegebruik, echte betalingen en Lovense zijn nog geblokkeerd door externe configuratie en end-to-end tests.

## Actueel werkbord

### Afgerond in code/documentatie
- [x] Masterprompt en eerdere analyse teruggevonden en in de checklist verwerkt.
- [x] Uitgebreide scope-checklist en implementatiematrix vastgelegd.
- [x] Daily After Hours-ritueelpagina met roterende dagelijkse prompt en lokale streak toegevoegd.
- [x] AFTER HOURS Club maand-/jaaropties als **niet-actieve prijsvoorstellen** toegevoegd; er wordt geen betaling gestart.
- [x] Lovense-koppelingsscherm en server-side tokenfunctie voorbereid.
- [x] Lovense externe setup en veiligheidsgrenzen gedocumenteerd.
- [x] Drie AH-overlaystijlen gedefinieerd: CLEAN, AFTER HOURS, CINEMATIC.
- [x] Overlay in camera-canvas voor nieuwe video-opnamen en lokale compositing voor foto's aangesloten.
- [x] Inkomstenplan met terugkerende waarde, prijsrekenvoorbeelden en adult-payment-provider shortlist toegevoegd.
- [x] Feature-branch CI-run 38330211922 geslaagd op commit `7533abc3d274daa046c7e9b1a315abb6d70ffed8`.

### Nu aan het werk
- [ ] **P0 — Verifieer build en routes op de laatste commit.** Controleer import-/routeintegratie van Daily, Lovense en MediaVault; geen code “klaar” noemen zonder buildresultaat.
- [ ] **P0 — Camera-overlay op echte devices testen.** Verifieer of live canvas, audio-track, opname, preview en upload in iOS Safari/PWA en Android Chrome werken.
- [ ] **P0 — Lovense SDK en token-endpoint valideren.** Vergelijk exacte events/parameters met actuele officiële SDK-documentatie; test pas met developer approval en echte testhardware.
- [ ] **P1 — Dagelijkse voortgang van localStorage naar accountgebonden serverstatus.** Voorkom verlies bij ander toestel/browser; geef geen dubbele beloning.
- [ ] **P1 — Monetization serverarchitectuur en providerkeuze.** Geen echte checkout tot provider het exacte aanbod schriftelijk heeft goedgekeurd.
- [ ] **P1 — Implementatiematrix per requirement bijwerken met broncode/testbewijs.**
- [ ] **P1 — Openstaande checklistitems in kleine, testbare commits afwerken.**

### Geblokkeerd door externe toegang/configuratie
- [ ] Lovense Developer approval + developer token + exacte platformnaam.
- [ ] Lovense secrets instellen en Edge Function naar het juiste Supabase-project deployen.
- [ ] Testapparaat/Remote/Connect om koppeling en STOP-gedrag echt te verifiëren.
- [ ] Supabase-migraties vergelijken met de echte projectgeschiedenis voordat ze worden toegepast.
- [ ] Adult-payment-provider underwriting en merchant-account.
- [ ] iPhone/Android apparaat-tests en privacy-/juridische review.

## Definitie van “klaar”
Een punt gaat pas naar **afgerond** wanneer:
1. De code aanwezig is op de werkbranch.
2. Build/tests slagen voor de betreffende code.
3. Security/privacy- en foutpaden zijn gecontroleerd.
4. Externe setup is uitgevoerd als die nodig is.
5. De functie end-to-end getest is op de relevante browser/apparaten.
6. De status en bewijslink in dit bord zijn bijgewerkt.

## Release-grenzen
- Niet zelfstandig naar `main` mergen, productie deployen of productiedatabase migraties uitvoeren zonder expliciete toestemming voor die stap.
- Geen echte betalingen of abonnementsverlengingen activeren vóór provider-goedkeuring en volledige webhook-/refund-/canceltests.
- Geen Lovense-opdrachten automatisch aan games koppelen vóór aparte opt-in, harde duurgrenzen, veilige STOP/pauzeafhandeling en hardwaretests.
- Consent, grenzen, PAUSE/PASS/STOP, basis-aftercare en account-/privacyrechten blijven gratis.
