# Plan de Developpement - Data Transformation Learning Tool

## Resume du Projet

Site web educatif en francais pour apprendre les transformations de donnees.
Les utilisateurs transforment une table de depart pour atteindre une table cible en utilisant des cartes de transformation.

## Decisions Techniques

- **Framework**: React + Vite (rapide, composants reutilisables, hot reload)
- **Styling**: Tailwind CSS (prototypage rapide, design moderne)
- **Interaction**: Clic pour ajouter les cartes au pipeline
- **Parametres**: Pre-configures dans chaque exercice
- **Validation**: Automatique quand le resultat correspond a la cible

---

## Architecture du Projet

```
dej-data-demo/
├── public/
│   └── exercises/           # Exercices charges dynamiquement
│       ├── exercice-1/
│       │   ├── config.json  # Metadata + cartes disponibles
│       │   ├── input.csv    # Table de depart
│       │   └── output.csv   # Table cible
│       ├── exercice-2/
│       └── exercice-3/
│           ├── config.json
│           ├── input.csv
│           ├── input2.csv   # Table secondaire (pour join)
│           └── output.csv
├── src/
│   ├── components/
│   │   ├── TableView.jsx         # Affichage de table avec highlight
│   │   ├── Card.jsx              # Carte de transformation
│   │   ├── CardInfo.jsx          # Popup d'information
│   │   ├── Pipeline.jsx          # Zone du pipeline actif
│   │   ├── ExerciseSelector.jsx  # Selection d'exercice
│   │   └── SuccessModal.jsx      # Modal de victoire
│   ├── transformations/
│   │   └── index.js              # Logique des 6 transformations
│   ├── hooks/
│   │   └── useExercise.js        # Chargement exercice + etat
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## Structure des Fichiers d'Exercice

### config.json
```json
{
  "id": "exercice-1",
  "title": "Nettoyage de donnees articles",
  "description": "Supprimez les lignes vides et filtrez les articles actifs",
  "difficulty": 1,
  "availableCards": [
    {
      "type": "delete_na",
      "id": "card-1"
    },
    {
      "type": "filter",
      "id": "card-2",
      "params": {
        "column": "Article dormant",
        "value": "NON"
      }
    },
    {
      "type": "delete",
      "id": "card-3",
      "params": {
        "column": "Article dormant"
      }
    }
  ],
  "hasSecondTable": false
}
```

---

## Les 6 Cartes de Transformation

| Carte | Description | Parametres |
|-------|-------------|------------|
| `drop_duplicates` | Supprime les doublons de lignes | Aucun |
| `sort` | Trie par colonne | `column`, `order` (asc/desc) |
| `delete` | Supprime une colonne | `column` |
| `delete_na` | Supprime lignes avec cellules vides | Aucun |
| `filter` | Filtre sur une valeur | `column`, `value` |
| `join` | Joint deux tables | `column` |

---

## Composants UI Principaux

### 1. Layout Principal
```
┌─────────────────────────────────────────────────────────────┐
│  Logo    Selecteur d'exercice                     [FR]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ TABLE DEPART    │    │ TABLE CIBLE     │                │
│  │                 │    │  (objectif)     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ CARTES DISPONIBLES                                [?]  ││
│  │  [drop_dup] [sort] [delete] [delete_na] [filter] [join]││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PIPELINE (cliquez sur les cartes ci-dessus)            ││
│  │  [carte 1] → [carte 2] → [carte 3]     [Reinitialiser] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ RESULTAT ACTUEL                         ✓ ou ✗         ││
│  │ (table transformee en temps reel)                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Carte de Transformation
- Icone representative
- Nom en francais
- Badge avec parametres pre-configures (ex: "Colonne: TVA")
- Bouton info (i) ouvrant un popup
- Etat: disponible / utilisee dans pipeline

### 3. Popup Information
- Titre de la carte
- Description detaillee
- Exemple visuel (avant/apres)
- Bouton fermer

### 4. Validation Automatique
- Comparaison cellule par cellule
- Indicateur visuel: bordure verte si match, rouge sinon
- Animation de succes quand exercice complete

---

## Etapes d'Implementation

### Phase 1: Setup et Structure
- [ ] Initialiser projet Vite + React
- [ ] Configurer Tailwind CSS
- [ ] Creer structure de dossiers
- [ ] Creer les 3 exercices en CSV + config.json

### Phase 2: Composants de Base
- [ ] TableView - affichage de table responsive
- [ ] Card - carte cliquable avec info
- [ ] CardInfo - modal popup explicatif
- [ ] Pipeline - liste ordonnee de cartes actives

### Phase 3: Logique de Transformation
- [ ] Implementer les 6 fonctions de transformation
- [ ] Parser CSV vers objets JavaScript
- [ ] Comparer deux tables (validation)

### Phase 4: Integration
- [ ] Hook useExercise pour charger exercices
- [ ] Wiring: clic carte → ajout pipeline → transformation
- [ ] Validation automatique en temps reel

### Phase 5: Polish
- [ ] Animations de transition sur les tables
- [ ] Modal de succes
- [ ] Selecteur d'exercice
- [ ] Tests manuels des 3 exercices

---

## Format CSV des Exercices

### Exercice 1 - input.csv
```csv
Article SKU,Famille d'article,Prix de l'article,Article dormant
ABC,Stellair,125 €,NON
DEF,Logiciels,750 €,NON
ABC,Stellair,75 €,OUI
XXX,,,
```

### Exercice 1 - output.csv
```csv
Article SKU,Famille d'article,Prix de l'article
ABC,Stellair,125 €
DEF,Logiciels,750 €
ABC,Stellair,75 €
```

---

## Ajout Facile de Nouveaux Exercices

Pour ajouter un exercice:
1. Creer un dossier dans `public/exercises/exercice-N/`
2. Ajouter `input.csv` (table de depart)
3. Ajouter `output.csv` (table cible)
4. Ajouter `config.json` avec les cartes disponibles
5. (Optionnel) `input2.csv` pour les exercices avec join

L'application detecte automatiquement les nouveaux exercices.

---

## Questions Ouvertes

1. **Design visuel**: Voulez-vous des couleurs specifiques ou un theme particulier ?
2. **Animations**: Souhaitez-vous des animations elaborees ou un style simple/epure ?
3. **Logo/Branding**: Avez-vous un logo ou nom pour l'outil ?
