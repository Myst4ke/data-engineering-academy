# Data Dojo 🥋 - Development Plan
*L'art de la transformation de données*

---

## 1. Homescreen Design

### Layout
```
┌─────────────────────────────────────────────────────────┐
│                    🥋 DATA DOJO                         │
│           L'art de la transformation de données         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⭐ DÉBUTANT (5/6 ✓)           [Unlock All Toggle]     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                  │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │                  │
│  │ ✓ │ │ ✓ │ │ ✓ │ │ ✓ │ │ ✓ │ │   │                  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                  │
│                                                         │
│  ⭐⭐ INTERMÉDIAIRE (0/6) 🔒                            │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                  │
│  │ 7 │ │ 8 │ │ 9 │ │10 │ │11 │ │12 │                  │
│  │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│                  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                  │
│                                                         │
│  ⭐⭐⭐ EXPERT (0/6) 🔒                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                  │
│  │13 │ │14 │ │15 │ │16 │ │17 │ │18 │                  │
│  │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│ │ 🔒│                  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                  │
│                                                         │
│              Progression: 5/18 exercices                │
└─────────────────────────────────────────────────────────┘
```

### Features
- Exercise cards show: number, title, completion status
- Hover shows exercise description
- Click to start exercise
- Locked tiers show lock icon, grayed out
- Toggle "Tout débloquer" for testing

---

## 2. Transformation Cards (10 total)

### Current Cards (6)
1. `drop_duplicates` - Supprimer les doublons 🔄
2. `sort` - Trier ↕️
3. `delete` - Supprimer une colonne 🗑️
4. `delete_na` - Supprimer les lignes vides 🧹
5. `filter` - Filtrer 🔍
6. `join` - Joindre 🔗

### New Cards (4)
7. `rename` - Renommer une colonne ✏️ (Pink)
8. `select` - Sélectionner des colonnes ✅ (Teal)
9. `fill_na` - Remplir les vides 🔧 (Slate)
10. `concat` - Concaténer les tables ⬇️ (Lime)

---

## 3. Exercise Plan (18 total)

### ⭐ DÉBUTANT (6 exercises) - Single card solutions

| # | ID | Title | Cards Used | Data Theme |
|---|-----|-------|------------|------------|
| 1 | ex-01 | Doublons Articles | drop_duplicates | Produits |
| 2 | ex-02 | Données Complètes | delete_na | Clients |
| 3 | ex-03 | Tri par Prix | sort | Prix |
| 4 | ex-04 | Colonne Inutile | delete | Employés |
| 5 | ex-05 | Filtrer Actifs | filter | Statuts |
| 6 | ex-06 | Renommer Colonne | rename | Inventaire |

### ⭐⭐ INTERMÉDIAIRE (6 exercises) - 2-3 cards

| # | ID | Title | Cards Used | Data Theme |
|---|-----|-------|------------|------------|
| 7 | ex-07 | Nettoyage Complet | drop_duplicates + delete_na | Commandes |
| 8 | ex-08 | Tri Filtré | filter + sort | Ventes |
| 9 | ex-09 | Sélection Nette | select + sort | RH |
| 10 | ex-10 | Remplir Vides | fill_na + filter | Stock |
| 11 | ex-11 | Fusion Tables | join | Produits-Prix |
| 12 | ex-12 | Multi-Suppression | delete + delete + drop_duplicates | Rapports |

### ⭐⭐⭐ EXPERT (6 exercises) - 3+ cards

| # | ID | Title | Cards Used | Data Theme |
|---|-----|-------|------------|------------|
| 13 | ex-13 | Pipeline Complet | drop_duplicates + delete_na + sort + filter | Analytics |
| 14 | ex-14 | Fusion Avancée | join + delete + sort | Multi-tables |
| 15 | ex-15 | ETL Basique | select + rename + fill_na + sort | Migration |
| 16 | ex-16 | Nettoyage Pro | delete_na + drop_duplicates + filter + delete | Big Data |
| 17 | ex-17 | Union & Clean | concat + drop_duplicates + sort | Consolidation |
| 18 | ex-18 | Master Data | join + select + rename + sort + filter | Challenge Final |

---

## 4. Progress System

### localStorage Structure
```json
{
  "dataDojo": {
    "completed": ["ex-01", "ex-02", "ex-05"],
    "unlockAll": false
  }
}
```

### Unlock Logic
- DÉBUTANT: Always unlocked
- INTERMÉDIAIRE: Unlock when all 6 DÉBUTANT completed (or unlockAll)
- EXPERT: Unlock when all 6 INTERMÉDIAIRE completed (or unlockAll)

---

## 5. Implementation Order

1. ✅ Git repo initialized
2. [ ] Add 4 new transformation cards
3. [ ] Create HomeScreen component
4. [ ] Implement progress saving (localStorage)
5. [ ] Add unlock system with toggle
6. [ ] Create all 18 exercises
7. [ ] Test and polish
8. [ ] Final commit

---

## File Structure

```
src/
├── components/
│   ├── HomeScreen.jsx      # Main menu
│   ├── ExerciseCard.jsx    # Exercise tile
│   ├── Card.jsx
│   ├── Pipeline.jsx
│   └── ...
├── utils/
│   ├── progress.js         # localStorage helpers
│   ├── cardDefinitions.js  # All 10 cards
│   └── csvParser.js
└── App.jsx                 # Routing: home vs game

public/exercises/
├── ex-01/ through ex-18/   # All 18 exercises
```
