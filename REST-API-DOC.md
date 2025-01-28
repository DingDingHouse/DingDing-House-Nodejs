# REST API with Node.js, Express, and OOP

This project is a simple REST API built using Node.js and Express.js with an object-oriented approach. It includes user management functionalities and a global error handler using `http-errors`.

## Prerequisites

- Node.js installed
- MongoDB instance (local or remote)

## Step 1: Set Up Your Project

1. **Initialize your project**:

   ```sh
   mkdir rest-api-oop
   cd rest-api-oop
   npm init -y
   ```

2. **Install dependencies**:
   ```sh
   npm install express mongoose http-errors
   ```

## Step 2: Create the Basic Project Structure

```
rest-api-oop/
├── src/
│   ├── users/
│   │   ├── controllers/
│   │   │   └── userController.js
│   │   ├── models/
│   │   │   └── userModel.js
│   │   ├── routes/
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   └── userService.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── app.js
│   ├── config.js
└── README.md
```

## Step 3: Set Up the Configuration

1. **src/config.js**:
   ```js
   module.exports = {
     port: process.env.PORT || 3000,
     mongoURI: "your_mongodb_connection_string",
   };
   ```

## Step 4: Create the Model

1. **src/users/models/userModel.js**:

   ```js
   const mongoose = require("mongoose");

   const userSchema = new mongoose.Schema({
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
   });

   const User = mongoose.model("User", userSchema);

   module.exports = User;
   ```

## Step 5: Create the Service

1. **src/users/services/userService.js**:

   ```js
   const User = require("../models/userModel");

   class UserService {
     async createUser(data) {
       const user = new User(data);
       return await user.save();
     }

     async getUserById(id) {
       return await User.findById(id);
     }

     async getAllUsers() {
       return await User.find();
     }

     async updateUser(id, data) {
       return await User.findByIdAndUpdate(id, data, { new: true });
     }

     async deleteUser(id) {
       return await User.findByIdAndDelete(id);
     }
   }

   module.exports = new UserService();
   ```

## Step 6: Create the Controller

1. **src/users/controllers/userController.js**:

   ```js
   const createError = require("http-errors");
   const userService = require("../services/userService");

   class UserController {
     async createUser(req, res, next) {
       try {
         const user = await userService.createUser(req.body);
         res.status(201).json(user);
       } catch (error) {
         next(createError(400, error.message));
       }
     }

     async getUserById(req, res, next) {
       try {
         const user = await userService.getUserById(req.params.id);
         if (!user) {
           return next(createError(404, "User not found"));
         }
         res.json(user);
       } catch (error) {
         next(createError(400, error.message));
       }
     }

     async getAllUsers(req, res, next) {
       try {
         const users = await userService.getAllUsers();
         res.json(users);
       } catch (error) {
         next(createError(400, error.message));
       }
     }

     async updateUser(req, res, next) {
       try {
         const user = await userService.updateUser(req.params.id, req.body);
         if (!user) {
           return next(createError(404, "User not found"));
         }
         res.json(user);
       } catch (error) {
         next(createError(400, error.message));
       }
     }

     async deleteUser(req, res, next) {
       try {
         const user = await userService.deleteUser(req.params.id);
         if (!user) {
           return next(createError(404, "User not found"));
         }
         res.json({ message: "User deleted successfully" });
       } catch (error) {
         next(createError(400, error.message));
       }
     }
   }

   module.exports = new UserController();
   ```

## Step 7: Create the Routes

1. **src/users/routes/userRoutes.js**:

   ```js
   const express = require("express");
   const userController = require("../controllers/userController");

   const router = express.Router();

   router.post("/users", userController.createUser);
   router.get("/users/:id", userController.getUserById);
   router.get("/users", userController.getAllUsers);
   router.put("/users/:id", userController.updateUser);
   router.delete("/users/:id", userController.deleteUser);

   module.exports = router;
   ```

## Step 8: Set Up the Application

1. **src/middleware/errorHandler.js**:

   ```js
   const createError = require("http-errors");

   const errorHandler = (err, req, res, next) => {
     if (!err.status) {
       err = createError(500, err.message);
     }

     res.status(err.status || 500);
     res.json({
       status: err.status,
       message: err.message,
     });
   };

   module.exports = errorHandler;
   ```

2. **src/app.js**:

   ```js
   const express = require("express");
   const mongoose = require("mongoose");
   const config = require("./config");
   const userRoutes = require("./users/routes/userRoutes");
   const errorHandler = require("./middleware/errorHandler");

   const app = express();

   app.use(express.json());

   mongoose
     .connect(config.mongoURI, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
     })
     .then(() => console.log("MongoDB connected"))
     .catch((err) => console.error(err));

   app.use("/api", userRoutes);

   // Error handler middleware
   app.use(errorHandler);

   const PORT = config.port;
   app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
   });
   ```

## Step 9: Run Your Application

1. **Start the server**:
   ```sh
   node src/app.js
   ```

The server will start on the port defined in `config.js` (default is 3000).
