import { Hono } from "hono";
import { loginUser , registerUser , logoutUser  , refreshSession} from "@/controllers/auth.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";


const authRouter = new Hono()
//routes
authRouter.post('/login' , loginUser )
authRouter.post('/register', registerUser)
authRouter.post('/refresh-session' , refreshSession )
authRouter.post('/logout' , logoutUser )

// protected test
authRouter.get('/protected' , verifyJWT , (c)=>{
  return c.json( { message : "you have accessed a protected route" } )
} )


export { authRouter }
