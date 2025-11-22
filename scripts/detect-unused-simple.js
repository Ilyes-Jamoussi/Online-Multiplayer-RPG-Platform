#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CLIENT_SRC = path.join(__dirname, '../client/src/app');
const SERVER_SRC = path.join(__dirname, '../server/app');

function getAllFiles(dir, extensions = ['.ts', '.html']) {
    const files = [];
    
    function traverse(currentDir) {
        if (!fs.existsSync(currentDir)) return;
        
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
                traverse(fullPath);
            } else if (extensions.some(ext => item.endsWith(ext)) && !item.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

function extractMembers(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const members = [];
    
    // Propriétés et méthodes publiques/privées
    const patterns = [
        /^\s*(?:private|protected|public)?\s*(?:readonly\s+)?(\w+):\s*[^=;]+[;=]/gm,
        /^\s*(?:private|protected|public)?\s*(\w+)\s*\([^)]*\)\s*[:{]/gm,
        /^\s*(?:private|protected|public)?\s*get\s+(\w+)\s*\(\)/gm,
        /^\s*(?:private|protected|public)?\s*set\s+(\w+)\s*\(/gm
    ];
    
    patterns.forEach(regex => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const name = match[1];
            if (name && !name.startsWith('ng') && !name.startsWith('_')) {
                members.push({ name, file: filePath });
            }
        }
    });
    
    return members;
}

function isUsedInFile(memberName, filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const patterns = [
        new RegExp(`\\b${memberName}\\b`, 'g'),
        new RegExp(`this\\.${memberName}\\b`, 'g')
    ];
    
    return patterns.some(pattern => pattern.test(content));
}

function analyzeUsage() {
    console.log('🔍 DÉTECTION DES MEMBRES INUTILISÉS\n');
    
    const allFiles = [...getAllFiles(CLIENT_SRC), ...getAllFiles(SERVER_SRC)];
    const tsFiles = allFiles.filter(f => f.endsWith('.ts') && !f.includes('.spec.ts'));
    const testFiles = allFiles.filter(f => f.includes('.spec.ts'));
    const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
    
    console.log(`📁 Fichiers: ${tsFiles.length} TS, ${testFiles.length} tests, ${htmlFiles.length} HTML\n`);
    
    let allMembers = [];
    tsFiles.forEach(file => {
        allMembers = allMembers.concat(extractMembers(file));
    });
    
    const results = {
        unused: [],
        testOnly: []
    };
    
    allMembers.forEach(member => {
        const otherTsFiles = tsFiles.filter(f => f !== member.file);
        const usedInTs = otherTsFiles.some(f => isUsedInFile(member.name, f));
        const usedInHtml = htmlFiles.some(f => isUsedInFile(member.name, f));
        const usedInTests = testFiles.some(f => isUsedInFile(member.name, f));
        
        if (!usedInTs && !usedInHtml) {
            if (usedInTests) {
                results.testOnly.push(member);
            } else {
                results.unused.push(member);
            }
        }
    });
    
    return results;
}

function printResults(results) {
    console.log('🔴 MEMBRES COMPLÈTEMENT INUTILISÉS:');
    results.unused.forEach(member => {
        const relativePath = path.relative(process.cwd(), member.file);
        console.log(`  ❌ ${member.name} dans ${relativePath}`);
    });
    
    console.log('\n🟠 UTILISÉS UNIQUEMENT DANS LES TESTS:');
    results.testOnly.forEach(member => {
        const relativePath = path.relative(process.cwd(), member.file);
        console.log(`  🧪 ${member.name} dans ${relativePath}`);
    });
    
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   • Inutilisés: ${results.unused.length}`);
    console.log(`   • Tests uniquement: ${results.testOnly.length}`);
    console.log(`   • Total problématique: ${results.unused.length + results.testOnly.length}`);
}

if (require.main === module) {
    const results = analyzeUsage();
    printResults(results);
}
