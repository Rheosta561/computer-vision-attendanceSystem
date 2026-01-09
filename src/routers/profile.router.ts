import { verifyJWT } from "@/middlewares/auth.middleware";
import { Hono } from "hono";
import { createProfile , updateProfile } from "@/controllers/profile.controller";


export const profileRouter = new Hono();
profileRouter.post('/', verifyJWT ,  async c => {
     const user = c.get('user')
     const userId = user.id
  const body = await c.req.json()

  return c.json(
    await createProfile(userId, body)
  )
})

profileRouter.patch('/', verifyJWT , async c => {
   const user = c.get('user')
     const userId = user.id
  const body = await c.req.json()

  return c.json(
    await updateProfile(userId, body)
  )
})
