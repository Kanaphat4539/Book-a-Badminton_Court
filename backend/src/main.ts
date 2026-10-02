import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const proxyHops = process.env.TRUST_PROXY_HOPS;
  if (proxyHops && /^[1-9]\d*$/.test(proxyHops)) {
    app.set('trust proxy', Number(proxyHops));
  } else {
    app.set('trust proxy', true);
  }
  app.enableCors();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
