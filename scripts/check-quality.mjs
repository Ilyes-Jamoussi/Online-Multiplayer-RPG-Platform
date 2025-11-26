#!/usr/bin/env node

/**
 * Cross-platform equivalent of scripts/check-quality.sh.
 * Runs the same repository quality checks without requiring a POSIX shell.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const clientDir = path.join(repoRoot, 'client');
const isWindows = process.platform === 'win32';

const runCommand = (command, args, options = {}) => {
    const result = spawnSync(command, args, {
        cwd: options.cwd ?? repoRoot,
        encoding: 'utf8',
        shell: isWindows,
    });

    if (result.error) {
        throw result.error;
    }

    return result;
};

const runNodeScript = (scriptPath) => runCommand('node', [scriptPath], { cwd: repoRoot });
const runClientNpm = (scriptName) => runCommand('npm', ['run', scriptName], { cwd: clientDir });

const extractMatches = (output, regex) =>
    output
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter((line) => regex.test(line));

let errors = 0;

const logHeader = () => {
    console.log('==========================================');
    console.log('   VÉRIFICATION QUALITÉ DU CODE');
    console.log('==========================================\n');
};

const logSection = (message) => {
    console.log(message);
};

const handleFailureOutput = (result) => {
    const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    if (combined) {
        console.log(combined);
    }
};

const runUnnecessaryFilesCheck = () => {
    logSection('📁 Fichiers inutiles...');
    const result = runNodeScript('./scripts/check-unnecessary-files.mjs');
    if (result.status === 0) {
        console.log('✅ OK\n');
        return;
    }
    handleFailureOutput(result);
    errors += 1;
    console.log('');
};

const runUnusedMembersCheck = () => {
    logSection('🔍 Membres inutilisés...');
    const result = runClientNpm('check:unused-members');
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    const matches = extractMatches(output, /\[(?:UNUSED|ONLY-TESTS)\]/);

    if (result.status !== 0) {
        handleFailureOutput(result);
        errors += 1;
    } else if (matches.length === 0) {
        console.log('✅ OK');
    } else {
        console.log(matches.join('\n'));
        errors += 1;
    }
    console.log('');
};

const runUnusedMethodsCheck = () => {
    logSection('🔍 Méthodes inutilisées...');
    const result = runClientNpm('check:unused-methods');
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    const matches = extractMatches(output, /\[(?:UNUSED|ONLY-TESTS)\]/);

    if (result.status !== 0) {
        handleFailureOutput(result);
        errors += 1;
    } else if (matches.length === 0) {
        console.log('✅ OK');
    } else {
        console.log(matches.join('\n'));
        errors += 1;
    }
    console.log('');
};

const runDuplicateMethodsCheck = () => {
    logSection('🔍 Méthodes dupliquées...');
    const result = runClientNpm('check:duplicate-methods');
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    const matches = extractMatches(output, /\[DUPLICATE\]/);

    if (result.status !== 0) {
        handleFailureOutput(result);
        errors += 1;
    } else if (matches.length === 0) {
        console.log('✅ OK');
    } else {
        console.log('⚠️  Détectées:');
        console.log(matches.join('\n'));
    }
    console.log('');
};

const summarize = () => {
    if (errors === 0) {
        process.exit(0);
    }

    console.log(`❌ ${errors} CHECK(S) ONT ÉCHOUÉ`);
    process.exit(1);
};

logHeader();
runUnnecessaryFilesCheck();
runUnusedMembersCheck();
runUnusedMethodsCheck();
runDuplicateMethodsCheck();
summarize();

