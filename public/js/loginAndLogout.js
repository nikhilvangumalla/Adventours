import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'post',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    document.cookie = `jwt=${res.data.token};expries=${new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000
    ).toGMTString()}`;
    // console.log(res);
    if (res.data.status === 'success') {
      // if u want delay after pressing submit button use below code

      showAlert('success', 'Logged in successfully');
      // window.setTimeout(() => {
      //   location.assign('/');
      // }, 2000);
      location.assign('/');
    }
  } catch (err) {
    // console.log('error', err.response);
    showAlert('error', err.response.data.message);
  }

  // fetch('http://127.0.0.1:5000/api/v1/users/login', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     email,
  //     password
  //   }),
  //   headers: {
  //     'Content-type': 'application/json; charset=UTF-8'
  //   }
  // })
  //   .then(response => {
  //     response.json();
  //  // document.cookie = `jwt=${res.data.token}`;
  //   })
  //   .then(json => console.log(json));
};

export const logout = async () => {
  let res;
  try {
    res = await axios({
      method: 'get',
      url: '/api/v1/users/logout'
    });
    // console.log(res.data);

    document.cookie = `jwt=;expires= ${new Date(Date.now())}`;
    if (res.data.status === 'success') {
      // location.reload(true);
      showAlert('success', 'Logged Out Successfully');
      location.assign('/');
    }
  } catch (err) {
    // console.log(err.response.data);
    showAlert('error', 'Error Logging Out! Please try again');
    // location.assign('/');
    // location.reload(true);
  }
};
