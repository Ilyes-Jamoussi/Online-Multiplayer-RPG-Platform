#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CLIENT_SRC = path.join(__dirname, '../client/src/app');
const SERVER_SRC = path.join(__dirname, '../server/app');

// Patterns à ignorer
const IGNORE_PATTERNS = [
    /constructor/,
    /ngOnInit|ngOnDestroy|ngAfterViewInit|ngOnChanges/,
    /@Input|@Output|@ViewChild|@HostListener/,
    /get\s+\w+\(\)|set\s+\w+\(/,
];

function getAllTsFiles(dir) {
    const files = [];
    
    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.includes('node_modules')) {
                traverse(fullPath);
            } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

function extractPublicMembers(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const members = [];
    
    // Regex pour propriétés et méthodes publiques
    const patterns = [
        /^\s*(readonly\s+)?(\w+):\s*[^=;]+[;=]/gm, // propriétés
        /^\s*(\w+)\([^)]*\):\s*[^{]+\{/gm, // méthodes
        /^\s*get\s+(\w+)\(\)/gm, // getters
        /^\s*set\s+(\w+)\(/gm, // setters
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const memberName = match[1] || match[2];
            if (memberName && !memberName.startsWith('_') && !memberName.startsWith('ng')) {
                // Vérifier si ce n'est pas un pattern à ignorer
                const shouldIgnore = IGNORE_PATTERNS.some(ignorePattern => 
                    ignorePattern.test(match[0])
                );
                
                if (!shouldIgnore) {
                    members.push({
                        name: memberName,
                        line: match[0].trim(),
                        file: filePath
                    });
                }
            }
        }
    });
    
    return members;
}

function searchUsageInFiles(memberName, files, excludeFile) {
    const usages = [];
    
    for (const file of files) {
        if (file === excludeFile) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const isTestFile = file.includes('.spec.ts');
        
        // Chercher les usages
        const regex = new RegExp(`\\b${memberName}\\b`, 'g');
        const matches = content.match(regex);
        
        if (matches) {
            usages.push({
                file,
                count: matches.length,
                isTest: isTestFile
            });
        }
    }
    
    return usages;
}

function analyzeUsage(members, allFiles) {
    const results = {
        unused: [],
        testOnly: [],
        used: []
    };
    
    for (const member of members) {
        const usages = searchUsageInFiles(member.name, allFiles, member.file);
        
        if (usages.length === 0) {
            results.unused.push(member);
        } else {
            const nonTestUsages = usages.filter(u => !u.isTest);
            const testUsages = usages.filter(u => u.isTest);
            
            if (nonTestUsages.length === 0 && testUsages.length > 0) {
                results.testOnly.push({
                    ...member,
                    testUsages: testUsages.length
                });
            } else {
                results.used.push({
                    ...member,
                    totalUsages: usages.length,
                    testUsages: testUsages.length,
                    realUsages: nonTestUsages.length
                });
            }
        }
    }
    
    return results;
}

function generateReport(results) {
    console.log('🔍 ANALYSE DES PROPRIÉTÉS ET MÉTHODES INUTILISÉES\n');
    
    // Propriétés complètement inutilisées
    if (results.unused.length > 0) {
        console.log('❌ PROPRIÉTÉS/MÉTHODES INUTILISÉES:');
        results.unused.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  - ${relativePath}: ${member.name}`);
        });
        console.log('');
    }
    
    // Propriétés utilisées uniquement dans les tests
    if (results.testOnly.length > 0) {
        console.log('⚠️  UTILISÉES UNIQUEMENT DANS LES TESTS:');
        results.testOnly.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  - ${relativePath}: ${member.name} (${member.testUsages} usages test)`);
        });
        console.log('');
    }
    
    // Résumé
    console.log('📊 RÉSUMÉ:');
    console.log(`  - Inutilisées: ${results.unused.length}`);
    console.log(`  - Tests uniquement: ${results.testOnly.length}`);
    console.log(`  - Utilisées correctement: ${results.used.length}`);
    
    // Score de propreté
    const total = results.unused.length + results.testOnly.length + results.used.length;
    const clean = results.used.length;
    const cleanPercentage = total > 0 ? Math.round((clean / total) * 100) : 100;
    
    console.log(`\n🎯 SCORE DE PROPRETÉ: ${cleanPercentage}%`);
    
    if (results.unused.length > 0 || results.testOnly.length > 0) {
        console.log('\n💡 RECOMMANDATIONS:');
        console.log('  - Supprimer les propriétés/méthodes inutilisées');
        console.log('  - Réviser les propriétés utilisées uniquement dans les tests');
    }
}

// Exécution principale
function main() {
    console.log('🚀 Analyse en cours...\n');
    
    const clientFiles = getAllTsFiles(CLIENT_SRC);
    const serverFiles = getAllTsFiles(SERVER_SRC);
    const allFiles = [...clientFiles, ...serverFiles];
    
    console.log(`📁 Fichiers analysés: ${allFiles.length}`);
    
    let allMembers = [];
    
    // Extraire les membres de tous les fichiers
    for (const file of allFiles) {
        if (!file.includes('.spec.ts')) { // Ignorer les fichiers de test pour l'extraction
            const members = extractPublicMembers(file);
            allMembers = allMembers.concat(members);
        }
    }
    
    console.log(`🔍 Membres publics trouvés: ${allMembers.length}\n`);
    
    // Analyser l'usage
    const results = analyzeUsage(allMembers, allFiles);
    
    // Générer le rapport
    generateReport(results);
}

if (require.main === module) {
    main();
}

module.exports = { main };
