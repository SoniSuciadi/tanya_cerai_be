import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
export class sendMessageToAllUsersDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsOptional()
  @IsObject()
  data?: object;
}
