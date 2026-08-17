import { ApiProperty } from '@nestjs/swagger';

export class PagingDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  total: number;
}
