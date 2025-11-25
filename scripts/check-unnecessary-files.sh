#!/bin/bash

# Script pour détecter les fichiers/dossiers inutiles TRACKÉS dans git

echo "Vérification des fichiers inutiles dans le repository Git..."
echo ""

ERRORS=0

# Fonction pour vérifier si un chemin est tracké par git
is_tracked() {
    git ls-files "$1" 2>/dev/null | grep -q .
}

# Vérifier node_modules
if is_tracked "node_modules/"; then
    echo "❌ [ERROR] Dossier node_modules tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "client/node_modules/"; then
    echo "❌ [ERROR] Dossier client/node_modules tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "server/node_modules/"; then
    echo "❌ [ERROR] Dossier server/node_modules tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier coverage
if is_tracked "coverage/"; then
    echo "❌ [ERROR] Dossier coverage tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "client/coverage/"; then
    echo "❌ [ERROR] Dossier client/coverage tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "server/coverage/"; then
    echo "❌ [ERROR] Dossier server/coverage tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier dist/out
if is_tracked "dist/"; then
    echo "❌ [ERROR] Dossier dist tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "client/dist/"; then
    echo "❌ [ERROR] Dossier client/dist tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

if is_tracked "server/out/"; then
    echo "❌ [ERROR] Dossier server/out tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier .angular
if is_tracked "client/.angular/"; then
    echo "❌ [ERROR] Dossier client/.angular tracké dans git"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier fichiers de log trackés
LOG_FILES=$(git ls-files | grep "\.log$")
if [ -n "$LOG_FILES" ]; then
    echo "❌ [ERROR] Fichiers .log trackés dans git:"
    echo "$LOG_FILES"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier fichiers temporaires trackés
TEMP_FILES=$(git ls-files | grep -E "\.(tmp|temp)$")
if [ -n "$TEMP_FILES" ]; then
    echo "❌ [ERROR] Fichiers temporaires trackés dans git:"
    echo "$TEMP_FILES"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier fichiers de backup trackés
BACKUP_FILES=$(git ls-files | grep -E "(~|\.bak)$")
if [ -n "$BACKUP_FILES" ]; then
    echo "❌ [ERROR] Fichiers de backup trackés dans git:"
    echo "$BACKUP_FILES"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier .DS_Store trackés
DS_STORE=$(git ls-files | grep "\.DS_Store$")
if [ -n "$DS_STORE" ]; then
    echo "❌ [ERROR] Fichiers .DS_Store trackés dans git:"
    echo "$DS_STORE"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier package.json à la racine
if is_tracked "package.json" && [ -f "package.json" ]; then
    echo "❌ [ERROR] package.json tracké à la racine du projet"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Aucun fichier inutile tracké dans git"
    exit 0
else
    echo "❌ $ERRORS problème(s) détecté(s)"
    exit 1
fi
