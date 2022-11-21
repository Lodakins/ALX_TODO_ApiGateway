import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import  middy from 'middy';
import { getUserId } from '../lambda/utils';

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
  signatureVersion: 'v4'
});
const itemsTable = process.env.TODOS_TABLE;
const bucketName = process.env.ATTACHMENT_S3_BUCKET;

export const handler = middy (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Caller event', event)
    const itemId = event.pathParameters.itemId
    const validGroupId = await itemExists(itemId,event);
  
    if (!validGroupId) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Item does not exist'
        })
      }
    }
  
  
     const url = getUploadUrl(itemId)

     await updateItem(url,itemId,event);
  
    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: url
      })
    }
  });


  async function updateItem(url: string, itemId: string, event: APIGatewayProxyEvent) {

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
      })
  }

   async function itemExists(itemId: string, event: APIGatewayProxyEvent){
    const result= await this.docClient.get({
        TableName: this.itemsTable,
        Key: {
          userId: getUserId(event),
          todoId: itemId
        }
      }).promise();

      return !!result.Item;
  }

  function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: imageId,
      Expires: 300
    })
  }