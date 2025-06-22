import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function notify(message, type = 'info') {
  toast(message, { type });
}
// In your App.js, add <ToastContainer /> from react-toastify
