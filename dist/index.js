"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const ApiError_1 = require("./utils/ApiError");
const ApiResponse_1 = require("./utils/ApiResponse");
const auth_router_1 = require("./routers/auth.router");
const event_router_1 = require("./routers/event.router");
const group_router_1 = require("./routers/group.router");
const user_router_1 = require("./routers/user.router");
const profile_router_1 = require("./routers/profile.router");
const sendMail_1 = require("./utils/sendMail");
const app = new hono_1.Hono();
app.onError((err, c) => {
    if (err instanceof ApiError_1.ApiError) {
        return c.json({
            success: false,
            message: err.message,
            errors: err.errors,
        }, err.statusCode);
    }
    // Unknown error
    console.error(err);
    return c.json({
        success: false,
        message: 'Internal Server Error',
    }, 500);
});
app.route('/auth', auth_router_1.authRouter);
app.route('/event', event_router_1.eventRouter);
app.route('/group', group_router_1.groupRouter);
app.route('/user', user_router_1.userRouter);
app.route('/profile', profile_router_1.profileRouter);
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
//testing  error util 
app.get('/error', (c) => {
    throw new ApiError_1.ApiError(400, "This is a custom API error", [{ field: "example", message: "Example error message" },]);
});
//testing response util
app.get('/success', (c) => {
    const response = new ApiResponse_1.ApiResponse(200, { user: "Anubhav Mishra" });
    return c.json(response);
});
// testing mail util
app.get('/test-email', async (c) => {
    await (0, sendMail_1.sendEmail)({
        to: 'manubhav731@gmail.com',
        subject: 'Test Email',
        html: '<h1>Email working 🚀</h1>',
    });
    return c.text('Email sent');
});
//
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
