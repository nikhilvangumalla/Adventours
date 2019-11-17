import axios from 'axios';
import { showAlert } from './alerts';
import { logout } from './loginAndLogout';

export const updateSettings = async (data, type) => {
  try {
    // console.log(data);

    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    // console.log(res);

    if (res.data.status === 'success') {
      await showAlert('success', `${type.toUpperCase()} updated successfully!`);
      if (type === 'password') {
        window.setTimeout(() => {
          logout();
        }, 2000);
      } else {
        window.setTimeout(() => {
          location.reload();
        }, 2000);
      }
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
