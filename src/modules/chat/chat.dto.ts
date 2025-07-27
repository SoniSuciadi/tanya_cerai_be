import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  chatRoom: string;
}
export class ChatQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  search: string;

  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  rowsPerPage: number;

  @IsOptional()
  @IsString()
  order: string;

  @IsOptional()
  @IsString()
  orderBy: string;
}
