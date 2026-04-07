# Stratégie de tests

## Règles

- Chaque évolution fonctionnelle doit inclure des tests automatisés couvrant le comportement ajouté ou modifié.
- Une fonctionnalité n’est considérée comme livrée que si la suite de tests associée passe à **100 %**.
- Les tests doivent être **déterministes** et rejouables via `npm test` sans étape manuelle.

## Commandes

| Commande           | Rôle                                                        |
| ------------------ | ----------------------------------------------------------- |
| `npm test`         | Exécute Jest (preset `jest-expo`).                          |
| `npm run lint`     | Vérifie ESLint sur le dépôt.                                |
| `npm run validate` | Enchaîne lint puis tests : seuil attendu avant intégration. |

## Périmètre

- **Unitaires / composants** : écrans et logique avec `@testing-library/react-native`.
- **Modules purs** : fonctions de configuration et utilitaires testées sans rendu UI lorsque possible.

Les tests d’UI qui dépendent du pipeline CSS Tailwind complet peuvent cibler les props `className` là où la résolution runtime n’est pas disponible sous Jest.
