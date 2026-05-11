// FIX-P1-4: Token Blacklist to invalidate tokens on logout before their expiration
const blacklist = new Set();

export const addToBlacklist = (token) => {
    blacklist.add(token);
};

export const isBlacklisted = (token) => {
    return blacklist.has(token);
};

// Cleanup routine: Clear the Set periodically to prevent memory leak.
// Since JWTs expire after 7 days, we clear the set every 24 hours.
// In a highly-scaled production environment, this should be in Redis.
setInterval(() => {
    blacklist.clear();
}, 24 * 60 * 60 * 1000); // 24 hours
