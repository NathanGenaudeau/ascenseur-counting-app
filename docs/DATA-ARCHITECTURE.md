# Accès aux données (application mobile ↔ Supabase)

## Décision

L’application **ne contient pas** de clé secrète serveur (service role) ni de chaîne de connexion Postgres complète. La persistance repose sur **Supabase** (Postgres managé, Auth, Edge Functions, RLS).

## Point d’accès unique côté app

| Élément | Rôle |
|--------|------|
| **`src/config/env.ts`** | Lecture **uniquement** des variables `EXPO_PUBLIC_*` (URL projet, clé anon, API optionnelle). Aucun secret serveur. |
| **`src/data/supabaseClient.ts`** | **Client Supabase unique** : `getTypedSupabaseClient()` retourne `SupabaseClient<Database> \| null` (singleton, compatible Expo). `null` si URL ou clé anon absents. |
| **`src/data/database.types.ts`** | Contrat TypeScript **Row / Insert / Update** aligné sur le schéma Postgres (référence de vérité avec le script SQL). |
| **`src/data/repositories/*.ts`** | **Seule couche applicative** qui enchaîne les appels `.from(...).select/insert/update` vers les tables. Pas de logique métier de score dupliquée hors du domaine. |
| **`src/data/persistence/`** (optionnel) | `PersistenceGateway` + préfixes `/v1/...` si un backend HTTP proxy ou des Edge Functions exposent la même donnée en REST. |

Le flux principal pour la persistance serverless est donc : **écran / service → repository → client Supabase typé → Postgres (RLS)**.

## Deux modes complémentaires

| Mode | Usage |
|------|--------|
| **Client Supabase** (`@supabase/supabase-js`) | `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` — accès direct aux tables **sous contrôle des politiques RLS**. |
| **API HTTP** (`EXPO_PUBLIC_API_URL`) | Routes REST (`/v1/...`) pour logique métier, agrégations ou proxy si le backend reste la couche unique d’écriture. |

## Rôles

| Couche | Responsabilité |
|--------|----------------|
| Application React Native | Variables `EXPO_PUBLIC_*` uniquement ; clé **anon** publique acceptable si RLS est correctement configurée. |
| Supabase (Postgres + RLS + éventuellement Edge Functions) | Persistance, règles d’accès, agrégations. |

## Stratégie secrets

- **Interdit** dans le dépôt mobile : clé **service role** Supabase, mots de passe Postgres, secrets Edge non prévus pour le client.
- **Autorisé** : URL projet Supabase, clé **anon**, URL publique d’API custom.

Le mapping tables Postgres ↔ routes REST (optionnel) est décrit dans [SUPABASE.md](./SUPABASE.md). Les types générés / maintenus pour Supabase sont dans `src/data/database.types.ts` ; les documents métier camelCase restent dans `src/domain/` et sont mappés dans les repositories.
