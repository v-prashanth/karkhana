import crypto from "crypto";

/**
 * Checks a password against the HaveIBeenPwned API using k-anonymity.
 * This is secure because we only send the first 5 characters of the SHA-1 hash.
 * 
 * @param password The plaintext password to check
 * @returns true if the password has been found in a data breach, false otherwise
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  if (!password) return false;

  try {
    // 1. Hash the password with SHA-1
    const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    
    // 2. Split the hash into prefix (first 5 chars) and suffix (the rest)
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // 3. Query the HIBP API with only the prefix (k-anonymity model)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "Karkhana-Business-OS", // HIBP requires a user agent
      },
    });

    if (!response.ok) {
      console.error("Failed to check HaveIBeenPwned API", response.status);
      // Fail open: If the API is down, don't block registration, just assume safe
      return false;
    }

    const data = await response.text();

    // 4. The API returns a list of suffixes that match the prefix, along with a count
    // Example format: 
    // 0018A45C4D1DEF81644B54AB7F969B88D83:1
    // 00D4F6E8FA6EECAD2A3AA415EEC418D38EC:2

    // Check if our suffix is in the returned list
    const isPwned = data.split('\n').some(line => {
      const [returnedSuffix] = line.split(':');
      return returnedSuffix.trim() === suffix;
    });

    return isPwned;
  } catch (error) {
    console.error("Error checking password against HIBP:", error);
    // Fail open
    return false;
  }
}
