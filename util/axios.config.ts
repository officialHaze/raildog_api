import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://etrain.info",
  timeout: 60000,
  withCredentials: true,
});

export default axiosInstance;
