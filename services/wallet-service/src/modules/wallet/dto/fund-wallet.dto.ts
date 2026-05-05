import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  reference?: string;
}
