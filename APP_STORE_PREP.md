# App Store Prep - Flag Master

## Etat actuel
- Gameplay principal mobile teste par le proprietaire: OK.
- Xcode / Capacitor: `npx cap sync` OK.
- Firebase Auth: OK.
- Admin: migration preparee vers `/admins/{uid}` au lieu d'un email hardcode.
- Haptics iOS: confirme OK sur appareil.
- Nouvelle DA Adventure Pop: validee sur mobile.
- Boutique: skins Terry visibles, decors achetables/equipables depuis Boutique > Decors.
- Nom release: `Flag Master` dans Capacitor et iOS.
- `armv7` retire de `Info.plist`.
- Shuffle remplace par Fisher-Yates.
- CSS release: `--green` defini et poids `font-weight: 1000` normalises.

## Firebase admin a valider dans la console
- Publier les regles de `firestore.rules` dans Firebase Console > Firestore > Rules.
- Creer le document `admins/TQvhA4NC7LavR7NOjBSk2DokTWC3`.
- Champs conseilles: `active: true`, `role: "owner"`.
- Ne pas mettre d'email admin dans le code client.

## A finir avant soumission
- Captures App Store iPhone 6.7" et 6.5" avec la nouvelle DA.
- Icone App Store 1024 x 1024 sans transparence.
- Ajouter une politique de confidentialite publique si Firebase reste actif.
- Tester un compte neuf: invite, inscription, connexion, stats, boutique, achat/equipement, haptics.
- Tester un compte non-admin pour confirmer qu'aucun outil admin n'apparait.
- Tester hors ligne: lancement, mode invite, message clair si Firebase indisponible.
- Verifier poids final et espace disque avant archive Xcode.

## Documents prets
- `APP_STORE_LISTING.md` - textes App Store, mots-cles, categorie, notes reviewer.
- `PRIVACY_POLICY.md` - politique de confidentialite prete a publier.
- `SUPPORT.md` - contenu support a publier.
- `QA_TEST_PLAN.md` - plan de test final.
- `ROADMAP.md` - feuille de route produit.

## In-App Purchases a creer dans App Store Connect
- `com.akatsuki.flagmaster.coins.small` - consommable - 150 Globe-Coins - 0,99 EUR.
- `com.akatsuki.flagmaster.coins.medium` - consommable - 500 Globe-Coins - 2,99 EUR.
- `com.akatsuki.flagmaster.coins.large` - consommable - 1200 Globe-Coins - 5,99 EUR.
- `com.akatsuki.flagmaster.pack.capitals` - non consommable - Carnet des Capitales - 1,99 EUR.
- `com.akatsuki.flagmaster.pack.gallery` - non consommable - Galerie bonus - 1,99 EUR.

## StoreKit a brancher plus tard
- Ajouter le plugin natif d'achat integre ou une integration StoreKit compatible Capacitor.
- Relier `startIapPurchase(storeId)` a l'achat StoreKit reel.
- Relier `restorePurchases()` a la restauration des non-consommables.
- Appeler `grantIapProduct(storeId)` uniquement apres confirmation d'achat Apple.

## Assets a renforcer
- Remplacer les derniers decors temporaires par des images optimisees finales.
- Preparer 3 a 5 skins premium futurs, sans reference directe a des licences externes.
