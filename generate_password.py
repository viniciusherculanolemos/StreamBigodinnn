import secrets
import string

def generate_secure_password(length=16):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = "".join(secrets.choice(alphabet) for i in range(length))
    # Ensure password complexity (example: at least one upper, one lower, one digit, one punctuation)
    # This is a basic check, more robust checks can be added
    if (any(c.islower() for c in password) and
            any(c.isupper() for c in password) and
            any(c.isdigit() for c in password) and
            any(p in string.punctuation for p in password)):
        return password
    else:
        # Regenerate if complexity not met (simple retry)
        return generate_secure_password(length)

if __name__ == "__main__":
    # This part is for direct execution and testing of the password generation
    # The actual user creation will be in a separate script that uses this function
    # and runs within the Flask app context.
    password = generate_secure_password()
    print(f"Generated Password: {password}")

