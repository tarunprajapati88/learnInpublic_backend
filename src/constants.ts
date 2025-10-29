
export const TIME_CONSTANTS = {

  
  // Cookie Max Ages
  ACCESS_TOKEN_COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000,      // 7 day
  REFRESH_TOKEN_COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Session timeouts
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
} as const;
export default TIME_CONSTANTS;