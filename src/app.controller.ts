import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check if the application is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is running',
  })
  @ApiResponse({
    status: 500,
    description: 'Application is not running',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
