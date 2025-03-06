// lossy deserialization of contract data
// see https://wagmi.sh/core/guides/faq#lossy-serialization
const replacer = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value

/**
 * Lossy deserialization of contract data because we aren't hitting bigint values > INTEGER_MAX_SAFE_INTEGER yet
 * @param data 
 * @returns 
 */
export const stringify = (data: unknown) => {
  return JSON.stringify(data, replacer);
};
