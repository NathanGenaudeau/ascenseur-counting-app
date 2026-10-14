# Persistance Supabase (Postgres)

La **référence de vérité** du schéma est `src/data/database.types.ts`, aligné sur la base réelle. Attention : `supabase/migrations/20260404120000_initial_ascenseur_schema.sql` est antérieur à plusieurs modifications faites dans le dashboard (`round_number`, `game_player_id`, `is_last_used`, `display_name_snapshot`…) et ne décrit plus la base.

| Table Postgres | Rôle |
|----------------|------|
| `players` | Joueurs réutilisables. |
| `games` | Parties et métadonnées. |
| `game_players` | Lien partie ↔ joueurs (ordre de siège, sans dupliquer le référentiel joueur). |
| `rounds` | Manches d’une partie. |
| `round_results` | Annonces (`bid`), plis gagnés (`tricks_won`), score de manche. |
| `game_config_templates` | Modèles de configuration (historique, préremplissage). |
| `game_config_template_players` | Joueurs / sièges associés à un modèle. |

## Fonctions RPC

Définies dans `supabase/migrations/20261014120000_atomic_write_rpcs.sql`, **à appliquer avant de déployer une version de l’app qui les appelle** (SQL Editor ou `supabase db push`).

| Fonction | Rôle |
|----------|------|
| `start_game(p_seats)` | Crée la partie `in_progress` et ses sièges ; réutilise un joueur existant de même nom (casse et espaces ignorés) au lieu d’en créer un doublon. Renvoie les `game_player_id`. |
| `save_round(p_game_id, p_round_number, p_results)` | Upsert idempotent d’une manche et de ses résultats (retry sans risque). |
| `save_last_game_config(p_name, p_player_count, p_seats)` | Remplace la configuration « dernière utilisée » et ses sièges. |

Le client mobile utilise **`getTypedSupabaseClient()`** avec la clé **anon** et les politiques **RLS**.
