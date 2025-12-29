export const getApiUrl = () => {
  if (window.location.hostname === 'tms.nibiaa.com') {
    return 'https://apitms.nibiaa.com';
  }
  return `http://${window.location.hostname}:8080`;
};
