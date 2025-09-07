# Personal Cloud Server - Frontend

A React frontend application for the Personal Cloud Server project. This application provides a clean, minimal interface for user authentication and file management.

## Features

- **User Authentication**: Login and registration with email/password
- **File Upload**: Upload files to your personal cloud storage
- **File Management**: View and download your uploaded files
- **Responsive Design**: Clean, minimal UI that works on desktop and mobile
- **Session Management**: Simple session-based authentication using localStorage

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Backend server running on `http://localhost:8080`

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Make sure your Spring Boot backend is running on `http://localhost:8080`

2. Start the React development server:
   ```bash
   npm start
   ```

3. The application will open in your browser at `http://localhost:3000`

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.js          # Login page component
│   │   ├── Register.js       # Registration page component
│   │   └── Dashboard.js      # Main dashboard with file operations
│   ├── App.js               # Main app component with routing
│   ├── App.css              # App-specific styles
│   ├── index.js             # Application entry point
│   └── index.css            # Global styles
├── package.json
└── README.md
```

## API Endpoints Used

The frontend communicates with the following backend endpoints:

- `POST /api/registerUser` - User registration
- `POST /api/loginUser` - User login
- `POST /api/files/upload` - File upload
- `GET /api/files/my-files/{ownerId}` - Get user's files
- `GET /api/files/download/{fileId}` - Download file

## Usage

### Registration
1. Navigate to the registration page
2. Fill in username, email, and password
3. Confirm password matches
4. Click "Register" to create your account
5. You'll be redirected to the login page

### Login
1. Enter your email and password
2. Click "Login" to access your dashboard
3. You'll be redirected to the dashboard upon successful login

### File Management
1. **Upload Files**: Select a file using the file picker and click "Upload File"
2. **View Files**: See all your uploaded files in the "Your Files" section
3. **Download Files**: Click the "Download" button next to any file to download it

## Authentication

The application uses simple session-based authentication:
- User credentials are stored in localStorage after successful login
- The user remains logged in until they explicitly logout or clear browser data
- Protected routes automatically redirect to login if user is not authenticated

## Styling

The application uses a clean, minimal design with:
- Responsive layout that works on desktop and mobile
- Clean typography and spacing
- Intuitive color scheme with blue accents
- Card-based layout for better content organization

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

### Proxy Configuration

The `package.json` includes a proxy configuration that forwards API requests to the backend server running on `http://localhost:8080`. This allows the frontend to make requests to `/api/*` endpoints without CORS issues during development.

## Troubleshooting

### Common Issues

1. **Backend Connection Error**: Make sure your Spring Boot backend is running on port 8080
2. **CORS Issues**: The backend should have `@CrossOrigin(origins = "*")` configured
3. **File Upload Fails**: Check that the backend file upload directory has proper permissions
4. **Login Issues**: Verify that the backend user validation is working correctly

### Browser Compatibility

The application is tested on modern browsers including:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Make sure the backend is running and accessible
2. Test all functionality including login, registration, file upload, and download
3. Ensure the UI is responsive and works on different screen sizes
4. Follow the existing code style and component structure
