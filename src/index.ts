import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ApiError } from './utils/ApiError'
import { ApiResponse } from './utils/ApiResponse'
import { authRouter } from './routers/auth.router'

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


//

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
