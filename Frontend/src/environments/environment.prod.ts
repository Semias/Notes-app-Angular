// Replaces environment.ts in production builds (fileReplacements in
// angular.json). The Docker image serves this app and the API from one origin,
// so a relative URL reaches the API wherever the app is deployed.
export const environment = {
  apiUrl: '',
};
