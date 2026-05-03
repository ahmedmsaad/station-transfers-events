import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransferBatchDto } from './dto/create-transfer.dto';
import { TransfersService } from './transfers.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Ingest a batch of transfer events (idempotent by event_id)' })
  @ApiResponse({ status: 200, description: '{ inserted, duplicates }' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  ingest(@Body() dto: CreateTransferBatchDto) {
    return this.transfersService.ingest(dto);
  }
}
