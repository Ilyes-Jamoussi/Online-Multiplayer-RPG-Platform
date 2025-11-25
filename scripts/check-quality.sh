#!/bin/bash

# Script centralisé pour vérifier la qualité du code

echo "=========================================="
echo "   VÉRIFICATION QUALITÉ DU CODE"
echo "=========================================="
echo ""

ERRORS=0

# 1. Vérifier les fichiers inutiles
echo "📁 Fichiers inutiles..."
if ./scripts/check-unnecessary-files.sh > /dev/null 2>&1; then
    echo "✅ OK"
else
    ./scripts/check-unnecessary-files.sh
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Vérifier les membres inutilisés (client)
echo "🔍 Membres inutilisés..."
cd client
UNUSED_MEMBERS=$(npm run check:unused-members 2>&1 | grep -E "\[UNUSED\]|\[ONLY-TESTS\]")
if [ -z "$UNUSED_MEMBERS" ]; then
    echo "✅ OK"
else
    echo "$UNUSED_MEMBERS"
    ERRORS=$((ERRORS + 1))
fi
cd ..
echo ""

# 3. Vérifier les méthodes inutilisées (client)
echo "🔍 Méthodes inutilisées..."
cd client
UNUSED_METHODS=$(npm run check:unused-methods 2>&1 | grep -E "\[UNUSED\]|\[ONLY-TESTS\]")
if [ -z "$UNUSED_METHODS" ]; then
    echo "✅ OK"
else
    echo "$UNUSED_METHODS"
    ERRORS=$((ERRORS + 1))
fi
cd ..
echo ""

# 4. Vérifier les méthodes dupliquées (client)
echo "🔍 Méthodes dupliquées..."
cd client
DUPLICATE_METHODS=$(npm run check:duplicate-methods 2>&1 | grep -E "\[DUPLICATE\]")
if [ -z "$DUPLICATE_METHODS" ]; then
    echo "✅ OK"
else
    echo "⚠️  Détectées:"
    echo "$DUPLICATE_METHODS"
fi
cd ..
echo ""

# Résumé
if [ $ERRORS -eq 0 ]; then
    exit 0
else
    echo ""
    echo "❌ $ERRORS CHECK(S) ONT ÉCHOUÉ"
    exit 1
fi
