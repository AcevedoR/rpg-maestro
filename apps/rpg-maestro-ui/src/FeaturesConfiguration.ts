export const isDevModeEnabled: boolean = process.env.NODE_ENV && process.env.NODE_ENV !== 'production';
console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);