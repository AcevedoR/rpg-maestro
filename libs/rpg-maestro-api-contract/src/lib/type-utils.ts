import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export async function parseAndValidateDto<T extends object>(cls: new () => T, input: object): Promise<T> {
  const dto = plainToInstance(cls, input);
  await validateOrReject(dto);
  return dto;
}
