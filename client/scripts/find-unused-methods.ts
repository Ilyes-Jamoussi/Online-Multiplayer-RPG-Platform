// scripts/find-unused-methods.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Node, Project, MethodDeclaration, ReferencedSymbol } from 'ts-morph';

const isSpecFile = (filePath: string) => filePath.endsWith('.spec.ts');
const isComponentFile = (filePath: string) => filePath.endsWith('.component.ts');

function getTemplateContentIfExists(tsFilePath: string): string | null {
    if (!isComponentFile(tsFilePath)) return null;

    const htmlPath = tsFilePath.replace('.component.ts', '.component.html');
    if (!fs.existsSync(htmlPath)) return null;

    return fs.readFileSync(htmlPath, 'utf8');
}

function getAllTemplateContents(projectPath: string): string[] {
    const templates: string[] = [];
    const srcPath = path.join(projectPath, 'src');
    
    function scanDirectory(dir: string): void {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDirectory(fullPath);
            } else if (entry.name.endsWith('.component.html')) {
                templates.push(fs.readFileSync(fullPath, 'utf8'));
            }
        }
    }
    
    scanDirectory(srcPath);
    return templates;
}

// 1) On charge le projet Angular avec TOUS les fichiers (y compris les tests)
const project = new Project({
    tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json'),
});

// 2) On filtre les fichiers (on exclut les tests)
const sourceFiles = project
    .getSourceFiles()
    .filter((sf) => !isSpecFile(sf.getFilePath()));

// 3) Charger tous les templates HTML pour détecter les bindings
const projectPath = path.join(__dirname, '..');
const allTemplates = getAllTemplateContents(projectPath);

console.log(`Analyzing ${sourceFiles.length} files for unused methods...`);

for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const baseName = sf.getBaseName();
    const templateContent = getTemplateContentIfExists(filePath);

    for (const clazz of sf.getClasses()) {
        const className = clazz.getName() ?? '<anonymous>';

        // On prend les méthodes (pas les getters/setters)
        const methods = clazz
            .getMethods()
            .filter((m) => {
                const name = m.getName();
                // Exclure les lifecycle hooks Angular et méthodes spéciales
                const angularHooks = [
                    'ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngDoCheck',
                    'ngAfterContentInit', 'ngAfterContentChecked',
                    'ngAfterViewInit', 'ngAfterViewChecked',
                    'constructor'
                ];
                return !angularHooks.includes(name);
            });

        for (const method of methods) {
            const name = method.getName();
            
            // Ignorer les méthodes privées (convention: commencent par _)
            if (name.startsWith('_')) continue;
            
            // Ignorer les méthodes avec des décorateurs (@HostListener, @Output, etc.)
            const decorators = method.getDecorators();
            if (decorators.length > 0) continue;

            const refs: ReferencedSymbol[] = method.findReferences();

            // On ignore la définition elle-même
            const refsExceptDecl = refs.flatMap(ref => ref.getReferences()).filter(
                (r) => !r.isDefinition() && !r.getNode().wasForgotten()
            );

            const refsInSpecs = refsExceptDecl.filter((r) =>
                isSpecFile(r.getSourceFile().getFilePath())
            );

            const refsInNonSpecs = refsExceptDecl.filter(
                (r) => !isSpecFile(r.getSourceFile().getFilePath())
            );

            // --- Gestion du HTML pour les components ---
            let usedInTemplate = false;
            
            // Vérifier dans le template du composant lui-même
            if (templateContent) {
                const regex = new RegExp(`\\b${name}\\b`, 'm');
                usedInTemplate = regex.test(templateContent);
            }
            
            // Vérifier dans TOUS les templates (pour les event bindings)
            if (!usedInTemplate) {
                // Chercher les patterns de binding Angular: (click)="methodName()", {{methodName()}}
                const bindingPatterns = [
                    new RegExp(`\\(\\w+\\)="[^"]*\\b${name}\\b`, 'm'),  // (click)="methodName()"
                    new RegExp(`\\{\\{[^}]*\\b${name}\\b`, 'm'),        // {{methodName()}}
                    new RegExp(`\\*\\w+="[^"]*\\b${name}\\b`, 'm'),     // *ngIf="methodName()"
                    new RegExp(`\\[\\w+\\]="[^"]*\\b${name}\\b`, 'm'),  // [disabled]="methodName()"
                ];
                
                for (const template of allTemplates) {
                    if (bindingPatterns.some(pattern => pattern.test(template))) {
                        usedInTemplate = true;
                        break;
                    }
                }
            }

            const hasAppUsage = usedInTemplate || refsInNonSpecs.length > 0;
            const hasSpecUsage = refsInSpecs.length > 0;

            if (!hasAppUsage && !hasSpecUsage) {
                // Totalement inutilisée
                console.log(
                    `[UNUSED] ${baseName} :: ${className}.${name}()`
                );
            } else if (!hasAppUsage && hasSpecUsage) {
                // Utilisée uniquement dans les tests
                console.log(
                    `[ONLY-TESTS] ${baseName} :: ${className}.${name}()`
                );
            }
        }
    }
}
