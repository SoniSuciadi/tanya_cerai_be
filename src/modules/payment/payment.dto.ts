import { IsNotEmpty } from 'class-validator';

export class CreatePayment {
  @IsNotEmpty()
  packageName: string;
}
