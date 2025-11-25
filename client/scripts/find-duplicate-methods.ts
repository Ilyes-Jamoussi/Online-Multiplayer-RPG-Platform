// scripts/find-duplicate-methods.ts
import { Project } from 'ts-morph';
import * as path from 'node:path';

const isSpecFile = (filePath: string) => filePath.endsWith('.spec.ts');

// 1) On charge le projet
const project = new Project({
    tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json'),
});

// 2) On filtre les fichiers (on exclut les tests)
const sourceFiles = project
    .getSourceFiles()
    .filter((sf) => !isSpecFile(sf.getFilePath()));

console.log(`Analyzing ${sourceFiles.length} files for duplicate methods...`);

// Map pour stocker les méthodes par nom
const methodsByName = new Map<string, Array<{ file: string; class: string; body: string }>>();

for (const sf of sourceFiles) {
    const baseName = sf.getBaseName();

    for (const clazz of sf.getClasses()) {
        const className = clazz.getName() ?? '<anonymous>';

        for (const method of clazz.getMethods()) {
            const name = method.getName();
            
            // Ignorer les lifecycle hooks Angular
            const angularHooks = [
                'ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngDoCheck',
                'ngAfterContentInit', 'ngAfterContentChecked',
                'ngAfterViewInit', 'ngAfterViewChecked',
                'constructor'
            ];
            if (angularHooks.includes(name)) continue;
            
            // Ignorer les méthodes privées
            if (name.startsWith('_')) continue;

            const body = method.getBodyText() || '';
            
            if (!methodsByName.has(name)) {
                methodsByName.set(name, []);
            }
            
            methodsByName.get(name)!.push({
                file: baseName,
                class: className,
                body: body.trim()
            });
        }
    }
}

// Détecter les duplications
for (const [methodName, occurrences] of methodsByName.entries()) {
    if (occurrences.length < 2) continue;
    
    // Grouper par corps de méthode similaire
    const bodyGroups = new Map<string, typeof occurrences>();
    
    for (const occurrence of occurrences) {
        // Normaliser le corps pour comparaison (enlever espaces, etc.)
        const normalizedBody = occurrence.body.replace(/\s+/g, ' ');
        
        if (!bodyGroups.has(normalizedBody)) {
            bodyGroups.set(normalizedBody, []);
        }
        bodyGroups.get(normalizedBody)!.push(occurrence);
    }
    
    // Afficher les duplications
    for (const [body, group] of bodyGroups.entries()) {
        if (group.length >= 2) {
            console.log(`\n[DUPLICATE] ${methodName}() - ${group.length} occurrences identiques:`);
            for (const occ of group) {
                console.log(`  - ${occ.file} :: ${occ.class}`);
            }
        }
    }
}
