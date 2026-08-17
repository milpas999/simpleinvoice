import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SimpleInvoice API')
    .setDescription(
      'REST API for the SimpleInvoice assessment project. See requirements.md for the full specification.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('invoices')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
