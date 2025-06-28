export const isDevModeEnabled: boolean = process.env.NODE_ENV && process.env.NODE_ENV !== 'production';
console.info("process.env.NODE_ENV: ", process.env.NODE_ENV);