# Posts API Reference

The Posts API provides methods for managing discussion posts and comments within the HakgyoExpo platform. It enables users to create, read, update, and delete posts, as well as manage likes and comments on posts.

## Installation

Ensure you have the SDK installed and configured:

```bash
npm install @hakgyo/expo-sdk
```

```typescript
import { postsApi } from '@hakgyo/expo-sdk';
```

---

## Overview

The [`postsApi`](packages/hakgyo-expo-sdk/src/api/posts.ts:6) object provides the following functionality:

- **Post Management**: Create, read, update, and delete discussion posts
- **Engagement**: Like and unlike posts
- **Comments**: Add and retrieve comments on posts

---

## Available Methods

### `list(params?)`

Retrieves a paginated list of all posts with optional filtering.

```typescript
const response = await postsApi.list({
  page: 1,
  limit: 10,
  search: 'Korean',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params` | [`QueryParams`](#queryparams) | Optional query parameters for filtering, pagination, and sorting |

**Returns:** `Promise<PaginatedResponse<Post>>`

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Tips for Learning Korean",
      "description": "Here are some tips...",
      "type": "DISCUSSION",
      "isPublished": true,
      "isPinned": false,
      "viewCount": 150,
      "likeCount": 25,
      "commentCount": 10,
      "shareCount": 5,
      "tags": ["korean", "tips"],
      "authorId": "user-123",
      "kelasId": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### `get(id)`

Retrieves a single post by its ID.

```typescript
const post = await postsApi.get(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post |

**Returns:** `Promise<Post>`

---

### `create(data)`

Creates a new post.

```typescript
const newPost = await postsApi.create({
  title: 'My New Post',
  description: 'This is the content of my post',
  type: 'DISCUSSION',
  isPublished: true,
  tags: ['help', 'question'],
  kelasId: 1
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Partial<Post>` | The post data to create |

**Returns:** `Promise<Post>`

---

### `update(id, data)`

Updates an existing post.

```typescript
const updatedPost = await postsApi.update(1, {
  title: 'Updated Title',
  description: 'Updated content'
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post to update |
| `data` | `Partial<Post>` | The fields to update |

**Returns:** `Promise<Post>`

---

### `delete(id)`

Deletes a post.

```typescript
await postsApi.delete(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post to delete |

**Returns:** `Promise<void>`

---

### `like(id)`

Likes a post.

```typescript
await postsApi.like(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post to like |

**Returns:** `Promise<void>`

---

### `unlike(id)`

Unlikes a post (removes the like).

```typescript
await postsApi.unlike(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post to unlike |

**Returns:** `Promise<void>`

---

### `getComments(id)`

Retrieves all comments for a specific post.

```typescript
const comments = await postsApi.getComments(1);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post |

**Returns:** `Promise<Comment[]>`

---

### `addComment(id, content)`

Adds a new comment to a post.

```typescript
const comment = await postsApi.addComment(1, 'Great post! Thanks for sharing.');
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `number` | The unique identifier of the post |
| `content` | `string` | The comment content |

**Returns:** `Promise<Comment>`

---

## Types

### `Post`

Represents a discussion post in the platform.

```typescript
interface Post {
  id: number;
  title: string;
  description?: string;
  jsonDescription?: any;
  htmlDescription: string;
  type: 'DISCUSSION' | 'ANNOUNCEMENT' | 'QUESTION' | 'SHARE' | 'TUTORIAL';
  isPublished: boolean;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: User;
  kelasId?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique identifier |
| `title` | `string` | Post title |
| `description` | `string?` | Post description/content |
| `jsonDescription` | `any?` | JSON representation of content |
| `htmlDescription` | `string` | HTML rendered content |
| `type` | `'DISCUSSION' \| 'ANNOUNCEMENT' \| 'QUESTION' \| 'SHARE' \| 'TUTORIAL'` | Post type/category |
| `isPublished` | `boolean` | Whether the post is published |
| `isPinned` | `boolean` | Whether the post is pinned to top |
| `viewCount` | `number` | Number of views |
| `likeCount` | `number` | Number of likes |
| `commentCount` | `number` | Number of comments |
| `shareCount` | `number` | Number of shares |
| `tags` | `string[]` | Array of tags |
| `authorId` | `string` | Author's user ID |
| `author` | `User?` | Author details (when included) |
| `kelasId` | `number?` | Associated class ID (optional) |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |

---

### `Comment`

Represents a comment on a post.

```typescript
interface Comment {
  id: number;
  content: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Unique identifier |
| `content` | `string` | Comment text content |

---

### `QueryParams`

Standard query parameters for API requests.

```typescript
interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
```

---

## Usage Examples

### Listing Posts in a Class

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

// Fetch posts for a specific class
async function getClassPosts(kelasId: number) {
  const response = await postsApi.list({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    kelasId: kelasId.toString()
  });

  if (response.success && response.data) {
    return response.data;
  }
  
  throw new Error(response.error || 'Failed to fetch posts');
}

// Usage
const posts = await getClassPosts(1);
console.log(`Found ${posts.length} posts`);
```

### Creating a New Post

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

async function createDiscussionPost() {
  const postData = {
    title: 'How to improve Korean listening skills?',
    description: 'I have been learning Korean for 6 months but struggle with listening. Any tips?',
    type: 'QUESTION' as const,
    isPublished: true,
    tags: ['korean', 'listening', 'help'],
    kelasId: 1
  };

  const response = await postsApi.create(postData);

  if (response.success && response.data) {
    console.log('Post created:', response.data.id);
    return response.data;
  }

  throw new Error(response.error || 'Failed to create post');
}

// Usage
const newPost = await createDiscussionPost();
```

### Liking and Unliking Posts

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

async function toggleLike(postId: number, isLiked: boolean) {
  try {
    if (isLiked) {
      await postsApi.unlike(postId);
      console.log('Post unliked');
    } else {
      await postsApi.like(postId);
      console.log('Post liked');
    }
  } catch (error) {
    console.error('Failed to toggle like:', error);
  }
}

// Usage
await toggleLike(1, false); // Like post 1
await toggleLike(1, true);  // Unlike post 1
```

### Managing Comments

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

// Get all comments for a post
async function getPostComments(postId: number) {
  const comments = await postsApi.getComments(postId);
  return comments;
}

// Add a comment to a post
async function addReply(postId: number, content: string) {
  const comment = await postsApi.addComment(postId, content);
  return comment;
}

// Usage
const comments = await getPostComments(1);
console.log(`Post has ${comments.length} comments`);

const newComment = await addReply(1, 'Thanks for sharing this!');
console.log('Comment added:', newComment.id);
```

### Searching Posts

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

async function searchPosts(query: string) {
  const response = await postsApi.list({
    page: 1,
    limit: 10,
    search: query,
    sortBy: 'likeCount',
    sortOrder: 'desc'
  });

  if (response.success && response.data) {
    return response.data;
  }

  return [];
}

// Usage
const results = await searchPosts('Korean grammar');
console.log(`Found ${results.length} posts matching "Korean grammar"`);
```

---

## Error Handling

The Posts API may return errors in the following scenarios:

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `404` | Post not found | Verify the post ID exists |
| `401` | Unauthorized | Ensure user is authenticated |
| `403` | Forbidden | Check user permissions for the operation |
| `400` | Bad Request | Validate the request data |
| `500` | Server Error | Try again later or contact support |

### Error Response Format

```json
{
  "success": false,
  "error": "Post not found",
  "message": "The post with ID 999 does not exist"
}
```

### Handling Errors

```typescript
import { postsApi } from '@hakgyo/expo-sdk';

async function safeGetPost(id: number) {
  try {
    const post = await postsApi.get(id);
    return post;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('Post not found');
      return null;
    }
    if (error.response?.status === 401) {
      console.error('Please login to view this post');
      throw error;
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Pagination

Always use pagination when fetching lists of posts to improve performance:

```typescript
// Good: Use pagination
const response = await postsApi.list({ page: 1, limit: 20 });

// Avoid: Fetching all posts at once
// const response = await postsApi.list(); // May return large datasets
```

### 2. Optimistic Updates

For better UX, implement optimistic updates when liking posts:

```typescript
async function toggleLikeWithOptimisticUpdate(postId: number, currentlyLiked: boolean) {
  // Update UI immediately
  setPostLiked(postId, !currentlyLiked);
  
  try {
    // Make API call
    if (currentlyLiked) {
      await postsApi.unlike(postId);
    } else {
      await postsApi.like(postId);
    }
  } catch (error) {
    // Revert on error
    setPostLiked(postId, currentlyLiked);
    console.error('Failed to toggle like');
  }
}
```

### 3. Input Validation

Validate user input before creating or updating posts:

```typescript
function validatePostData(data: Partial<Post>): string[] {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!data.type) {
    errors.push('Post type is required');
  }
  
  return errors;
}
```

### 4. Caching

Implement caching for frequently accessed posts:

```typescript
const postCache = new Map<number, { post: Post; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getPostCached(id: number): Promise<Post> {
  const cached = postCache.get(id);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.post;
  }
  
  const post = await postsApi.get(id);
  postCache.set(id, { post, timestamp: Date.now() });
  
  return post;
}
```

### 5. Error Boundaries

Wrap post-related operations in error boundaries:

```typescript
async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Post operation failed:', error);
    // Show user-friendly error message
    return null;
  }
}

// Usage
const post = await withErrorHandling(() => postsApi.get(1));
```

---

## Related APIs

- [Kelas API](./api-kelas.md) - Class management
- [Materi API](./api-materi.md) - Learning materials
- [Vocabulary API](./api-vocabulary.md) - Vocabulary sets

---

## Changelog

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release with basic CRUD operations |
| 1.1.0 | Added like/unlike functionality |
| 1.2.0 | Added comment management |