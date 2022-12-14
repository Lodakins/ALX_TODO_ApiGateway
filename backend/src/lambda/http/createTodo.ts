import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo} from '../../helpers/todos';

export const handler = middy (async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  // TODO: Implement creating a new TODO item
  const newItem = await createTodo(newTodo,event);
  return {
    statusCode: 201,
    body: JSON.stringify({
      item: newItem
    })
  }

});

handler.use(httpErrorHandler())
.use(
  cors({
    credentials: true
  })
)
