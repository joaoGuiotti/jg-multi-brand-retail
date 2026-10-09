import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { join } from 'path';

// Carregar variáveis de ambiente do diretório customizado
const myEnv = dotenv.config({ path: join(__dirname, 'envs', '.env') });
expand(myEnv);

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.MIGRATION_DATABASE_URL || process.env.DB_URL,
    },
});
