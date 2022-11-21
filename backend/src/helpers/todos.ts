import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'
import { getUserId } from '../lambda/utils';
import { APIGatewayProxyEvent } from 'aws-lambda';

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()

export async function getTodos(): Promise<TodoItem[]> {
  return todoAccess.getAllItems()
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest ,
  event: APIGatewayProxyEvent
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = getUserId(event)

  return await todoAccess.createTodoItem({
      userId: userId,
      todoId: itemId,
      createdAt: new Date().toString(),
      name: createTodoRequest.name,
      dueDate: createTodoRequest.dueDate,
      done: false
  });
}


export async function updateTodo(
    updateTodoRequest: UpdateTodoRequest ,
    itemId: string,
    event: APIGatewayProxyEvent
  ): Promise<TodoItem> {

    const userId = getUserId(event);
    return await todoAccess.updateTodoItem({
        ...updateTodoRequest
    },itemId,userId)
}

export async function deleteTodo(
    itemId: string,
    event: APIGatewayProxyEvent
  ): Promise<TodoItem> {
  
    const userId = getUserId(event);
    return await todoAccess.deleteTodoItem(itemId,userId);
}

