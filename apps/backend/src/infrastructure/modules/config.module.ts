import { Module } from '@nestjs/common';
import { ConfigModuleOptions, ConfigModule as NestConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { join } from 'path';

//@ts-expect-error - the type is correct
const joiJson = Joi.extend((joi) => {
    return {
        type: 'object',
        base: joi.object(),
        coerce(value, _schema) {
            if (value[0] !== '{' && !/^\s*\{/.test(value)) {
                return;
            }

            try {
                return { value: JSON.parse(value) };
            } catch (err) {
                console.error(err);
            }
        },
    };
});

type DB_SCHEMA_TYPE = {
    DB_VENDOR: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_URL: string;
}

export const DB_SCHEMA = Joi.object<DB_SCHEMA_TYPE>({
    DB_VENDOR: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_URL: Joi.string().required(),
});

@Module({})
export class ConfigModule extends NestConfigModule {
    static forRoot(options: ConfigModuleOptions = {}) {
        const { envFilePath, ...otherOptions } = options;

        return super.forRoot({
            isGlobal: true,
            expandVariables: true,
            envFilePath: [
                ...(Array.isArray(envFilePath) ? envFilePath! : [envFilePath!]),
                join(process.cwd(), 'envs', `${process.env.NODE_ENV}.env`),
                join(process.cwd(), 'envs', '.env'),
            ],
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                PORT: Joi.number().default(3000),
            }).concat(DB_SCHEMA),
            ...otherOptions,
        });
    }
}