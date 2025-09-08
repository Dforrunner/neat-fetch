# Contributing to Neat Fetch 🚀

First off, thank you for considering contributing! ❤️ Your help makes **Neat Fetch** better for everyone.

## How to Contribute

### 1. Reporting Issues 🐛

If you find a bug or have a feature request:

1. Check the [issues](https://github.com/Dforrunner/neat-fetch/issues) to see if it has already been reported.
2. If not, open a new issue with a clear title and description.
3. Include steps to reproduce, expected behavior, and environment details (Node.js version, browser, etc.).

### 2. Suggesting Features 💡

Feature requests are welcome!

* Explain the problem you’re trying to solve.
* Suggest an API or usage example.
* Keep backward compatibility in mind.

### 3. Making Code Changes ✨

Since **Neat Fetch** is currently a single `index.ts` file:

1. Fork the repository and clone it locally.
2. Create a new branch for your change:

   ```bash
   git checkout -b feature/my-awesome-feature
   ```
3. Make your changes directly in `index.ts`. Please:

   * Keep the code clean and readable.
   * Preserve TypeScript types.
   * Update or add inline JSDoc comments where appropriate.
4. Test your changes manually:

   ```ts
   import neatFetch from './index';

   // Example test
   const [data, error] = await neatFetch('https://jsonplaceholder.typicode.com/todos/1').json();
   console.log({ data, error });
   ```

### 4. Submitting Your Changes 📝

1. Commit your changes with a clear message:

   ```bash
   git commit -m "feat: add timeout support"
   ```
2. Push your branch:

   ```bash
   git push origin feature/my-awesome-feature
   ```
3. Open a pull request (PR) to `main`. Include:

   * What problem your PR fixes
   * How to test your changes
   * Any notes about backwards compatibility

### 5. Code Style & Guidelines 🛠️

* Use TypeScript types whenever possible.
* Keep functions small and readable.
* Prefer explicit error handling with `[data, error]`.
* Maintain chainable API style.

### 6. No Automated Tests Yet ⚠️

* Since Neat Fetch is a single-file library, tests are manual.
* You can create a small `examples/test.ts` to run requests and verify behavior.

### 7. Need Help? 🤝

Join discussions in the [issues](https://github.com/yourusername/neat-fetch/issues) or open a PR with a “WIP” tag if you want feedback before finishing.

---

Thank you for helping make **Neat Fetch** awesome! 💪
