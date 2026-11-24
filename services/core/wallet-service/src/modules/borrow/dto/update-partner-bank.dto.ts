import { PartialType } from '@nestjs/swagger';
import { CreatePartnerBankDto } from './create-partner-bank.dto.js';

export class UpdatePartnerBankDto extends PartialType(CreatePartnerBankDto) {}
