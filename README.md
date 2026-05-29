# DevPulse

### Live link: [Dev-Pulse](https://dev-pulse-delta-eight.vercel.app/)

## Features

- User Registration (only type **contributor** and **maintainer**)
- User Login (only authenticated users)
- Create Issue (only can authenticated users)
- Get All Issues
- Get Single Issue
- Update Issue (maintainer can update any issue but contributor can update only own issue and only if the status is open)
- Delete Issue (only maintainer can delete a issue)

## Tech Stack

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Raw SQL
- bcrypt
- jsonwebtoken

## Setup Steps

1. Select `git bash` instead of `terminal`
2. then run:

   ```bash
   npm init --y
   ```

3. then to use typescript, run:

   ```bash
   npm i -D typescript
   ```

4. then to get typescript config file, run:

   ```bash
   npx tsc --init
   ```

5. then go to `tsconfig.json` file -
   - Uncomment the following lines:

     ```tsx
     // "rootDir": "./src",
     // "outDir": "./dist",
     ```

   - change `"module": "nodenext",` to `"module": "esnext",` .
   - change `"types": [],` to `"types": ["node"],` .
   - we can comment the line `"jsx": "react-jsx",`

6. then go to `package.json` file:
   - change `"type": "commonjs"` to `"type": "module"`
   - type into scripts:
     ```tsx
     "dev": "tsx watch ./src/server.ts",
     ```
7. Create a folder named `src` in the root directory and create a file in this folder named `server.ts`
8. go to [expressjs.com](http://expressjs.com) . then copy the express installation command line and run in the terminal

   ```bash
   npm i express
   ```

9. copy the code template from the website and paste in `server.ts` file
10. add line the following cmd line to the copied code:

    ```bash
    import express from “express”
    ```

11. to remove the error for express run the command:

    ```bash
    npm i --save-dev @types/express
    ```

12. for the script in point 6, run:

    ```bash
    npm i -D tsx
    ```

13. search `neondb` in browser. login and crate a project then click connect. we will get a **connection string** there.
14. to install pg, run:

    ```bash
    npm install pg
    ```

15. to solve type error of pg, run:

    ```bash
    npm i --save-dev @types/pg
    ```

16. to install dotenve, run:

    ```bash
    npm i dotenv
    ```

17. to install the package of bcryptjs, run:

    ```bash
    npm i bcryptjs
    ```

18. to install the package of jsonwebtoken, run:
    ```bash
    npm i jsonwebtoken
    ```

## API endpoints:

- User Registration: `POST /api/auth/signup`
- User Login: `POST /api/auth/login`
- Create Issue: `POST /api/issues`
- Get All Issues: `GET /api/issues?sort=newest`
- Get Single Issue: `GET /api/issues/:id`
- Update Issue: `PATCH /api/issues/:id`
- Delete Issue: `DELETE /api/issues/:id`

## Database Schema Summary

## Table: users

Stores account information for all system users.

<table border="1" cellpadding="8" cellspacing="0">
    <tr>
        <th>Field</th>
        <th>Type/Constraint</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>id</code></td>
        <td>SERIAL PRIMARY KEY </td>
        <td>Unique auto-incrementing identifier</td>
    </tr>
    <tr>
        <td><code>name</code></td>
        <td>VARCHAR, NOT NULL</td>
        <td>Full name of the user</td>
    </tr>
    <tr>
        <td><code>email</code></td>
        <td>VARCHAR, UNIQUE, NOT NULL</td>
        <td>User login email address</td>
    </tr>
    <tr>
        <td><code>password</code></td>
        <td>TEXT, NOT NULL</td>
        <td>Encrypted password (never returned in API responses)</td>
    </tr>
    <tr>
        <td><code>role</code></td>
        <td>VARCHAR, DEFAULT <code>'contributor'</code>,CHECK (<code>role IN('contributor','maintainer')</code>)</td>
        <td>Defines user access level</td>
    </tr>
    <tr>
        <td><code>created_at</code></td>
        <td>TIMESTAMP, DEFAULT CURRENT_TIMESTAMP</td>
        <td>Account creation time</td>
    </tr>
    <tr>
        <td><code>updated_at</code></td>
        <td>TIMESTAMP, DEFAULT CURRENT_TIMESTAMP</td>
        <td>Last update time</td>
    </tr>
</table>

## Table: issues

Stores reported bugs and feature requests.

<table border="1" cellpadding="8" cellspacing="0">
    <tr>
        <th>Field</th>
        <th>Type/Constraint</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>id</code></td>
        <td>SERIAL PRIMARY KEY </td>
        <td>Unique auto-incrementing identifier</td>
    </tr>
    <tr>
        <td><code>title</code></td>
        <td>VARCHAR, NOT NULL</td>
        <td>Short issue title</td>
    </tr>
    <tr>
        <td><code>description</code></td>
        <td>TEXT, NOT NULL</td>
        <td>Detailed issue description (minimum 20 characters validated in application logic)</td>
    </tr>
    <tr>
        <td><code>type</code></td>
        <td>VARCHAR, CHECK (<code>type IN ('bug', 'feature_request')</code>)</td>
        <td>Type of issue</td>
    </tr>
    <tr>
        <td><code>status</code></td>
        <td>VARCHAR, DEFAULT <code>'open'</code>,CHECK (<code>status IN('open','in_progress', 'resolved')</code>)</td>
        <td>Current issue status</td>
    </tr>
    <tr>
        <td><code>reporter_id</code></td>
        <td>INT, NOT NULL</td>
        <td>ID of the reporting user (validated in application logic)</td>
    </tr>
    <tr>
        <td><code>created_at</code></td>
        <td>TIMESTAMP, DEFAULT CURRENT_TIMESTAMP</td>
        <td>Issue creation time</td>
    </tr>
    <tr>
        <td><code>updated_at</code></td>
        <td>TIMESTAMP, DEFAULT CURRENT_TIMESTAMP</td>
        <td>Last update time</td>
    </tr>
</table>
