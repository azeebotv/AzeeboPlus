import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkBankAccountDto {
  @ApiProperty({ description: 'Bank name', example: 'GTBank' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  bankName!: string;

  @ApiProperty({ description: 'Bank account number', example: '0123456789' })
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  accountNumber!: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  accountName!: string;
}
