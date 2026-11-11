// Temporary in-memory store for the Postman auth ticket. Replace with MongoDB
// persistence when the database is connected.
const users = new Map();

export function findUserByEmail(email) {
  return users.get(email.toLowerCase()) ?? null;
}

export function findUserByIdentifier(field, value) {
  for (const user of users.values()) {
    if (user[field]?.toLowerCase() === value.toLowerCase()) return user;
  }
  return null;
}

export function saveUser(user) {
  users.set(user.email, user);
  return user;
}
