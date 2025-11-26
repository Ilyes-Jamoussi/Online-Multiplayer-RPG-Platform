#!/usr/bin/env node

/**
 * Cross-platform script to detect unnecessary files tracked in git.
 * Mirrors the previous Bash implementation so it can run on any OS.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

const runGit = (args) => {
    const { stdout, error, status, stderr } = spawnSync('git', ['ls-files', ...args], { encoding: 'utf8' });
    if (error) {
        throw error;
    }
    if (status !== 0) {
        throw new Error(stderr.trim() || 'git ls-files failed');
    }
    return stdout.trim();
};

const isTracked = (targetPath) => runGit(['--', targetPath]).length > 0;
const trackedFiles = runGit([]).split(/\r?\n/).filter(Boolean);
const reportLines = [];
let errors = 0;

const report = (message, details) => {
    reportLines.push(`❌ [ERROR] ${message}`);
    if (details?.length) {
        reportLines.push(details.join('\n'));
    }
    errors += 1;
};

console.log('Vérification des fichiers inutiles dans le repository Git...\n');

[
    { path: 'node_modules/', message: 'Dossier node_modules tracké dans git' },
    { path: 'client/node_modules/', message: 'Dossier client/node_modules tracké dans git' },
    { path: 'server/node_modules/', message: 'Dossier server/node_modules tracké dans git' },
    { path: 'coverage/', message: 'Dossier coverage tracké dans git' },
    { path: 'client/coverage/', message: 'Dossier client/coverage tracké dans git' },
    { path: 'server/coverage/', message: 'Dossier server/coverage tracké dans git' },
    { path: 'dist/', message: 'Dossier dist tracké dans git' },
    { path: 'client/dist/', message: 'Dossier client/dist tracké dans git' },
    { path: 'server/out/', message: 'Dossier server/out tracké dans git' },
    { path: 'client/.angular/', message: 'Dossier client/.angular tracké dans git' },
].forEach(({ path: target, message }) => {
    if (isTracked(target)) {
        report(message);
    }
});

const findTracked = (regex) => trackedFiles.filter((file) => regex.test(file));

const logFiles = findTracked(/\.log$/i);
if (logFiles.length) {
    report('Fichiers .log trackés dans git:', logFiles);
}

const tempFiles = findTracked(/\.(tmp|temp)$/i);
if (tempFiles.length) {
    report('Fichiers temporaires trackés dans git:', tempFiles);
}

const backupFiles = findTracked(/(~|\.bak)$/i);
if (backupFiles.length) {
    report('Fichiers de backup trackés dans git:', backupFiles);
}

const dsStoreFiles = findTracked(/\.DS_Store$/);
if (dsStoreFiles.length) {
    report('Fichiers .DS_Store trackés dans git:', dsStoreFiles);
}

const rootPackageJsonPath = path.join(repoRoot, 'package.json');
if (fs.existsSync(rootPackageJsonPath) && isTracked('package.json')) {
    report('package.json tracké à la racine du projet');
}

if (reportLines.length) {
    console.log(reportLines.join('\n'));
    console.log(`\n❌ ${errors} problème(s) détecté(s)`);
    process.exit(1);
}

console.log('✅ Aucun fichier inutile tracké dans git');

