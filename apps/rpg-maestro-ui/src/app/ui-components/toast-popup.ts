import { Bounce, toast } from 'react-toastify';

export function toastInfo(text: string, time: number): void {
  toast.info(text, {
    position: 'bottom-left',
    autoClose: time,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Bounce,
  });
}

export function toastSuccess(text: string, time: number): void {
  toast.success(text, {
    position: 'bottom-left',
    autoClose: time,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Bounce,
  });
}

export function toastError(text: string, time: number) {
  toast.error(text, {
    position: 'bottom-left',
    autoClose: time,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Bounce,
  });
}
