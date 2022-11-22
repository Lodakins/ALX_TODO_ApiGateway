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
  
    async getAllItems(userId: string): Promise<TodoItem[]> {
  
      try{
        const result = await this.docClient.query({
          TableName: this.itemsTable,
          KeyConditionExpression: 'userId = :ur',
          ExpressionAttributeValues: {
            ':ur': userId
          }
        }).promise()
        const items = result.Items
        return items as TodoItem[]
    
      }catch(err){
        logger.log()
        throw new Error(err);
      }
      
     
    }
  
    async createTodoItem(item: TodoItem): Promise<TodoItem> {
        try{
          await this.docClient.put({
            TableName: this.itemsTable,
            Item: item
          }).promise()
      
          return item

        }catch(err){
          logger.log({
            level: 'error',
            message: err
          });
          throw new Error(err);
        }
      
    }

    async updateTodoItem(item: TodoUpdate, itemId: string, userId : string): Promise<any>{

      try{
        const response = await this.getTodoItembyID(itemId,userId);

        if (!response) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Item does not exist'
            })
          }
        }

        await this.docClient.update({
          TableName: this.itemsTable,
          Key: {
            userId: userId,
            todoId: itemId
          },
          UpdateExpression: "SET done = :do, dueDate = :du, #name = :n",
          ExpressionAttributeNames:{
            "#name": "name"
          },
          ExpressionAttributeValues: {
            ":do": item.done,
            ":du": item.dueDate,
            ":n": item.name
          },
        }).promise();

        return true;
      }catch(err){
        logger.log({
          level: 'error',
          message: err
        });
        throw new Error(err);
      }

       
    }

    async deleteTodoItem(itemId: string, userId: string): Promise<any>{

      try{
        const response = await this.getTodoItembyID(itemId,userId);
        if (!response) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Item does not exist'
            })
          }
        }
  
        await this.docClient.delete({
          TableName: this.itemsTable,
          Key: {
            userId: userId,
            todoId: itemId
          }
        }).promise()

        return true;
      }catch(err){
        logger.log({
          level: 'error',
          message: err
        });
        throw new Error(err);
      }
      
    }

    async getTodoItembyID(itemID : string, userId: string): Promise<boolean>{
      const result=  await this.docClient.get({
        TableName: this.itemsTable,
        Key: {
          userId: userId,
          todoId: itemID
        }
      }).promise();

      return !!result.Item;
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