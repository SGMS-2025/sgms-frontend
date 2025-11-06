/**
 * Generate username from email address
 * Extracts the part before @ symbol, removes special characters, and limits to 20 characters
 *
 * @param email - Email address to generate username from
 * @returns Generated username or empty string if email is invalid
 *
 * @example
 * generateUsernameFromEmail('john.doe@example.com') // Returns 'johndoe'
 * generateUsernameFromEmail('test_user+tag@domain.com') // Returns 'test_usertag'
 */
export const generateUsernameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return '';
  }

  // Extract the part before @ symbol
  const username = email.split('@')[0];

  // Remove any special characters and keep only alphanumeric and underscore
  const cleanedUsername = username.replace(/[^a-zA-Z0-9_]/g, '');

  // Ensure username is not empty and has reasonable length
  return cleanedUsername.substring(0, 20); // Limit to 20 characters
};
