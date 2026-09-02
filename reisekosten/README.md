# RVI Reisekosten

Eigenständige Anwendung zur Erfassung, Prüfung und Freigabe von Reisekosten bei RVI. Läuft unabhängig vom Vertriebsportal (`rvi-portal`) im Repo-Root – eigenes `package.json`, eigene Datenbank, eigener Prozess.

## Setup

```bash
cd reisekosten
npm install
cp .env.example .env   # SESSION_SECRET eintragen, z. B. via: openssl rand -base64 32
npm run db:seed        # legt Kilometersätze + Test-Accounts an (SQLite-Datei unter data/)
npm run dev
```

Die App läuft dann unter `http://localhost:3000` (oder dem übergebenen Port, z. B. `npm run dev -- -p 3100`).

## Test-Zugänge (nach `npm run db:seed`)

| Rolle | E-Mail | Passwort |
|---|---|---|
| Mitarbeitend | `mitarbeiterin@rvi.de` | `Rvi-Test-2026!` |
| Freigabeberechtigt | `freigabe@rvi.de` | `Rvi-Test-2026!` |
| Admin | `admin@rvi.de` | `Rvi-Test-2026!` |

Bitte in einer echten Umgebung nach dem ersten Login Passwörter ändern bzw. eigene Accounts über **Team & Rollen** anlegen.

## Funktionsumfang (Stand dieser Version)

- **Rollen & Rechte**: jeder Account kann eigene Reisen erfassen; `isApprover` schaltet Freigaben frei, `isAdmin` zusätzlich Team- und Kilometersatz-Verwaltung.
- **Statuspfad**: Entwurf → Eingereicht → In Prüfung → Freigegeben, mit Zurückgegeben als Rücksprung (Pflichtkommentar).
- **Prüfprotokoll**: lückenlose Historie je Reise (angelegt, eingereicht, geprüft/freigegeben, Kommentare) unter „Prüfprotokoll" auf der Detailseite.
- **Belege**: Kategorie, Händler, Betrag, Zahlungsart, optionaler Foto-/Scan-Upload mit geschütztem Download.
- **Kilometerabrechnung**: Start/Ziel/Datum/Anlass/Fahrzeugart/km; Satz wird bei Erfassung eingefroren (spätere Satzänderungen wirken nicht rückwirkend). Standardsätze: Privat-Pkw 0,30 €/km, Motorrad/Motorroller 0,20 €/km – unter **Kilometersätze** administrierbar.
- **PDF-Export** je Reise unter „PDF" auf der Detailseite bzw. `/reisekosten/[id]/pdf`.

Bewusst **nicht** enthalten (siehe Briefing „Sinnvolle nächste Ausbaustufen"): automatische Streckenberechnung, Slack-Benachrichtigungen, Auswertungs-Dashboard/Filter, Buchhaltungsexport, Vertretungsregelungen, automatischer Mailversand nach Freigabe.

## Architektur-Hinweise

Diese Next.js-Version (16.x) und die installierte Prisma-Version wichen bei der Umsetzung deutlich von bekannten Konventionen ab (siehe `AGENTS.md`). Getroffene Entscheidungen:

- **Datenbank**: `better-sqlite3` mit handgeschriebener SQL-Datenzugriffsschicht (`lib/schema.sql`, `lib/db.ts`, `lib/repo/*`) statt Prisma – die installierte Prisma-Version bringt eine komplett neue, undokumentierte Contract-API ohne klassisches `schema.prisma`. Für ein produktives Setup mit Postgres müsste diese Schicht neu geschrieben werden.
- **Auth**: kein next-auth, sondern signierte JWT-Session-Cookies via `jose` + `bcryptjs`, nach dem in den Next.js-eigenen Docs empfohlenen Muster (`lib/session.ts`, `lib/dal.ts`, `app/actions/auth.ts`).
- **Routenschutz**: `proxy.ts` (Next-16-Nachfolger von `middleware.ts`) für den optimistischen Cookie-Check; die eigentliche Rollenprüfung erfolgt serverseitig in jeder Seite/Aktion (`requireUser`/`requireApprover`/`requireAdmin` in `lib/dal.ts`).
- **Geldbeträge** werden intern als Integer-Cent geführt, um Rundungsfehler zu vermeiden.
- **Beleg-Dateien** liegen lokal unter `uploads/` (gitignored) und werden nur über eine authentifizierte Route ausgeliefert, nie als öffentliches Static-Verzeichnis.

## Nützliche Befehle

```bash
npm run dev       # Entwicklungsserver
npm run build     # Produktions-Build
npm run lint      # ESLint
npm run db:seed   # Kilometersätze + Test-Accounts anlegen (idempotent)
```
