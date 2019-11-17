import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: 'post',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        confirmPassword
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Signed up successfully');
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', err.response);
  }
};
