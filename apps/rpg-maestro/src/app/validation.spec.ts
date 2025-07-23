import { parseAndValidateDto } from '@rpg-maestro/rpg-maestro-api-contract';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ValidationError } from 'class-validator';

export class ValidatedDTO {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionalArrayField?: string[];

  @IsString()
  @IsNotEmpty()
  requiredStringField: string;
}

describe('validation behaviour', () => {
  it('should parse a valid object', async () => {
    const result = await parseAndValidateDto(ValidatedDTO, { requiredStringField: 'test' });
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(ValidatedDTO);
    expect(result.requiredStringField).toEqual('test');
  });
  it('should throw when object is invalid', async () => {
    await expect(parseAndValidateDto(ValidatedDTO, {})).rejects.toEqual(
      expect.arrayContaining([expect.any(ValidationError)])
    );
  });
});
