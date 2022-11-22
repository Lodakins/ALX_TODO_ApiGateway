import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import  middy from 'middy';
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk';
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger';
import { getUploadUrl } from '../../helpers/attachmentUtils';

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('TodosAccess');

const docClient = new XAWS.DynamoDB.DocumentClient()

const itemsTable = process.env.TODOS_TABLE;

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const validGroupId = await itemExists(todoId,event);
  
    if (!validGroupId) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Item does not exist'
        })
      }
    }
  
  
    const url = getUploadUrl(todoId);

    await updateItem(url,todoId,event);
  
    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

  async function updateItem(url: string, itemId: string, event: APIGatewayProxyEvent) {

    try{

      await docClient.update({
        TableName: itemsTable,
        Key: {
          userId: getUserId(event),
          todoId: itemId,
        },
        UpdateExpression: "set attachmentUrl = :do",
        ExpressionAttributeValues: {
          ":do": url
        },
      }).promise();

    }catch(error){
      logger.log({
        level: 'error',
        message: error
      });

      throw new Error(error);
    }
   
  }

   async function itemExists(itemId: string, event: APIGatewayProxyEvent){
    const result= await docClient.get({
        TableName: itemsTable,
        Key: {
          userId: getUserId(event),
          todoId: itemId
        }
      }).promise();

      return !!result.Item;
  }

