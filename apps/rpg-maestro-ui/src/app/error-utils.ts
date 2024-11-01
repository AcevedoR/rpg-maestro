import { Bounce, toast } from 'react-toastify';

export function displayError(err: string) {
  toast.error(err, {
    position: 'bottom-left',
    autoClose: 10000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Bounce,
  });
}