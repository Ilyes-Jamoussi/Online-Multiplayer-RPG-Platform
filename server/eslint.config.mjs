import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintComments from 'eslint-plugin-eslint-comments';
import baseConfig from '../eslint.config.basic.mjs';

export default [
    ...baseConfig(tsParser, tsPlugin, eslintComments),
    {
        files: ['**/*.ts'],
        rules: {
            // Ajoutez ici d'autres règles spécifiques au serveur au besoin
        },
    },
];