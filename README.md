# MeTube API

This project is a complex backend built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **JWT**, **Bcrypt**, and more. It replicates core backend functionalities of YouTube, allowing users to create channels, upload videos, and interact through likes, dislikes, comments, replies, subscriptions, and even post tweets. The API adheres to standard backend practices, utilizing JWT for authentication, Bcrypt for password hashing, and implements access and refresh tokens for secure session management.

## Features

- **User Authentication**: Secure login and signup using JWT, Bcrypt, access tokens, and refresh tokens.
- **Channel Creation**: Users automatically get a channel upon registration.
- **Video Uploads**: Upload videos directly to channels, processed using **Multer** and stored in **Cloudinary**.
- **Video Management**: Features include upload, delete, and retrieve video details.
- **Interaction**: Users can like, dislike, comment, and reply to comments on videos.
- **Subscriptions**: Subscribe or unsubscribe to channels.
- **Community Posts (Tweets)**: Similar to YouTube's community posts, users can post tweets to share updates.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas, Mongoose
- **Authentication**: JWT (JSON Web Tokens), Bcrypt
- **File Upload**: Multer (video files)
- **Cloud Storage**: Cloudinary (video storage)
- **Security**: Access Tokens, Refresh Tokens

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**
- **MongoDB Atlas** account
- **Cloudinary** account

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Harsh-710/MeTube-API.git
   ```

2. **Install dependencies:**

   ```bash
   cd MeTube-API
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory and add the following:

   ```bash
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   MONGODB_URI=your-mongo-db-atlas-uri
   CORS_ORIGIN=your-personal-ip-address
   ACCESS_TOKEN_SECRET=your-access-token-secret
   ACCESS_TOKEN_EXPIRY=your-access-token-expiry
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   REFRESH_TOKEN_EXPIRY=your-refresh-token-expiry
   ```

4. **Run the server:**

   ```bash
   npm start
   ```

   The API will be running at `http://localhost:5000`.

## API Endpoints

### 1. **User Authentication**

- **POST** `/api/v1/users/register`
  - Register a new user with secure password hashing.
  - Automatically creates a linked channel.

- **POST** `/api/v1/users/login`
  - Authenticate user and receive access and refresh tokens.

- **POST** `/api/v1/users/refresh-token`
  - Obtain a new access token using a refresh token.

- **POST** `/api/v1/users/logout`
  - Logout user and invalidate the refresh token.

- **POST** `/api/v1/users/change-password`
  - Changes password of the user.

- **GET** `/api/v1/users/current-user`
  - Returns details of the logged in user.

- **PATCH** `/api/v1/users/update-account`
  - Updates account details of the user.

- **PATCH** `/api/v1/users/update-avatar`
  - Updates avatar-image of the user account.

- **PATCH** `/api/v1/users/update-cover-image`
  - Updates cover-image of the user account.

- **GET** `/api/v1/users/channel/:username`
  - Returns user's channel profile.

- **GET** `/api/v1/users/watch-history`
  - Returns a list of all the videos user has watched.

- **DELETE** `/api/v1/users/delete-account`
  - Deletes user account.

## Built With

- [**Node.js**](https://nodejs.org/) - JavaScript runtime environment
- [**Express.js**](https://expressjs.com/) - Web framework for Node.js
- [**MongoDB Atlas**](https://www.mongodb.com/cloud/atlas) - Cloud-based NoSQL database
- [**Mongoose**](https://mongoosejs.com/) - MongoDB object modeling tool
- [**JWT**](https://jwt.io/) - JSON Web Tokens for authentication
- [**Bcrypt**](https://github.com/kelektiv/node.bcrypt.js) - Library for hashing passwords
- [**Multer**](https://github.com/expressjs/multer) - Middleware for handling `multipart/form-data`
- [**Cloudinary**](https://cloudinary.com/) - Cloud storage for media
- **And many more...**

## Security Practices

- **Password Hashing:** User passwords are securely hashed using Bcrypt.
- **Authentication:** Implements JWT for stateless authentication.
- **Token Management:** Utilizes access and refresh tokens for session management.
- **Data Validation:** Ensures all inputs are validated to prevent injections and errors.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the project**

2. **Create your feature branch:**

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit your changes:**

   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the branch:**

   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a pull request**

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

- **Your Name** - [Harsh Chhachhia](mailto:harshchhachhia008@gmail.com)
- **Project Link:** [https://github.com/Harsh-710/MeTube-API](https://github.com/Harsh-710/MeTube-API)

---
