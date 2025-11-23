#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CLIENT_SRC = path.join(__dirname, '../client/src/app');
const SERVER_SRC = path.join(__dirname, '../server/app');

// Patterns Angular à ignorer automatiquement
const ANGULAR_LIFECYCLE = [
    'ngOnInit', 'ngOnDestroy', 'ngAfterViewInit', 'ngOnChanges', 'ngAfterViewChecked',
    'ngAfterContentInit', 'ngAfterContentChecked', 'ngDoCheck', 'ngOnDestroy'
];

const ANGULAR_DECORATORS = [
    '@Input', '@Output', '@ViewChild', '@ViewChildren', '@ContentChild', '@ContentChildren',
    '@HostListener', '@HostBinding'
];

function getAllFiles(dir, extensions = ['.ts', '.html', '.scss']) {
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

function extractMembersFromTypeScript(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const members = [];
    
    // Patterns pour extraire les membres
    const patterns = [
        // Propriétés avec types
        {
            regex: /^\s*(?:readonly\s+)?(\w+):\s*[^=;]+[;=]/gm,
            type: 'property'
        },
        // Méthodes
        {
            regex: /^\s*(\w+)\s*\([^)]*\)\s*:\s*[^{]+\{/gm,
            type: 'method'
        },
        // Getters
        {
            regex: /^\s*get\s+(\w+)\s*\(\)/gm,
            type: 'getter'
        },
        // Setters
        {
            regex: /^\s*set\s+(\w+)\s*\(/gm,
            type: 'setter'
        }
    ];
    
    patterns.forEach(({ regex, type }) => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const memberName = match[1];
            
            if (memberName && 
                !memberName.startsWith('_') && 
                !memberName.startsWith('ng') &&
                !ANGULAR_LIFECYCLE.includes(memberName)) {
                
                // Vérifier les décorateurs Angular
                const lineStart = content.lastIndexOf('\n', match.index);
                const previousLines = content.substring(Math.max(0, lineStart - 200), match.index);
                
                const hasAngularDecorator = ANGULAR_DECORATORS.some(decorator => 
                    previousLines.includes(decorator)
                );
                
                if (!hasAngularDecorator) {
                    members.push({
                        name: memberName,
                        type,
                        line: match[0].trim(),
                        file: filePath,
                        isPrivate: match[0].includes('private'),
                        isProtected: match[0].includes('protected')
                    });
                }
            }
        }
    });
    
    return members;
}

function searchInAllFiles(memberName, allFiles, excludeFile) {
    const usages = [];
    
    for (const file of allFiles) {
        if (file === excludeFile) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const isTestFile = file.includes('.spec.ts');
        const isHtmlFile = file.endsWith('.html');
        const isScssFile = file.endsWith('.scss');
        
        // Patterns de recherche selon le type de fichier
        let searchPatterns = [];
        
        if (isHtmlFile) {
            // Dans HTML : chercher dans les bindings, événements, interpolations
            searchPatterns = [
                new RegExp(`\\b${memberName}\\b`, 'g'), // usage général
                new RegExp(`\\(\\w+\\)="[^"]*${memberName}[^"]*"`, 'g'), // event binding
                new RegExp(`\\[\\w+\\]="[^"]*${memberName}[^"]*"`, 'g'), // property binding
                new RegExp(`{{[^}]*${memberName}[^}]*}}`, 'g'), // interpolation
                new RegExp(`\\*\\w+="[^"]*${memberName}[^"]*"`, 'g') // structural directives
            ];
        } else if (isScssFile) {
            // Dans SCSS : chercher les classes CSS qui pourraient correspondre
            searchPatterns = [
                new RegExp(`\\.${memberName}\\b`, 'g'),
                new RegExp(`#${memberName}\\b`, 'g')
            ];
        } else {
            // Dans TS : recherche standard
            searchPatterns = [
                new RegExp(`\\b${memberName}\\b`, 'g'),
                new RegExp(`this\\.${memberName}\\b`, 'g'),
                new RegExp(`\\$\\{.*${memberName}.*\\}`, 'g') // template literals
            ];
        }
        
        let totalMatches = 0;
        searchPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                totalMatches += matches.length;
            }
        });
        
        if (totalMatches > 0) {
            usages.push({
                file,
                count: totalMatches,
                isTest: isTestFile,
                isHtml: isHtmlFile,
                isScss: isScssFile
            });
        }
    }
    
    return usages;
}

function categorizeUsage(member, usages) {
    if (usages.length === 0) {
        return {
            category: 'unused',
            confidence: member.isPrivate ? 'high' : 'medium',
            reason: member.isPrivate ? 'Private member with no usages' : 'Public member with no detected usages'
        };
    }
    
    const testUsages = usages.filter(u => u.isTest);
    const htmlUsages = usages.filter(u => u.isHtml);
    const scssUsages = usages.filter(u => u.isScss);
    const tsUsages = usages.filter(u => !u.isTest && !u.isHtml && !u.isScss);
    
    // Utilisé uniquement dans les tests
    if (testUsages.length > 0 && tsUsages.length === 0 && htmlUsages.length === 0) {
        return {
            category: 'test-only',
            confidence: 'high',
            reason: `Used only in ${testUsages.length} test file(s)`,
            testCount: testUsages.length
        };
    }
    
    // Utilisé dans les templates HTML (probablement légitime)
    if (htmlUsages.length > 0) {
        return {
            category: 'used',
            confidence: 'high',
            reason: `Used in ${htmlUsages.length} HTML template(s)`,
            htmlCount: htmlUsages.length,
            tsCount: tsUsages.length,
            testCount: testUsages.length
        };
    }
    
    // Utilisé dans le code TypeScript
    if (tsUsages.length > 0) {
        return {
            category: 'used',
            confidence: 'high',
            reason: `Used in ${tsUsages.length} TypeScript file(s)`,
            tsCount: tsUsages.length,
            testCount: testUsages.length
        };
    }
    
    // Utilisé uniquement dans SCSS (possiblement inutile)
    if (scssUsages.length > 0 && tsUsages.length === 0 && htmlUsages.length === 0) {
        return {
            category: 'scss-only',
            confidence: 'medium',
            reason: `Used only in ${scssUsages.length} SCSS file(s)`,
            scssCount: scssUsages.length
        };
    }
    
    return {
        category: 'used',
        confidence: 'medium',
        reason: 'Has usages but unclear context'
    };
}

function analyzeProject() {
    console.log('🚀 ANALYSE COMPLÈTE DES MEMBRES INUTILISÉS\n');
    
    // Collecter tous les fichiers
    const clientFiles = getAllFiles(CLIENT_SRC);
    const serverFiles = getAllFiles(SERVER_SRC);
    const allFiles = [...clientFiles, ...serverFiles];
    
    console.log(`📁 Fichiers analysés: ${allFiles.length}`);
    console.log(`   - TypeScript: ${allFiles.filter(f => f.endsWith('.ts')).length}`);
    console.log(`   - HTML: ${allFiles.filter(f => f.endsWith('.html')).length}`);
    console.log(`   - SCSS: ${allFiles.filter(f => f.endsWith('.scss')).length}\n`);
    
    // Extraire les membres de tous les fichiers TS (sauf tests)
    let allMembers = [];
    const tsFiles = allFiles.filter(f => f.endsWith('.ts') && !f.includes('.spec.ts'));
    
    for (const file of tsFiles) {
        const members = extractMembersFromTypeScript(file);
        allMembers = allMembers.concat(members);
    }
    
    console.log(`🔍 Membres extraits: ${allMembers.length}\n`);
    
    // Analyser chaque membre
    const results = {
        unused: [],
        testOnly: [],
        scssOnly: [],
        used: []
    };
    
    let processed = 0;
    for (const member of allMembers) {
        const usages = searchInAllFiles(member.name, allFiles, member.file);
        const analysis = categorizeUsage(member, usages);
        
        const memberWithAnalysis = {
            ...member,
            ...analysis,
            usages
        };
        
        switch (analysis.category) {
            case 'unused':
                results.unused.push(memberWithAnalysis);
                break;
            case 'test-only':
                results.testOnly.push(memberWithAnalysis);
                break;
            case 'scss-only':
                results.scssOnly.push(memberWithAnalysis);
                break;
            default:
                results.used.push(memberWithAnalysis);
        }
        
        processed++;
        if (processed % 100 === 0) {
            console.log(`   Analysé: ${processed}/${allMembers.length}`);
        }
    }
    
    return results;
}

function generateDetailedReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DÉTAILLÉ');
    console.log('='.repeat(60));
    
    // Membres complètement inutilisés (haute confiance)
    const highConfidenceUnused = results.unused.filter(m => m.confidence === 'high');
    if (highConfidenceUnused.length > 0) {
        console.log('\n🔴 MEMBRES INUTILISÉS (HAUTE CONFIANCE):');
        highConfidenceUnused.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  ❌ ${relativePath}`);
            console.log(`     ${member.type}: ${member.name} (${member.reason})`);
        });
    }
    
    // Membres inutilisés (confiance moyenne)
    const mediumConfidenceUnused = results.unused.filter(m => m.confidence === 'medium');
    if (mediumConfidenceUnused.length > 0) {
        console.log('\n🟡 MEMBRES POSSIBLEMENT INUTILISÉS (VÉRIFIER MANUELLEMENT):');
        mediumConfidenceUnused.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  ⚠️  ${relativePath}`);
            console.log(`     ${member.type}: ${member.name} (${member.reason})`);
        });
    }
    
    // Utilisés uniquement dans les tests
    if (results.testOnly.length > 0) {
        console.log('\n🟠 UTILISÉS UNIQUEMENT DANS LES TESTS:');
        results.testOnly.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  🧪 ${relativePath}`);
            console.log(`     ${member.type}: ${member.name} (${member.testCount} test files)`);
        });
    }
    
    // Utilisés uniquement dans SCSS
    if (results.scssOnly.length > 0) {
        console.log('\n🟣 UTILISÉS UNIQUEMENT DANS SCSS:');
        results.scssOnly.forEach(member => {
            const relativePath = path.relative(process.cwd(), member.file);
            console.log(`  🎨 ${relativePath}`);
            console.log(`     ${member.type}: ${member.name} (${member.scssCount} SCSS files)`);
        });
    }
    
    // Statistiques finales
    console.log('\n' + '='.repeat(60));
    console.log('📈 STATISTIQUES FINALES');
    console.log('='.repeat(60));
    
    const total = results.unused.length + results.testOnly.length + results.scssOnly.length + results.used.length;
    const problematic = results.unused.length + results.testOnly.length;
    const cleanPercentage = total > 0 ? Math.round(((total - problematic) / total) * 100) : 100;
    
    console.log(`\n📊 Résumé:`);
    console.log(`   • Total analysé: ${total}`);
    console.log(`   • Inutilisés: ${results.unused.length} (${highConfidenceUnused.length} haute confiance)`);
    console.log(`   • Tests uniquement: ${results.testOnly.length}`);
    console.log(`   • SCSS uniquement: ${results.scssOnly.length}`);
    console.log(`   • Utilisés correctement: ${results.used.length}`);
    console.log(`\n🎯 Score de propreté: ${cleanPercentage}%`);
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (highConfidenceUnused.length > 0) {
        console.log(`   1. Supprimer ${highConfidenceUnused.length} membres inutilisés (haute confiance)`);
    }
    if (results.testOnly.length > 0) {
        console.log(`   2. Réviser ${results.testOnly.length} membres utilisés uniquement dans les tests`);
    }
    if (mediumConfidenceUnused.length > 0) {
        console.log(`   3. Vérifier manuellement ${mediumConfidenceUnused.length} membres possiblement inutilisés`);
    }
    if (results.scssOnly.length > 0) {
        console.log(`   4. Examiner ${results.scssOnly.length} membres utilisés uniquement dans SCSS`);
    }
}

// Exécution principale
if (require.main === module) {
    const results = analyzeProject();
    generateDetailedReport(results);
}

module.exports = { analyzeProject, generateDetailedReport };
