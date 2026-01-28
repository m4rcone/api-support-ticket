import { Controller, Get } from '@nestjs/common';
import { StatusService } from './status.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Status')
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  @Get()
  async getStatus() {
    const databaseStatus = await this.statusService.checkDatabase();

    return {
      services: {
        database: databaseStatus,
      },
    };
  }
}
