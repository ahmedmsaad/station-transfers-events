import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StationsService } from './stations.service';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get(':station_id/summary')
  @ApiOperation({ summary: 'Get reconciliation summary for a station' })
  @ApiResponse({ status: 200, description: '{ station_id, total_approved_amount, events_count }' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  getSummary(@Param('station_id') stationId: string) {
    return this.stationsService.getSummary(stationId);
  }
}
