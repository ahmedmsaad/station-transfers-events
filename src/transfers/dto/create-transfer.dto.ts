import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TransferEventDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'evt-001' })
  event_id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'S1' })
  station_id: string;

  @IsDefined()
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 100.5, minimum: 0 })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'approved' })
  status: string;

  @IsDateString()
  @ApiProperty({ example: '2026-02-19T10:00:00Z' })
  created_at: string;
}

export class CreateTransferBatchDto {
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferEventDto)
  @ApiProperty({ type: [TransferEventDto] })
  events: TransferEventDto[];
}
