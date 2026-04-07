# Architecture des dossiers

| Chemin            | Rôle                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `src/screens/`    | Écrans plein écran rattachés à la navigation.                                                 |
| `src/components/` | Composants réutilisables entre plusieurs écrans.                                              |
| `src/navigation/` | Définition des navigateurs (onglets, piles) et types de routes.                               |
| `src/data/`       | Couche d’accès aux données (clients, DTO, synchronisation). Voir [DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md). |
| `src/domain/`     | Modèles et parseurs alignés sur les tables Supabase / Postgres. Voir [SUPABASE.md](./SUPABASE.md).               |
| `src/context/`    | État partagé (session de partie, brouillon de configuration).                                   |
| `src/services/`   | Accès API spécialisés et persistance locale (ex. dernière configuration).                     |
| `src/utils/`      | Helpers génériques (formatage, validation légère).                                            |
| `src/config/`     | Variables d’environnement exposées à l’app et constantes non sensibles (voir `.env.example`). |
| `__tests__/`      | Tests Jest alignés sur les modules testés.                                                    |

Les secrets (clés API privées, chaînes de connexion base de données) ne doivent pas être placés dans le client mobile ; ils relèvent d’un backend ou d’`EXPO_PUBLIC_*` uniquement pour des valeurs non sensibles.
