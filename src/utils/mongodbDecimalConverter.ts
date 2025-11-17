/**
 * Converts MongoDB Decimal128 objects { $numberDecimal: "value" } to regular numbers
 * throughout an entire object tree recursively.
 */
interface MongoDecimal {
  $numberDecimal: string;
}

/**
 * Recursively converts all MongoDB Decimal128 values to numbers
 * @param obj - Any object that might contain Decimal values
 * @returns Converted object with all Decimals converted to numbers
 */
export const convertMongoDecimalToNumbers = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's a Decimal128 object, convert it
  if (typeof obj === 'object' && !Array.isArray(obj) && '$numberDecimal' in obj) {
    const decimal = obj as MongoDecimal;
    const converted = parseFloat(decimal.$numberDecimal);
    // Debug log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[DecimalConverter] Converting decimal:', { from: obj, to: converted });
    }
    return converted;
  }

  // If it's an array, process each element
  if (Array.isArray(obj)) {
    return obj.map((item) => convertMongoDecimalToNumbers(item));
  }

  // If it's an object, process each property
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertMongoDecimalToNumbers((obj as Record<string, unknown>)[key]);
      }
    }
    return converted;
  }

  // Otherwise return as-is
  return obj;
};
