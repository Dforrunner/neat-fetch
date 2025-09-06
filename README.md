# 🚀 Neat Fetch


**Neat Fetch is a modern, lightweight, and type-safe wrapper around the native `fetch` API that makes HTTP requests predictable, readable, and enjoyable.**

Tired of nesting `try/catch` blocks, juggling `undefined` responses, or writing verbose error handling logic? Neat Fetch brings the simplicity and clarity of Go-style error handling to JavaScript and TypeScript.**

Instead of throwing exceptions, it returns a simple [data, error] tuple:
```typescript
// Before: Messy error handling 😩
try {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed');
  const data = await response.json();
  // Use data...
} catch (error) {
  // Handle error...
}

// After: Clean and predictable ✨
const [data, error] = await neatFetch('/api/users').json();
if (error) return handleError(error);
// Use data safely...
```

## ✨ Why Neat Fetch?
- ✔️ **Native fetch under the hood** Fully compatible with the standard `fetch` API.
- 🔒 **Type-safe** - Full TypeScript support, no more `any` types
- 🎯 **Tuple error handling** - `[data, error]` pattern, no try-catch needed
- ⚡ **Zero dependencies** - Lightweight and fast
- 🔄 **Smart retries** - Automatic retry with exponential backoff
- ⏱️ **Timeout support** - Never hang forever
- 🌐 **Universal** - Works in browser, Node.js, React Native
- 🛠️ **Developer UX** - Chainable API, great autocomplete

## 📦 Installation

```bash
npm install neat-fetch
# or
yarn add neat-fetch
# or
pnpm add neat-fetch
```

## 🚀 Quick Start

```typescript
import { neatFetch } from 'neat-fetch';

// GET request with automatic JSON parsing
const [users, error] = await neatFetch('/api/users').json<User[]>();

if (error) {
  console.error('Failed to fetch users:', error.message);
  return;
}

// users is fully typed as User[]
console.log(`Found ${users.length} users`);
```

## 📚 Complete API Guide

### 🔥 HTTP Methods Made Easy

```typescript
// GET - The most common one
const [users, error] = await neatFetch('/api/users').get<User[]>();

// POST with data
const [newUser, error] = await neatFetch('/api/users').post({
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT for full updates
const [updatedUser, error] = await neatFetch('/api/users/123').put({
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// PATCH for partial updates
const [user, error] = await neatFetch('/api/users/123').patch({
  email: 'newemail@example.com'
});

// DELETE
const [result, error] = await neatFetch('/api/users/123').delete();

// HEAD for metadata only
const [response, error] = await neatFetch('/api/users').head();
if (!error) {
  console.log('Total users:', response.headers.get('x-total-count'));
}

// OPTIONS for CORS preflight
const [response, error] = await neatFetch('/api/users').options();
```

### 🎛️ Response Parsing (All Native Methods Supported)

```typescript
// JSON (most common)
const [data, error] = await neatFetch('/api/data').json<MyType>();

// Plain text
const [text, error] = await neatFetch('/api/readme').text();

// Binary data
const [blob, error] = await neatFetch('/api/image.png').blob();
const [buffer, error] = await neatFetch('/api/file.pdf').arrayBuffer();

// Form data
const [formData, error] = await neatFetch('/api/form').formData();

// Streaming
const [stream, error] = await neatFetch('/api/large-file').stream();
if (!error && stream) {
  const reader = stream.getReader();
  // Process stream...
}
```

### 🔗 Query Parameters Made Simple

 ⚠️ Query params are URL encoded by default. If you encode them prior to passing them, they will be double encoded, which may not be what you want.

```typescript
// Object syntax (recommended)
const [users, error] = await neatFetch('/api/users', {
  params: {
    page: 1,
    limit: 20,
    sort: 'created_at',
    filter: ['active', 'premium'], // Arrays work too!
    search: 'john doe'
  }
}).json<User[]>();

// Becomes: /api/users?page=1&limit=20&sort=created_at&filter=active&filter=premium&search=john%20doe

// Chainable syntax
const [users, error] = await neatFetch('/api/users')
  .query({ page: 1, limit: 20 })
  .query({ sort: 'name' }) // Merged with previous params
  .json<User[]>();
```

### ⚡ Configuration & Advanced Features

```typescript
// Timeout (never hang forever)
const [data, error] = await neatFetch('/api/slow-endpoint', {
  timeout: 5000 // 5 seconds
}).json();

// Retry on failure
const [data, error] = await neatFetch('/api/unreliable', {
  retry: 3,        // Retry 3 times
  retryDelay: 1000 // Wait 1s between retries (exponential backoff)
}).json();

// Base URL for cleaner code
const [data, error] = await neatFetch('/users', {
  baseURL: 'https://api.example.com'
}).json(); // Fetches https://api.example.com/users

// Custom headers
const [data, error] = await neatFetch('/api/protected', {
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  }
}).json();
```

### 🔧 Chainable API (Fluent Interface)

```typescript
// Chain everything together
const [data, error] = await neatFetch('/api/users')
  .timeout(10000)
  .retry(2, 500)
  .headers({
    'Authorization': 'Bearer token',
    'X-Client-Version': '1.2.3'
  })
  .query({
    page: 1,
    limit: 50,
    include: ['profile', 'settings']
  })
  .json<UsersResponse>();

// Each method returns a new instance, so you can reuse base configurations
const baseRequest = neatFetch('/api')
  .timeout(5000)
  .headers({ 'Authorization': 'Bearer token' });

const [users, userError] = await baseRequest.clone().get('/users');
const [posts, postError] = await baseRequest.clone().get('/posts');
```

### 🏭 Create Configured Instances

```typescript
import { createNeatFetchInstance } from 'neat-fetch';

// Create an API client with defaults
const api = createNeatFetchInstance({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  retry: 2
});

// Use it anywhere in your app
const [users, error] = await api('/users').json<User[]>();
const [posts, error] = await api('/posts').query({ limit: 10 }).json<Post[]>();

// Perfect for different environments
const devApi = createInstance({ baseURL: 'http://localhost:3000/api' });
const prodApi = createInstance({ baseURL: 'https://api.myapp.com' });
```

## 🛡️ Error Handling Like a Pro

```typescript
const [data, error] = await neatFetch('/api/users').json();

if (error) {
  // Check if it's an HTTP error (4xx, 5xx)
  if ('status' in error) {
    console.log(`HTTP ${error.status}: ${error.statusText}`);
    
    // Access the response for more details
    if (error.response) {
      const [errorBody, _] = await neatFetch.fromResponse(error.response).json();
      console.log('Server error details:', errorBody);
    }
    
    // Handle specific status codes
    switch (error.status) {
      case 401:
        redirectToLogin();
        break;
      case 403:
        showAccessDeniedMessage();
        break;
      case 429:
        showRateLimitMessage();
        break;
      case 500:
        showServerErrorMessage();
        break;
    }
  } else {
    // Network error, timeout, etc.
    console.log('Network error:', error.message);
    showOfflineMessage();
  }
  return;
}

// If we get here, data is guaranteed to be valid
console.log('Success:', data);
```

## 🎯 TypeScript Examples

### Basic Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// Fully typed request and response
const [response, error] = await neatFetch('/api/users', {
  params: { page: 1, limit: 20 }
}).json<ApiResponse<User[]>>();

if (error) return;

// TypeScript knows the exact shape
console.log(`Found ${response.data.length} of ${response.meta.total} users`);
response.data.forEach(user => {
  console.log(`${user.name} (${user.email})`); // Full autocomplete!
});
```

### Custom Error Types

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

const [data, error] = await neatFetch('/api/users').json<User[]>();

if (error && 'status' in error && error.response) {
  const [apiError, _] = await neatFetch.fromResponse(error.response).json<ApiError>();
  if (!apiError) return;
  
  console.log(`API Error ${apiError.code}: ${apiError.message}`);
}
```

## 🔄 Promise Compatibility

Neat Fetch is fully Promise-compatible, so it works with all your existing patterns:

```typescript
// Works with .then()/.catch()
neatFetch('/api/users')
  .then(([data, error]) => {
    if (error) throw error;
    console.log('Users:', data);
  })
  .catch(error => {
    console.error('Failed:', error);
  });

// Works with Promise.all()
const [results, errors] = await Promise.all([
  neatFetch('/api/users').json(),
  neatFetch('/api/posts').json(),
  neatFetch('/api/comments').json()
]);

// Works with Promise.race()
const [firstResult, error] = await Promise.race([
  neatFetch('/api/fast-endpoint').json(),
  neatFetch('/api/slow-endpoint').json()
]);
```

## 🌟 Real-World Examples

### React Hook

```typescript
import { useState, useEffect } from 'react';
import neatFetch from 'neat-fetch';

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [result, err] = await neatFetch(url).json<T>();
      setData(result);
      setError(err);
      setLoading(false);
    };

    fetchData();
  }, [url]);

  return { data, error, loading };
}

// Usage
function UserList() {
  const { data: users, error, loading } = useApi<User[]>('/api/users');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!users) return <div>No users found</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Form Submission

```typescript
async function handleSubmit(formData: FormData) {
  setSubmitting(true);
  setError(null);

  const [result, error] = await neatFetch('/api/users', {
    timeout: 30000 // Long timeout for uploads
  }).post({
    name: formData.get('name'),
    email: formData.get('email'),
    avatar: formData.get('avatar') // File upload
  });

  setSubmitting(false);

  if (error) {
    if ('status' in error && error.status === 422) {
      setError('Please check your input and try again');
    } else {
      setError('Something went wrong. Please try again later.');
    }
    return;
  }

  // Success!
  router.push('/users');
  showSuccessMessage('User created successfully!');
}
```

### API Client Class

```typescript
class ApiClient {
  private baseRequest: ReturnType<typeof createNeatFetchInstance>;

  constructor(baseURL: string, token?: string) {
    this.baseRequest = createNeatFetchInstance({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      timeout: 15000,
      retry: 2
    });
  }

  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    return this.baseRequest('/users').query(params || {}).json<User[]>();
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>) {
    return this.baseRequest('/users').post(userData);
  }

  async updateUser(id: number, userData: Partial<User>) {
    return this.baseRequest(`/users/${id}`).patch(userData);
  }

  async deleteUser(id: number) {
    return this.baseRequest(`/users/${id}`).delete();
  }
}

// Usage
const api = new ApiClient('https://api.example.com', userToken);

const [users, error] = await api.getUsers({ page: 1, limit: 20 });
if (error) {
  console.error('Failed to fetch users:', error);
} else {
  console.log('Users loaded:', users);
}
```

## 🤔 Migration Guide

### From Native Fetch

```typescript
// Before
const response = await fetch('/api/users?page=1&limit=20', {
  headers: { 'Authorization': 'Bearer token' }
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const users = await response.json();

// After
const [users, error] = await neatFetch('/api/users', {
  params: { page: 1, limit: 20 },
  headers: { 'Authorization': 'Bearer token' }
}).json();

if (error) {
  console.error('Error:', error);
  return;
}
```

### From Axios

```typescript
// Before
try {
  const response = await axios.get('/api/users', {
    params: { page: 1, limit: 20 },
    timeout: 5000
  });
  const users = response.data;
} catch (error) {
  console.error('Error:', error);
}

// After
const [users, error] = await neatFetch('/api/users', {
  params: { page: 1, limit: 20 },
  timeout: 5000
}).json();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Users:', users);
}
```

## 🎨 Best Practices

### 1. Always Handle Errors

```typescript
// ✅ Good
const [data, error] = await neatFetch('/api/data').json();
if (error) {
  handleError(error);
  return;
}
processData(data);

// ❌ Bad - ignoring errors
const [data] = await neatFetch('/api/data').json();
processData(data); // Could be null!
```

### 2. Use Type Annotations

```typescript
// ✅ Good
const [users, error] = await neatFetch('/api/users').json<User[]>();

// ✅ Also good
interface UsersResponse {
  users: User[];
  total: number;
}
const [response, error] = await neatFetch('/api/users').json<UsersResponse>();
```

### 3. Create Reusable API Clients

```typescript
// ✅ Good - centralized configuration
const api = createNeatFetchInstance({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Authorization': `Bearer ${getToken()}` }
});

export { api };

// Use throughout your app
const [users, error] = await api('/users').json<User[]>();
```

### 4. Handle Different Error Types

```typescript
const [data, error] = await neatFetch('/api/data').json();

if (error) {
  if ('status' in error) {
    // HTTP error
    switch (error.status) {
      case 401: return redirectToLogin();
      case 403: return showAccessDenied();
      case 429: return showRateLimit();
      default: return showServerError();
    }
  } else {
    // Network error
    return showNetworkError();
  }
}
```

## 🚀 Performance Tips

- Use `createNeatFetchInstance()` to avoid recreating configuration
- Set appropriate timeouts to avoid hanging requests
- Use retry sparingly - not all endpoints benefit from retries
- Consider using `head()` requests for checking resource existence
- Stream large responses with `.stream()` instead of `.json()`

## 📝 API Reference Summary

| Method | Description | Returns |
|--------|-------------|---------|
| `.json<T>()` | Parse as JSON | `Promise<FetchResult<T>>` |
| `.text()` | Parse as text | `Promise<FetchResult<string>>` |
| `.blob()` | Parse as Blob | `Promise<FetchResult<Blob>>` |
| `.arrayBuffer()` | Parse as ArrayBuffer | `Promise<FetchResult<ArrayBuffer>>` |
| `.formData()` | Parse as FormData | `Promise<FetchResult<FormData>>` |
| `.stream()` | Get ReadableStream | `Promise<FetchResult<ReadableStream>>` |
| `.get<T>()` | GET request | `Promise<FetchResult<T>>` |
| `.post<T>(data)` | POST request | `Promise<FetchResult<T>>` |
| `.put<T>(data)` | PUT request | `Promise<FetchResult<T>>` |
| `.patch<T>(data)` | PATCH request | `Promise<FetchResult<T>>` |
| `.delete<T>()` | DELETE request | `Promise<FetchResult<T>>` |
| `.head()` | HEAD request | `Promise<FetchResult<Response>>` |
| `.options()` | OPTIONS request | `Promise<FetchResult<Response>>` |
| `.timeout(ms)` | Set timeout | `NeatFetchInstance` |
| `.retry(count, delay?)` | Set retry | `NeatFetchInstance` |
| `.headers(obj)` | Add headers | `NeatFetchInstance` |
| `.query(params)` | Add query params | `NeatFetchInstance` |
| `.clone()` | Clone NeatFetch instance | `NeatFetchInstance` |
| `.fromResponse` | Parse response |  json, text, blob, arrayBuffer or formData | 

## 🤝 Contributing

We love contributions! Please check out our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT License

Copyright (c) 2025 dforrunner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


---

**Made with ❤️ for developers who hate messy error handling**