// eslint-disable-next-line
import { Knex } from 'knex'


declare module 'knex/types/tables' {

  export interface Tables {

    users: {
      id: string 
      session_id?: string
      fullName: string
      username: string
      email: string
      password: string
    },

    meals: {
      id: string
      userId: string
      name: string
      description: string
      dateAndTime: string
      isDietMeal: boolean
    }



  }
}