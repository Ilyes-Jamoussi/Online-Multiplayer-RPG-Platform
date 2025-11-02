import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import baseConfig from '../eslint.config.basic.mjs';

export default [
    ...baseConfig(tsParser, tsPlugin),
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        plugins: {
            '@angular-eslint': angular,
        },
        rules: {
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase',
                },
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case',
                },
            ],
            '@angular-eslint/use-lifecycle-interface': 'error',

            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variableLike',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'function',
                    format: ['camelCase'],
                },
                {
                    selector: 'method',
                    format: ['camelCase'],
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    selector: 'variable',
                    modifiers: ['const', 'global'],
                    format: ['UPPER_CASE'],
                },
            ],

            'id-length': [
                'warn',
                {
                    min: 3,
                    exceptions: ['io', 'i', 'j', 'k', 'x', 'y', 'id', 'db', 'ng', '', 'to', 'of', 'on'],
                },
            ],

            'no-restricted-syntax': [
                'warn',
                {
                    selector: 'TSParenthesizedType > TSObjectKeyword',
                    message: "-0,5 [citer l'extrait de code] une interface devrait être utilisée ici",
                },
            ],
        },
    },
    {
        files: ['**/*.html'],
        languageOptions: {
            parser: templateParser,
        },
        plugins: {
            '@angular-eslint/template': angularTemplate,
        },
        rules: {
            '@angular-eslint/template/no-call-expression': 'warn',
        },
    },
    {
        files: ['src/app/dto/**/*.ts'],
        rules: {
            '@typescript-eslint/naming-convention': 'off',
            '@typescript-eslint/array-type': 'off',
        },
    },
];
