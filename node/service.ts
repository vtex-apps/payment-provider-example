/* eslint-disable func-names */
import {
  Context,
  IOClients,
  method,
  ParamsContext,
  RecorderState,
  RouteHandler,
  Service,
  ServiceConfig,
  ServiceContext,
} from '@vtex/api'
import { json as requestParser } from 'co-body'
import { identity, omit } from 'ramda'

import {
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  CancellationRequest,
  CancellationResponse,
  InboundRequest,
  InboundResponse,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
  SettlementResponse,
} from './types'

type PromiseOrValue<Value> = Promise<Value> | Value

export type ConnectorContext<
  RequestT extends PaymentRequest,
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = ServiceContext<ClientsT, StateT, CustomT> & {
  connector: {
    appKey: string
    appToken: string
    paymentId: string
    transactionId: string
    requestId: string
    content: RequestT
  }
}

type ConnectorHandlerImpl<
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  RequestT extends PaymentRequest = PaymentRequest,
  ResponseT extends PaymentResponse = PaymentResponse
> = (
  ctx: ConnectorContext<RequestT, ClientsT, StateT, CustomT>
) => PromiseOrValue<ResponseT>

export type ConnectorHandler<
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  RequestT extends PaymentRequest = PaymentRequest,
  ResponseT extends PaymentResponse = PaymentResponse
> =
  | ConnectorHandlerImpl<ClientsT, StateT, CustomT, RequestT, ResponseT>
  | [
      (
        | RouteHandler<ClientsT, StateT, CustomT>
        // tslint:disable-next-line:array-type
        | Array<RouteHandler<ClientsT, StateT, CustomT>>
      ),
      ConnectorHandlerImpl<ClientsT, StateT, CustomT, RequestT, ResponseT>
    ]

export interface ConnectorOptions<
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> {
  authorize: ConnectorHandler<
    ClientsT,
    StateT,
    CustomT,
    AuthorizationRequest,
    AuthorizationResponse
  >
  settle: ConnectorHandler<
    ClientsT,
    StateT,
    CustomT,
    SettlementRequest,
    SettlementResponse
  >
  refund: ConnectorHandler<
    ClientsT,
    StateT,
    CustomT,
    RefundRequest,
    RefundResponse
  >
  inbound?: ConnectorHandler<
    ClientsT,
    StateT,
    CustomT,
    InboundRequest,
    InboundResponse
  >
  cancel: ConnectorHandler<
    ClientsT,
    StateT,
    CustomT,
    CancellationRequest,
    CancellationResponse
  >
  paymentMethods: (
    ctx: ServiceContext<ClientsT, StateT, CustomT>
  ) => PromiseOrValue<AvailablePaymentsResponse>
}

export interface ConnectorServiceConfig<
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
> extends ServiceConfig<ClientsT, StateT, CustomT> {
  connector: ConnectorOptions<ClientsT>
}

// tslint:disable-next-line:ban-types
export const renameFunction = (name: string, fn: Function) => {
  Object.defineProperty(fn, 'name', { value: name })
}

const promisify = async <Value>(
  pOrValue: PromiseOrValue<Value>
): Promise<Value> => pOrValue

const buildConnectorContext = async <
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext,
  RequestT extends PaymentRequest
>(
  serviceContext: ServiceContext<ClientsT, StateT, CustomT>
): Promise<ConnectorContext<RequestT, ClientsT, StateT, CustomT>> => {
  const content = (await requestParser(serviceContext.req)) as RequestT
  const {
    'x-provider-api-appkey': providerKey,
    'x-provider-api-apptoken': providerToken,
  } = serviceContext.headers
  return {
    ...serviceContext,
    connector: {
      appKey: providerKey,
      appToken: providerToken,
      paymentId: content.paymentId,
      transactionId: content.transactionId,
      requestId: content.requestId,
      content,
    },
  }
}

type ContextBuilder<
  BuildedContext extends Context<ClientsT>,
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = (
  ctx: ServiceContext<ClientsT, StateT, CustomT>
) => PromiseOrValue<BuildedContext>

type Handler<
  Response,
  BuildedContext extends Context<ClientsT>,
  ClientsT extends IOClients = IOClients
> = (ctx: BuildedContext) => PromiseOrValue<Response>

const routify = <
  Response,
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  BuildedContext extends ServiceContext<
    ClientsT,
    StateT,
    CustomT
  > = ServiceContext<ClientsT, StateT, CustomT>
>(
  contextBuilder: ContextBuilder<BuildedContext, ClientsT, StateT, CustomT>,
  handler: Handler<Response, BuildedContext, ClientsT>
): RouteHandler<ClientsT, StateT, CustomT> => {
  // tslint:disable-next-line:only-arrow-functions
  const routeHandler = async function(
    ctx: ServiceContext<ClientsT, StateT, CustomT>,
    next: () => Promise<unknown>
  ) {
    const buildedContext = await promisify(contextBuilder(ctx))
    const result = await promisify(handler(buildedContext))
    ctx.body = result
    ctx.status = 200
    await next()
  }
  renameFunction(handler.name, routeHandler)
  return routeHandler
}

async function notImplemented(
  ctx: ServiceContext,
  next: () => Promise<unknown>
) {
  ctx.status = 501
  await next()
}

const isTuple = <First, Second>(
  tupleOrValue: Second | [First, Second]
): tupleOrValue is [First, Second] =>
  (tupleOrValue as [First, Second]).length === 2

const toArray = <Element>(ele: Element | Element[]): Element[] =>
  Array.isArray(ele) ? ele : [ele]

const buildConnectorRoutes = <
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
>(
  config: ConnectorServiceConfig<ClientsT, StateT, CustomT>
) => {
  const connectorRoutify = <
    Request extends PaymentRequest,
    Response extends PaymentResponse
  >(
    handler: ConnectorHandler<ClientsT, StateT, CustomT, Request, Response>
    // tslint:disable-next-line:array-type
  ): Array<RouteHandler<ClientsT, StateT, CustomT>> => {
    const { main, middlewares } = isTuple(handler)
      ? { middlewares: toArray(handler[0]), main: handler[1] }
      : { middlewares: [], main: handler }
    const route = routify<
      Response,
      ClientsT,
      StateT,
      CustomT,
      ConnectorContext<Request, ClientsT, StateT, CustomT>
    >(buildConnectorContext, main)
    return [...middlewares, route]
  }
  return {
    authorizations: method({
      POST: connectorRoutify<AuthorizationRequest, AuthorizationResponse>(
        config.connector.authorize
      ),
    }),
    settlements: method({
      POST: connectorRoutify<SettlementRequest, SettlementResponse>(
        config.connector.settle
      ),
    }),
    refunds: method({
      POST: connectorRoutify<RefundRequest, RefundResponse>(
        config.connector.refund
      ),
    }),
    cancellations: method({
      POST: connectorRoutify<CancellationRequest, CancellationResponse>(
        config.connector.cancel
      ),
    }),
    inbound: method({
      POST: config.connector.inbound
        ? connectorRoutify(config.connector.inbound)
        : notImplemented,
    }),
    paymentMethods: method({
      GET: routify<AvailablePaymentsResponse, ClientsT, StateT, CustomT>(
        identity,
        config.connector.paymentMethods
      ),
    }),
  }
}

export class ConnectorService<
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
> extends Service<ClientsT, StateT, CustomT> {
  constructor(config: ConnectorServiceConfig<ClientsT, StateT, CustomT>) {
    super(
      omit(['connector'], {
        ...config,
        routes: {
          ...buildConnectorRoutes(config),
          ...config.routes,
        },
      })
    )
  }
}
