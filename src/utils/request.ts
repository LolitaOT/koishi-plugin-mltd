// const axios = require('axios')
import axios from 'axios';
// create an axios instance
const service = axios.create({
  baseURL: 'https://api.matsurihi.me/mltd/v1/', // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 1000 * 60 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(

  response => {
    // console.log(response)
    const res = response.data
   
      return res
    
    // if the custom code is not 20000, it is judged as an error.
  },
  error => {
    return Promise.reject(error)
  }
)

export = service
