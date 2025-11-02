import { GameStoreModule } from '@app/modules/game-store/module/game-store.module';
import { SessionModule } from '@app/modules/session/module/session.module';

import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            // eslint-disable-next-line @typescript-eslint/require-await -- NestJS useFactory requires async signature
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        GameStoreModule,
        SessionModule,
    ],
    providers: [Logger],
})
export class AppModule {}
