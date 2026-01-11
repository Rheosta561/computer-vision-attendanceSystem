"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const hono_1 = require("hono");
const auth_controller_1 = require("@/controllers/auth.controller");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const faculty_middleware_1 = require("@/middlewares/faculty.middleware");
const ApiError_1 = require("@/utils/ApiError");
const authRouter = new hono_1.Hono();
exports.authRouter = authRouter;
//routes
authRouter.post('/login', auth_controller_1.loginUser);
authRouter.post('/register', auth_controller_1.registerUser);
authRouter.post('/refresh-session', auth_controller_1.refreshSession);
authRouter.post('/logout', auth_controller_1.logoutUser);
// protected test
authRouter.get('/protected', auth_middleware_1.verifyJWT, (c) => {
    return c.json({ message: "you have accessed a protected route" });
});
// assign faculty key
authRouter.post('/assign-faculty-key', auth_middleware_1.verifyJWT, auth_controller_1.assignFacultyKey);
// faculty protected test
authRouter.get('/faculty-protected', auth_middleware_1.verifyJWT, faculty_middleware_1.requireFaculty, (c) => {
    try {
        return c.json({ message: "you have accessed a faculty protected route" });
    }
    catch (error) {
        throw new ApiError_1.ApiError(500, 'Not having access to faculty route');
    }
});
authRouter.post('/get-credentials', auth_controller_1.getCredentials);
// changepassword 
authRouter.post('/change-password', auth_middleware_1.verifyJWT, auth_controller_1.changePassword);
// forget password
authRouter.post('/forgot-password', auth_controller_1.forgotPassword);
