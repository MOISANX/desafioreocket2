import fastify from 'fastify'
import { env } from './env'
import cookie from '@fastify/cookie'
import { userRoutes } from './routes/user'
import { mealsRoutes } from './routes/meals'



const app = fastify()

app.register(cookie)
app.register(userRoutes,{
  prefix: 'users',
})
app.register(mealsRoutes,{
  prefix: 'meals'
})


app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('Rodando a mais de mil graus')
  })
