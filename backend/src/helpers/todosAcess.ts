import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {

    constructor(
      private readonly docClient: DocumentClient = createDynamoDBClient(),
      private readonly itemsTable = process.env.TODOS_TABLE) {
    }
  
    async getAllItems(): Promise<TodoItem[]> {
      console.log('Getting all items')
  
      const result = await this.docClient.scan({
        TableName: this.itemsTable
      }).promise()
  
      const items = result.Items
      return items as TodoItem[]
    }
  
    async createTodoItem(item: TodoItem): Promise<TodoItem> {
      await this.docClient.put({
        TableName: this.itemsTable,
        Item: item
      }).promise()
  
      return item
    }

    async updateTodoItem(item: TodoUpdate, itemId: String, userId : String): Promise<any>{

        const response:TodoItem = await this.getTodoItembyID(itemId,userId);

        await this.docClient.update({
          TableName: this.itemsTable,
          Key: {
            userId: response.userId,
            todoId: response.todoId,
          },
          UpdateExpression: "set done = :do, dueDate = :du, name = :n",
          ExpressionAttributeValues: {
            ":do": item.done,
            ":du": item.dueDate,
            ":n": item.name
          },
        })

        return true;
    }

    async deleteTodoItem(itemId: String, userId: String): Promise<any>{

      const response:TodoItem = await this.getTodoItembyID(itemId,userId)

      await this.docClient.delete({
        TableName: this.itemsTable,
        Key: {
          userId: response.userId,
          todoId: response.todoId
        },
      })
    }

    async getTodoItembyID(itemID : String, userId: String): Promise<TodoItem>{
      return await this.docClient.get({
        TableName: this.itemsTable,
        Key: {
          userId: userId,
          todoId: itemID
        }
      }).promise();
    }


  }

  
  function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }