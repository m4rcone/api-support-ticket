import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    maxLength: 254,
    uniqueItems: true,
  })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 8,
    maxLength: 60,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(60)
  password: string;
}
