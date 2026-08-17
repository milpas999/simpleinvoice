import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { PagedInvoicesResponseDto } from './dto/paged-invoices-response.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List invoices with search, filter, sort, pagination',
  })
  @ApiResponse({ status: 200, type: PagedInvoicesResponseDto })
  list(@Query() query: QueryInvoicesDto): Promise<PagedInvoicesResponseDto> {
    return this.invoicesService.list(query);
  }

  @Get(':invoiceId')
  @ApiOperation({ summary: 'Get invoice detail by ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  getById(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.getById(invoiceId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Duplicate invoice number' })
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(dto, user.id);
  }
}
