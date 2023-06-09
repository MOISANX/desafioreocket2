import { randomUUID } from "crypto";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {  z } from 'zod';
import { knex } from "../database";
import bcrypt from 'bcrypt';




export async function userRoutes(app: FastifyInstance){

  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as {email:string ,password: string}
  
    const user = await knex('users')
      .where(function () {
        this.where('email', email)
      })
      .first();
  
    if (!user) {
   
      return reply.status(401).send('Credenciais inválidas');
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
   
      return reply.status(401).send('Credenciais inválidas senha');
    }

    const sessionId: string | undefined = user.session_id;
    
    
  if (sessionId) {
  
    reply.setCookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // Define o tempo de expiração desejado para a sessão
    });
  }

  return reply.send('Login bem-sucedido');
   
  });
  

  app.get('/', async () =>{

    const users = await knex('users').select(
      'id',
      'email',
      'fullName',
      'username',
      'password',
      'session_id'
    )

    return{
      users
    }


  })

  app.post('/create', async (request, reply) => {

    const createUserBodySchema = z.object({
      fullName: z.string(),
      username: z.string(),
      email: z.string(),
      password:z.string(),
    })

    const {fullName, username, email, password } = createUserBodySchema.parse(request.body)

    const hashedPassword = await bcrypt.hash(password, 10);

    let sessionId = request.cookies.sessionId

    if(!sessionId){
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId , {
        path: '/',
        maxAge: 1000* 60 * 60* 24 * 7,
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      email,
      username,
      fullName,
      password: hashedPassword,
      session_id: sessionId,

    })

      return reply.status(201).send()

  })

  app.put('/update/:id',async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>{

    const updateUser = z.object({
     fullName: z.string(),
      username: z.string(),
      email: z.string(),
      password:z.string(),
    })

    
    const id = request.params.id;
    const data = request.body;
  
    try {
      const validatedData = updateUser.parse(data);
  
      await knex('users')
        .where({ id})
        .update(validatedData);
  
      reply.send({ message: 'Usuário atualizado com sucesso!' });
    } catch (error) {
      console.error(error);
      reply.status(400).send({ error: 'Dados inválidos.' });
    }

  })

  app.delete('/delete/:id',
   async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {

      const userId = request.params.id;

     await knex('users').where({id: userId}).del();

     return reply.send('Usuario excluido com sucesso');

  })


  
}