import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ApiError } from './utils/ApiError'
import { ApiResponse } from './utils/ApiResponse'
import { authRouter } from './routers/auth.router'
import { eventRouter } from './routers/event.router'
import {groupRouter} from './routers/group.router'
import { userRouter } from './routers/user.router'
import { profileRouter } from './routers/profile.router'
import { sendEmail } from './utils/sendMail'

const app = new Hono()

app.onError((err, c) => {

  if (err instanceof ApiError) {
    return c.json(
      {
        success : false,
        message : err.message,
        errors : err.errors,
      },
      err.statusCode as any
    )
  }

  // Unknown error
  console.error(err)

  return c.json(
    {
      success: false,
      message: 'Internal Server Error',
    },
    500
  )
})


app.route('/auth' , authRouter)

app.route('/event', eventRouter);

app.route('/group', groupRouter);

app.route('/user', userRouter);

app.route('/profile' , profileRouter);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})






//testing  error util 
app.get('/error', (c) => {
  throw new ApiError(400, "This is a custom API error", [{ field: "example", message: "Example error message" } , ])
})

//testing response util
app.get('/success' , (c)=>{
  const response  = new ApiResponse(200 , { user : "Anubhav Mishra" } )
  return c.json(response )
})

// testing mail util
app.get('/test-email', async (c) => {
  await sendEmail({
    to: 'manubhav731@gmail.com',
    subject: 'Test Email',
    html: '<h1>Email working 🚀</h1>',
  })

  return c.text('Email sent')
})



//

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
