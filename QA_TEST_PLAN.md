# Plan de Test Final - FlagMaster

## Smoke test obligatoire
- Lancer l'app après installation propre.
- Jouer en invité.
- Lancer une partie Solo classique.
- Répondre juste et faux.
- Vérifier haptics sur bonne/mauvaise réponse.
- Arriver à l'écran de fin.
- Vérifier mission suivante, coins et bouton boutique.
- Retour accueil.

## Accueil
- Vérifier que seuls `Solo` et `Multijoueur local` apparaissent.
- En multijoueur local, tester 2, 3 et 4 joueurs.
- Lancer une partie multi avec noms vides: les noms doivent devenir `Joueur 1`, `Joueur 2`, etc.
- Tester Classique, Chrono, Survie.
- Tester Facile, Moyen, Difficile.
- Ouvrir Zone et réponses, changer zone et 4/6 réponses.

## Boutique
- Ouvrir Boutique depuis l'accueil.
- Vérifier le solde de Globe-Coins.
- Vérifier Décors, Tenues Terry, Bonus, Galerie.
- Équiper chaque décor premium et confirmer que le fond change.
- Équiper plusieurs skins Terry.
- Vérifier packs Globe-Coins, packs premium et bouton Restaurer achats.
- Vérifier qu'aucun vrai paiement ne se déclenche tant que StoreKit n'est pas branché.

## Compte et Firebase
- Tester mode invité.
- Créer un compte neuf.
- Se connecter.
- Jouer une partie.
- Quitter/revenir et vérifier la progression.
- Tester compte non-admin: aucun outil admin ne doit apparaître.
- Tester mauvais mot de passe: message clair.

## Hors ligne
- Couper le réseau.
- Lancer l'app.
- Jouer en invité.
- Vérifier que l'app reste utilisable sans Firebase.
- Vérifier que la connexion affiche un message clair si indisponible.

## App Store
- Vérifier icône dans Xcode.
- Vérifier splash screen sur appareil.
- Vérifier absence de warnings bloquants Xcode.
- Vérifier poids de l'app.
- Faire captures iPhone 6.7 pouces et 6.5 pouces.
- Vérifier privacy/support URLs avant soumission.

## Régression rapide après chaque `npx cap sync`
- `node --check www/app.js`
- `npx cap sync`
- `node --check ios/App/App/public/app.js`
- Supprimer/déplacer les fichiers `._*` créés sur disque externe.
