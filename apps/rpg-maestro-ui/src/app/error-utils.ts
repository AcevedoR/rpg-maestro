import { toastError } from './ui-components/toast-popup';

export function displayError(err: string) {
  toastError(err, 10000);
  console.error(err);
}
