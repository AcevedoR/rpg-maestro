export function isDevOrTestEnv(){
  return !isProductionEnv;
}
export function isProductionEnv(){
  const nodeEnv = process.env['NODE'+'_ENV'] || 'development';
  const configurationEnv = process.env['CONFIGURATION_ENV'] || 'development';
  return nodeEnv !== 'production' && configurationEnv !== 'production';
}