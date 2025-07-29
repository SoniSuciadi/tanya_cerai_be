import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class sendMessageToAllUsersDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  message?: string;
}
