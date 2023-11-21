import axios from "axios";

const baseurl = process.env.CRAWL_BASE_URL ?? "https://etrain.info";

const axiosInstance = axios.create({
  baseURL: baseurl,
  timeout: 60000,
  withCredentials: true,
});

export default axiosInstance;
