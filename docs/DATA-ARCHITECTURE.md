# Accès aux données (application mobile ↔ Supabase)

## Décision

L’application **ne contient pas** de clé secrète serveur (service role) ni de chaîne de connexion Postgres complète. La persistance repose sur **Supabase** (Postgres managé, Auth, Edge Functions, RLS).

## Point d’accès unique côté app

| Élément | Rôle |
|--------|------|
| **`src/config/env.ts`** | Lecture **uniquement** des variables `EXPO_PUBLIC_*` (URL projet, clé anon). Aucun secret serveur. |
| **`src/data/supabaseClient.ts`** | **Client Supabase unique** : `getTypedSupabaseClient()` retourne `SupabaseClient<Database> \| null` (singleton, compatible Expo). `null` si URL ou clé anon absents. |
| **`src/data/database.types.ts`** | Contrat TypeScript **Row / Insert / Update** aligné sur le schéma Postgres (référence de vérité avec le script SQL). |
| **`src/data/repositories/*.ts`** | **Seule couche applicative** qui appelle Supabase : lectures via `.from(...)`, écritures multi-tables via les RPC transactionnelles (`start_game`, `save_round`, `save_last_game_config`). Pas de logique métier de score dupliquée hors du domaine. |

Le flux principal pour la persistance serverless est donc : **écran / service → repository → client Supabase typé → Postgres (RLS)**.

## Écritures atomiques et mode hors ligne

Les opérations qui touchent plusieurs tables passent par des fonctions Postgres (`supabase/migrations/20261014120000_atomic_write_rpcs.sql`) : une transaction et un aller-retour chacune, donc pas de partie orpheline ni de modèle sans sièges en cas d’échec.

La partie en cours est sauvegardée sur l’appareil (`src/services/activeGameStorage.ts`, AsyncStorage) et reprise au redémarrage. Les manches sont envoyées dans l’ordre par `GameSessionContext` ; `save_round` étant idempotente, un échec laisse la manche en attente et un nouvel essai (manche suivante, retour au premier plan, bouton « Réessayer ») reprend là où l’envoi s’était arrêté. La clôture de partie n’est envoyée qu’après la dernière manche.

## Rôles

| Couche | Responsabilité |
|--------|----------------|
| Application React Native | Variables `EXPO_PUBLIC_*` uniquement ; clé **anon** publique acceptable si RLS est correctement configurée. |
| Supabase (Postgres + RLS + éventuellement Edge Functions) | Persistance, règles d’accès, agrégations. |

## Stratégie secrets

- **Interdit** dans le dépôt mobile : clé **service role** Supabase, mots de passe Postgres, secrets Edge non prévus pour le client.
- **Autorisé** : URL projet Supabase, clé **anon**.

Les tables sont décrites dans [SUPABASE.md](./SUPABASE.md). Les types générés / maintenus pour Supabase sont dans `src/data/database.types.ts` ; les documents métier camelCase restent dans `src/domain/` et sont mappés dans les repositories.
