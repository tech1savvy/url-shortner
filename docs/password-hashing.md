## Password Hashing with bcrypt

### Why Password Hashing?

Imagine your database gets breached. If you store passwords in plain text, the attacker immediately has access to everyone's accounts. This is a huge risk.

**Password hashing** transforms a password into a fixed-size string of characters (the "hash") using a one-way cryptographic function. This means:

1.  **One-way:** You can generate a hash from a password, but you cannot reverse the process to get the original password back from the hash.
2.  **Salt:** A unique, random string (the "salt") is added to each password *before* hashing. This prevents "rainbow table" attacks, where attackers pre-compute hashes for common passwords. Even if two users have the same password, their hashes will be different because their salts are different.
3.  **Iteration/Rounds:** Hashing algorithms like bcrypt are designed to be computationally intensive (slow). This makes brute-force attacks (trying many passwords) much harder, as each attempt takes a significant amount of time.

When a user tries to log in, you take their provided password, combine it with the stored salt for that user, hash it, and then compare the newly generated hash with the hash stored in your database. If they match, the password is correct.

### Implementation with `bcrypt`

We used the `bcrypt` library for this implementation.

**Step 1: Install `bcrypt`**

We installed the `bcrypt` package using npm:

```bash
npm install bcrypt
```

**Step 2: Modify `user.model.js`**

We added hashing logic to `features/auth/user.model.js` using a Mongoose pre-save hook to hash the password *before* it's saved to the database. We also added a method to compare passwords during login.

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
```

**Explanation of Changes in `user.model.js`:**

*   `const bcrypt = require("bcrypt");`: Imports the bcrypt library.
*   `userSchema.pre("save", async function (next) { ... });`: This is a Mongoose "pre-save" hook. It means this function will run *before* a `User` document is saved to the database.
    *   `if (!this.isModified("password")) return next();`: This is important! It ensures that the password is only re-hashed if it has actually been modified. This prevents unnecessary re-hashing if you update other user fields.
    *   `const salt = await bcrypt.genSalt(10);`: Generates a salt. The `10` is the "salt rounds" or "cost factor". A higher number means more computational work (slower hashing), which makes brute-force attacks harder but also increases the time it takes to hash. `10` is a good balance for most applications.
    *   `this.password = await bcrypt.hash(this.password, salt);`: Hashes the user's plain-text password using the generated salt. The result is stored back in `this.password`.
    *   `next();`: Calls the next middleware in the save process.
*   `userSchema.methods.comparePassword = async function (candidatePassword) { ... };`: This adds a custom method to your `User` schema. You can call `user.comparePassword(plainTextPassword)` on a user instance.
    *   `return bcrypt.compare(candidatePassword, this.password);`: Compares the provided `candidatePassword` (plain text) with the hashed password stored in `this.password`. `bcrypt.compare` handles the salting and hashing internally and returns `true` if they match, `false` otherwise.

**Step 3: Modify `auth.controller.js` for Login**

Since passwords are now hashed, we can't directly compare the plain-text password from the request with the stored hash. We need to use the `comparePassword` method added to the `User` model.

```javascript
const User = require("./user.model");
const { setUser } = require("./auth.service");

async function handleUserSignup(req, res) {
  const { name, email, password } = req.body;
  await User.create({ name, email, password });

  return res.redirect("/");
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render("login", {
      error: "Invalid email or password",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.render("login", {
      error: "Invalid email or password",
    });
  }

  const token = setUser(user);
  res.cookie("uid", token);
  return res.redirect("/");
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
};
```

**Explanation of Changes in `auth.controller.js`:**

*   `const user = await User.findOne({ email });`: We now only find the user by email. We don't include the password in the `findOne` query because the stored password is now hashed.
*   `if (!user) { ... }`: If no user is found with that email, it's an invalid credential.
*   `const isMatch = await user.comparePassword(password);`: This is the crucial part. We call the `comparePassword` method on the `user` object, passing the plain-text password provided by the user. This method will handle the hashing and comparison.
*   `if (!isMatch) { ... }`: If `isMatch` is false, it means the password was incorrect.
