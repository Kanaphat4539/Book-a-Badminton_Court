import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const proxyHops = process.env.TRUST_PROXY_HOPS;
  if (proxyHops && /^[1-9]\d*$/.test(proxyHops)) {
    app.set('trust proxy', Number(proxyHops));
  }
  app.enableCors();
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
