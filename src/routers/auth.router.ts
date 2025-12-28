import { Hono } from "hono";
import { loginUser , registerUser , logoutUser  , refreshSession , assignFacultyKey} from "@/controllers/auth.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { requireFaculty } from "@/middlewares/faculty.middleware";
import { ApiError } from "@/utils/ApiError";


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

// assign faculty key
authRouter.post('/assign-faculty-key', verifyJWT,  assignFacultyKey );


// faculty protected test
authRouter.get('/faculty-protected', verifyJWT, requireFaculty , (c)=>{
  try {
    return c.json( { message : "you have accessed a faculty protected route" } )
    
  } catch (error) {
    throw new ApiError(500, 'Not having access to faculty route');
    
  }

})


export { authRouter }
