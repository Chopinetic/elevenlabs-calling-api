# ElevenLabs API Node.js

## Endpoints & Examples

### 1. POST /call
Déclenche un appel sortant via ElevenLabs.

**Exemple curl :**
```bash
curl -X POST http://localhost:3000/call \
  -H "Content-Type: application/json" \
  -d '{"callerid": "+33612345678"}'
```

### 2. GET /conversation/:convid
Récupère le JSON complet d'une conversation stockée en base (par convID).

**Exemple curl :**
```bash
curl http://localhost:3000/conversation/1
```

### 3. GET /transcript/:convid
Récupère uniquement la partie transcript du JSON de la conversation (par convID).

**Exemple curl :**
```bash
curl http://localhost:3000/transcript/1
```

---

**Remarques :**
- Remplace `localhost:3000` par l'adresse/port de ton serveur si besoin.
- Pour `/call`, le champ `callerid` doit contenir le numéro à appeler (format international recommandé).
- Pour `/conversation/:convid` et `/transcript/:convid`, `:convid` correspond à la clé primaire auto-incrémentée dans la table MySQL `CONVERSATION`.
- Les variables d'environnement sont à renseigner dans `.env` (voir `.env.example`).
