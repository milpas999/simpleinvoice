import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Kept unauthenticated deliberately — used by the Docker healthcheck and
  // must keep working even once JWT guards are applied to other routes.
  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
