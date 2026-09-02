# RVI Reisekosten

Eigenständige Anwendung zur Erfassung, Prüfung und Freigabe von Reisekosten bei RVI. Läuft unabhängig vom Vertriebsportal (`rvi-portal`) im Repo-Root – eigenes `package.json`, eigene Datenbank, eigener Prozess.

## Lokales Setup

```bash
cd reisekosten
npm install
cp .env.example .env   # SESSION_SECRET + DATABASE_URL eintragen
npm run db:seed        # legt Tabellen (falls nötig), Kilometersätze + Test-Accounts an
npm run dev
```

`DATABASE_URL` muss auf eine Postgres-Datenbank zeigen (lokal z. B. `postgresql://postgres:postgres@localhost:5432/reisekosten_dev`). Die App legt ihr Tabellenschema beim ersten Verbindungsaufbau selbst an – kein separater Migrationsschritt nötig.

Die App läuft dann unter `http://localhost:3000` (oder dem übergebenen Port, z. B. `npm run dev -- -p 3100`).

## Deployment auf Vercel

1. **Postgres-Datenbank anlegen**: im Vercel-Projekt unter *Storage* → *Create Database* → Postgres (oder eine Neon-Integration verknüpfen). Vercel setzt daraufhin automatisch eine Verbindungs-Umgebungsvariable (i. d. R. `POSTGRES_URL`); die App erkennt sowohl `DATABASE_URL` als auch `POSTGRES_URL`/`POSTGRES_PRISMA_URL`.
2. **Repo importieren**: `michaelmorbach/Test` als neues Vercel-Projekt importieren, dabei **Root Directory auf `reisekosten`** setzen (Next.js wird automatisch erkannt).
3. **Umgebungsvariable `SESSION_SECRET`** im Projekt anlegen (z. B. via `openssl rand -base64 32`).
4. Deployen – beim ersten Request legt die App ihr Schema in der verbundenen Postgres-Datenbank an.

Beleg-Dateien werden direkt in der Datenbank gespeichert (nicht im Dateisystem), damit sie auf der zustandslosen Serverless-Plattform von Vercel zuverlässig erhalten bleiben.

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
- **Belege**: Kategorie, Händler, Betrag, Zahlungsart, optionaler Foto-/Scan-Upload (in der Datenbank gespeichert) mit geschütztem Download.
- **Kilometerabrechnung**: Start/Ziel/Datum/Anlass/Fahrzeugart/km; Satz wird bei Erfassung eingefroren (spätere Satzänderungen wirken nicht rückwirkend). Standardsätze: Privat-Pkw 0,30 €/km, Motorrad/Motorroller 0,20 €/km – unter **Kilometersätze** administrierbar.
- **PDF-Export** je Reise unter „PDF" auf der Detailseite bzw. `/reisekosten/[id]/pdf`.

Bewusst **nicht** enthalten (siehe Briefing „Sinnvolle nächste Ausbaustufen"): automatische Streckenberechnung, Slack-Benachrichtigungen, Auswertungs-Dashboard/Filter, Buchhaltungsexport, Vertretungsregelungen, automatischer Mailversand nach Freigabe.

## Architektur-Hinweise

Diese Next.js-Version (16.x) und die im Projekt zunächst installierte Prisma-Version wichen bei der Umsetzung deutlich von bekannten Konventionen ab (siehe `AGENTS.md`). Getroffene Entscheidungen:

- **Datenbank**: Postgres über `pg` (node-postgres) mit einer schlanken, handgeschriebenen SQL-Datenzugriffsschicht (`lib/schema.sql`, `lib/db.ts`, `lib/repo/*`) statt eines ORMs – die im Projekt installierte Prisma-Version brachte eine komplett neue, undokumentierte Contract-API ohne klassisches `schema.prisma`.
- **Auth**: kein next-auth, sondern signierte JWT-Session-Cookies via `jose` + `bcryptjs`, nach dem in den Next.js-eigenen Docs empfohlenen Muster (`lib/session.ts`, `lib/dal.ts`, `app/actions/auth.ts`).
- **Routenschutz**: `proxy.ts` (Next-16-Nachfolger von `middleware.ts`) für den optimistischen Cookie-Check; die eigentliche Rollenprüfung erfolgt serverseitig in jeder Seite/Aktion (`requireUser`/`requireApprover`/`requireAdmin` in `lib/dal.ts`).
- **Geldbeträge** werden intern als Integer-Cent geführt, um Rundungsfehler zu vermeiden.
- **Beleg-Dateien** liegen als `bytea` in Postgres (nicht im Dateisystem), damit sie auch auf einer zustandslosen Serverless-Plattform wie Vercel erhalten bleiben.

## Nützliche Befehle

```bash
npm run dev       # Entwicklungsserver
npm run build     # Produktions-Build
npm run lint      # ESLint
npm run db:seed   # Schema anlegen (falls nötig) + Kilometersätze + Test-Accounts (idempotent)
```
