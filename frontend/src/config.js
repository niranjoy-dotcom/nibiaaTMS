export const getApiUrl = () => {
  if (window.location.hostname === 'tms.nibiaa.com') {
    return 'https://apitms.nibiaa.com';
  }
  // Use relative path for Docker (HAProxy) and Local Dev (Vite Proxy)
  return '/api';
};
