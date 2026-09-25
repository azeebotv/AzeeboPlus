import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawWalletDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'bank-account-123' })
  @IsString()
  bankAccountId!: string;

  @ApiProperty({ example: 'Withdrawal to bank account', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferWalletDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'user-456' })
  @IsString()
  recipientId!: string;

  @ApiProperty({ example: 'Transfer for services', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
