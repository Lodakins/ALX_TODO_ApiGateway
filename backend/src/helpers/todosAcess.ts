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
      private readonly groupsTable = process.env.TODOS_TABLE) {
    }
  
    async getAllItems(): Promise<TodoItem[]> {
      console.log('Getting all items')
  
      const result = await this.docClient.scan({
        TableName: this.groupsTable
      }).promise()
  
      const items = result.Items
      return items as TodoItem[]
    }
  
    async createTodItem(item: TodoItem): Promise<TodoItem> {
      await this.docClient.put({
        TableName: this.groupsTable,
        Item: group
      }).promise()
  
      return item
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