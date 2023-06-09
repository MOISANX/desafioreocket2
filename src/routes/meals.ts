import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from 'zod';
import { knex } from "../database";
import { checkSessionIdExists } from '../middlewares/check-session-id'
import { randomUUID } from "crypto";

interface RouteParams {
  id: string;
}

export async function mealsRoutes(app: FastifyInstance){

  
  
  app.post('/create', {
    preHandler: [checkSessionIdExists]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      dateAndTime: z.string(),
      isDietMeal: z.boolean(),
    });

    const userId = (request as any).userId; 

    const {name, description, dateAndTime, isDietMeal} = createMealBodySchema.parse(request.body);

    await knex('meals').insert({
      id: randomUUID(),
      userId,
      name,
      description,
      dateAndTime,
      isDietMeal,
    });

    return reply.status(201).send({ message: 'Meals criado com sucesso!' })
  });

  app.get('/', {
    preHandler: [checkSessionIdExists]
  }, async () =>{

    const meals = await knex('meals').select()

    return{
      meals
    };
  })

  app.get<{ Params: RouteParams }>('/:id', {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const id = request.params.id;
  
    const meal = await knex('meals')
      .select()
      .where('id', id)
      .first();
  
    if (!meal) {
      return {
        error: 'Meal not found'
      };
    }
  
    return {
      meal
    };
  });

  app.get('/metrics', {
    preHandler: [checkSessionIdExists]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).userId; 

    // Quantidade total de refeições registradas
    const totalMeals = (await knex('meals')
      .where('userId', userId)
      .count('id as total')
      .first()) as { count: number } | undefined;

    // Quantidade total de refeições dentro da dieta
    const totalDietMeals = (await knex('meals')
      .where({ userId, isDietMeal: true })
      .count('id as total')
      .first()) as { count: number } | undefined;

    // Quantidade total de refeições fora da dieta
    const totalNonDietMeals = (await knex('meals')
      .where({ userId, isDietMeal: false })
      .count('id as total')
      .first()) as { count: number } | undefined;

    // Melhor sequência de refeições dentro da dieta
    const meals = await knex('meals')
      .where('userId', userId)
      .orderBy('dateAndTime', 'asc');

    let bestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < meals.length; i++) {
      if (meals[i].isDietMeal) {
        currentStreak += 1;
        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }

    return reply.send({
      totalMeals: totalMeals ? totalMeals.count : 0,
      totalDietMeals: totalDietMeals ? totalDietMeals.count : 0,
      totalNonDietMeals: totalNonDietMeals ? totalNonDietMeals.count : 0,
      bestDietStreak: bestStreak,
    });
  });
  
   app.put<{Params:RouteParams}>('/update/:id',async (request,reply) =>{

    const updateMeals = z.object({
      name: z.string(),
      description: z.string(),
      dateAndTime: z.string(),
      isDietMeal: z.boolean(),
    })

    
    const id = request.params.id;
    const data = request.body;
  
    try {
      const validatedData = updateMeals.parse(data);
  
      await knex('meals')
        .where({ id})
        .update(validatedData);
  
      reply.send({ message: 'Meals atualizado com sucesso!' });
    } catch (error) {
      console.error(error);
      reply.status(400).send({ error: 'Dados inválidos.' });
    }

  })
  
  app.delete<{ Params: RouteParams }>('/delete/:id',{
    preHandler: [checkSessionIdExists]
  }, async (request, reply)=>{

    const mealsId = request.params.id;

    await knex('meals').where({id: mealsId}).del();

    return reply.send('Dieta excluida com sucesso');
  })


}
