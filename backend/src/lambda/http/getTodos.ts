import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getTodos } from '../../helpers/todos';

// TODO: Get all TODO items for a current user
export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const items =  await getTodos();

    return {
      statusCode: 201,
      body: JSON.stringify({
        items
      })
    }

});

handler.use(httpErrorHandler())
.use(
  cors({
    credentials: true
  })
)
