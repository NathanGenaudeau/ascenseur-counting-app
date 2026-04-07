# Persistance Supabase (Postgres)

Les tables suivantes sont la **référence de vérité** alignée avec `supabase/migrations/*.sql` et `src/data/database.types.ts`. Les chemins REST exposés au mobile (optionnel, via API dédiée) sont préfixés par `/v1` (voir `src/data/persistence/supabaseResources.ts`).

| Table Postgres | Ressource REST (exemple) | Rôle |
|----------------|--------------------------|------|
| `players` | `/v1/players` | Joueurs réutilisables. |
| `games` | `/v1/games` | Parties et métadonnées. |
| `game_players` | `/v1/game-players` | Lien partie ↔ joueurs (ordre de siège, sans dupliquer le référentiel joueur). |
| `rounds` | `/v1/rounds` | Manches d’une partie. |
| `round_results` | `/v1/round-results` | Annonces (`bid`), plis gagnés (`tricks_won`), score de manche. |
| `game_config_templates` | `/v1/game-config-templates` | Modèles de configuration (historique, préremplissage). |
| `game_config_template_players` | `/v1/game-config-template-players` | Joueurs / sièges associés à un modèle. |

Le client mobile utilise **`getTypedSupabaseClient()`** avec la clé **anon** et les politiques **RLS**, ou uniquement l’**API HTTPS** selon le déploiement.
