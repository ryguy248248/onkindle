// Accounts are username-only. Netlify Identity still needs an email per user,
// so each username maps to an internal, never-mailed address.
const USER_DOMAIN = "users.onkindle.invalid";

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${USER_DOMAIN}`;
}
