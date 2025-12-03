import { ChatModule } from '@app/modules/chat/chat.module';
import { GameLogModule } from '@app/modules/game-log/game-log.module';
import { GameStoreModule } from '@app/modules/game-store/game-store.module';
import { SessionModule } from '@app/modules/session/session.module';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            // eslint-disable-next-line @typescript-eslint/require-await -- NestJS useFactory requires async signature
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        ChatModule,
        GameLogModule,
        GameStoreModule,
        SessionModule,
    ],
})
export class AppModule {}
