import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseAndValidateDto<T extends object>(cls: new (_: any) => T, input: object): Promise<T> {
  const dto = plainToInstance(cls, input);
  await validateOrReject(dto);
  return dto;
}
