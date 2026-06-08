
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model SupportTicket
 * 
 */
export type SupportTicket = $Result.DefaultSelection<Prisma.$SupportTicketPayload>
/**
 * Model SupportMessage
 * 
 */
export type SupportMessage = $Result.DefaultSelection<Prisma.$SupportMessagePayload>
/**
 * Model Refund
 * 
 */
export type Refund = $Result.DefaultSelection<Prisma.$RefundPayload>
/**
 * Model Chargeback
 * 
 */
export type Chargeback = $Result.DefaultSelection<Prisma.$ChargebackPayload>
/**
 * Model Appeal
 * 
 */
export type Appeal = $Result.DefaultSelection<Prisma.$AppealPayload>
/**
 * Model ContentTakedown
 * 
 */
export type ContentTakedown = $Result.DefaultSelection<Prisma.$ContentTakedownPayload>
/**
 * Model PayoutDispute
 * 
 */
export type PayoutDispute = $Result.DefaultSelection<Prisma.$PayoutDisputePayload>
/**
 * Model UserSuspension
 * 
 */
export type UserSuspension = $Result.DefaultSelection<Prisma.$UserSuspensionPayload>
/**
 * Model WebhookEvent
 * 
 */
export type WebhookEvent = $Result.DefaultSelection<Prisma.$WebhookEventPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SupportTicketCategory: {
  REFUND: 'REFUND',
  CHARGEBACK: 'CHARGEBACK',
  ACCOUNT_APPEAL: 'ACCOUNT_APPEAL',
  CONTENT_TAKEDOWN: 'CONTENT_TAKEDOWN',
  PAYOUT_DISPUTE: 'PAYOUT_DISPUTE',
  USER_SUSPENSION: 'USER_SUSPENSION',
  GENERAL: 'GENERAL'
};

export type SupportTicketCategory = (typeof SupportTicketCategory)[keyof typeof SupportTicketCategory]


export const SupportTicketPriority: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export type SupportTicketPriority = (typeof SupportTicketPriority)[keyof typeof SupportTicketPriority]


export const SupportTicketStatus: {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_INFO: 'PENDING_INFO',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ESCALATED: 'ESCALATED'
};

export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus]

}

export type SupportTicketCategory = $Enums.SupportTicketCategory

export const SupportTicketCategory: typeof $Enums.SupportTicketCategory

export type SupportTicketPriority = $Enums.SupportTicketPriority

export const SupportTicketPriority: typeof $Enums.SupportTicketPriority

export type SupportTicketStatus = $Enums.SupportTicketStatus

export const SupportTicketStatus: typeof $Enums.SupportTicketStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SupportTickets
 * const supportTickets = await prisma.supportTicket.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more SupportTickets
   * const supportTickets = await prisma.supportTicket.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.supportTicket`: Exposes CRUD operations for the **SupportTicket** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupportTickets
    * const supportTickets = await prisma.supportTicket.findMany()
    * ```
    */
  get supportTicket(): Prisma.SupportTicketDelegate<ExtArgs>;

  /**
   * `prisma.supportMessage`: Exposes CRUD operations for the **SupportMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupportMessages
    * const supportMessages = await prisma.supportMessage.findMany()
    * ```
    */
  get supportMessage(): Prisma.SupportMessageDelegate<ExtArgs>;

  /**
   * `prisma.refund`: Exposes CRUD operations for the **Refund** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Refunds
    * const refunds = await prisma.refund.findMany()
    * ```
    */
  get refund(): Prisma.RefundDelegate<ExtArgs>;

  /**
   * `prisma.chargeback`: Exposes CRUD operations for the **Chargeback** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Chargebacks
    * const chargebacks = await prisma.chargeback.findMany()
    * ```
    */
  get chargeback(): Prisma.ChargebackDelegate<ExtArgs>;

  /**
   * `prisma.appeal`: Exposes CRUD operations for the **Appeal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Appeals
    * const appeals = await prisma.appeal.findMany()
    * ```
    */
  get appeal(): Prisma.AppealDelegate<ExtArgs>;

  /**
   * `prisma.contentTakedown`: Exposes CRUD operations for the **ContentTakedown** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContentTakedowns
    * const contentTakedowns = await prisma.contentTakedown.findMany()
    * ```
    */
  get contentTakedown(): Prisma.ContentTakedownDelegate<ExtArgs>;

  /**
   * `prisma.payoutDispute`: Exposes CRUD operations for the **PayoutDispute** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PayoutDisputes
    * const payoutDisputes = await prisma.payoutDispute.findMany()
    * ```
    */
  get payoutDispute(): Prisma.PayoutDisputeDelegate<ExtArgs>;

  /**
   * `prisma.userSuspension`: Exposes CRUD operations for the **UserSuspension** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserSuspensions
    * const userSuspensions = await prisma.userSuspension.findMany()
    * ```
    */
  get userSuspension(): Prisma.UserSuspensionDelegate<ExtArgs>;

  /**
   * `prisma.webhookEvent`: Exposes CRUD operations for the **WebhookEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebhookEvents
    * const webhookEvents = await prisma.webhookEvent.findMany()
    * ```
    */
  get webhookEvent(): Prisma.WebhookEventDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    SupportTicket: 'SupportTicket',
    SupportMessage: 'SupportMessage',
    Refund: 'Refund',
    Chargeback: 'Chargeback',
    Appeal: 'Appeal',
    ContentTakedown: 'ContentTakedown',
    PayoutDispute: 'PayoutDispute',
    UserSuspension: 'UserSuspension',
    WebhookEvent: 'WebhookEvent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "supportTicket" | "supportMessage" | "refund" | "chargeback" | "appeal" | "contentTakedown" | "payoutDispute" | "userSuspension" | "webhookEvent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      SupportTicket: {
        payload: Prisma.$SupportTicketPayload<ExtArgs>
        fields: Prisma.SupportTicketFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupportTicketFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupportTicketFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          findFirst: {
            args: Prisma.SupportTicketFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupportTicketFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          findMany: {
            args: Prisma.SupportTicketFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>[]
          }
          create: {
            args: Prisma.SupportTicketCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          createMany: {
            args: Prisma.SupportTicketCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupportTicketCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>[]
          }
          delete: {
            args: Prisma.SupportTicketDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          update: {
            args: Prisma.SupportTicketUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          deleteMany: {
            args: Prisma.SupportTicketDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupportTicketUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SupportTicketUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportTicketPayload>
          }
          aggregate: {
            args: Prisma.SupportTicketAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupportTicket>
          }
          groupBy: {
            args: Prisma.SupportTicketGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupportTicketGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupportTicketCountArgs<ExtArgs>
            result: $Utils.Optional<SupportTicketCountAggregateOutputType> | number
          }
        }
      }
      SupportMessage: {
        payload: Prisma.$SupportMessagePayload<ExtArgs>
        fields: Prisma.SupportMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupportMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupportMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          findFirst: {
            args: Prisma.SupportMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupportMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          findMany: {
            args: Prisma.SupportMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>[]
          }
          create: {
            args: Prisma.SupportMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          createMany: {
            args: Prisma.SupportMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupportMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>[]
          }
          delete: {
            args: Prisma.SupportMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          update: {
            args: Prisma.SupportMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          deleteMany: {
            args: Prisma.SupportMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupportMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SupportMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupportMessagePayload>
          }
          aggregate: {
            args: Prisma.SupportMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupportMessage>
          }
          groupBy: {
            args: Prisma.SupportMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupportMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupportMessageCountArgs<ExtArgs>
            result: $Utils.Optional<SupportMessageCountAggregateOutputType> | number
          }
        }
      }
      Refund: {
        payload: Prisma.$RefundPayload<ExtArgs>
        fields: Prisma.RefundFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RefundFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RefundFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          findFirst: {
            args: Prisma.RefundFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RefundFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          findMany: {
            args: Prisma.RefundFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>[]
          }
          create: {
            args: Prisma.RefundCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          createMany: {
            args: Prisma.RefundCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RefundCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>[]
          }
          delete: {
            args: Prisma.RefundDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          update: {
            args: Prisma.RefundUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          deleteMany: {
            args: Prisma.RefundDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RefundUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RefundUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefundPayload>
          }
          aggregate: {
            args: Prisma.RefundAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRefund>
          }
          groupBy: {
            args: Prisma.RefundGroupByArgs<ExtArgs>
            result: $Utils.Optional<RefundGroupByOutputType>[]
          }
          count: {
            args: Prisma.RefundCountArgs<ExtArgs>
            result: $Utils.Optional<RefundCountAggregateOutputType> | number
          }
        }
      }
      Chargeback: {
        payload: Prisma.$ChargebackPayload<ExtArgs>
        fields: Prisma.ChargebackFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChargebackFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChargebackFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          findFirst: {
            args: Prisma.ChargebackFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChargebackFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          findMany: {
            args: Prisma.ChargebackFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>[]
          }
          create: {
            args: Prisma.ChargebackCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          createMany: {
            args: Prisma.ChargebackCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChargebackCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>[]
          }
          delete: {
            args: Prisma.ChargebackDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          update: {
            args: Prisma.ChargebackUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          deleteMany: {
            args: Prisma.ChargebackDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChargebackUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChargebackUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChargebackPayload>
          }
          aggregate: {
            args: Prisma.ChargebackAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChargeback>
          }
          groupBy: {
            args: Prisma.ChargebackGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChargebackGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChargebackCountArgs<ExtArgs>
            result: $Utils.Optional<ChargebackCountAggregateOutputType> | number
          }
        }
      }
      Appeal: {
        payload: Prisma.$AppealPayload<ExtArgs>
        fields: Prisma.AppealFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppealFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppealFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          findFirst: {
            args: Prisma.AppealFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppealFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          findMany: {
            args: Prisma.AppealFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>[]
          }
          create: {
            args: Prisma.AppealCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          createMany: {
            args: Prisma.AppealCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AppealCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>[]
          }
          delete: {
            args: Prisma.AppealDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          update: {
            args: Prisma.AppealUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          deleteMany: {
            args: Prisma.AppealDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppealUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AppealUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          aggregate: {
            args: Prisma.AppealAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAppeal>
          }
          groupBy: {
            args: Prisma.AppealGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppealGroupByOutputType>[]
          }
          count: {
            args: Prisma.AppealCountArgs<ExtArgs>
            result: $Utils.Optional<AppealCountAggregateOutputType> | number
          }
        }
      }
      ContentTakedown: {
        payload: Prisma.$ContentTakedownPayload<ExtArgs>
        fields: Prisma.ContentTakedownFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContentTakedownFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContentTakedownFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          findFirst: {
            args: Prisma.ContentTakedownFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContentTakedownFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          findMany: {
            args: Prisma.ContentTakedownFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>[]
          }
          create: {
            args: Prisma.ContentTakedownCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          createMany: {
            args: Prisma.ContentTakedownCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContentTakedownCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>[]
          }
          delete: {
            args: Prisma.ContentTakedownDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          update: {
            args: Prisma.ContentTakedownUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          deleteMany: {
            args: Prisma.ContentTakedownDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContentTakedownUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ContentTakedownUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentTakedownPayload>
          }
          aggregate: {
            args: Prisma.ContentTakedownAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContentTakedown>
          }
          groupBy: {
            args: Prisma.ContentTakedownGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContentTakedownGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContentTakedownCountArgs<ExtArgs>
            result: $Utils.Optional<ContentTakedownCountAggregateOutputType> | number
          }
        }
      }
      PayoutDispute: {
        payload: Prisma.$PayoutDisputePayload<ExtArgs>
        fields: Prisma.PayoutDisputeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PayoutDisputeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PayoutDisputeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          findFirst: {
            args: Prisma.PayoutDisputeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PayoutDisputeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          findMany: {
            args: Prisma.PayoutDisputeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>[]
          }
          create: {
            args: Prisma.PayoutDisputeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          createMany: {
            args: Prisma.PayoutDisputeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PayoutDisputeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>[]
          }
          delete: {
            args: Prisma.PayoutDisputeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          update: {
            args: Prisma.PayoutDisputeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          deleteMany: {
            args: Prisma.PayoutDisputeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PayoutDisputeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PayoutDisputeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutDisputePayload>
          }
          aggregate: {
            args: Prisma.PayoutDisputeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayoutDispute>
          }
          groupBy: {
            args: Prisma.PayoutDisputeGroupByArgs<ExtArgs>
            result: $Utils.Optional<PayoutDisputeGroupByOutputType>[]
          }
          count: {
            args: Prisma.PayoutDisputeCountArgs<ExtArgs>
            result: $Utils.Optional<PayoutDisputeCountAggregateOutputType> | number
          }
        }
      }
      UserSuspension: {
        payload: Prisma.$UserSuspensionPayload<ExtArgs>
        fields: Prisma.UserSuspensionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserSuspensionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserSuspensionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          findFirst: {
            args: Prisma.UserSuspensionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserSuspensionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          findMany: {
            args: Prisma.UserSuspensionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>[]
          }
          create: {
            args: Prisma.UserSuspensionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          createMany: {
            args: Prisma.UserSuspensionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserSuspensionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>[]
          }
          delete: {
            args: Prisma.UserSuspensionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          update: {
            args: Prisma.UserSuspensionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          deleteMany: {
            args: Prisma.UserSuspensionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserSuspensionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserSuspensionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSuspensionPayload>
          }
          aggregate: {
            args: Prisma.UserSuspensionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserSuspension>
          }
          groupBy: {
            args: Prisma.UserSuspensionGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserSuspensionGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserSuspensionCountArgs<ExtArgs>
            result: $Utils.Optional<UserSuspensionCountAggregateOutputType> | number
          }
        }
      }
      WebhookEvent: {
        payload: Prisma.$WebhookEventPayload<ExtArgs>
        fields: Prisma.WebhookEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebhookEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebhookEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findFirst: {
            args: Prisma.WebhookEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebhookEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findMany: {
            args: Prisma.WebhookEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          create: {
            args: Prisma.WebhookEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          createMany: {
            args: Prisma.WebhookEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebhookEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          delete: {
            args: Prisma.WebhookEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          update: {
            args: Prisma.WebhookEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          deleteMany: {
            args: Prisma.WebhookEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebhookEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WebhookEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          aggregate: {
            args: Prisma.WebhookEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebhookEvent>
          }
          groupBy: {
            args: Prisma.WebhookEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebhookEventCountArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type SupportTicketCountOutputType
   */

  export type SupportTicketCountOutputType = {
    messages: number
  }

  export type SupportTicketCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | SupportTicketCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * SupportTicketCountOutputType without action
   */
  export type SupportTicketCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicketCountOutputType
     */
    select?: SupportTicketCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SupportTicketCountOutputType without action
   */
  export type SupportTicketCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupportMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model SupportTicket
   */

  export type AggregateSupportTicket = {
    _count: SupportTicketCountAggregateOutputType | null
    _min: SupportTicketMinAggregateOutputType | null
    _max: SupportTicketMaxAggregateOutputType | null
  }

  export type SupportTicketMinAggregateOutputType = {
    id: string | null
    userId: string | null
    orderId: string | null
    ticketId: string | null
    category: $Enums.SupportTicketCategory | null
    priority: $Enums.SupportTicketPriority | null
    status: $Enums.SupportTicketStatus | null
    subject: string | null
    description: string | null
    assignedTo: string | null
    resolvedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupportTicketMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    orderId: string | null
    ticketId: string | null
    category: $Enums.SupportTicketCategory | null
    priority: $Enums.SupportTicketPriority | null
    status: $Enums.SupportTicketStatus | null
    subject: string | null
    description: string | null
    assignedTo: string | null
    resolvedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupportTicketCountAggregateOutputType = {
    id: number
    userId: number
    orderId: number
    ticketId: number
    category: number
    priority: number
    status: number
    subject: number
    description: number
    metadata: number
    assignedTo: number
    resolvedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupportTicketMinAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    ticketId?: true
    category?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    assignedTo?: true
    resolvedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupportTicketMaxAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    ticketId?: true
    category?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    assignedTo?: true
    resolvedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupportTicketCountAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    ticketId?: true
    category?: true
    priority?: true
    status?: true
    subject?: true
    description?: true
    metadata?: true
    assignedTo?: true
    resolvedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupportTicketAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupportTicket to aggregate.
     */
    where?: SupportTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportTickets to fetch.
     */
    orderBy?: SupportTicketOrderByWithRelationInput | SupportTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupportTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupportTickets
    **/
    _count?: true | SupportTicketCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupportTicketMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupportTicketMaxAggregateInputType
  }

  export type GetSupportTicketAggregateType<T extends SupportTicketAggregateArgs> = {
        [P in keyof T & keyof AggregateSupportTicket]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupportTicket[P]>
      : GetScalarType<T[P], AggregateSupportTicket[P]>
  }




  export type SupportTicketGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupportTicketWhereInput
    orderBy?: SupportTicketOrderByWithAggregationInput | SupportTicketOrderByWithAggregationInput[]
    by: SupportTicketScalarFieldEnum[] | SupportTicketScalarFieldEnum
    having?: SupportTicketScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupportTicketCountAggregateInputType | true
    _min?: SupportTicketMinAggregateInputType
    _max?: SupportTicketMaxAggregateInputType
  }

  export type SupportTicketGroupByOutputType = {
    id: string
    userId: string
    orderId: string | null
    ticketId: string
    category: $Enums.SupportTicketCategory
    priority: $Enums.SupportTicketPriority
    status: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata: JsonValue | null
    assignedTo: string | null
    resolvedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SupportTicketCountAggregateOutputType | null
    _min: SupportTicketMinAggregateOutputType | null
    _max: SupportTicketMaxAggregateOutputType | null
  }

  type GetSupportTicketGroupByPayload<T extends SupportTicketGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupportTicketGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupportTicketGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupportTicketGroupByOutputType[P]>
            : GetScalarType<T[P], SupportTicketGroupByOutputType[P]>
        }
      >
    >


  export type SupportTicketSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderId?: boolean
    ticketId?: boolean
    category?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    metadata?: boolean
    assignedTo?: boolean
    resolvedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messages?: boolean | SupportTicket$messagesArgs<ExtArgs>
    refund?: boolean | SupportTicket$refundArgs<ExtArgs>
    chargeback?: boolean | SupportTicket$chargebackArgs<ExtArgs>
    appeal?: boolean | SupportTicket$appealArgs<ExtArgs>
    takedown?: boolean | SupportTicket$takedownArgs<ExtArgs>
    dispute?: boolean | SupportTicket$disputeArgs<ExtArgs>
    suspension?: boolean | SupportTicket$suspensionArgs<ExtArgs>
    _count?: boolean | SupportTicketCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supportTicket"]>

  export type SupportTicketSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderId?: boolean
    ticketId?: boolean
    category?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    metadata?: boolean
    assignedTo?: boolean
    resolvedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["supportTicket"]>

  export type SupportTicketSelectScalar = {
    id?: boolean
    userId?: boolean
    orderId?: boolean
    ticketId?: boolean
    category?: boolean
    priority?: boolean
    status?: boolean
    subject?: boolean
    description?: boolean
    metadata?: boolean
    assignedTo?: boolean
    resolvedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupportTicketInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | SupportTicket$messagesArgs<ExtArgs>
    refund?: boolean | SupportTicket$refundArgs<ExtArgs>
    chargeback?: boolean | SupportTicket$chargebackArgs<ExtArgs>
    appeal?: boolean | SupportTicket$appealArgs<ExtArgs>
    takedown?: boolean | SupportTicket$takedownArgs<ExtArgs>
    dispute?: boolean | SupportTicket$disputeArgs<ExtArgs>
    suspension?: boolean | SupportTicket$suspensionArgs<ExtArgs>
    _count?: boolean | SupportTicketCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SupportTicketIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SupportTicketPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupportTicket"
    objects: {
      messages: Prisma.$SupportMessagePayload<ExtArgs>[]
      refund: Prisma.$RefundPayload<ExtArgs> | null
      chargeback: Prisma.$ChargebackPayload<ExtArgs> | null
      appeal: Prisma.$AppealPayload<ExtArgs> | null
      takedown: Prisma.$ContentTakedownPayload<ExtArgs> | null
      dispute: Prisma.$PayoutDisputePayload<ExtArgs> | null
      suspension: Prisma.$UserSuspensionPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      orderId: string | null
      ticketId: string
      category: $Enums.SupportTicketCategory
      priority: $Enums.SupportTicketPriority
      status: $Enums.SupportTicketStatus
      subject: string
      description: string
      metadata: Prisma.JsonValue | null
      assignedTo: string | null
      resolvedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supportTicket"]>
    composites: {}
  }

  type SupportTicketGetPayload<S extends boolean | null | undefined | SupportTicketDefaultArgs> = $Result.GetResult<Prisma.$SupportTicketPayload, S>

  type SupportTicketCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SupportTicketFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SupportTicketCountAggregateInputType | true
    }

  export interface SupportTicketDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupportTicket'], meta: { name: 'SupportTicket' } }
    /**
     * Find zero or one SupportTicket that matches the filter.
     * @param {SupportTicketFindUniqueArgs} args - Arguments to find a SupportTicket
     * @example
     * // Get one SupportTicket
     * const supportTicket = await prisma.supportTicket.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupportTicketFindUniqueArgs>(args: SelectSubset<T, SupportTicketFindUniqueArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SupportTicket that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SupportTicketFindUniqueOrThrowArgs} args - Arguments to find a SupportTicket
     * @example
     * // Get one SupportTicket
     * const supportTicket = await prisma.supportTicket.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupportTicketFindUniqueOrThrowArgs>(args: SelectSubset<T, SupportTicketFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SupportTicket that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketFindFirstArgs} args - Arguments to find a SupportTicket
     * @example
     * // Get one SupportTicket
     * const supportTicket = await prisma.supportTicket.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupportTicketFindFirstArgs>(args?: SelectSubset<T, SupportTicketFindFirstArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SupportTicket that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketFindFirstOrThrowArgs} args - Arguments to find a SupportTicket
     * @example
     * // Get one SupportTicket
     * const supportTicket = await prisma.supportTicket.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupportTicketFindFirstOrThrowArgs>(args?: SelectSubset<T, SupportTicketFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SupportTickets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupportTickets
     * const supportTickets = await prisma.supportTicket.findMany()
     * 
     * // Get first 10 SupportTickets
     * const supportTickets = await prisma.supportTicket.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supportTicketWithIdOnly = await prisma.supportTicket.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupportTicketFindManyArgs>(args?: SelectSubset<T, SupportTicketFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SupportTicket.
     * @param {SupportTicketCreateArgs} args - Arguments to create a SupportTicket.
     * @example
     * // Create one SupportTicket
     * const SupportTicket = await prisma.supportTicket.create({
     *   data: {
     *     // ... data to create a SupportTicket
     *   }
     * })
     * 
     */
    create<T extends SupportTicketCreateArgs>(args: SelectSubset<T, SupportTicketCreateArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SupportTickets.
     * @param {SupportTicketCreateManyArgs} args - Arguments to create many SupportTickets.
     * @example
     * // Create many SupportTickets
     * const supportTicket = await prisma.supportTicket.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupportTicketCreateManyArgs>(args?: SelectSubset<T, SupportTicketCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupportTickets and returns the data saved in the database.
     * @param {SupportTicketCreateManyAndReturnArgs} args - Arguments to create many SupportTickets.
     * @example
     * // Create many SupportTickets
     * const supportTicket = await prisma.supportTicket.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupportTickets and only return the `id`
     * const supportTicketWithIdOnly = await prisma.supportTicket.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupportTicketCreateManyAndReturnArgs>(args?: SelectSubset<T, SupportTicketCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SupportTicket.
     * @param {SupportTicketDeleteArgs} args - Arguments to delete one SupportTicket.
     * @example
     * // Delete one SupportTicket
     * const SupportTicket = await prisma.supportTicket.delete({
     *   where: {
     *     // ... filter to delete one SupportTicket
     *   }
     * })
     * 
     */
    delete<T extends SupportTicketDeleteArgs>(args: SelectSubset<T, SupportTicketDeleteArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SupportTicket.
     * @param {SupportTicketUpdateArgs} args - Arguments to update one SupportTicket.
     * @example
     * // Update one SupportTicket
     * const supportTicket = await prisma.supportTicket.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupportTicketUpdateArgs>(args: SelectSubset<T, SupportTicketUpdateArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SupportTickets.
     * @param {SupportTicketDeleteManyArgs} args - Arguments to filter SupportTickets to delete.
     * @example
     * // Delete a few SupportTickets
     * const { count } = await prisma.supportTicket.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupportTicketDeleteManyArgs>(args?: SelectSubset<T, SupportTicketDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupportTickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupportTickets
     * const supportTicket = await prisma.supportTicket.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupportTicketUpdateManyArgs>(args: SelectSubset<T, SupportTicketUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SupportTicket.
     * @param {SupportTicketUpsertArgs} args - Arguments to update or create a SupportTicket.
     * @example
     * // Update or create a SupportTicket
     * const supportTicket = await prisma.supportTicket.upsert({
     *   create: {
     *     // ... data to create a SupportTicket
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupportTicket we want to update
     *   }
     * })
     */
    upsert<T extends SupportTicketUpsertArgs>(args: SelectSubset<T, SupportTicketUpsertArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SupportTickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketCountArgs} args - Arguments to filter SupportTickets to count.
     * @example
     * // Count the number of SupportTickets
     * const count = await prisma.supportTicket.count({
     *   where: {
     *     // ... the filter for the SupportTickets we want to count
     *   }
     * })
    **/
    count<T extends SupportTicketCountArgs>(
      args?: Subset<T, SupportTicketCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupportTicketCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupportTicket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SupportTicketAggregateArgs>(args: Subset<T, SupportTicketAggregateArgs>): Prisma.PrismaPromise<GetSupportTicketAggregateType<T>>

    /**
     * Group by SupportTicket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportTicketGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SupportTicketGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupportTicketGroupByArgs['orderBy'] }
        : { orderBy?: SupportTicketGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SupportTicketGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupportTicketGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupportTicket model
   */
  readonly fields: SupportTicketFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupportTicket.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupportTicketClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    messages<T extends SupportTicket$messagesArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findMany"> | Null>
    refund<T extends SupportTicket$refundArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$refundArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    chargeback<T extends SupportTicket$chargebackArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$chargebackArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    appeal<T extends SupportTicket$appealArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$appealArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    takedown<T extends SupportTicket$takedownArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$takedownArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    dispute<T extends SupportTicket$disputeArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$disputeArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    suspension<T extends SupportTicket$suspensionArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicket$suspensionArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SupportTicket model
   */ 
  interface SupportTicketFieldRefs {
    readonly id: FieldRef<"SupportTicket", 'String'>
    readonly userId: FieldRef<"SupportTicket", 'String'>
    readonly orderId: FieldRef<"SupportTicket", 'String'>
    readonly ticketId: FieldRef<"SupportTicket", 'String'>
    readonly category: FieldRef<"SupportTicket", 'SupportTicketCategory'>
    readonly priority: FieldRef<"SupportTicket", 'SupportTicketPriority'>
    readonly status: FieldRef<"SupportTicket", 'SupportTicketStatus'>
    readonly subject: FieldRef<"SupportTicket", 'String'>
    readonly description: FieldRef<"SupportTicket", 'String'>
    readonly metadata: FieldRef<"SupportTicket", 'Json'>
    readonly assignedTo: FieldRef<"SupportTicket", 'String'>
    readonly resolvedAt: FieldRef<"SupportTicket", 'DateTime'>
    readonly createdAt: FieldRef<"SupportTicket", 'DateTime'>
    readonly updatedAt: FieldRef<"SupportTicket", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupportTicket findUnique
   */
  export type SupportTicketFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter, which SupportTicket to fetch.
     */
    where: SupportTicketWhereUniqueInput
  }

  /**
   * SupportTicket findUniqueOrThrow
   */
  export type SupportTicketFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter, which SupportTicket to fetch.
     */
    where: SupportTicketWhereUniqueInput
  }

  /**
   * SupportTicket findFirst
   */
  export type SupportTicketFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter, which SupportTicket to fetch.
     */
    where?: SupportTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportTickets to fetch.
     */
    orderBy?: SupportTicketOrderByWithRelationInput | SupportTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupportTickets.
     */
    cursor?: SupportTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupportTickets.
     */
    distinct?: SupportTicketScalarFieldEnum | SupportTicketScalarFieldEnum[]
  }

  /**
   * SupportTicket findFirstOrThrow
   */
  export type SupportTicketFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter, which SupportTicket to fetch.
     */
    where?: SupportTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportTickets to fetch.
     */
    orderBy?: SupportTicketOrderByWithRelationInput | SupportTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupportTickets.
     */
    cursor?: SupportTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupportTickets.
     */
    distinct?: SupportTicketScalarFieldEnum | SupportTicketScalarFieldEnum[]
  }

  /**
   * SupportTicket findMany
   */
  export type SupportTicketFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter, which SupportTickets to fetch.
     */
    where?: SupportTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportTickets to fetch.
     */
    orderBy?: SupportTicketOrderByWithRelationInput | SupportTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupportTickets.
     */
    cursor?: SupportTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportTickets.
     */
    skip?: number
    distinct?: SupportTicketScalarFieldEnum | SupportTicketScalarFieldEnum[]
  }

  /**
   * SupportTicket create
   */
  export type SupportTicketCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * The data needed to create a SupportTicket.
     */
    data: XOR<SupportTicketCreateInput, SupportTicketUncheckedCreateInput>
  }

  /**
   * SupportTicket createMany
   */
  export type SupportTicketCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupportTickets.
     */
    data: SupportTicketCreateManyInput | SupportTicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupportTicket createManyAndReturn
   */
  export type SupportTicketCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SupportTickets.
     */
    data: SupportTicketCreateManyInput | SupportTicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupportTicket update
   */
  export type SupportTicketUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * The data needed to update a SupportTicket.
     */
    data: XOR<SupportTicketUpdateInput, SupportTicketUncheckedUpdateInput>
    /**
     * Choose, which SupportTicket to update.
     */
    where: SupportTicketWhereUniqueInput
  }

  /**
   * SupportTicket updateMany
   */
  export type SupportTicketUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupportTickets.
     */
    data: XOR<SupportTicketUpdateManyMutationInput, SupportTicketUncheckedUpdateManyInput>
    /**
     * Filter which SupportTickets to update
     */
    where?: SupportTicketWhereInput
  }

  /**
   * SupportTicket upsert
   */
  export type SupportTicketUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * The filter to search for the SupportTicket to update in case it exists.
     */
    where: SupportTicketWhereUniqueInput
    /**
     * In case the SupportTicket found by the `where` argument doesn't exist, create a new SupportTicket with this data.
     */
    create: XOR<SupportTicketCreateInput, SupportTicketUncheckedCreateInput>
    /**
     * In case the SupportTicket was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupportTicketUpdateInput, SupportTicketUncheckedUpdateInput>
  }

  /**
   * SupportTicket delete
   */
  export type SupportTicketDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
    /**
     * Filter which SupportTicket to delete.
     */
    where: SupportTicketWhereUniqueInput
  }

  /**
   * SupportTicket deleteMany
   */
  export type SupportTicketDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupportTickets to delete
     */
    where?: SupportTicketWhereInput
  }

  /**
   * SupportTicket.messages
   */
  export type SupportTicket$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    where?: SupportMessageWhereInput
    orderBy?: SupportMessageOrderByWithRelationInput | SupportMessageOrderByWithRelationInput[]
    cursor?: SupportMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SupportMessageScalarFieldEnum | SupportMessageScalarFieldEnum[]
  }

  /**
   * SupportTicket.refund
   */
  export type SupportTicket$refundArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    where?: RefundWhereInput
  }

  /**
   * SupportTicket.chargeback
   */
  export type SupportTicket$chargebackArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    where?: ChargebackWhereInput
  }

  /**
   * SupportTicket.appeal
   */
  export type SupportTicket$appealArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    where?: AppealWhereInput
  }

  /**
   * SupportTicket.takedown
   */
  export type SupportTicket$takedownArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    where?: ContentTakedownWhereInput
  }

  /**
   * SupportTicket.dispute
   */
  export type SupportTicket$disputeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    where?: PayoutDisputeWhereInput
  }

  /**
   * SupportTicket.suspension
   */
  export type SupportTicket$suspensionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    where?: UserSuspensionWhereInput
  }

  /**
   * SupportTicket without action
   */
  export type SupportTicketDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportTicket
     */
    select?: SupportTicketSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportTicketInclude<ExtArgs> | null
  }


  /**
   * Model SupportMessage
   */

  export type AggregateSupportMessage = {
    _count: SupportMessageCountAggregateOutputType | null
    _min: SupportMessageMinAggregateOutputType | null
    _max: SupportMessageMaxAggregateOutputType | null
  }

  export type SupportMessageMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    senderId: string | null
    senderType: string | null
    message: string | null
    isInternal: boolean | null
    createdAt: Date | null
  }

  export type SupportMessageMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    senderId: string | null
    senderType: string | null
    message: string | null
    isInternal: boolean | null
    createdAt: Date | null
  }

  export type SupportMessageCountAggregateOutputType = {
    id: number
    ticketId: number
    senderId: number
    senderType: number
    message: number
    isInternal: number
    createdAt: number
    _all: number
  }


  export type SupportMessageMinAggregateInputType = {
    id?: true
    ticketId?: true
    senderId?: true
    senderType?: true
    message?: true
    isInternal?: true
    createdAt?: true
  }

  export type SupportMessageMaxAggregateInputType = {
    id?: true
    ticketId?: true
    senderId?: true
    senderType?: true
    message?: true
    isInternal?: true
    createdAt?: true
  }

  export type SupportMessageCountAggregateInputType = {
    id?: true
    ticketId?: true
    senderId?: true
    senderType?: true
    message?: true
    isInternal?: true
    createdAt?: true
    _all?: true
  }

  export type SupportMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupportMessage to aggregate.
     */
    where?: SupportMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportMessages to fetch.
     */
    orderBy?: SupportMessageOrderByWithRelationInput | SupportMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupportMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupportMessages
    **/
    _count?: true | SupportMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupportMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupportMessageMaxAggregateInputType
  }

  export type GetSupportMessageAggregateType<T extends SupportMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateSupportMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupportMessage[P]>
      : GetScalarType<T[P], AggregateSupportMessage[P]>
  }




  export type SupportMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupportMessageWhereInput
    orderBy?: SupportMessageOrderByWithAggregationInput | SupportMessageOrderByWithAggregationInput[]
    by: SupportMessageScalarFieldEnum[] | SupportMessageScalarFieldEnum
    having?: SupportMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupportMessageCountAggregateInputType | true
    _min?: SupportMessageMinAggregateInputType
    _max?: SupportMessageMaxAggregateInputType
  }

  export type SupportMessageGroupByOutputType = {
    id: string
    ticketId: string
    senderId: string
    senderType: string
    message: string
    isInternal: boolean
    createdAt: Date
    _count: SupportMessageCountAggregateOutputType | null
    _min: SupportMessageMinAggregateOutputType | null
    _max: SupportMessageMaxAggregateOutputType | null
  }

  type GetSupportMessageGroupByPayload<T extends SupportMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupportMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupportMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupportMessageGroupByOutputType[P]>
            : GetScalarType<T[P], SupportMessageGroupByOutputType[P]>
        }
      >
    >


  export type SupportMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    senderId?: boolean
    senderType?: boolean
    message?: boolean
    isInternal?: boolean
    createdAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supportMessage"]>

  export type SupportMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    senderId?: boolean
    senderType?: boolean
    message?: boolean
    isInternal?: boolean
    createdAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supportMessage"]>

  export type SupportMessageSelectScalar = {
    id?: boolean
    ticketId?: boolean
    senderId?: boolean
    senderType?: boolean
    message?: boolean
    isInternal?: boolean
    createdAt?: boolean
  }

  export type SupportMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type SupportMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $SupportMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupportMessage"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      senderId: string
      senderType: string
      message: string
      isInternal: boolean
      createdAt: Date
    }, ExtArgs["result"]["supportMessage"]>
    composites: {}
  }

  type SupportMessageGetPayload<S extends boolean | null | undefined | SupportMessageDefaultArgs> = $Result.GetResult<Prisma.$SupportMessagePayload, S>

  type SupportMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SupportMessageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SupportMessageCountAggregateInputType | true
    }

  export interface SupportMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupportMessage'], meta: { name: 'SupportMessage' } }
    /**
     * Find zero or one SupportMessage that matches the filter.
     * @param {SupportMessageFindUniqueArgs} args - Arguments to find a SupportMessage
     * @example
     * // Get one SupportMessage
     * const supportMessage = await prisma.supportMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupportMessageFindUniqueArgs>(args: SelectSubset<T, SupportMessageFindUniqueArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one SupportMessage that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SupportMessageFindUniqueOrThrowArgs} args - Arguments to find a SupportMessage
     * @example
     * // Get one SupportMessage
     * const supportMessage = await prisma.supportMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupportMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, SupportMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first SupportMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageFindFirstArgs} args - Arguments to find a SupportMessage
     * @example
     * // Get one SupportMessage
     * const supportMessage = await prisma.supportMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupportMessageFindFirstArgs>(args?: SelectSubset<T, SupportMessageFindFirstArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first SupportMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageFindFirstOrThrowArgs} args - Arguments to find a SupportMessage
     * @example
     * // Get one SupportMessage
     * const supportMessage = await prisma.supportMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupportMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, SupportMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more SupportMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupportMessages
     * const supportMessages = await prisma.supportMessage.findMany()
     * 
     * // Get first 10 SupportMessages
     * const supportMessages = await prisma.supportMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supportMessageWithIdOnly = await prisma.supportMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupportMessageFindManyArgs>(args?: SelectSubset<T, SupportMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a SupportMessage.
     * @param {SupportMessageCreateArgs} args - Arguments to create a SupportMessage.
     * @example
     * // Create one SupportMessage
     * const SupportMessage = await prisma.supportMessage.create({
     *   data: {
     *     // ... data to create a SupportMessage
     *   }
     * })
     * 
     */
    create<T extends SupportMessageCreateArgs>(args: SelectSubset<T, SupportMessageCreateArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many SupportMessages.
     * @param {SupportMessageCreateManyArgs} args - Arguments to create many SupportMessages.
     * @example
     * // Create many SupportMessages
     * const supportMessage = await prisma.supportMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupportMessageCreateManyArgs>(args?: SelectSubset<T, SupportMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupportMessages and returns the data saved in the database.
     * @param {SupportMessageCreateManyAndReturnArgs} args - Arguments to create many SupportMessages.
     * @example
     * // Create many SupportMessages
     * const supportMessage = await prisma.supportMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupportMessages and only return the `id`
     * const supportMessageWithIdOnly = await prisma.supportMessage.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupportMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, SupportMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a SupportMessage.
     * @param {SupportMessageDeleteArgs} args - Arguments to delete one SupportMessage.
     * @example
     * // Delete one SupportMessage
     * const SupportMessage = await prisma.supportMessage.delete({
     *   where: {
     *     // ... filter to delete one SupportMessage
     *   }
     * })
     * 
     */
    delete<T extends SupportMessageDeleteArgs>(args: SelectSubset<T, SupportMessageDeleteArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one SupportMessage.
     * @param {SupportMessageUpdateArgs} args - Arguments to update one SupportMessage.
     * @example
     * // Update one SupportMessage
     * const supportMessage = await prisma.supportMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupportMessageUpdateArgs>(args: SelectSubset<T, SupportMessageUpdateArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more SupportMessages.
     * @param {SupportMessageDeleteManyArgs} args - Arguments to filter SupportMessages to delete.
     * @example
     * // Delete a few SupportMessages
     * const { count } = await prisma.supportMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupportMessageDeleteManyArgs>(args?: SelectSubset<T, SupportMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupportMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupportMessages
     * const supportMessage = await prisma.supportMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupportMessageUpdateManyArgs>(args: SelectSubset<T, SupportMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one SupportMessage.
     * @param {SupportMessageUpsertArgs} args - Arguments to update or create a SupportMessage.
     * @example
     * // Update or create a SupportMessage
     * const supportMessage = await prisma.supportMessage.upsert({
     *   create: {
     *     // ... data to create a SupportMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupportMessage we want to update
     *   }
     * })
     */
    upsert<T extends SupportMessageUpsertArgs>(args: SelectSubset<T, SupportMessageUpsertArgs<ExtArgs>>): Prisma__SupportMessageClient<$Result.GetResult<Prisma.$SupportMessagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of SupportMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageCountArgs} args - Arguments to filter SupportMessages to count.
     * @example
     * // Count the number of SupportMessages
     * const count = await prisma.supportMessage.count({
     *   where: {
     *     // ... the filter for the SupportMessages we want to count
     *   }
     * })
    **/
    count<T extends SupportMessageCountArgs>(
      args?: Subset<T, SupportMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupportMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupportMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SupportMessageAggregateArgs>(args: Subset<T, SupportMessageAggregateArgs>): Prisma.PrismaPromise<GetSupportMessageAggregateType<T>>

    /**
     * Group by SupportMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupportMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SupportMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupportMessageGroupByArgs['orderBy'] }
        : { orderBy?: SupportMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SupportMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupportMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupportMessage model
   */
  readonly fields: SupportMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupportMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupportMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SupportMessage model
   */ 
  interface SupportMessageFieldRefs {
    readonly id: FieldRef<"SupportMessage", 'String'>
    readonly ticketId: FieldRef<"SupportMessage", 'String'>
    readonly senderId: FieldRef<"SupportMessage", 'String'>
    readonly senderType: FieldRef<"SupportMessage", 'String'>
    readonly message: FieldRef<"SupportMessage", 'String'>
    readonly isInternal: FieldRef<"SupportMessage", 'Boolean'>
    readonly createdAt: FieldRef<"SupportMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupportMessage findUnique
   */
  export type SupportMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter, which SupportMessage to fetch.
     */
    where: SupportMessageWhereUniqueInput
  }

  /**
   * SupportMessage findUniqueOrThrow
   */
  export type SupportMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter, which SupportMessage to fetch.
     */
    where: SupportMessageWhereUniqueInput
  }

  /**
   * SupportMessage findFirst
   */
  export type SupportMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter, which SupportMessage to fetch.
     */
    where?: SupportMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportMessages to fetch.
     */
    orderBy?: SupportMessageOrderByWithRelationInput | SupportMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupportMessages.
     */
    cursor?: SupportMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupportMessages.
     */
    distinct?: SupportMessageScalarFieldEnum | SupportMessageScalarFieldEnum[]
  }

  /**
   * SupportMessage findFirstOrThrow
   */
  export type SupportMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter, which SupportMessage to fetch.
     */
    where?: SupportMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportMessages to fetch.
     */
    orderBy?: SupportMessageOrderByWithRelationInput | SupportMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupportMessages.
     */
    cursor?: SupportMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupportMessages.
     */
    distinct?: SupportMessageScalarFieldEnum | SupportMessageScalarFieldEnum[]
  }

  /**
   * SupportMessage findMany
   */
  export type SupportMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter, which SupportMessages to fetch.
     */
    where?: SupportMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupportMessages to fetch.
     */
    orderBy?: SupportMessageOrderByWithRelationInput | SupportMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupportMessages.
     */
    cursor?: SupportMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupportMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupportMessages.
     */
    skip?: number
    distinct?: SupportMessageScalarFieldEnum | SupportMessageScalarFieldEnum[]
  }

  /**
   * SupportMessage create
   */
  export type SupportMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a SupportMessage.
     */
    data: XOR<SupportMessageCreateInput, SupportMessageUncheckedCreateInput>
  }

  /**
   * SupportMessage createMany
   */
  export type SupportMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupportMessages.
     */
    data: SupportMessageCreateManyInput | SupportMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupportMessage createManyAndReturn
   */
  export type SupportMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many SupportMessages.
     */
    data: SupportMessageCreateManyInput | SupportMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupportMessage update
   */
  export type SupportMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a SupportMessage.
     */
    data: XOR<SupportMessageUpdateInput, SupportMessageUncheckedUpdateInput>
    /**
     * Choose, which SupportMessage to update.
     */
    where: SupportMessageWhereUniqueInput
  }

  /**
   * SupportMessage updateMany
   */
  export type SupportMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupportMessages.
     */
    data: XOR<SupportMessageUpdateManyMutationInput, SupportMessageUncheckedUpdateManyInput>
    /**
     * Filter which SupportMessages to update
     */
    where?: SupportMessageWhereInput
  }

  /**
   * SupportMessage upsert
   */
  export type SupportMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the SupportMessage to update in case it exists.
     */
    where: SupportMessageWhereUniqueInput
    /**
     * In case the SupportMessage found by the `where` argument doesn't exist, create a new SupportMessage with this data.
     */
    create: XOR<SupportMessageCreateInput, SupportMessageUncheckedCreateInput>
    /**
     * In case the SupportMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupportMessageUpdateInput, SupportMessageUncheckedUpdateInput>
  }

  /**
   * SupportMessage delete
   */
  export type SupportMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
    /**
     * Filter which SupportMessage to delete.
     */
    where: SupportMessageWhereUniqueInput
  }

  /**
   * SupportMessage deleteMany
   */
  export type SupportMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupportMessages to delete
     */
    where?: SupportMessageWhereInput
  }

  /**
   * SupportMessage without action
   */
  export type SupportMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupportMessage
     */
    select?: SupportMessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupportMessageInclude<ExtArgs> | null
  }


  /**
   * Model Refund
   */

  export type AggregateRefund = {
    _count: RefundCountAggregateOutputType | null
    _avg: RefundAvgAggregateOutputType | null
    _sum: RefundSumAggregateOutputType | null
    _min: RefundMinAggregateOutputType | null
    _max: RefundMaxAggregateOutputType | null
  }

  export type RefundAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type RefundSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type RefundMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    paymentId: string | null
    userId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    refundReference: string | null
    processedAt: Date | null
    processedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RefundMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    paymentId: string | null
    userId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    refundReference: string | null
    processedAt: Date | null
    processedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RefundCountAggregateOutputType = {
    id: number
    ticketId: number
    paymentId: number
    userId: number
    amount: number
    currency: number
    reason: number
    status: number
    refundReference: number
    processedAt: number
    processedBy: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RefundAvgAggregateInputType = {
    amount?: true
  }

  export type RefundSumAggregateInputType = {
    amount?: true
  }

  export type RefundMinAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    refundReference?: true
    processedAt?: true
    processedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RefundMaxAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    refundReference?: true
    processedAt?: true
    processedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RefundCountAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    refundReference?: true
    processedAt?: true
    processedBy?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RefundAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Refund to aggregate.
     */
    where?: RefundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Refunds to fetch.
     */
    orderBy?: RefundOrderByWithRelationInput | RefundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RefundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Refunds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Refunds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Refunds
    **/
    _count?: true | RefundCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RefundAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RefundSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RefundMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RefundMaxAggregateInputType
  }

  export type GetRefundAggregateType<T extends RefundAggregateArgs> = {
        [P in keyof T & keyof AggregateRefund]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRefund[P]>
      : GetScalarType<T[P], AggregateRefund[P]>
  }




  export type RefundGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RefundWhereInput
    orderBy?: RefundOrderByWithAggregationInput | RefundOrderByWithAggregationInput[]
    by: RefundScalarFieldEnum[] | RefundScalarFieldEnum
    having?: RefundScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RefundCountAggregateInputType | true
    _avg?: RefundAvgAggregateInputType
    _sum?: RefundSumAggregateInputType
    _min?: RefundMinAggregateInputType
    _max?: RefundMaxAggregateInputType
  }

  export type RefundGroupByOutputType = {
    id: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal
    currency: string
    reason: string
    status: string
    refundReference: string | null
    processedAt: Date | null
    processedBy: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: RefundCountAggregateOutputType | null
    _avg: RefundAvgAggregateOutputType | null
    _sum: RefundSumAggregateOutputType | null
    _min: RefundMinAggregateOutputType | null
    _max: RefundMaxAggregateOutputType | null
  }

  type GetRefundGroupByPayload<T extends RefundGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RefundGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RefundGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RefundGroupByOutputType[P]>
            : GetScalarType<T[P], RefundGroupByOutputType[P]>
        }
      >
    >


  export type RefundSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    refundReference?: boolean
    processedAt?: boolean
    processedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["refund"]>

  export type RefundSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    refundReference?: boolean
    processedAt?: boolean
    processedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["refund"]>

  export type RefundSelectScalar = {
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    refundReference?: boolean
    processedAt?: boolean
    processedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RefundInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type RefundIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $RefundPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Refund"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      paymentId: string
      userId: string
      amount: Prisma.Decimal
      currency: string
      reason: string
      status: string
      refundReference: string | null
      processedAt: Date | null
      processedBy: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["refund"]>
    composites: {}
  }

  type RefundGetPayload<S extends boolean | null | undefined | RefundDefaultArgs> = $Result.GetResult<Prisma.$RefundPayload, S>

  type RefundCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RefundFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RefundCountAggregateInputType | true
    }

  export interface RefundDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Refund'], meta: { name: 'Refund' } }
    /**
     * Find zero or one Refund that matches the filter.
     * @param {RefundFindUniqueArgs} args - Arguments to find a Refund
     * @example
     * // Get one Refund
     * const refund = await prisma.refund.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RefundFindUniqueArgs>(args: SelectSubset<T, RefundFindUniqueArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Refund that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RefundFindUniqueOrThrowArgs} args - Arguments to find a Refund
     * @example
     * // Get one Refund
     * const refund = await prisma.refund.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RefundFindUniqueOrThrowArgs>(args: SelectSubset<T, RefundFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Refund that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundFindFirstArgs} args - Arguments to find a Refund
     * @example
     * // Get one Refund
     * const refund = await prisma.refund.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RefundFindFirstArgs>(args?: SelectSubset<T, RefundFindFirstArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Refund that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundFindFirstOrThrowArgs} args - Arguments to find a Refund
     * @example
     * // Get one Refund
     * const refund = await prisma.refund.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RefundFindFirstOrThrowArgs>(args?: SelectSubset<T, RefundFindFirstOrThrowArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Refunds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Refunds
     * const refunds = await prisma.refund.findMany()
     * 
     * // Get first 10 Refunds
     * const refunds = await prisma.refund.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const refundWithIdOnly = await prisma.refund.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RefundFindManyArgs>(args?: SelectSubset<T, RefundFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Refund.
     * @param {RefundCreateArgs} args - Arguments to create a Refund.
     * @example
     * // Create one Refund
     * const Refund = await prisma.refund.create({
     *   data: {
     *     // ... data to create a Refund
     *   }
     * })
     * 
     */
    create<T extends RefundCreateArgs>(args: SelectSubset<T, RefundCreateArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Refunds.
     * @param {RefundCreateManyArgs} args - Arguments to create many Refunds.
     * @example
     * // Create many Refunds
     * const refund = await prisma.refund.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RefundCreateManyArgs>(args?: SelectSubset<T, RefundCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Refunds and returns the data saved in the database.
     * @param {RefundCreateManyAndReturnArgs} args - Arguments to create many Refunds.
     * @example
     * // Create many Refunds
     * const refund = await prisma.refund.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Refunds and only return the `id`
     * const refundWithIdOnly = await prisma.refund.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RefundCreateManyAndReturnArgs>(args?: SelectSubset<T, RefundCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Refund.
     * @param {RefundDeleteArgs} args - Arguments to delete one Refund.
     * @example
     * // Delete one Refund
     * const Refund = await prisma.refund.delete({
     *   where: {
     *     // ... filter to delete one Refund
     *   }
     * })
     * 
     */
    delete<T extends RefundDeleteArgs>(args: SelectSubset<T, RefundDeleteArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Refund.
     * @param {RefundUpdateArgs} args - Arguments to update one Refund.
     * @example
     * // Update one Refund
     * const refund = await prisma.refund.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RefundUpdateArgs>(args: SelectSubset<T, RefundUpdateArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Refunds.
     * @param {RefundDeleteManyArgs} args - Arguments to filter Refunds to delete.
     * @example
     * // Delete a few Refunds
     * const { count } = await prisma.refund.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RefundDeleteManyArgs>(args?: SelectSubset<T, RefundDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Refunds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Refunds
     * const refund = await prisma.refund.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RefundUpdateManyArgs>(args: SelectSubset<T, RefundUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Refund.
     * @param {RefundUpsertArgs} args - Arguments to update or create a Refund.
     * @example
     * // Update or create a Refund
     * const refund = await prisma.refund.upsert({
     *   create: {
     *     // ... data to create a Refund
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Refund we want to update
     *   }
     * })
     */
    upsert<T extends RefundUpsertArgs>(args: SelectSubset<T, RefundUpsertArgs<ExtArgs>>): Prisma__RefundClient<$Result.GetResult<Prisma.$RefundPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Refunds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundCountArgs} args - Arguments to filter Refunds to count.
     * @example
     * // Count the number of Refunds
     * const count = await prisma.refund.count({
     *   where: {
     *     // ... the filter for the Refunds we want to count
     *   }
     * })
    **/
    count<T extends RefundCountArgs>(
      args?: Subset<T, RefundCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RefundCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Refund.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RefundAggregateArgs>(args: Subset<T, RefundAggregateArgs>): Prisma.PrismaPromise<GetRefundAggregateType<T>>

    /**
     * Group by Refund.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefundGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RefundGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RefundGroupByArgs['orderBy'] }
        : { orderBy?: RefundGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RefundGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRefundGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Refund model
   */
  readonly fields: RefundFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Refund.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RefundClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Refund model
   */ 
  interface RefundFieldRefs {
    readonly id: FieldRef<"Refund", 'String'>
    readonly ticketId: FieldRef<"Refund", 'String'>
    readonly paymentId: FieldRef<"Refund", 'String'>
    readonly userId: FieldRef<"Refund", 'String'>
    readonly amount: FieldRef<"Refund", 'Decimal'>
    readonly currency: FieldRef<"Refund", 'String'>
    readonly reason: FieldRef<"Refund", 'String'>
    readonly status: FieldRef<"Refund", 'String'>
    readonly refundReference: FieldRef<"Refund", 'String'>
    readonly processedAt: FieldRef<"Refund", 'DateTime'>
    readonly processedBy: FieldRef<"Refund", 'String'>
    readonly metadata: FieldRef<"Refund", 'Json'>
    readonly createdAt: FieldRef<"Refund", 'DateTime'>
    readonly updatedAt: FieldRef<"Refund", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Refund findUnique
   */
  export type RefundFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter, which Refund to fetch.
     */
    where: RefundWhereUniqueInput
  }

  /**
   * Refund findUniqueOrThrow
   */
  export type RefundFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter, which Refund to fetch.
     */
    where: RefundWhereUniqueInput
  }

  /**
   * Refund findFirst
   */
  export type RefundFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter, which Refund to fetch.
     */
    where?: RefundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Refunds to fetch.
     */
    orderBy?: RefundOrderByWithRelationInput | RefundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Refunds.
     */
    cursor?: RefundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Refunds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Refunds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Refunds.
     */
    distinct?: RefundScalarFieldEnum | RefundScalarFieldEnum[]
  }

  /**
   * Refund findFirstOrThrow
   */
  export type RefundFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter, which Refund to fetch.
     */
    where?: RefundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Refunds to fetch.
     */
    orderBy?: RefundOrderByWithRelationInput | RefundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Refunds.
     */
    cursor?: RefundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Refunds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Refunds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Refunds.
     */
    distinct?: RefundScalarFieldEnum | RefundScalarFieldEnum[]
  }

  /**
   * Refund findMany
   */
  export type RefundFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter, which Refunds to fetch.
     */
    where?: RefundWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Refunds to fetch.
     */
    orderBy?: RefundOrderByWithRelationInput | RefundOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Refunds.
     */
    cursor?: RefundWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Refunds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Refunds.
     */
    skip?: number
    distinct?: RefundScalarFieldEnum | RefundScalarFieldEnum[]
  }

  /**
   * Refund create
   */
  export type RefundCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * The data needed to create a Refund.
     */
    data: XOR<RefundCreateInput, RefundUncheckedCreateInput>
  }

  /**
   * Refund createMany
   */
  export type RefundCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Refunds.
     */
    data: RefundCreateManyInput | RefundCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Refund createManyAndReturn
   */
  export type RefundCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Refunds.
     */
    data: RefundCreateManyInput | RefundCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Refund update
   */
  export type RefundUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * The data needed to update a Refund.
     */
    data: XOR<RefundUpdateInput, RefundUncheckedUpdateInput>
    /**
     * Choose, which Refund to update.
     */
    where: RefundWhereUniqueInput
  }

  /**
   * Refund updateMany
   */
  export type RefundUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Refunds.
     */
    data: XOR<RefundUpdateManyMutationInput, RefundUncheckedUpdateManyInput>
    /**
     * Filter which Refunds to update
     */
    where?: RefundWhereInput
  }

  /**
   * Refund upsert
   */
  export type RefundUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * The filter to search for the Refund to update in case it exists.
     */
    where: RefundWhereUniqueInput
    /**
     * In case the Refund found by the `where` argument doesn't exist, create a new Refund with this data.
     */
    create: XOR<RefundCreateInput, RefundUncheckedCreateInput>
    /**
     * In case the Refund was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RefundUpdateInput, RefundUncheckedUpdateInput>
  }

  /**
   * Refund delete
   */
  export type RefundDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
    /**
     * Filter which Refund to delete.
     */
    where: RefundWhereUniqueInput
  }

  /**
   * Refund deleteMany
   */
  export type RefundDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Refunds to delete
     */
    where?: RefundWhereInput
  }

  /**
   * Refund without action
   */
  export type RefundDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Refund
     */
    select?: RefundSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefundInclude<ExtArgs> | null
  }


  /**
   * Model Chargeback
   */

  export type AggregateChargeback = {
    _count: ChargebackCountAggregateOutputType | null
    _avg: ChargebackAvgAggregateOutputType | null
    _sum: ChargebackSumAggregateOutputType | null
    _min: ChargebackMinAggregateOutputType | null
    _max: ChargebackMaxAggregateOutputType | null
  }

  export type ChargebackAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type ChargebackSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type ChargebackMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    paymentId: string | null
    userId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    disputeDeadline: Date | null
    evidenceDue: Date | null
    chargebackRef: string | null
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChargebackMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    paymentId: string | null
    userId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    disputeDeadline: Date | null
    evidenceDue: Date | null
    chargebackRef: string | null
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChargebackCountAggregateOutputType = {
    id: number
    ticketId: number
    paymentId: number
    userId: number
    amount: number
    currency: number
    reason: number
    status: number
    disputeDeadline: number
    evidenceDue: number
    chargebackRef: number
    resolution: number
    resolvedAt: number
    resolvedBy: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChargebackAvgAggregateInputType = {
    amount?: true
  }

  export type ChargebackSumAggregateInputType = {
    amount?: true
  }

  export type ChargebackMinAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    disputeDeadline?: true
    evidenceDue?: true
    chargebackRef?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChargebackMaxAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    disputeDeadline?: true
    evidenceDue?: true
    chargebackRef?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChargebackCountAggregateInputType = {
    id?: true
    ticketId?: true
    paymentId?: true
    userId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    disputeDeadline?: true
    evidenceDue?: true
    chargebackRef?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChargebackAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chargeback to aggregate.
     */
    where?: ChargebackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chargebacks to fetch.
     */
    orderBy?: ChargebackOrderByWithRelationInput | ChargebackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChargebackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chargebacks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chargebacks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Chargebacks
    **/
    _count?: true | ChargebackCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChargebackAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChargebackSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChargebackMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChargebackMaxAggregateInputType
  }

  export type GetChargebackAggregateType<T extends ChargebackAggregateArgs> = {
        [P in keyof T & keyof AggregateChargeback]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChargeback[P]>
      : GetScalarType<T[P], AggregateChargeback[P]>
  }




  export type ChargebackGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChargebackWhereInput
    orderBy?: ChargebackOrderByWithAggregationInput | ChargebackOrderByWithAggregationInput[]
    by: ChargebackScalarFieldEnum[] | ChargebackScalarFieldEnum
    having?: ChargebackScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChargebackCountAggregateInputType | true
    _avg?: ChargebackAvgAggregateInputType
    _sum?: ChargebackSumAggregateInputType
    _min?: ChargebackMinAggregateInputType
    _max?: ChargebackMaxAggregateInputType
  }

  export type ChargebackGroupByOutputType = {
    id: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal
    currency: string
    reason: string
    status: string
    disputeDeadline: Date
    evidenceDue: Date
    chargebackRef: string | null
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ChargebackCountAggregateOutputType | null
    _avg: ChargebackAvgAggregateOutputType | null
    _sum: ChargebackSumAggregateOutputType | null
    _min: ChargebackMinAggregateOutputType | null
    _max: ChargebackMaxAggregateOutputType | null
  }

  type GetChargebackGroupByPayload<T extends ChargebackGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChargebackGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChargebackGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChargebackGroupByOutputType[P]>
            : GetScalarType<T[P], ChargebackGroupByOutputType[P]>
        }
      >
    >


  export type ChargebackSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    disputeDeadline?: boolean
    evidenceDue?: boolean
    chargebackRef?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chargeback"]>

  export type ChargebackSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    disputeDeadline?: boolean
    evidenceDue?: boolean
    chargebackRef?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chargeback"]>

  export type ChargebackSelectScalar = {
    id?: boolean
    ticketId?: boolean
    paymentId?: boolean
    userId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    status?: boolean
    disputeDeadline?: boolean
    evidenceDue?: boolean
    chargebackRef?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChargebackInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type ChargebackIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $ChargebackPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Chargeback"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      paymentId: string
      userId: string
      amount: Prisma.Decimal
      currency: string
      reason: string
      status: string
      disputeDeadline: Date
      evidenceDue: Date
      chargebackRef: string | null
      resolution: string | null
      resolvedAt: Date | null
      resolvedBy: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["chargeback"]>
    composites: {}
  }

  type ChargebackGetPayload<S extends boolean | null | undefined | ChargebackDefaultArgs> = $Result.GetResult<Prisma.$ChargebackPayload, S>

  type ChargebackCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChargebackFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChargebackCountAggregateInputType | true
    }

  export interface ChargebackDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Chargeback'], meta: { name: 'Chargeback' } }
    /**
     * Find zero or one Chargeback that matches the filter.
     * @param {ChargebackFindUniqueArgs} args - Arguments to find a Chargeback
     * @example
     * // Get one Chargeback
     * const chargeback = await prisma.chargeback.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChargebackFindUniqueArgs>(args: SelectSubset<T, ChargebackFindUniqueArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Chargeback that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChargebackFindUniqueOrThrowArgs} args - Arguments to find a Chargeback
     * @example
     * // Get one Chargeback
     * const chargeback = await prisma.chargeback.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChargebackFindUniqueOrThrowArgs>(args: SelectSubset<T, ChargebackFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Chargeback that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackFindFirstArgs} args - Arguments to find a Chargeback
     * @example
     * // Get one Chargeback
     * const chargeback = await prisma.chargeback.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChargebackFindFirstArgs>(args?: SelectSubset<T, ChargebackFindFirstArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Chargeback that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackFindFirstOrThrowArgs} args - Arguments to find a Chargeback
     * @example
     * // Get one Chargeback
     * const chargeback = await prisma.chargeback.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChargebackFindFirstOrThrowArgs>(args?: SelectSubset<T, ChargebackFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Chargebacks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Chargebacks
     * const chargebacks = await prisma.chargeback.findMany()
     * 
     * // Get first 10 Chargebacks
     * const chargebacks = await prisma.chargeback.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chargebackWithIdOnly = await prisma.chargeback.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChargebackFindManyArgs>(args?: SelectSubset<T, ChargebackFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Chargeback.
     * @param {ChargebackCreateArgs} args - Arguments to create a Chargeback.
     * @example
     * // Create one Chargeback
     * const Chargeback = await prisma.chargeback.create({
     *   data: {
     *     // ... data to create a Chargeback
     *   }
     * })
     * 
     */
    create<T extends ChargebackCreateArgs>(args: SelectSubset<T, ChargebackCreateArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Chargebacks.
     * @param {ChargebackCreateManyArgs} args - Arguments to create many Chargebacks.
     * @example
     * // Create many Chargebacks
     * const chargeback = await prisma.chargeback.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChargebackCreateManyArgs>(args?: SelectSubset<T, ChargebackCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Chargebacks and returns the data saved in the database.
     * @param {ChargebackCreateManyAndReturnArgs} args - Arguments to create many Chargebacks.
     * @example
     * // Create many Chargebacks
     * const chargeback = await prisma.chargeback.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Chargebacks and only return the `id`
     * const chargebackWithIdOnly = await prisma.chargeback.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChargebackCreateManyAndReturnArgs>(args?: SelectSubset<T, ChargebackCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Chargeback.
     * @param {ChargebackDeleteArgs} args - Arguments to delete one Chargeback.
     * @example
     * // Delete one Chargeback
     * const Chargeback = await prisma.chargeback.delete({
     *   where: {
     *     // ... filter to delete one Chargeback
     *   }
     * })
     * 
     */
    delete<T extends ChargebackDeleteArgs>(args: SelectSubset<T, ChargebackDeleteArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Chargeback.
     * @param {ChargebackUpdateArgs} args - Arguments to update one Chargeback.
     * @example
     * // Update one Chargeback
     * const chargeback = await prisma.chargeback.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChargebackUpdateArgs>(args: SelectSubset<T, ChargebackUpdateArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Chargebacks.
     * @param {ChargebackDeleteManyArgs} args - Arguments to filter Chargebacks to delete.
     * @example
     * // Delete a few Chargebacks
     * const { count } = await prisma.chargeback.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChargebackDeleteManyArgs>(args?: SelectSubset<T, ChargebackDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chargebacks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Chargebacks
     * const chargeback = await prisma.chargeback.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChargebackUpdateManyArgs>(args: SelectSubset<T, ChargebackUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Chargeback.
     * @param {ChargebackUpsertArgs} args - Arguments to update or create a Chargeback.
     * @example
     * // Update or create a Chargeback
     * const chargeback = await prisma.chargeback.upsert({
     *   create: {
     *     // ... data to create a Chargeback
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Chargeback we want to update
     *   }
     * })
     */
    upsert<T extends ChargebackUpsertArgs>(args: SelectSubset<T, ChargebackUpsertArgs<ExtArgs>>): Prisma__ChargebackClient<$Result.GetResult<Prisma.$ChargebackPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Chargebacks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackCountArgs} args - Arguments to filter Chargebacks to count.
     * @example
     * // Count the number of Chargebacks
     * const count = await prisma.chargeback.count({
     *   where: {
     *     // ... the filter for the Chargebacks we want to count
     *   }
     * })
    **/
    count<T extends ChargebackCountArgs>(
      args?: Subset<T, ChargebackCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChargebackCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Chargeback.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChargebackAggregateArgs>(args: Subset<T, ChargebackAggregateArgs>): Prisma.PrismaPromise<GetChargebackAggregateType<T>>

    /**
     * Group by Chargeback.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChargebackGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChargebackGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChargebackGroupByArgs['orderBy'] }
        : { orderBy?: ChargebackGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChargebackGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChargebackGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Chargeback model
   */
  readonly fields: ChargebackFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Chargeback.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChargebackClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Chargeback model
   */ 
  interface ChargebackFieldRefs {
    readonly id: FieldRef<"Chargeback", 'String'>
    readonly ticketId: FieldRef<"Chargeback", 'String'>
    readonly paymentId: FieldRef<"Chargeback", 'String'>
    readonly userId: FieldRef<"Chargeback", 'String'>
    readonly amount: FieldRef<"Chargeback", 'Decimal'>
    readonly currency: FieldRef<"Chargeback", 'String'>
    readonly reason: FieldRef<"Chargeback", 'String'>
    readonly status: FieldRef<"Chargeback", 'String'>
    readonly disputeDeadline: FieldRef<"Chargeback", 'DateTime'>
    readonly evidenceDue: FieldRef<"Chargeback", 'DateTime'>
    readonly chargebackRef: FieldRef<"Chargeback", 'String'>
    readonly resolution: FieldRef<"Chargeback", 'String'>
    readonly resolvedAt: FieldRef<"Chargeback", 'DateTime'>
    readonly resolvedBy: FieldRef<"Chargeback", 'String'>
    readonly metadata: FieldRef<"Chargeback", 'Json'>
    readonly createdAt: FieldRef<"Chargeback", 'DateTime'>
    readonly updatedAt: FieldRef<"Chargeback", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Chargeback findUnique
   */
  export type ChargebackFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter, which Chargeback to fetch.
     */
    where: ChargebackWhereUniqueInput
  }

  /**
   * Chargeback findUniqueOrThrow
   */
  export type ChargebackFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter, which Chargeback to fetch.
     */
    where: ChargebackWhereUniqueInput
  }

  /**
   * Chargeback findFirst
   */
  export type ChargebackFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter, which Chargeback to fetch.
     */
    where?: ChargebackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chargebacks to fetch.
     */
    orderBy?: ChargebackOrderByWithRelationInput | ChargebackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chargebacks.
     */
    cursor?: ChargebackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chargebacks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chargebacks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chargebacks.
     */
    distinct?: ChargebackScalarFieldEnum | ChargebackScalarFieldEnum[]
  }

  /**
   * Chargeback findFirstOrThrow
   */
  export type ChargebackFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter, which Chargeback to fetch.
     */
    where?: ChargebackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chargebacks to fetch.
     */
    orderBy?: ChargebackOrderByWithRelationInput | ChargebackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chargebacks.
     */
    cursor?: ChargebackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chargebacks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chargebacks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chargebacks.
     */
    distinct?: ChargebackScalarFieldEnum | ChargebackScalarFieldEnum[]
  }

  /**
   * Chargeback findMany
   */
  export type ChargebackFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter, which Chargebacks to fetch.
     */
    where?: ChargebackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chargebacks to fetch.
     */
    orderBy?: ChargebackOrderByWithRelationInput | ChargebackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Chargebacks.
     */
    cursor?: ChargebackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chargebacks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chargebacks.
     */
    skip?: number
    distinct?: ChargebackScalarFieldEnum | ChargebackScalarFieldEnum[]
  }

  /**
   * Chargeback create
   */
  export type ChargebackCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * The data needed to create a Chargeback.
     */
    data: XOR<ChargebackCreateInput, ChargebackUncheckedCreateInput>
  }

  /**
   * Chargeback createMany
   */
  export type ChargebackCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Chargebacks.
     */
    data: ChargebackCreateManyInput | ChargebackCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Chargeback createManyAndReturn
   */
  export type ChargebackCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Chargebacks.
     */
    data: ChargebackCreateManyInput | ChargebackCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chargeback update
   */
  export type ChargebackUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * The data needed to update a Chargeback.
     */
    data: XOR<ChargebackUpdateInput, ChargebackUncheckedUpdateInput>
    /**
     * Choose, which Chargeback to update.
     */
    where: ChargebackWhereUniqueInput
  }

  /**
   * Chargeback updateMany
   */
  export type ChargebackUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Chargebacks.
     */
    data: XOR<ChargebackUpdateManyMutationInput, ChargebackUncheckedUpdateManyInput>
    /**
     * Filter which Chargebacks to update
     */
    where?: ChargebackWhereInput
  }

  /**
   * Chargeback upsert
   */
  export type ChargebackUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * The filter to search for the Chargeback to update in case it exists.
     */
    where: ChargebackWhereUniqueInput
    /**
     * In case the Chargeback found by the `where` argument doesn't exist, create a new Chargeback with this data.
     */
    create: XOR<ChargebackCreateInput, ChargebackUncheckedCreateInput>
    /**
     * In case the Chargeback was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChargebackUpdateInput, ChargebackUncheckedUpdateInput>
  }

  /**
   * Chargeback delete
   */
  export type ChargebackDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
    /**
     * Filter which Chargeback to delete.
     */
    where: ChargebackWhereUniqueInput
  }

  /**
   * Chargeback deleteMany
   */
  export type ChargebackDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chargebacks to delete
     */
    where?: ChargebackWhereInput
  }

  /**
   * Chargeback without action
   */
  export type ChargebackDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chargeback
     */
    select?: ChargebackSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChargebackInclude<ExtArgs> | null
  }


  /**
   * Model Appeal
   */

  export type AggregateAppeal = {
    _count: AppealCountAggregateOutputType | null
    _min: AppealMinAggregateOutputType | null
    _max: AppealMaxAggregateOutputType | null
  }

  export type AppealMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    userId: string | null
    appealType: string | null
    resourceId: string | null
    resourceType: string | null
    originalDecision: string | null
    reason: string | null
    status: string | null
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AppealMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    userId: string | null
    appealType: string | null
    resourceId: string | null
    resourceType: string | null
    originalDecision: string | null
    reason: string | null
    status: string | null
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AppealCountAggregateOutputType = {
    id: number
    ticketId: number
    userId: number
    appealType: number
    resourceId: number
    resourceType: number
    originalDecision: number
    reason: number
    evidence: number
    status: number
    decision: number
    decidedAt: number
    decidedBy: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AppealMinAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    appealType?: true
    resourceId?: true
    resourceType?: true
    originalDecision?: true
    reason?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AppealMaxAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    appealType?: true
    resourceId?: true
    resourceType?: true
    originalDecision?: true
    reason?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AppealCountAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    appealType?: true
    resourceId?: true
    resourceType?: true
    originalDecision?: true
    reason?: true
    evidence?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AppealAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Appeal to aggregate.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Appeals
    **/
    _count?: true | AppealCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppealMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppealMaxAggregateInputType
  }

  export type GetAppealAggregateType<T extends AppealAggregateArgs> = {
        [P in keyof T & keyof AggregateAppeal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAppeal[P]>
      : GetScalarType<T[P], AggregateAppeal[P]>
  }




  export type AppealGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppealWhereInput
    orderBy?: AppealOrderByWithAggregationInput | AppealOrderByWithAggregationInput[]
    by: AppealScalarFieldEnum[] | AppealScalarFieldEnum
    having?: AppealScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppealCountAggregateInputType | true
    _min?: AppealMinAggregateInputType
    _max?: AppealMaxAggregateInputType
  }

  export type AppealGroupByOutputType = {
    id: string
    ticketId: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence: JsonValue | null
    status: string
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: AppealCountAggregateOutputType | null
    _min: AppealMinAggregateOutputType | null
    _max: AppealMaxAggregateOutputType | null
  }

  type GetAppealGroupByPayload<T extends AppealGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppealGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppealGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppealGroupByOutputType[P]>
            : GetScalarType<T[P], AppealGroupByOutputType[P]>
        }
      >
    >


  export type AppealSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    appealType?: boolean
    resourceId?: boolean
    resourceType?: boolean
    originalDecision?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["appeal"]>

  export type AppealSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    appealType?: boolean
    resourceId?: boolean
    resourceType?: boolean
    originalDecision?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["appeal"]>

  export type AppealSelectScalar = {
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    appealType?: boolean
    resourceId?: boolean
    resourceType?: boolean
    originalDecision?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AppealInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type AppealIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $AppealPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Appeal"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      userId: string
      appealType: string
      resourceId: string
      resourceType: string
      originalDecision: string
      reason: string
      evidence: Prisma.JsonValue | null
      status: string
      decision: string | null
      decidedAt: Date | null
      decidedBy: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["appeal"]>
    composites: {}
  }

  type AppealGetPayload<S extends boolean | null | undefined | AppealDefaultArgs> = $Result.GetResult<Prisma.$AppealPayload, S>

  type AppealCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<AppealFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: AppealCountAggregateInputType | true
    }

  export interface AppealDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Appeal'], meta: { name: 'Appeal' } }
    /**
     * Find zero or one Appeal that matches the filter.
     * @param {AppealFindUniqueArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppealFindUniqueArgs>(args: SelectSubset<T, AppealFindUniqueArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Appeal that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {AppealFindUniqueOrThrowArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppealFindUniqueOrThrowArgs>(args: SelectSubset<T, AppealFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Appeal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindFirstArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppealFindFirstArgs>(args?: SelectSubset<T, AppealFindFirstArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Appeal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindFirstOrThrowArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppealFindFirstOrThrowArgs>(args?: SelectSubset<T, AppealFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Appeals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Appeals
     * const appeals = await prisma.appeal.findMany()
     * 
     * // Get first 10 Appeals
     * const appeals = await prisma.appeal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const appealWithIdOnly = await prisma.appeal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AppealFindManyArgs>(args?: SelectSubset<T, AppealFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Appeal.
     * @param {AppealCreateArgs} args - Arguments to create a Appeal.
     * @example
     * // Create one Appeal
     * const Appeal = await prisma.appeal.create({
     *   data: {
     *     // ... data to create a Appeal
     *   }
     * })
     * 
     */
    create<T extends AppealCreateArgs>(args: SelectSubset<T, AppealCreateArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Appeals.
     * @param {AppealCreateManyArgs} args - Arguments to create many Appeals.
     * @example
     * // Create many Appeals
     * const appeal = await prisma.appeal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppealCreateManyArgs>(args?: SelectSubset<T, AppealCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Appeals and returns the data saved in the database.
     * @param {AppealCreateManyAndReturnArgs} args - Arguments to create many Appeals.
     * @example
     * // Create many Appeals
     * const appeal = await prisma.appeal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Appeals and only return the `id`
     * const appealWithIdOnly = await prisma.appeal.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AppealCreateManyAndReturnArgs>(args?: SelectSubset<T, AppealCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Appeal.
     * @param {AppealDeleteArgs} args - Arguments to delete one Appeal.
     * @example
     * // Delete one Appeal
     * const Appeal = await prisma.appeal.delete({
     *   where: {
     *     // ... filter to delete one Appeal
     *   }
     * })
     * 
     */
    delete<T extends AppealDeleteArgs>(args: SelectSubset<T, AppealDeleteArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Appeal.
     * @param {AppealUpdateArgs} args - Arguments to update one Appeal.
     * @example
     * // Update one Appeal
     * const appeal = await prisma.appeal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppealUpdateArgs>(args: SelectSubset<T, AppealUpdateArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Appeals.
     * @param {AppealDeleteManyArgs} args - Arguments to filter Appeals to delete.
     * @example
     * // Delete a few Appeals
     * const { count } = await prisma.appeal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppealDeleteManyArgs>(args?: SelectSubset<T, AppealDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Appeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Appeals
     * const appeal = await prisma.appeal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppealUpdateManyArgs>(args: SelectSubset<T, AppealUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Appeal.
     * @param {AppealUpsertArgs} args - Arguments to update or create a Appeal.
     * @example
     * // Update or create a Appeal
     * const appeal = await prisma.appeal.upsert({
     *   create: {
     *     // ... data to create a Appeal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Appeal we want to update
     *   }
     * })
     */
    upsert<T extends AppealUpsertArgs>(args: SelectSubset<T, AppealUpsertArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Appeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealCountArgs} args - Arguments to filter Appeals to count.
     * @example
     * // Count the number of Appeals
     * const count = await prisma.appeal.count({
     *   where: {
     *     // ... the filter for the Appeals we want to count
     *   }
     * })
    **/
    count<T extends AppealCountArgs>(
      args?: Subset<T, AppealCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppealCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Appeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AppealAggregateArgs>(args: Subset<T, AppealAggregateArgs>): Prisma.PrismaPromise<GetAppealAggregateType<T>>

    /**
     * Group by Appeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AppealGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppealGroupByArgs['orderBy'] }
        : { orderBy?: AppealGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AppealGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppealGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Appeal model
   */
  readonly fields: AppealFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Appeal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppealClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Appeal model
   */ 
  interface AppealFieldRefs {
    readonly id: FieldRef<"Appeal", 'String'>
    readonly ticketId: FieldRef<"Appeal", 'String'>
    readonly userId: FieldRef<"Appeal", 'String'>
    readonly appealType: FieldRef<"Appeal", 'String'>
    readonly resourceId: FieldRef<"Appeal", 'String'>
    readonly resourceType: FieldRef<"Appeal", 'String'>
    readonly originalDecision: FieldRef<"Appeal", 'String'>
    readonly reason: FieldRef<"Appeal", 'String'>
    readonly evidence: FieldRef<"Appeal", 'Json'>
    readonly status: FieldRef<"Appeal", 'String'>
    readonly decision: FieldRef<"Appeal", 'String'>
    readonly decidedAt: FieldRef<"Appeal", 'DateTime'>
    readonly decidedBy: FieldRef<"Appeal", 'String'>
    readonly metadata: FieldRef<"Appeal", 'Json'>
    readonly createdAt: FieldRef<"Appeal", 'DateTime'>
    readonly updatedAt: FieldRef<"Appeal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Appeal findUnique
   */
  export type AppealFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal findUniqueOrThrow
   */
  export type AppealFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal findFirst
   */
  export type AppealFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Appeals.
     */
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal findFirstOrThrow
   */
  export type AppealFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Appeals.
     */
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal findMany
   */
  export type AppealFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter, which Appeals to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal create
   */
  export type AppealCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * The data needed to create a Appeal.
     */
    data: XOR<AppealCreateInput, AppealUncheckedCreateInput>
  }

  /**
   * Appeal createMany
   */
  export type AppealCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Appeals.
     */
    data: AppealCreateManyInput | AppealCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Appeal createManyAndReturn
   */
  export type AppealCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Appeals.
     */
    data: AppealCreateManyInput | AppealCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Appeal update
   */
  export type AppealUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * The data needed to update a Appeal.
     */
    data: XOR<AppealUpdateInput, AppealUncheckedUpdateInput>
    /**
     * Choose, which Appeal to update.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal updateMany
   */
  export type AppealUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Appeals.
     */
    data: XOR<AppealUpdateManyMutationInput, AppealUncheckedUpdateManyInput>
    /**
     * Filter which Appeals to update
     */
    where?: AppealWhereInput
  }

  /**
   * Appeal upsert
   */
  export type AppealUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * The filter to search for the Appeal to update in case it exists.
     */
    where: AppealWhereUniqueInput
    /**
     * In case the Appeal found by the `where` argument doesn't exist, create a new Appeal with this data.
     */
    create: XOR<AppealCreateInput, AppealUncheckedCreateInput>
    /**
     * In case the Appeal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppealUpdateInput, AppealUncheckedUpdateInput>
  }

  /**
   * Appeal delete
   */
  export type AppealDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
    /**
     * Filter which Appeal to delete.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal deleteMany
   */
  export type AppealDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Appeals to delete
     */
    where?: AppealWhereInput
  }

  /**
   * Appeal without action
   */
  export type AppealDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AppealInclude<ExtArgs> | null
  }


  /**
   * Model ContentTakedown
   */

  export type AggregateContentTakedown = {
    _count: ContentTakedownCountAggregateOutputType | null
    _min: ContentTakedownMinAggregateOutputType | null
    _max: ContentTakedownMaxAggregateOutputType | null
  }

  export type ContentTakedownMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    contentId: string | null
    reportedBy: string | null
    reason: string | null
    status: string | null
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContentTakedownMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    contentId: string | null
    reportedBy: string | null
    reason: string | null
    status: string | null
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContentTakedownCountAggregateOutputType = {
    id: number
    ticketId: number
    contentId: number
    reportedBy: number
    reason: number
    evidence: number
    status: number
    decision: number
    decidedAt: number
    decidedBy: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContentTakedownMinAggregateInputType = {
    id?: true
    ticketId?: true
    contentId?: true
    reportedBy?: true
    reason?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContentTakedownMaxAggregateInputType = {
    id?: true
    ticketId?: true
    contentId?: true
    reportedBy?: true
    reason?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContentTakedownCountAggregateInputType = {
    id?: true
    ticketId?: true
    contentId?: true
    reportedBy?: true
    reason?: true
    evidence?: true
    status?: true
    decision?: true
    decidedAt?: true
    decidedBy?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContentTakedownAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentTakedown to aggregate.
     */
    where?: ContentTakedownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentTakedowns to fetch.
     */
    orderBy?: ContentTakedownOrderByWithRelationInput | ContentTakedownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContentTakedownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentTakedowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentTakedowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContentTakedowns
    **/
    _count?: true | ContentTakedownCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContentTakedownMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContentTakedownMaxAggregateInputType
  }

  export type GetContentTakedownAggregateType<T extends ContentTakedownAggregateArgs> = {
        [P in keyof T & keyof AggregateContentTakedown]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContentTakedown[P]>
      : GetScalarType<T[P], AggregateContentTakedown[P]>
  }




  export type ContentTakedownGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentTakedownWhereInput
    orderBy?: ContentTakedownOrderByWithAggregationInput | ContentTakedownOrderByWithAggregationInput[]
    by: ContentTakedownScalarFieldEnum[] | ContentTakedownScalarFieldEnum
    having?: ContentTakedownScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContentTakedownCountAggregateInputType | true
    _min?: ContentTakedownMinAggregateInputType
    _max?: ContentTakedownMaxAggregateInputType
  }

  export type ContentTakedownGroupByOutputType = {
    id: string
    ticketId: string
    contentId: string
    reportedBy: string
    reason: string
    evidence: JsonValue | null
    status: string
    decision: string | null
    decidedAt: Date | null
    decidedBy: string | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ContentTakedownCountAggregateOutputType | null
    _min: ContentTakedownMinAggregateOutputType | null
    _max: ContentTakedownMaxAggregateOutputType | null
  }

  type GetContentTakedownGroupByPayload<T extends ContentTakedownGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContentTakedownGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContentTakedownGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContentTakedownGroupByOutputType[P]>
            : GetScalarType<T[P], ContentTakedownGroupByOutputType[P]>
        }
      >
    >


  export type ContentTakedownSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    contentId?: boolean
    reportedBy?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contentTakedown"]>

  export type ContentTakedownSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    contentId?: boolean
    reportedBy?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contentTakedown"]>

  export type ContentTakedownSelectScalar = {
    id?: boolean
    ticketId?: boolean
    contentId?: boolean
    reportedBy?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    decision?: boolean
    decidedAt?: boolean
    decidedBy?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContentTakedownInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type ContentTakedownIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $ContentTakedownPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContentTakedown"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      contentId: string
      reportedBy: string
      reason: string
      evidence: Prisma.JsonValue | null
      status: string
      decision: string | null
      decidedAt: Date | null
      decidedBy: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contentTakedown"]>
    composites: {}
  }

  type ContentTakedownGetPayload<S extends boolean | null | undefined | ContentTakedownDefaultArgs> = $Result.GetResult<Prisma.$ContentTakedownPayload, S>

  type ContentTakedownCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ContentTakedownFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ContentTakedownCountAggregateInputType | true
    }

  export interface ContentTakedownDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContentTakedown'], meta: { name: 'ContentTakedown' } }
    /**
     * Find zero or one ContentTakedown that matches the filter.
     * @param {ContentTakedownFindUniqueArgs} args - Arguments to find a ContentTakedown
     * @example
     * // Get one ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContentTakedownFindUniqueArgs>(args: SelectSubset<T, ContentTakedownFindUniqueArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ContentTakedown that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ContentTakedownFindUniqueOrThrowArgs} args - Arguments to find a ContentTakedown
     * @example
     * // Get one ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContentTakedownFindUniqueOrThrowArgs>(args: SelectSubset<T, ContentTakedownFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ContentTakedown that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownFindFirstArgs} args - Arguments to find a ContentTakedown
     * @example
     * // Get one ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContentTakedownFindFirstArgs>(args?: SelectSubset<T, ContentTakedownFindFirstArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ContentTakedown that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownFindFirstOrThrowArgs} args - Arguments to find a ContentTakedown
     * @example
     * // Get one ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContentTakedownFindFirstOrThrowArgs>(args?: SelectSubset<T, ContentTakedownFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ContentTakedowns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContentTakedowns
     * const contentTakedowns = await prisma.contentTakedown.findMany()
     * 
     * // Get first 10 ContentTakedowns
     * const contentTakedowns = await prisma.contentTakedown.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contentTakedownWithIdOnly = await prisma.contentTakedown.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContentTakedownFindManyArgs>(args?: SelectSubset<T, ContentTakedownFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ContentTakedown.
     * @param {ContentTakedownCreateArgs} args - Arguments to create a ContentTakedown.
     * @example
     * // Create one ContentTakedown
     * const ContentTakedown = await prisma.contentTakedown.create({
     *   data: {
     *     // ... data to create a ContentTakedown
     *   }
     * })
     * 
     */
    create<T extends ContentTakedownCreateArgs>(args: SelectSubset<T, ContentTakedownCreateArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ContentTakedowns.
     * @param {ContentTakedownCreateManyArgs} args - Arguments to create many ContentTakedowns.
     * @example
     * // Create many ContentTakedowns
     * const contentTakedown = await prisma.contentTakedown.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContentTakedownCreateManyArgs>(args?: SelectSubset<T, ContentTakedownCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContentTakedowns and returns the data saved in the database.
     * @param {ContentTakedownCreateManyAndReturnArgs} args - Arguments to create many ContentTakedowns.
     * @example
     * // Create many ContentTakedowns
     * const contentTakedown = await prisma.contentTakedown.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContentTakedowns and only return the `id`
     * const contentTakedownWithIdOnly = await prisma.contentTakedown.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContentTakedownCreateManyAndReturnArgs>(args?: SelectSubset<T, ContentTakedownCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ContentTakedown.
     * @param {ContentTakedownDeleteArgs} args - Arguments to delete one ContentTakedown.
     * @example
     * // Delete one ContentTakedown
     * const ContentTakedown = await prisma.contentTakedown.delete({
     *   where: {
     *     // ... filter to delete one ContentTakedown
     *   }
     * })
     * 
     */
    delete<T extends ContentTakedownDeleteArgs>(args: SelectSubset<T, ContentTakedownDeleteArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ContentTakedown.
     * @param {ContentTakedownUpdateArgs} args - Arguments to update one ContentTakedown.
     * @example
     * // Update one ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContentTakedownUpdateArgs>(args: SelectSubset<T, ContentTakedownUpdateArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ContentTakedowns.
     * @param {ContentTakedownDeleteManyArgs} args - Arguments to filter ContentTakedowns to delete.
     * @example
     * // Delete a few ContentTakedowns
     * const { count } = await prisma.contentTakedown.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContentTakedownDeleteManyArgs>(args?: SelectSubset<T, ContentTakedownDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContentTakedowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContentTakedowns
     * const contentTakedown = await prisma.contentTakedown.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContentTakedownUpdateManyArgs>(args: SelectSubset<T, ContentTakedownUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ContentTakedown.
     * @param {ContentTakedownUpsertArgs} args - Arguments to update or create a ContentTakedown.
     * @example
     * // Update or create a ContentTakedown
     * const contentTakedown = await prisma.contentTakedown.upsert({
     *   create: {
     *     // ... data to create a ContentTakedown
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContentTakedown we want to update
     *   }
     * })
     */
    upsert<T extends ContentTakedownUpsertArgs>(args: SelectSubset<T, ContentTakedownUpsertArgs<ExtArgs>>): Prisma__ContentTakedownClient<$Result.GetResult<Prisma.$ContentTakedownPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ContentTakedowns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownCountArgs} args - Arguments to filter ContentTakedowns to count.
     * @example
     * // Count the number of ContentTakedowns
     * const count = await prisma.contentTakedown.count({
     *   where: {
     *     // ... the filter for the ContentTakedowns we want to count
     *   }
     * })
    **/
    count<T extends ContentTakedownCountArgs>(
      args?: Subset<T, ContentTakedownCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContentTakedownCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContentTakedown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContentTakedownAggregateArgs>(args: Subset<T, ContentTakedownAggregateArgs>): Prisma.PrismaPromise<GetContentTakedownAggregateType<T>>

    /**
     * Group by ContentTakedown.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentTakedownGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContentTakedownGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContentTakedownGroupByArgs['orderBy'] }
        : { orderBy?: ContentTakedownGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContentTakedownGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContentTakedownGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContentTakedown model
   */
  readonly fields: ContentTakedownFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContentTakedown.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContentTakedownClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ContentTakedown model
   */ 
  interface ContentTakedownFieldRefs {
    readonly id: FieldRef<"ContentTakedown", 'String'>
    readonly ticketId: FieldRef<"ContentTakedown", 'String'>
    readonly contentId: FieldRef<"ContentTakedown", 'String'>
    readonly reportedBy: FieldRef<"ContentTakedown", 'String'>
    readonly reason: FieldRef<"ContentTakedown", 'String'>
    readonly evidence: FieldRef<"ContentTakedown", 'Json'>
    readonly status: FieldRef<"ContentTakedown", 'String'>
    readonly decision: FieldRef<"ContentTakedown", 'String'>
    readonly decidedAt: FieldRef<"ContentTakedown", 'DateTime'>
    readonly decidedBy: FieldRef<"ContentTakedown", 'String'>
    readonly metadata: FieldRef<"ContentTakedown", 'Json'>
    readonly createdAt: FieldRef<"ContentTakedown", 'DateTime'>
    readonly updatedAt: FieldRef<"ContentTakedown", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContentTakedown findUnique
   */
  export type ContentTakedownFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter, which ContentTakedown to fetch.
     */
    where: ContentTakedownWhereUniqueInput
  }

  /**
   * ContentTakedown findUniqueOrThrow
   */
  export type ContentTakedownFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter, which ContentTakedown to fetch.
     */
    where: ContentTakedownWhereUniqueInput
  }

  /**
   * ContentTakedown findFirst
   */
  export type ContentTakedownFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter, which ContentTakedown to fetch.
     */
    where?: ContentTakedownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentTakedowns to fetch.
     */
    orderBy?: ContentTakedownOrderByWithRelationInput | ContentTakedownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentTakedowns.
     */
    cursor?: ContentTakedownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentTakedowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentTakedowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentTakedowns.
     */
    distinct?: ContentTakedownScalarFieldEnum | ContentTakedownScalarFieldEnum[]
  }

  /**
   * ContentTakedown findFirstOrThrow
   */
  export type ContentTakedownFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter, which ContentTakedown to fetch.
     */
    where?: ContentTakedownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentTakedowns to fetch.
     */
    orderBy?: ContentTakedownOrderByWithRelationInput | ContentTakedownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentTakedowns.
     */
    cursor?: ContentTakedownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentTakedowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentTakedowns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentTakedowns.
     */
    distinct?: ContentTakedownScalarFieldEnum | ContentTakedownScalarFieldEnum[]
  }

  /**
   * ContentTakedown findMany
   */
  export type ContentTakedownFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter, which ContentTakedowns to fetch.
     */
    where?: ContentTakedownWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentTakedowns to fetch.
     */
    orderBy?: ContentTakedownOrderByWithRelationInput | ContentTakedownOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContentTakedowns.
     */
    cursor?: ContentTakedownWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentTakedowns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentTakedowns.
     */
    skip?: number
    distinct?: ContentTakedownScalarFieldEnum | ContentTakedownScalarFieldEnum[]
  }

  /**
   * ContentTakedown create
   */
  export type ContentTakedownCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * The data needed to create a ContentTakedown.
     */
    data: XOR<ContentTakedownCreateInput, ContentTakedownUncheckedCreateInput>
  }

  /**
   * ContentTakedown createMany
   */
  export type ContentTakedownCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContentTakedowns.
     */
    data: ContentTakedownCreateManyInput | ContentTakedownCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContentTakedown createManyAndReturn
   */
  export type ContentTakedownCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ContentTakedowns.
     */
    data: ContentTakedownCreateManyInput | ContentTakedownCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContentTakedown update
   */
  export type ContentTakedownUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * The data needed to update a ContentTakedown.
     */
    data: XOR<ContentTakedownUpdateInput, ContentTakedownUncheckedUpdateInput>
    /**
     * Choose, which ContentTakedown to update.
     */
    where: ContentTakedownWhereUniqueInput
  }

  /**
   * ContentTakedown updateMany
   */
  export type ContentTakedownUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContentTakedowns.
     */
    data: XOR<ContentTakedownUpdateManyMutationInput, ContentTakedownUncheckedUpdateManyInput>
    /**
     * Filter which ContentTakedowns to update
     */
    where?: ContentTakedownWhereInput
  }

  /**
   * ContentTakedown upsert
   */
  export type ContentTakedownUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * The filter to search for the ContentTakedown to update in case it exists.
     */
    where: ContentTakedownWhereUniqueInput
    /**
     * In case the ContentTakedown found by the `where` argument doesn't exist, create a new ContentTakedown with this data.
     */
    create: XOR<ContentTakedownCreateInput, ContentTakedownUncheckedCreateInput>
    /**
     * In case the ContentTakedown was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContentTakedownUpdateInput, ContentTakedownUncheckedUpdateInput>
  }

  /**
   * ContentTakedown delete
   */
  export type ContentTakedownDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
    /**
     * Filter which ContentTakedown to delete.
     */
    where: ContentTakedownWhereUniqueInput
  }

  /**
   * ContentTakedown deleteMany
   */
  export type ContentTakedownDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentTakedowns to delete
     */
    where?: ContentTakedownWhereInput
  }

  /**
   * ContentTakedown without action
   */
  export type ContentTakedownDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentTakedown
     */
    select?: ContentTakedownSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContentTakedownInclude<ExtArgs> | null
  }


  /**
   * Model PayoutDispute
   */

  export type AggregatePayoutDispute = {
    _count: PayoutDisputeCountAggregateOutputType | null
    _avg: PayoutDisputeAvgAggregateOutputType | null
    _sum: PayoutDisputeSumAggregateOutputType | null
    _min: PayoutDisputeMinAggregateOutputType | null
    _max: PayoutDisputeMaxAggregateOutputType | null
  }

  export type PayoutDisputeAvgAggregateOutputType = {
    amount: Decimal | null
    compensation: Decimal | null
  }

  export type PayoutDisputeSumAggregateOutputType = {
    amount: Decimal | null
    compensation: Decimal | null
  }

  export type PayoutDisputeMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    creatorId: string | null
    payoutId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    compensation: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutDisputeMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    creatorId: string | null
    payoutId: string | null
    amount: Decimal | null
    currency: string | null
    reason: string | null
    status: string | null
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    compensation: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutDisputeCountAggregateOutputType = {
    id: number
    ticketId: number
    creatorId: number
    payoutId: number
    amount: number
    currency: number
    reason: number
    evidence: number
    status: number
    resolution: number
    resolvedAt: number
    resolvedBy: number
    compensation: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PayoutDisputeAvgAggregateInputType = {
    amount?: true
    compensation?: true
  }

  export type PayoutDisputeSumAggregateInputType = {
    amount?: true
    compensation?: true
  }

  export type PayoutDisputeMinAggregateInputType = {
    id?: true
    ticketId?: true
    creatorId?: true
    payoutId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    compensation?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutDisputeMaxAggregateInputType = {
    id?: true
    ticketId?: true
    creatorId?: true
    payoutId?: true
    amount?: true
    currency?: true
    reason?: true
    status?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    compensation?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutDisputeCountAggregateInputType = {
    id?: true
    ticketId?: true
    creatorId?: true
    payoutId?: true
    amount?: true
    currency?: true
    reason?: true
    evidence?: true
    status?: true
    resolution?: true
    resolvedAt?: true
    resolvedBy?: true
    compensation?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PayoutDisputeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutDispute to aggregate.
     */
    where?: PayoutDisputeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutDisputes to fetch.
     */
    orderBy?: PayoutDisputeOrderByWithRelationInput | PayoutDisputeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PayoutDisputeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutDisputes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutDisputes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PayoutDisputes
    **/
    _count?: true | PayoutDisputeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PayoutDisputeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PayoutDisputeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PayoutDisputeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PayoutDisputeMaxAggregateInputType
  }

  export type GetPayoutDisputeAggregateType<T extends PayoutDisputeAggregateArgs> = {
        [P in keyof T & keyof AggregatePayoutDispute]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayoutDispute[P]>
      : GetScalarType<T[P], AggregatePayoutDispute[P]>
  }




  export type PayoutDisputeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutDisputeWhereInput
    orderBy?: PayoutDisputeOrderByWithAggregationInput | PayoutDisputeOrderByWithAggregationInput[]
    by: PayoutDisputeScalarFieldEnum[] | PayoutDisputeScalarFieldEnum
    having?: PayoutDisputeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PayoutDisputeCountAggregateInputType | true
    _avg?: PayoutDisputeAvgAggregateInputType
    _sum?: PayoutDisputeSumAggregateInputType
    _min?: PayoutDisputeMinAggregateInputType
    _max?: PayoutDisputeMaxAggregateInputType
  }

  export type PayoutDisputeGroupByOutputType = {
    id: string
    ticketId: string
    creatorId: string
    payoutId: string
    amount: Decimal
    currency: string
    reason: string
    evidence: JsonValue | null
    status: string
    resolution: string | null
    resolvedAt: Date | null
    resolvedBy: string | null
    compensation: Decimal | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: PayoutDisputeCountAggregateOutputType | null
    _avg: PayoutDisputeAvgAggregateOutputType | null
    _sum: PayoutDisputeSumAggregateOutputType | null
    _min: PayoutDisputeMinAggregateOutputType | null
    _max: PayoutDisputeMaxAggregateOutputType | null
  }

  type GetPayoutDisputeGroupByPayload<T extends PayoutDisputeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PayoutDisputeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PayoutDisputeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PayoutDisputeGroupByOutputType[P]>
            : GetScalarType<T[P], PayoutDisputeGroupByOutputType[P]>
        }
      >
    >


  export type PayoutDisputeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    creatorId?: boolean
    payoutId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    compensation?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutDispute"]>

  export type PayoutDisputeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    creatorId?: boolean
    payoutId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    compensation?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutDispute"]>

  export type PayoutDisputeSelectScalar = {
    id?: boolean
    ticketId?: boolean
    creatorId?: boolean
    payoutId?: boolean
    amount?: boolean
    currency?: boolean
    reason?: boolean
    evidence?: boolean
    status?: boolean
    resolution?: boolean
    resolvedAt?: boolean
    resolvedBy?: boolean
    compensation?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PayoutDisputeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type PayoutDisputeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $PayoutDisputePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PayoutDispute"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      creatorId: string
      payoutId: string
      amount: Prisma.Decimal
      currency: string
      reason: string
      evidence: Prisma.JsonValue | null
      status: string
      resolution: string | null
      resolvedAt: Date | null
      resolvedBy: string | null
      compensation: Prisma.Decimal | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payoutDispute"]>
    composites: {}
  }

  type PayoutDisputeGetPayload<S extends boolean | null | undefined | PayoutDisputeDefaultArgs> = $Result.GetResult<Prisma.$PayoutDisputePayload, S>

  type PayoutDisputeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PayoutDisputeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PayoutDisputeCountAggregateInputType | true
    }

  export interface PayoutDisputeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PayoutDispute'], meta: { name: 'PayoutDispute' } }
    /**
     * Find zero or one PayoutDispute that matches the filter.
     * @param {PayoutDisputeFindUniqueArgs} args - Arguments to find a PayoutDispute
     * @example
     * // Get one PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PayoutDisputeFindUniqueArgs>(args: SelectSubset<T, PayoutDisputeFindUniqueArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PayoutDispute that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PayoutDisputeFindUniqueOrThrowArgs} args - Arguments to find a PayoutDispute
     * @example
     * // Get one PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PayoutDisputeFindUniqueOrThrowArgs>(args: SelectSubset<T, PayoutDisputeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PayoutDispute that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeFindFirstArgs} args - Arguments to find a PayoutDispute
     * @example
     * // Get one PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PayoutDisputeFindFirstArgs>(args?: SelectSubset<T, PayoutDisputeFindFirstArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PayoutDispute that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeFindFirstOrThrowArgs} args - Arguments to find a PayoutDispute
     * @example
     * // Get one PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PayoutDisputeFindFirstOrThrowArgs>(args?: SelectSubset<T, PayoutDisputeFindFirstOrThrowArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PayoutDisputes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PayoutDisputes
     * const payoutDisputes = await prisma.payoutDispute.findMany()
     * 
     * // Get first 10 PayoutDisputes
     * const payoutDisputes = await prisma.payoutDispute.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const payoutDisputeWithIdOnly = await prisma.payoutDispute.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PayoutDisputeFindManyArgs>(args?: SelectSubset<T, PayoutDisputeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PayoutDispute.
     * @param {PayoutDisputeCreateArgs} args - Arguments to create a PayoutDispute.
     * @example
     * // Create one PayoutDispute
     * const PayoutDispute = await prisma.payoutDispute.create({
     *   data: {
     *     // ... data to create a PayoutDispute
     *   }
     * })
     * 
     */
    create<T extends PayoutDisputeCreateArgs>(args: SelectSubset<T, PayoutDisputeCreateArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PayoutDisputes.
     * @param {PayoutDisputeCreateManyArgs} args - Arguments to create many PayoutDisputes.
     * @example
     * // Create many PayoutDisputes
     * const payoutDispute = await prisma.payoutDispute.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PayoutDisputeCreateManyArgs>(args?: SelectSubset<T, PayoutDisputeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PayoutDisputes and returns the data saved in the database.
     * @param {PayoutDisputeCreateManyAndReturnArgs} args - Arguments to create many PayoutDisputes.
     * @example
     * // Create many PayoutDisputes
     * const payoutDispute = await prisma.payoutDispute.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PayoutDisputes and only return the `id`
     * const payoutDisputeWithIdOnly = await prisma.payoutDispute.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PayoutDisputeCreateManyAndReturnArgs>(args?: SelectSubset<T, PayoutDisputeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PayoutDispute.
     * @param {PayoutDisputeDeleteArgs} args - Arguments to delete one PayoutDispute.
     * @example
     * // Delete one PayoutDispute
     * const PayoutDispute = await prisma.payoutDispute.delete({
     *   where: {
     *     // ... filter to delete one PayoutDispute
     *   }
     * })
     * 
     */
    delete<T extends PayoutDisputeDeleteArgs>(args: SelectSubset<T, PayoutDisputeDeleteArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PayoutDispute.
     * @param {PayoutDisputeUpdateArgs} args - Arguments to update one PayoutDispute.
     * @example
     * // Update one PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PayoutDisputeUpdateArgs>(args: SelectSubset<T, PayoutDisputeUpdateArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PayoutDisputes.
     * @param {PayoutDisputeDeleteManyArgs} args - Arguments to filter PayoutDisputes to delete.
     * @example
     * // Delete a few PayoutDisputes
     * const { count } = await prisma.payoutDispute.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PayoutDisputeDeleteManyArgs>(args?: SelectSubset<T, PayoutDisputeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PayoutDisputes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PayoutDisputes
     * const payoutDispute = await prisma.payoutDispute.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PayoutDisputeUpdateManyArgs>(args: SelectSubset<T, PayoutDisputeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PayoutDispute.
     * @param {PayoutDisputeUpsertArgs} args - Arguments to update or create a PayoutDispute.
     * @example
     * // Update or create a PayoutDispute
     * const payoutDispute = await prisma.payoutDispute.upsert({
     *   create: {
     *     // ... data to create a PayoutDispute
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PayoutDispute we want to update
     *   }
     * })
     */
    upsert<T extends PayoutDisputeUpsertArgs>(args: SelectSubset<T, PayoutDisputeUpsertArgs<ExtArgs>>): Prisma__PayoutDisputeClient<$Result.GetResult<Prisma.$PayoutDisputePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PayoutDisputes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeCountArgs} args - Arguments to filter PayoutDisputes to count.
     * @example
     * // Count the number of PayoutDisputes
     * const count = await prisma.payoutDispute.count({
     *   where: {
     *     // ... the filter for the PayoutDisputes we want to count
     *   }
     * })
    **/
    count<T extends PayoutDisputeCountArgs>(
      args?: Subset<T, PayoutDisputeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PayoutDisputeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PayoutDispute.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PayoutDisputeAggregateArgs>(args: Subset<T, PayoutDisputeAggregateArgs>): Prisma.PrismaPromise<GetPayoutDisputeAggregateType<T>>

    /**
     * Group by PayoutDispute.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutDisputeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PayoutDisputeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PayoutDisputeGroupByArgs['orderBy'] }
        : { orderBy?: PayoutDisputeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PayoutDisputeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPayoutDisputeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PayoutDispute model
   */
  readonly fields: PayoutDisputeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PayoutDispute.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PayoutDisputeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PayoutDispute model
   */ 
  interface PayoutDisputeFieldRefs {
    readonly id: FieldRef<"PayoutDispute", 'String'>
    readonly ticketId: FieldRef<"PayoutDispute", 'String'>
    readonly creatorId: FieldRef<"PayoutDispute", 'String'>
    readonly payoutId: FieldRef<"PayoutDispute", 'String'>
    readonly amount: FieldRef<"PayoutDispute", 'Decimal'>
    readonly currency: FieldRef<"PayoutDispute", 'String'>
    readonly reason: FieldRef<"PayoutDispute", 'String'>
    readonly evidence: FieldRef<"PayoutDispute", 'Json'>
    readonly status: FieldRef<"PayoutDispute", 'String'>
    readonly resolution: FieldRef<"PayoutDispute", 'String'>
    readonly resolvedAt: FieldRef<"PayoutDispute", 'DateTime'>
    readonly resolvedBy: FieldRef<"PayoutDispute", 'String'>
    readonly compensation: FieldRef<"PayoutDispute", 'Decimal'>
    readonly metadata: FieldRef<"PayoutDispute", 'Json'>
    readonly createdAt: FieldRef<"PayoutDispute", 'DateTime'>
    readonly updatedAt: FieldRef<"PayoutDispute", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PayoutDispute findUnique
   */
  export type PayoutDisputeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter, which PayoutDispute to fetch.
     */
    where: PayoutDisputeWhereUniqueInput
  }

  /**
   * PayoutDispute findUniqueOrThrow
   */
  export type PayoutDisputeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter, which PayoutDispute to fetch.
     */
    where: PayoutDisputeWhereUniqueInput
  }

  /**
   * PayoutDispute findFirst
   */
  export type PayoutDisputeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter, which PayoutDispute to fetch.
     */
    where?: PayoutDisputeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutDisputes to fetch.
     */
    orderBy?: PayoutDisputeOrderByWithRelationInput | PayoutDisputeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutDisputes.
     */
    cursor?: PayoutDisputeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutDisputes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutDisputes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutDisputes.
     */
    distinct?: PayoutDisputeScalarFieldEnum | PayoutDisputeScalarFieldEnum[]
  }

  /**
   * PayoutDispute findFirstOrThrow
   */
  export type PayoutDisputeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter, which PayoutDispute to fetch.
     */
    where?: PayoutDisputeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutDisputes to fetch.
     */
    orderBy?: PayoutDisputeOrderByWithRelationInput | PayoutDisputeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutDisputes.
     */
    cursor?: PayoutDisputeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutDisputes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutDisputes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutDisputes.
     */
    distinct?: PayoutDisputeScalarFieldEnum | PayoutDisputeScalarFieldEnum[]
  }

  /**
   * PayoutDispute findMany
   */
  export type PayoutDisputeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter, which PayoutDisputes to fetch.
     */
    where?: PayoutDisputeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutDisputes to fetch.
     */
    orderBy?: PayoutDisputeOrderByWithRelationInput | PayoutDisputeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PayoutDisputes.
     */
    cursor?: PayoutDisputeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutDisputes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutDisputes.
     */
    skip?: number
    distinct?: PayoutDisputeScalarFieldEnum | PayoutDisputeScalarFieldEnum[]
  }

  /**
   * PayoutDispute create
   */
  export type PayoutDisputeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * The data needed to create a PayoutDispute.
     */
    data: XOR<PayoutDisputeCreateInput, PayoutDisputeUncheckedCreateInput>
  }

  /**
   * PayoutDispute createMany
   */
  export type PayoutDisputeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PayoutDisputes.
     */
    data: PayoutDisputeCreateManyInput | PayoutDisputeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PayoutDispute createManyAndReturn
   */
  export type PayoutDisputeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PayoutDisputes.
     */
    data: PayoutDisputeCreateManyInput | PayoutDisputeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PayoutDispute update
   */
  export type PayoutDisputeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * The data needed to update a PayoutDispute.
     */
    data: XOR<PayoutDisputeUpdateInput, PayoutDisputeUncheckedUpdateInput>
    /**
     * Choose, which PayoutDispute to update.
     */
    where: PayoutDisputeWhereUniqueInput
  }

  /**
   * PayoutDispute updateMany
   */
  export type PayoutDisputeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PayoutDisputes.
     */
    data: XOR<PayoutDisputeUpdateManyMutationInput, PayoutDisputeUncheckedUpdateManyInput>
    /**
     * Filter which PayoutDisputes to update
     */
    where?: PayoutDisputeWhereInput
  }

  /**
   * PayoutDispute upsert
   */
  export type PayoutDisputeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * The filter to search for the PayoutDispute to update in case it exists.
     */
    where: PayoutDisputeWhereUniqueInput
    /**
     * In case the PayoutDispute found by the `where` argument doesn't exist, create a new PayoutDispute with this data.
     */
    create: XOR<PayoutDisputeCreateInput, PayoutDisputeUncheckedCreateInput>
    /**
     * In case the PayoutDispute was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PayoutDisputeUpdateInput, PayoutDisputeUncheckedUpdateInput>
  }

  /**
   * PayoutDispute delete
   */
  export type PayoutDisputeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
    /**
     * Filter which PayoutDispute to delete.
     */
    where: PayoutDisputeWhereUniqueInput
  }

  /**
   * PayoutDispute deleteMany
   */
  export type PayoutDisputeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutDisputes to delete
     */
    where?: PayoutDisputeWhereInput
  }

  /**
   * PayoutDispute without action
   */
  export type PayoutDisputeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutDispute
     */
    select?: PayoutDisputeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutDisputeInclude<ExtArgs> | null
  }


  /**
   * Model UserSuspension
   */

  export type AggregateUserSuspension = {
    _count: UserSuspensionCountAggregateOutputType | null
    _min: UserSuspensionMinAggregateOutputType | null
    _max: UserSuspensionMaxAggregateOutputType | null
  }

  export type UserSuspensionMinAggregateOutputType = {
    id: string | null
    ticketId: string | null
    userId: string | null
    reason: string | null
    suspendedBy: string | null
    status: string | null
    suspendedAt: Date | null
    expiresAt: Date | null
    reinstatedAt: Date | null
    reinstatedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserSuspensionMaxAggregateOutputType = {
    id: string | null
    ticketId: string | null
    userId: string | null
    reason: string | null
    suspendedBy: string | null
    status: string | null
    suspendedAt: Date | null
    expiresAt: Date | null
    reinstatedAt: Date | null
    reinstatedBy: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserSuspensionCountAggregateOutputType = {
    id: number
    ticketId: number
    userId: number
    reason: number
    suspendedBy: number
    status: number
    suspendedAt: number
    expiresAt: number
    reinstatedAt: number
    reinstatedBy: number
    evidence: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserSuspensionMinAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    reason?: true
    suspendedBy?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    reinstatedAt?: true
    reinstatedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserSuspensionMaxAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    reason?: true
    suspendedBy?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    reinstatedAt?: true
    reinstatedBy?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserSuspensionCountAggregateInputType = {
    id?: true
    ticketId?: true
    userId?: true
    reason?: true
    suspendedBy?: true
    status?: true
    suspendedAt?: true
    expiresAt?: true
    reinstatedAt?: true
    reinstatedBy?: true
    evidence?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserSuspensionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserSuspension to aggregate.
     */
    where?: UserSuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSuspensions to fetch.
     */
    orderBy?: UserSuspensionOrderByWithRelationInput | UserSuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserSuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSuspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSuspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserSuspensions
    **/
    _count?: true | UserSuspensionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserSuspensionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserSuspensionMaxAggregateInputType
  }

  export type GetUserSuspensionAggregateType<T extends UserSuspensionAggregateArgs> = {
        [P in keyof T & keyof AggregateUserSuspension]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserSuspension[P]>
      : GetScalarType<T[P], AggregateUserSuspension[P]>
  }




  export type UserSuspensionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserSuspensionWhereInput
    orderBy?: UserSuspensionOrderByWithAggregationInput | UserSuspensionOrderByWithAggregationInput[]
    by: UserSuspensionScalarFieldEnum[] | UserSuspensionScalarFieldEnum
    having?: UserSuspensionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserSuspensionCountAggregateInputType | true
    _min?: UserSuspensionMinAggregateInputType
    _max?: UserSuspensionMaxAggregateInputType
  }

  export type UserSuspensionGroupByOutputType = {
    id: string
    ticketId: string
    userId: string
    reason: string
    suspendedBy: string
    status: string
    suspendedAt: Date
    expiresAt: Date | null
    reinstatedAt: Date | null
    reinstatedBy: string | null
    evidence: JsonValue | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: UserSuspensionCountAggregateOutputType | null
    _min: UserSuspensionMinAggregateOutputType | null
    _max: UserSuspensionMaxAggregateOutputType | null
  }

  type GetUserSuspensionGroupByPayload<T extends UserSuspensionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserSuspensionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserSuspensionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserSuspensionGroupByOutputType[P]>
            : GetScalarType<T[P], UserSuspensionGroupByOutputType[P]>
        }
      >
    >


  export type UserSuspensionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    reason?: boolean
    suspendedBy?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    reinstatedAt?: boolean
    reinstatedBy?: boolean
    evidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userSuspension"]>

  export type UserSuspensionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    reason?: boolean
    suspendedBy?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    reinstatedAt?: boolean
    reinstatedBy?: boolean
    evidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userSuspension"]>

  export type UserSuspensionSelectScalar = {
    id?: boolean
    ticketId?: boolean
    userId?: boolean
    reason?: boolean
    suspendedBy?: boolean
    status?: boolean
    suspendedAt?: boolean
    expiresAt?: boolean
    reinstatedAt?: boolean
    reinstatedBy?: boolean
    evidence?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserSuspensionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }
  export type UserSuspensionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ticket?: boolean | SupportTicketDefaultArgs<ExtArgs>
  }

  export type $UserSuspensionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserSuspension"
    objects: {
      ticket: Prisma.$SupportTicketPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      ticketId: string
      userId: string
      reason: string
      suspendedBy: string
      status: string
      suspendedAt: Date
      expiresAt: Date | null
      reinstatedAt: Date | null
      reinstatedBy: string | null
      evidence: Prisma.JsonValue | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["userSuspension"]>
    composites: {}
  }

  type UserSuspensionGetPayload<S extends boolean | null | undefined | UserSuspensionDefaultArgs> = $Result.GetResult<Prisma.$UserSuspensionPayload, S>

  type UserSuspensionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserSuspensionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserSuspensionCountAggregateInputType | true
    }

  export interface UserSuspensionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserSuspension'], meta: { name: 'UserSuspension' } }
    /**
     * Find zero or one UserSuspension that matches the filter.
     * @param {UserSuspensionFindUniqueArgs} args - Arguments to find a UserSuspension
     * @example
     * // Get one UserSuspension
     * const userSuspension = await prisma.userSuspension.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserSuspensionFindUniqueArgs>(args: SelectSubset<T, UserSuspensionFindUniqueArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one UserSuspension that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserSuspensionFindUniqueOrThrowArgs} args - Arguments to find a UserSuspension
     * @example
     * // Get one UserSuspension
     * const userSuspension = await prisma.userSuspension.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserSuspensionFindUniqueOrThrowArgs>(args: SelectSubset<T, UserSuspensionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first UserSuspension that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionFindFirstArgs} args - Arguments to find a UserSuspension
     * @example
     * // Get one UserSuspension
     * const userSuspension = await prisma.userSuspension.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserSuspensionFindFirstArgs>(args?: SelectSubset<T, UserSuspensionFindFirstArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first UserSuspension that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionFindFirstOrThrowArgs} args - Arguments to find a UserSuspension
     * @example
     * // Get one UserSuspension
     * const userSuspension = await prisma.userSuspension.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserSuspensionFindFirstOrThrowArgs>(args?: SelectSubset<T, UserSuspensionFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more UserSuspensions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserSuspensions
     * const userSuspensions = await prisma.userSuspension.findMany()
     * 
     * // Get first 10 UserSuspensions
     * const userSuspensions = await prisma.userSuspension.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userSuspensionWithIdOnly = await prisma.userSuspension.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserSuspensionFindManyArgs>(args?: SelectSubset<T, UserSuspensionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a UserSuspension.
     * @param {UserSuspensionCreateArgs} args - Arguments to create a UserSuspension.
     * @example
     * // Create one UserSuspension
     * const UserSuspension = await prisma.userSuspension.create({
     *   data: {
     *     // ... data to create a UserSuspension
     *   }
     * })
     * 
     */
    create<T extends UserSuspensionCreateArgs>(args: SelectSubset<T, UserSuspensionCreateArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many UserSuspensions.
     * @param {UserSuspensionCreateManyArgs} args - Arguments to create many UserSuspensions.
     * @example
     * // Create many UserSuspensions
     * const userSuspension = await prisma.userSuspension.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserSuspensionCreateManyArgs>(args?: SelectSubset<T, UserSuspensionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserSuspensions and returns the data saved in the database.
     * @param {UserSuspensionCreateManyAndReturnArgs} args - Arguments to create many UserSuspensions.
     * @example
     * // Create many UserSuspensions
     * const userSuspension = await prisma.userSuspension.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserSuspensions and only return the `id`
     * const userSuspensionWithIdOnly = await prisma.userSuspension.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserSuspensionCreateManyAndReturnArgs>(args?: SelectSubset<T, UserSuspensionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a UserSuspension.
     * @param {UserSuspensionDeleteArgs} args - Arguments to delete one UserSuspension.
     * @example
     * // Delete one UserSuspension
     * const UserSuspension = await prisma.userSuspension.delete({
     *   where: {
     *     // ... filter to delete one UserSuspension
     *   }
     * })
     * 
     */
    delete<T extends UserSuspensionDeleteArgs>(args: SelectSubset<T, UserSuspensionDeleteArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one UserSuspension.
     * @param {UserSuspensionUpdateArgs} args - Arguments to update one UserSuspension.
     * @example
     * // Update one UserSuspension
     * const userSuspension = await prisma.userSuspension.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserSuspensionUpdateArgs>(args: SelectSubset<T, UserSuspensionUpdateArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more UserSuspensions.
     * @param {UserSuspensionDeleteManyArgs} args - Arguments to filter UserSuspensions to delete.
     * @example
     * // Delete a few UserSuspensions
     * const { count } = await prisma.userSuspension.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserSuspensionDeleteManyArgs>(args?: SelectSubset<T, UserSuspensionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserSuspensions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserSuspensions
     * const userSuspension = await prisma.userSuspension.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserSuspensionUpdateManyArgs>(args: SelectSubset<T, UserSuspensionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one UserSuspension.
     * @param {UserSuspensionUpsertArgs} args - Arguments to update or create a UserSuspension.
     * @example
     * // Update or create a UserSuspension
     * const userSuspension = await prisma.userSuspension.upsert({
     *   create: {
     *     // ... data to create a UserSuspension
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserSuspension we want to update
     *   }
     * })
     */
    upsert<T extends UserSuspensionUpsertArgs>(args: SelectSubset<T, UserSuspensionUpsertArgs<ExtArgs>>): Prisma__UserSuspensionClient<$Result.GetResult<Prisma.$UserSuspensionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of UserSuspensions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionCountArgs} args - Arguments to filter UserSuspensions to count.
     * @example
     * // Count the number of UserSuspensions
     * const count = await prisma.userSuspension.count({
     *   where: {
     *     // ... the filter for the UserSuspensions we want to count
     *   }
     * })
    **/
    count<T extends UserSuspensionCountArgs>(
      args?: Subset<T, UserSuspensionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserSuspensionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserSuspension.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserSuspensionAggregateArgs>(args: Subset<T, UserSuspensionAggregateArgs>): Prisma.PrismaPromise<GetUserSuspensionAggregateType<T>>

    /**
     * Group by UserSuspension.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSuspensionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserSuspensionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserSuspensionGroupByArgs['orderBy'] }
        : { orderBy?: UserSuspensionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserSuspensionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserSuspensionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserSuspension model
   */
  readonly fields: UserSuspensionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserSuspension.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserSuspensionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ticket<T extends SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupportTicketDefaultArgs<ExtArgs>>): Prisma__SupportTicketClient<$Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserSuspension model
   */ 
  interface UserSuspensionFieldRefs {
    readonly id: FieldRef<"UserSuspension", 'String'>
    readonly ticketId: FieldRef<"UserSuspension", 'String'>
    readonly userId: FieldRef<"UserSuspension", 'String'>
    readonly reason: FieldRef<"UserSuspension", 'String'>
    readonly suspendedBy: FieldRef<"UserSuspension", 'String'>
    readonly status: FieldRef<"UserSuspension", 'String'>
    readonly suspendedAt: FieldRef<"UserSuspension", 'DateTime'>
    readonly expiresAt: FieldRef<"UserSuspension", 'DateTime'>
    readonly reinstatedAt: FieldRef<"UserSuspension", 'DateTime'>
    readonly reinstatedBy: FieldRef<"UserSuspension", 'String'>
    readonly evidence: FieldRef<"UserSuspension", 'Json'>
    readonly metadata: FieldRef<"UserSuspension", 'Json'>
    readonly createdAt: FieldRef<"UserSuspension", 'DateTime'>
    readonly updatedAt: FieldRef<"UserSuspension", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserSuspension findUnique
   */
  export type UserSuspensionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter, which UserSuspension to fetch.
     */
    where: UserSuspensionWhereUniqueInput
  }

  /**
   * UserSuspension findUniqueOrThrow
   */
  export type UserSuspensionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter, which UserSuspension to fetch.
     */
    where: UserSuspensionWhereUniqueInput
  }

  /**
   * UserSuspension findFirst
   */
  export type UserSuspensionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter, which UserSuspension to fetch.
     */
    where?: UserSuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSuspensions to fetch.
     */
    orderBy?: UserSuspensionOrderByWithRelationInput | UserSuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserSuspensions.
     */
    cursor?: UserSuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSuspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSuspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserSuspensions.
     */
    distinct?: UserSuspensionScalarFieldEnum | UserSuspensionScalarFieldEnum[]
  }

  /**
   * UserSuspension findFirstOrThrow
   */
  export type UserSuspensionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter, which UserSuspension to fetch.
     */
    where?: UserSuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSuspensions to fetch.
     */
    orderBy?: UserSuspensionOrderByWithRelationInput | UserSuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserSuspensions.
     */
    cursor?: UserSuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSuspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSuspensions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserSuspensions.
     */
    distinct?: UserSuspensionScalarFieldEnum | UserSuspensionScalarFieldEnum[]
  }

  /**
   * UserSuspension findMany
   */
  export type UserSuspensionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter, which UserSuspensions to fetch.
     */
    where?: UserSuspensionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSuspensions to fetch.
     */
    orderBy?: UserSuspensionOrderByWithRelationInput | UserSuspensionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserSuspensions.
     */
    cursor?: UserSuspensionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSuspensions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSuspensions.
     */
    skip?: number
    distinct?: UserSuspensionScalarFieldEnum | UserSuspensionScalarFieldEnum[]
  }

  /**
   * UserSuspension create
   */
  export type UserSuspensionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * The data needed to create a UserSuspension.
     */
    data: XOR<UserSuspensionCreateInput, UserSuspensionUncheckedCreateInput>
  }

  /**
   * UserSuspension createMany
   */
  export type UserSuspensionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserSuspensions.
     */
    data: UserSuspensionCreateManyInput | UserSuspensionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserSuspension createManyAndReturn
   */
  export type UserSuspensionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many UserSuspensions.
     */
    data: UserSuspensionCreateManyInput | UserSuspensionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserSuspension update
   */
  export type UserSuspensionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * The data needed to update a UserSuspension.
     */
    data: XOR<UserSuspensionUpdateInput, UserSuspensionUncheckedUpdateInput>
    /**
     * Choose, which UserSuspension to update.
     */
    where: UserSuspensionWhereUniqueInput
  }

  /**
   * UserSuspension updateMany
   */
  export type UserSuspensionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserSuspensions.
     */
    data: XOR<UserSuspensionUpdateManyMutationInput, UserSuspensionUncheckedUpdateManyInput>
    /**
     * Filter which UserSuspensions to update
     */
    where?: UserSuspensionWhereInput
  }

  /**
   * UserSuspension upsert
   */
  export type UserSuspensionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * The filter to search for the UserSuspension to update in case it exists.
     */
    where: UserSuspensionWhereUniqueInput
    /**
     * In case the UserSuspension found by the `where` argument doesn't exist, create a new UserSuspension with this data.
     */
    create: XOR<UserSuspensionCreateInput, UserSuspensionUncheckedCreateInput>
    /**
     * In case the UserSuspension was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserSuspensionUpdateInput, UserSuspensionUncheckedUpdateInput>
  }

  /**
   * UserSuspension delete
   */
  export type UserSuspensionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
    /**
     * Filter which UserSuspension to delete.
     */
    where: UserSuspensionWhereUniqueInput
  }

  /**
   * UserSuspension deleteMany
   */
  export type UserSuspensionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserSuspensions to delete
     */
    where?: UserSuspensionWhereInput
  }

  /**
   * UserSuspension without action
   */
  export type UserSuspensionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSuspension
     */
    select?: UserSuspensionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSuspensionInclude<ExtArgs> | null
  }


  /**
   * Model WebhookEvent
   */

  export type AggregateWebhookEvent = {
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  export type WebhookEventMinAggregateOutputType = {
    id: string | null
    type: string | null
    provider: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebhookEventMaxAggregateOutputType = {
    id: string | null
    type: string | null
    provider: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WebhookEventCountAggregateOutputType = {
    id: number
    type: number
    payload: number
    provider: number
    processedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WebhookEventMinAggregateInputType = {
    id?: true
    type?: true
    provider?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebhookEventMaxAggregateInputType = {
    id?: true
    type?: true
    provider?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WebhookEventCountAggregateInputType = {
    id?: true
    type?: true
    payload?: true
    provider?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WebhookEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvent to aggregate.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebhookEvents
    **/
    _count?: true | WebhookEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebhookEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebhookEventMaxAggregateInputType
  }

  export type GetWebhookEventAggregateType<T extends WebhookEventAggregateArgs> = {
        [P in keyof T & keyof AggregateWebhookEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebhookEvent[P]>
      : GetScalarType<T[P], AggregateWebhookEvent[P]>
  }




  export type WebhookEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookEventWhereInput
    orderBy?: WebhookEventOrderByWithAggregationInput | WebhookEventOrderByWithAggregationInput[]
    by: WebhookEventScalarFieldEnum[] | WebhookEventScalarFieldEnum
    having?: WebhookEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebhookEventCountAggregateInputType | true
    _min?: WebhookEventMinAggregateInputType
    _max?: WebhookEventMaxAggregateInputType
  }

  export type WebhookEventGroupByOutputType = {
    id: string
    type: string
    payload: JsonValue
    provider: string
    processedAt: Date
    createdAt: Date
    updatedAt: Date
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  type GetWebhookEventGroupByPayload<T extends WebhookEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebhookEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebhookEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
            : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
        }
      >
    >


  export type WebhookEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    payload?: boolean
    provider?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    payload?: boolean
    provider?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectScalar = {
    id?: boolean
    type?: boolean
    payload?: boolean
    provider?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $WebhookEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebhookEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: string
      payload: Prisma.JsonValue
      provider: string
      processedAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["webhookEvent"]>
    composites: {}
  }

  type WebhookEventGetPayload<S extends boolean | null | undefined | WebhookEventDefaultArgs> = $Result.GetResult<Prisma.$WebhookEventPayload, S>

  type WebhookEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WebhookEventFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WebhookEventCountAggregateInputType | true
    }

  export interface WebhookEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebhookEvent'], meta: { name: 'WebhookEvent' } }
    /**
     * Find zero or one WebhookEvent that matches the filter.
     * @param {WebhookEventFindUniqueArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebhookEventFindUniqueArgs>(args: SelectSubset<T, WebhookEventFindUniqueArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WebhookEvent that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WebhookEventFindUniqueOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebhookEventFindUniqueOrThrowArgs>(args: SelectSubset<T, WebhookEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WebhookEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebhookEventFindFirstArgs>(args?: SelectSubset<T, WebhookEventFindFirstArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WebhookEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebhookEventFindFirstOrThrowArgs>(args?: SelectSubset<T, WebhookEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WebhookEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany()
     * 
     * // Get first 10 WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebhookEventFindManyArgs>(args?: SelectSubset<T, WebhookEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WebhookEvent.
     * @param {WebhookEventCreateArgs} args - Arguments to create a WebhookEvent.
     * @example
     * // Create one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.create({
     *   data: {
     *     // ... data to create a WebhookEvent
     *   }
     * })
     * 
     */
    create<T extends WebhookEventCreateArgs>(args: SelectSubset<T, WebhookEventCreateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WebhookEvents.
     * @param {WebhookEventCreateManyArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebhookEventCreateManyArgs>(args?: SelectSubset<T, WebhookEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebhookEvents and returns the data saved in the database.
     * @param {WebhookEventCreateManyAndReturnArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebhookEvents and only return the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebhookEventCreateManyAndReturnArgs>(args?: SelectSubset<T, WebhookEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WebhookEvent.
     * @param {WebhookEventDeleteArgs} args - Arguments to delete one WebhookEvent.
     * @example
     * // Delete one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.delete({
     *   where: {
     *     // ... filter to delete one WebhookEvent
     *   }
     * })
     * 
     */
    delete<T extends WebhookEventDeleteArgs>(args: SelectSubset<T, WebhookEventDeleteArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WebhookEvent.
     * @param {WebhookEventUpdateArgs} args - Arguments to update one WebhookEvent.
     * @example
     * // Update one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebhookEventUpdateArgs>(args: SelectSubset<T, WebhookEventUpdateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WebhookEvents.
     * @param {WebhookEventDeleteManyArgs} args - Arguments to filter WebhookEvents to delete.
     * @example
     * // Delete a few WebhookEvents
     * const { count } = await prisma.webhookEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebhookEventDeleteManyArgs>(args?: SelectSubset<T, WebhookEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebhookEventUpdateManyArgs>(args: SelectSubset<T, WebhookEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WebhookEvent.
     * @param {WebhookEventUpsertArgs} args - Arguments to update or create a WebhookEvent.
     * @example
     * // Update or create a WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.upsert({
     *   create: {
     *     // ... data to create a WebhookEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebhookEvent we want to update
     *   }
     * })
     */
    upsert<T extends WebhookEventUpsertArgs>(args: SelectSubset<T, WebhookEventUpsertArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventCountArgs} args - Arguments to filter WebhookEvents to count.
     * @example
     * // Count the number of WebhookEvents
     * const count = await prisma.webhookEvent.count({
     *   where: {
     *     // ... the filter for the WebhookEvents we want to count
     *   }
     * })
    **/
    count<T extends WebhookEventCountArgs>(
      args?: Subset<T, WebhookEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebhookEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebhookEventAggregateArgs>(args: Subset<T, WebhookEventAggregateArgs>): Prisma.PrismaPromise<GetWebhookEventAggregateType<T>>

    /**
     * Group by WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebhookEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebhookEventGroupByArgs['orderBy'] }
        : { orderBy?: WebhookEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebhookEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebhookEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebhookEvent model
   */
  readonly fields: WebhookEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebhookEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebhookEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebhookEvent model
   */ 
  interface WebhookEventFieldRefs {
    readonly id: FieldRef<"WebhookEvent", 'String'>
    readonly type: FieldRef<"WebhookEvent", 'String'>
    readonly payload: FieldRef<"WebhookEvent", 'Json'>
    readonly provider: FieldRef<"WebhookEvent", 'String'>
    readonly processedAt: FieldRef<"WebhookEvent", 'DateTime'>
    readonly createdAt: FieldRef<"WebhookEvent", 'DateTime'>
    readonly updatedAt: FieldRef<"WebhookEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WebhookEvent findUnique
   */
  export type WebhookEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findUniqueOrThrow
   */
  export type WebhookEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findFirst
   */
  export type WebhookEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findFirstOrThrow
   */
  export type WebhookEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findMany
   */
  export type WebhookEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter, which WebhookEvents to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent create
   */
  export type WebhookEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * The data needed to create a WebhookEvent.
     */
    data: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
  }

  /**
   * WebhookEvent createMany
   */
  export type WebhookEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookEvent createManyAndReturn
   */
  export type WebhookEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookEvent update
   */
  export type WebhookEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * The data needed to update a WebhookEvent.
     */
    data: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
    /**
     * Choose, which WebhookEvent to update.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent updateMany
   */
  export type WebhookEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebhookEvents.
     */
    data: XOR<WebhookEventUpdateManyMutationInput, WebhookEventUncheckedUpdateManyInput>
    /**
     * Filter which WebhookEvents to update
     */
    where?: WebhookEventWhereInput
  }

  /**
   * WebhookEvent upsert
   */
  export type WebhookEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * The filter to search for the WebhookEvent to update in case it exists.
     */
    where: WebhookEventWhereUniqueInput
    /**
     * In case the WebhookEvent found by the `where` argument doesn't exist, create a new WebhookEvent with this data.
     */
    create: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
    /**
     * In case the WebhookEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
  }

  /**
   * WebhookEvent delete
   */
  export type WebhookEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Filter which WebhookEvent to delete.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent deleteMany
   */
  export type WebhookEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvents to delete
     */
    where?: WebhookEventWhereInput
  }

  /**
   * WebhookEvent without action
   */
  export type WebhookEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const SupportTicketScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    orderId: 'orderId',
    ticketId: 'ticketId',
    category: 'category',
    priority: 'priority',
    status: 'status',
    subject: 'subject',
    description: 'description',
    metadata: 'metadata',
    assignedTo: 'assignedTo',
    resolvedAt: 'resolvedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupportTicketScalarFieldEnum = (typeof SupportTicketScalarFieldEnum)[keyof typeof SupportTicketScalarFieldEnum]


  export const SupportMessageScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    senderId: 'senderId',
    senderType: 'senderType',
    message: 'message',
    isInternal: 'isInternal',
    createdAt: 'createdAt'
  };

  export type SupportMessageScalarFieldEnum = (typeof SupportMessageScalarFieldEnum)[keyof typeof SupportMessageScalarFieldEnum]


  export const RefundScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    paymentId: 'paymentId',
    userId: 'userId',
    amount: 'amount',
    currency: 'currency',
    reason: 'reason',
    status: 'status',
    refundReference: 'refundReference',
    processedAt: 'processedAt',
    processedBy: 'processedBy',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RefundScalarFieldEnum = (typeof RefundScalarFieldEnum)[keyof typeof RefundScalarFieldEnum]


  export const ChargebackScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    paymentId: 'paymentId',
    userId: 'userId',
    amount: 'amount',
    currency: 'currency',
    reason: 'reason',
    status: 'status',
    disputeDeadline: 'disputeDeadline',
    evidenceDue: 'evidenceDue',
    chargebackRef: 'chargebackRef',
    resolution: 'resolution',
    resolvedAt: 'resolvedAt',
    resolvedBy: 'resolvedBy',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChargebackScalarFieldEnum = (typeof ChargebackScalarFieldEnum)[keyof typeof ChargebackScalarFieldEnum]


  export const AppealScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    userId: 'userId',
    appealType: 'appealType',
    resourceId: 'resourceId',
    resourceType: 'resourceType',
    originalDecision: 'originalDecision',
    reason: 'reason',
    evidence: 'evidence',
    status: 'status',
    decision: 'decision',
    decidedAt: 'decidedAt',
    decidedBy: 'decidedBy',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AppealScalarFieldEnum = (typeof AppealScalarFieldEnum)[keyof typeof AppealScalarFieldEnum]


  export const ContentTakedownScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    contentId: 'contentId',
    reportedBy: 'reportedBy',
    reason: 'reason',
    evidence: 'evidence',
    status: 'status',
    decision: 'decision',
    decidedAt: 'decidedAt',
    decidedBy: 'decidedBy',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContentTakedownScalarFieldEnum = (typeof ContentTakedownScalarFieldEnum)[keyof typeof ContentTakedownScalarFieldEnum]


  export const PayoutDisputeScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    creatorId: 'creatorId',
    payoutId: 'payoutId',
    amount: 'amount',
    currency: 'currency',
    reason: 'reason',
    evidence: 'evidence',
    status: 'status',
    resolution: 'resolution',
    resolvedAt: 'resolvedAt',
    resolvedBy: 'resolvedBy',
    compensation: 'compensation',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PayoutDisputeScalarFieldEnum = (typeof PayoutDisputeScalarFieldEnum)[keyof typeof PayoutDisputeScalarFieldEnum]


  export const UserSuspensionScalarFieldEnum: {
    id: 'id',
    ticketId: 'ticketId',
    userId: 'userId',
    reason: 'reason',
    suspendedBy: 'suspendedBy',
    status: 'status',
    suspendedAt: 'suspendedAt',
    expiresAt: 'expiresAt',
    reinstatedAt: 'reinstatedAt',
    reinstatedBy: 'reinstatedBy',
    evidence: 'evidence',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserSuspensionScalarFieldEnum = (typeof UserSuspensionScalarFieldEnum)[keyof typeof UserSuspensionScalarFieldEnum]


  export const WebhookEventScalarFieldEnum: {
    id: 'id',
    type: 'type',
    payload: 'payload',
    provider: 'provider',
    processedAt: 'processedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WebhookEventScalarFieldEnum = (typeof WebhookEventScalarFieldEnum)[keyof typeof WebhookEventScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'SupportTicketCategory'
   */
  export type EnumSupportTicketCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketCategory'>
    


  /**
   * Reference to a field of type 'SupportTicketCategory[]'
   */
  export type ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketCategory[]'>
    


  /**
   * Reference to a field of type 'SupportTicketPriority'
   */
  export type EnumSupportTicketPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketPriority'>
    


  /**
   * Reference to a field of type 'SupportTicketPriority[]'
   */
  export type ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketPriority[]'>
    


  /**
   * Reference to a field of type 'SupportTicketStatus'
   */
  export type EnumSupportTicketStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketStatus'>
    


  /**
   * Reference to a field of type 'SupportTicketStatus[]'
   */
  export type ListEnumSupportTicketStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SupportTicketStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type SupportTicketWhereInput = {
    AND?: SupportTicketWhereInput | SupportTicketWhereInput[]
    OR?: SupportTicketWhereInput[]
    NOT?: SupportTicketWhereInput | SupportTicketWhereInput[]
    id?: StringFilter<"SupportTicket"> | string
    userId?: StringFilter<"SupportTicket"> | string
    orderId?: StringNullableFilter<"SupportTicket"> | string | null
    ticketId?: StringFilter<"SupportTicket"> | string
    category?: EnumSupportTicketCategoryFilter<"SupportTicket"> | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFilter<"SupportTicket"> | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFilter<"SupportTicket"> | $Enums.SupportTicketStatus
    subject?: StringFilter<"SupportTicket"> | string
    description?: StringFilter<"SupportTicket"> | string
    metadata?: JsonNullableFilter<"SupportTicket">
    assignedTo?: StringNullableFilter<"SupportTicket"> | string | null
    resolvedAt?: DateTimeNullableFilter<"SupportTicket"> | Date | string | null
    createdAt?: DateTimeFilter<"SupportTicket"> | Date | string
    updatedAt?: DateTimeFilter<"SupportTicket"> | Date | string
    messages?: SupportMessageListRelationFilter
    refund?: XOR<RefundNullableRelationFilter, RefundWhereInput> | null
    chargeback?: XOR<ChargebackNullableRelationFilter, ChargebackWhereInput> | null
    appeal?: XOR<AppealNullableRelationFilter, AppealWhereInput> | null
    takedown?: XOR<ContentTakedownNullableRelationFilter, ContentTakedownWhereInput> | null
    dispute?: XOR<PayoutDisputeNullableRelationFilter, PayoutDisputeWhereInput> | null
    suspension?: XOR<UserSuspensionNullableRelationFilter, UserSuspensionWhereInput> | null
  }

  export type SupportTicketOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrderInput | SortOrder
    ticketId?: SortOrder
    category?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    metadata?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messages?: SupportMessageOrderByRelationAggregateInput
    refund?: RefundOrderByWithRelationInput
    chargeback?: ChargebackOrderByWithRelationInput
    appeal?: AppealOrderByWithRelationInput
    takedown?: ContentTakedownOrderByWithRelationInput
    dispute?: PayoutDisputeOrderByWithRelationInput
    suspension?: UserSuspensionOrderByWithRelationInput
  }

  export type SupportTicketWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: SupportTicketWhereInput | SupportTicketWhereInput[]
    OR?: SupportTicketWhereInput[]
    NOT?: SupportTicketWhereInput | SupportTicketWhereInput[]
    userId?: StringFilter<"SupportTicket"> | string
    orderId?: StringNullableFilter<"SupportTicket"> | string | null
    category?: EnumSupportTicketCategoryFilter<"SupportTicket"> | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFilter<"SupportTicket"> | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFilter<"SupportTicket"> | $Enums.SupportTicketStatus
    subject?: StringFilter<"SupportTicket"> | string
    description?: StringFilter<"SupportTicket"> | string
    metadata?: JsonNullableFilter<"SupportTicket">
    assignedTo?: StringNullableFilter<"SupportTicket"> | string | null
    resolvedAt?: DateTimeNullableFilter<"SupportTicket"> | Date | string | null
    createdAt?: DateTimeFilter<"SupportTicket"> | Date | string
    updatedAt?: DateTimeFilter<"SupportTicket"> | Date | string
    messages?: SupportMessageListRelationFilter
    refund?: XOR<RefundNullableRelationFilter, RefundWhereInput> | null
    chargeback?: XOR<ChargebackNullableRelationFilter, ChargebackWhereInput> | null
    appeal?: XOR<AppealNullableRelationFilter, AppealWhereInput> | null
    takedown?: XOR<ContentTakedownNullableRelationFilter, ContentTakedownWhereInput> | null
    dispute?: XOR<PayoutDisputeNullableRelationFilter, PayoutDisputeWhereInput> | null
    suspension?: XOR<UserSuspensionNullableRelationFilter, UserSuspensionWhereInput> | null
  }, "id" | "ticketId">

  export type SupportTicketOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrderInput | SortOrder
    ticketId?: SortOrder
    category?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    metadata?: SortOrderInput | SortOrder
    assignedTo?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupportTicketCountOrderByAggregateInput
    _max?: SupportTicketMaxOrderByAggregateInput
    _min?: SupportTicketMinOrderByAggregateInput
  }

  export type SupportTicketScalarWhereWithAggregatesInput = {
    AND?: SupportTicketScalarWhereWithAggregatesInput | SupportTicketScalarWhereWithAggregatesInput[]
    OR?: SupportTicketScalarWhereWithAggregatesInput[]
    NOT?: SupportTicketScalarWhereWithAggregatesInput | SupportTicketScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SupportTicket"> | string
    userId?: StringWithAggregatesFilter<"SupportTicket"> | string
    orderId?: StringNullableWithAggregatesFilter<"SupportTicket"> | string | null
    ticketId?: StringWithAggregatesFilter<"SupportTicket"> | string
    category?: EnumSupportTicketCategoryWithAggregatesFilter<"SupportTicket"> | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityWithAggregatesFilter<"SupportTicket"> | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusWithAggregatesFilter<"SupportTicket"> | $Enums.SupportTicketStatus
    subject?: StringWithAggregatesFilter<"SupportTicket"> | string
    description?: StringWithAggregatesFilter<"SupportTicket"> | string
    metadata?: JsonNullableWithAggregatesFilter<"SupportTicket">
    assignedTo?: StringNullableWithAggregatesFilter<"SupportTicket"> | string | null
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"SupportTicket"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SupportTicket"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupportTicket"> | Date | string
  }

  export type SupportMessageWhereInput = {
    AND?: SupportMessageWhereInput | SupportMessageWhereInput[]
    OR?: SupportMessageWhereInput[]
    NOT?: SupportMessageWhereInput | SupportMessageWhereInput[]
    id?: StringFilter<"SupportMessage"> | string
    ticketId?: StringFilter<"SupportMessage"> | string
    senderId?: StringFilter<"SupportMessage"> | string
    senderType?: StringFilter<"SupportMessage"> | string
    message?: StringFilter<"SupportMessage"> | string
    isInternal?: BoolFilter<"SupportMessage"> | boolean
    createdAt?: DateTimeFilter<"SupportMessage"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type SupportMessageOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    senderId?: SortOrder
    senderType?: SortOrder
    message?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type SupportMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SupportMessageWhereInput | SupportMessageWhereInput[]
    OR?: SupportMessageWhereInput[]
    NOT?: SupportMessageWhereInput | SupportMessageWhereInput[]
    ticketId?: StringFilter<"SupportMessage"> | string
    senderId?: StringFilter<"SupportMessage"> | string
    senderType?: StringFilter<"SupportMessage"> | string
    message?: StringFilter<"SupportMessage"> | string
    isInternal?: BoolFilter<"SupportMessage"> | boolean
    createdAt?: DateTimeFilter<"SupportMessage"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id">

  export type SupportMessageOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    senderId?: SortOrder
    senderType?: SortOrder
    message?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
    _count?: SupportMessageCountOrderByAggregateInput
    _max?: SupportMessageMaxOrderByAggregateInput
    _min?: SupportMessageMinOrderByAggregateInput
  }

  export type SupportMessageScalarWhereWithAggregatesInput = {
    AND?: SupportMessageScalarWhereWithAggregatesInput | SupportMessageScalarWhereWithAggregatesInput[]
    OR?: SupportMessageScalarWhereWithAggregatesInput[]
    NOT?: SupportMessageScalarWhereWithAggregatesInput | SupportMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SupportMessage"> | string
    ticketId?: StringWithAggregatesFilter<"SupportMessage"> | string
    senderId?: StringWithAggregatesFilter<"SupportMessage"> | string
    senderType?: StringWithAggregatesFilter<"SupportMessage"> | string
    message?: StringWithAggregatesFilter<"SupportMessage"> | string
    isInternal?: BoolWithAggregatesFilter<"SupportMessage"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"SupportMessage"> | Date | string
  }

  export type RefundWhereInput = {
    AND?: RefundWhereInput | RefundWhereInput[]
    OR?: RefundWhereInput[]
    NOT?: RefundWhereInput | RefundWhereInput[]
    id?: StringFilter<"Refund"> | string
    ticketId?: StringFilter<"Refund"> | string
    paymentId?: StringFilter<"Refund"> | string
    userId?: StringFilter<"Refund"> | string
    amount?: DecimalFilter<"Refund"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Refund"> | string
    reason?: StringFilter<"Refund"> | string
    status?: StringFilter<"Refund"> | string
    refundReference?: StringNullableFilter<"Refund"> | string | null
    processedAt?: DateTimeNullableFilter<"Refund"> | Date | string | null
    processedBy?: StringNullableFilter<"Refund"> | string | null
    metadata?: JsonNullableFilter<"Refund">
    createdAt?: DateTimeFilter<"Refund"> | Date | string
    updatedAt?: DateTimeFilter<"Refund"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type RefundOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    refundReference?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    processedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type RefundWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: RefundWhereInput | RefundWhereInput[]
    OR?: RefundWhereInput[]
    NOT?: RefundWhereInput | RefundWhereInput[]
    paymentId?: StringFilter<"Refund"> | string
    userId?: StringFilter<"Refund"> | string
    amount?: DecimalFilter<"Refund"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Refund"> | string
    reason?: StringFilter<"Refund"> | string
    status?: StringFilter<"Refund"> | string
    refundReference?: StringNullableFilter<"Refund"> | string | null
    processedAt?: DateTimeNullableFilter<"Refund"> | Date | string | null
    processedBy?: StringNullableFilter<"Refund"> | string | null
    metadata?: JsonNullableFilter<"Refund">
    createdAt?: DateTimeFilter<"Refund"> | Date | string
    updatedAt?: DateTimeFilter<"Refund"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type RefundOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    refundReference?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    processedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RefundCountOrderByAggregateInput
    _avg?: RefundAvgOrderByAggregateInput
    _max?: RefundMaxOrderByAggregateInput
    _min?: RefundMinOrderByAggregateInput
    _sum?: RefundSumOrderByAggregateInput
  }

  export type RefundScalarWhereWithAggregatesInput = {
    AND?: RefundScalarWhereWithAggregatesInput | RefundScalarWhereWithAggregatesInput[]
    OR?: RefundScalarWhereWithAggregatesInput[]
    NOT?: RefundScalarWhereWithAggregatesInput | RefundScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Refund"> | string
    ticketId?: StringWithAggregatesFilter<"Refund"> | string
    paymentId?: StringWithAggregatesFilter<"Refund"> | string
    userId?: StringWithAggregatesFilter<"Refund"> | string
    amount?: DecimalWithAggregatesFilter<"Refund"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Refund"> | string
    reason?: StringWithAggregatesFilter<"Refund"> | string
    status?: StringWithAggregatesFilter<"Refund"> | string
    refundReference?: StringNullableWithAggregatesFilter<"Refund"> | string | null
    processedAt?: DateTimeNullableWithAggregatesFilter<"Refund"> | Date | string | null
    processedBy?: StringNullableWithAggregatesFilter<"Refund"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"Refund">
    createdAt?: DateTimeWithAggregatesFilter<"Refund"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Refund"> | Date | string
  }

  export type ChargebackWhereInput = {
    AND?: ChargebackWhereInput | ChargebackWhereInput[]
    OR?: ChargebackWhereInput[]
    NOT?: ChargebackWhereInput | ChargebackWhereInput[]
    id?: StringFilter<"Chargeback"> | string
    ticketId?: StringFilter<"Chargeback"> | string
    paymentId?: StringFilter<"Chargeback"> | string
    userId?: StringFilter<"Chargeback"> | string
    amount?: DecimalFilter<"Chargeback"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Chargeback"> | string
    reason?: StringFilter<"Chargeback"> | string
    status?: StringFilter<"Chargeback"> | string
    disputeDeadline?: DateTimeFilter<"Chargeback"> | Date | string
    evidenceDue?: DateTimeFilter<"Chargeback"> | Date | string
    chargebackRef?: StringNullableFilter<"Chargeback"> | string | null
    resolution?: StringNullableFilter<"Chargeback"> | string | null
    resolvedAt?: DateTimeNullableFilter<"Chargeback"> | Date | string | null
    resolvedBy?: StringNullableFilter<"Chargeback"> | string | null
    metadata?: JsonNullableFilter<"Chargeback">
    createdAt?: DateTimeFilter<"Chargeback"> | Date | string
    updatedAt?: DateTimeFilter<"Chargeback"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type ChargebackOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    disputeDeadline?: SortOrder
    evidenceDue?: SortOrder
    chargebackRef?: SortOrderInput | SortOrder
    resolution?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type ChargebackWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: ChargebackWhereInput | ChargebackWhereInput[]
    OR?: ChargebackWhereInput[]
    NOT?: ChargebackWhereInput | ChargebackWhereInput[]
    paymentId?: StringFilter<"Chargeback"> | string
    userId?: StringFilter<"Chargeback"> | string
    amount?: DecimalFilter<"Chargeback"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Chargeback"> | string
    reason?: StringFilter<"Chargeback"> | string
    status?: StringFilter<"Chargeback"> | string
    disputeDeadline?: DateTimeFilter<"Chargeback"> | Date | string
    evidenceDue?: DateTimeFilter<"Chargeback"> | Date | string
    chargebackRef?: StringNullableFilter<"Chargeback"> | string | null
    resolution?: StringNullableFilter<"Chargeback"> | string | null
    resolvedAt?: DateTimeNullableFilter<"Chargeback"> | Date | string | null
    resolvedBy?: StringNullableFilter<"Chargeback"> | string | null
    metadata?: JsonNullableFilter<"Chargeback">
    createdAt?: DateTimeFilter<"Chargeback"> | Date | string
    updatedAt?: DateTimeFilter<"Chargeback"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type ChargebackOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    disputeDeadline?: SortOrder
    evidenceDue?: SortOrder
    chargebackRef?: SortOrderInput | SortOrder
    resolution?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChargebackCountOrderByAggregateInput
    _avg?: ChargebackAvgOrderByAggregateInput
    _max?: ChargebackMaxOrderByAggregateInput
    _min?: ChargebackMinOrderByAggregateInput
    _sum?: ChargebackSumOrderByAggregateInput
  }

  export type ChargebackScalarWhereWithAggregatesInput = {
    AND?: ChargebackScalarWhereWithAggregatesInput | ChargebackScalarWhereWithAggregatesInput[]
    OR?: ChargebackScalarWhereWithAggregatesInput[]
    NOT?: ChargebackScalarWhereWithAggregatesInput | ChargebackScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Chargeback"> | string
    ticketId?: StringWithAggregatesFilter<"Chargeback"> | string
    paymentId?: StringWithAggregatesFilter<"Chargeback"> | string
    userId?: StringWithAggregatesFilter<"Chargeback"> | string
    amount?: DecimalWithAggregatesFilter<"Chargeback"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Chargeback"> | string
    reason?: StringWithAggregatesFilter<"Chargeback"> | string
    status?: StringWithAggregatesFilter<"Chargeback"> | string
    disputeDeadline?: DateTimeWithAggregatesFilter<"Chargeback"> | Date | string
    evidenceDue?: DateTimeWithAggregatesFilter<"Chargeback"> | Date | string
    chargebackRef?: StringNullableWithAggregatesFilter<"Chargeback"> | string | null
    resolution?: StringNullableWithAggregatesFilter<"Chargeback"> | string | null
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"Chargeback"> | Date | string | null
    resolvedBy?: StringNullableWithAggregatesFilter<"Chargeback"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"Chargeback">
    createdAt?: DateTimeWithAggregatesFilter<"Chargeback"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Chargeback"> | Date | string
  }

  export type AppealWhereInput = {
    AND?: AppealWhereInput | AppealWhereInput[]
    OR?: AppealWhereInput[]
    NOT?: AppealWhereInput | AppealWhereInput[]
    id?: StringFilter<"Appeal"> | string
    ticketId?: StringFilter<"Appeal"> | string
    userId?: StringFilter<"Appeal"> | string
    appealType?: StringFilter<"Appeal"> | string
    resourceId?: StringFilter<"Appeal"> | string
    resourceType?: StringFilter<"Appeal"> | string
    originalDecision?: StringFilter<"Appeal"> | string
    reason?: StringFilter<"Appeal"> | string
    evidence?: JsonNullableFilter<"Appeal">
    status?: StringFilter<"Appeal"> | string
    decision?: StringNullableFilter<"Appeal"> | string | null
    decidedAt?: DateTimeNullableFilter<"Appeal"> | Date | string | null
    decidedBy?: StringNullableFilter<"Appeal"> | string | null
    metadata?: JsonNullableFilter<"Appeal">
    createdAt?: DateTimeFilter<"Appeal"> | Date | string
    updatedAt?: DateTimeFilter<"Appeal"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type AppealOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    appealType?: SortOrder
    resourceId?: SortOrder
    resourceType?: SortOrder
    originalDecision?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    decision?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    decidedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type AppealWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: AppealWhereInput | AppealWhereInput[]
    OR?: AppealWhereInput[]
    NOT?: AppealWhereInput | AppealWhereInput[]
    userId?: StringFilter<"Appeal"> | string
    appealType?: StringFilter<"Appeal"> | string
    resourceId?: StringFilter<"Appeal"> | string
    resourceType?: StringFilter<"Appeal"> | string
    originalDecision?: StringFilter<"Appeal"> | string
    reason?: StringFilter<"Appeal"> | string
    evidence?: JsonNullableFilter<"Appeal">
    status?: StringFilter<"Appeal"> | string
    decision?: StringNullableFilter<"Appeal"> | string | null
    decidedAt?: DateTimeNullableFilter<"Appeal"> | Date | string | null
    decidedBy?: StringNullableFilter<"Appeal"> | string | null
    metadata?: JsonNullableFilter<"Appeal">
    createdAt?: DateTimeFilter<"Appeal"> | Date | string
    updatedAt?: DateTimeFilter<"Appeal"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type AppealOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    appealType?: SortOrder
    resourceId?: SortOrder
    resourceType?: SortOrder
    originalDecision?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    decision?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    decidedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AppealCountOrderByAggregateInput
    _max?: AppealMaxOrderByAggregateInput
    _min?: AppealMinOrderByAggregateInput
  }

  export type AppealScalarWhereWithAggregatesInput = {
    AND?: AppealScalarWhereWithAggregatesInput | AppealScalarWhereWithAggregatesInput[]
    OR?: AppealScalarWhereWithAggregatesInput[]
    NOT?: AppealScalarWhereWithAggregatesInput | AppealScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Appeal"> | string
    ticketId?: StringWithAggregatesFilter<"Appeal"> | string
    userId?: StringWithAggregatesFilter<"Appeal"> | string
    appealType?: StringWithAggregatesFilter<"Appeal"> | string
    resourceId?: StringWithAggregatesFilter<"Appeal"> | string
    resourceType?: StringWithAggregatesFilter<"Appeal"> | string
    originalDecision?: StringWithAggregatesFilter<"Appeal"> | string
    reason?: StringWithAggregatesFilter<"Appeal"> | string
    evidence?: JsonNullableWithAggregatesFilter<"Appeal">
    status?: StringWithAggregatesFilter<"Appeal"> | string
    decision?: StringNullableWithAggregatesFilter<"Appeal"> | string | null
    decidedAt?: DateTimeNullableWithAggregatesFilter<"Appeal"> | Date | string | null
    decidedBy?: StringNullableWithAggregatesFilter<"Appeal"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"Appeal">
    createdAt?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
  }

  export type ContentTakedownWhereInput = {
    AND?: ContentTakedownWhereInput | ContentTakedownWhereInput[]
    OR?: ContentTakedownWhereInput[]
    NOT?: ContentTakedownWhereInput | ContentTakedownWhereInput[]
    id?: StringFilter<"ContentTakedown"> | string
    ticketId?: StringFilter<"ContentTakedown"> | string
    contentId?: StringFilter<"ContentTakedown"> | string
    reportedBy?: StringFilter<"ContentTakedown"> | string
    reason?: StringFilter<"ContentTakedown"> | string
    evidence?: JsonNullableFilter<"ContentTakedown">
    status?: StringFilter<"ContentTakedown"> | string
    decision?: StringNullableFilter<"ContentTakedown"> | string | null
    decidedAt?: DateTimeNullableFilter<"ContentTakedown"> | Date | string | null
    decidedBy?: StringNullableFilter<"ContentTakedown"> | string | null
    metadata?: JsonNullableFilter<"ContentTakedown">
    createdAt?: DateTimeFilter<"ContentTakedown"> | Date | string
    updatedAt?: DateTimeFilter<"ContentTakedown"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type ContentTakedownOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    contentId?: SortOrder
    reportedBy?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    decision?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    decidedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type ContentTakedownWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: ContentTakedownWhereInput | ContentTakedownWhereInput[]
    OR?: ContentTakedownWhereInput[]
    NOT?: ContentTakedownWhereInput | ContentTakedownWhereInput[]
    contentId?: StringFilter<"ContentTakedown"> | string
    reportedBy?: StringFilter<"ContentTakedown"> | string
    reason?: StringFilter<"ContentTakedown"> | string
    evidence?: JsonNullableFilter<"ContentTakedown">
    status?: StringFilter<"ContentTakedown"> | string
    decision?: StringNullableFilter<"ContentTakedown"> | string | null
    decidedAt?: DateTimeNullableFilter<"ContentTakedown"> | Date | string | null
    decidedBy?: StringNullableFilter<"ContentTakedown"> | string | null
    metadata?: JsonNullableFilter<"ContentTakedown">
    createdAt?: DateTimeFilter<"ContentTakedown"> | Date | string
    updatedAt?: DateTimeFilter<"ContentTakedown"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type ContentTakedownOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    contentId?: SortOrder
    reportedBy?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    decision?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    decidedBy?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContentTakedownCountOrderByAggregateInput
    _max?: ContentTakedownMaxOrderByAggregateInput
    _min?: ContentTakedownMinOrderByAggregateInput
  }

  export type ContentTakedownScalarWhereWithAggregatesInput = {
    AND?: ContentTakedownScalarWhereWithAggregatesInput | ContentTakedownScalarWhereWithAggregatesInput[]
    OR?: ContentTakedownScalarWhereWithAggregatesInput[]
    NOT?: ContentTakedownScalarWhereWithAggregatesInput | ContentTakedownScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContentTakedown"> | string
    ticketId?: StringWithAggregatesFilter<"ContentTakedown"> | string
    contentId?: StringWithAggregatesFilter<"ContentTakedown"> | string
    reportedBy?: StringWithAggregatesFilter<"ContentTakedown"> | string
    reason?: StringWithAggregatesFilter<"ContentTakedown"> | string
    evidence?: JsonNullableWithAggregatesFilter<"ContentTakedown">
    status?: StringWithAggregatesFilter<"ContentTakedown"> | string
    decision?: StringNullableWithAggregatesFilter<"ContentTakedown"> | string | null
    decidedAt?: DateTimeNullableWithAggregatesFilter<"ContentTakedown"> | Date | string | null
    decidedBy?: StringNullableWithAggregatesFilter<"ContentTakedown"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"ContentTakedown">
    createdAt?: DateTimeWithAggregatesFilter<"ContentTakedown"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContentTakedown"> | Date | string
  }

  export type PayoutDisputeWhereInput = {
    AND?: PayoutDisputeWhereInput | PayoutDisputeWhereInput[]
    OR?: PayoutDisputeWhereInput[]
    NOT?: PayoutDisputeWhereInput | PayoutDisputeWhereInput[]
    id?: StringFilter<"PayoutDispute"> | string
    ticketId?: StringFilter<"PayoutDispute"> | string
    creatorId?: StringFilter<"PayoutDispute"> | string
    payoutId?: StringFilter<"PayoutDispute"> | string
    amount?: DecimalFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"PayoutDispute"> | string
    reason?: StringFilter<"PayoutDispute"> | string
    evidence?: JsonNullableFilter<"PayoutDispute">
    status?: StringFilter<"PayoutDispute"> | string
    resolution?: StringNullableFilter<"PayoutDispute"> | string | null
    resolvedAt?: DateTimeNullableFilter<"PayoutDispute"> | Date | string | null
    resolvedBy?: StringNullableFilter<"PayoutDispute"> | string | null
    compensation?: DecimalNullableFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string | null
    metadata?: JsonNullableFilter<"PayoutDispute">
    createdAt?: DateTimeFilter<"PayoutDispute"> | Date | string
    updatedAt?: DateTimeFilter<"PayoutDispute"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type PayoutDisputeOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    creatorId?: SortOrder
    payoutId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    resolution?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    compensation?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type PayoutDisputeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: PayoutDisputeWhereInput | PayoutDisputeWhereInput[]
    OR?: PayoutDisputeWhereInput[]
    NOT?: PayoutDisputeWhereInput | PayoutDisputeWhereInput[]
    creatorId?: StringFilter<"PayoutDispute"> | string
    payoutId?: StringFilter<"PayoutDispute"> | string
    amount?: DecimalFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"PayoutDispute"> | string
    reason?: StringFilter<"PayoutDispute"> | string
    evidence?: JsonNullableFilter<"PayoutDispute">
    status?: StringFilter<"PayoutDispute"> | string
    resolution?: StringNullableFilter<"PayoutDispute"> | string | null
    resolvedAt?: DateTimeNullableFilter<"PayoutDispute"> | Date | string | null
    resolvedBy?: StringNullableFilter<"PayoutDispute"> | string | null
    compensation?: DecimalNullableFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string | null
    metadata?: JsonNullableFilter<"PayoutDispute">
    createdAt?: DateTimeFilter<"PayoutDispute"> | Date | string
    updatedAt?: DateTimeFilter<"PayoutDispute"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type PayoutDisputeOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    creatorId?: SortOrder
    payoutId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    evidence?: SortOrderInput | SortOrder
    status?: SortOrder
    resolution?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    resolvedBy?: SortOrderInput | SortOrder
    compensation?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PayoutDisputeCountOrderByAggregateInput
    _avg?: PayoutDisputeAvgOrderByAggregateInput
    _max?: PayoutDisputeMaxOrderByAggregateInput
    _min?: PayoutDisputeMinOrderByAggregateInput
    _sum?: PayoutDisputeSumOrderByAggregateInput
  }

  export type PayoutDisputeScalarWhereWithAggregatesInput = {
    AND?: PayoutDisputeScalarWhereWithAggregatesInput | PayoutDisputeScalarWhereWithAggregatesInput[]
    OR?: PayoutDisputeScalarWhereWithAggregatesInput[]
    NOT?: PayoutDisputeScalarWhereWithAggregatesInput | PayoutDisputeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PayoutDispute"> | string
    ticketId?: StringWithAggregatesFilter<"PayoutDispute"> | string
    creatorId?: StringWithAggregatesFilter<"PayoutDispute"> | string
    payoutId?: StringWithAggregatesFilter<"PayoutDispute"> | string
    amount?: DecimalWithAggregatesFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"PayoutDispute"> | string
    reason?: StringWithAggregatesFilter<"PayoutDispute"> | string
    evidence?: JsonNullableWithAggregatesFilter<"PayoutDispute">
    status?: StringWithAggregatesFilter<"PayoutDispute"> | string
    resolution?: StringNullableWithAggregatesFilter<"PayoutDispute"> | string | null
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"PayoutDispute"> | Date | string | null
    resolvedBy?: StringNullableWithAggregatesFilter<"PayoutDispute"> | string | null
    compensation?: DecimalNullableWithAggregatesFilter<"PayoutDispute"> | Decimal | DecimalJsLike | number | string | null
    metadata?: JsonNullableWithAggregatesFilter<"PayoutDispute">
    createdAt?: DateTimeWithAggregatesFilter<"PayoutDispute"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PayoutDispute"> | Date | string
  }

  export type UserSuspensionWhereInput = {
    AND?: UserSuspensionWhereInput | UserSuspensionWhereInput[]
    OR?: UserSuspensionWhereInput[]
    NOT?: UserSuspensionWhereInput | UserSuspensionWhereInput[]
    id?: StringFilter<"UserSuspension"> | string
    ticketId?: StringFilter<"UserSuspension"> | string
    userId?: StringFilter<"UserSuspension"> | string
    reason?: StringFilter<"UserSuspension"> | string
    suspendedBy?: StringFilter<"UserSuspension"> | string
    status?: StringFilter<"UserSuspension"> | string
    suspendedAt?: DateTimeFilter<"UserSuspension"> | Date | string
    expiresAt?: DateTimeNullableFilter<"UserSuspension"> | Date | string | null
    reinstatedAt?: DateTimeNullableFilter<"UserSuspension"> | Date | string | null
    reinstatedBy?: StringNullableFilter<"UserSuspension"> | string | null
    evidence?: JsonNullableFilter<"UserSuspension">
    metadata?: JsonNullableFilter<"UserSuspension">
    createdAt?: DateTimeFilter<"UserSuspension"> | Date | string
    updatedAt?: DateTimeFilter<"UserSuspension"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }

  export type UserSuspensionOrderByWithRelationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    reason?: SortOrder
    suspendedBy?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    reinstatedAt?: SortOrderInput | SortOrder
    reinstatedBy?: SortOrderInput | SortOrder
    evidence?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ticket?: SupportTicketOrderByWithRelationInput
  }

  export type UserSuspensionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    ticketId?: string
    AND?: UserSuspensionWhereInput | UserSuspensionWhereInput[]
    OR?: UserSuspensionWhereInput[]
    NOT?: UserSuspensionWhereInput | UserSuspensionWhereInput[]
    userId?: StringFilter<"UserSuspension"> | string
    reason?: StringFilter<"UserSuspension"> | string
    suspendedBy?: StringFilter<"UserSuspension"> | string
    status?: StringFilter<"UserSuspension"> | string
    suspendedAt?: DateTimeFilter<"UserSuspension"> | Date | string
    expiresAt?: DateTimeNullableFilter<"UserSuspension"> | Date | string | null
    reinstatedAt?: DateTimeNullableFilter<"UserSuspension"> | Date | string | null
    reinstatedBy?: StringNullableFilter<"UserSuspension"> | string | null
    evidence?: JsonNullableFilter<"UserSuspension">
    metadata?: JsonNullableFilter<"UserSuspension">
    createdAt?: DateTimeFilter<"UserSuspension"> | Date | string
    updatedAt?: DateTimeFilter<"UserSuspension"> | Date | string
    ticket?: XOR<SupportTicketRelationFilter, SupportTicketWhereInput>
  }, "id" | "ticketId">

  export type UserSuspensionOrderByWithAggregationInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    reason?: SortOrder
    suspendedBy?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    reinstatedAt?: SortOrderInput | SortOrder
    reinstatedBy?: SortOrderInput | SortOrder
    evidence?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserSuspensionCountOrderByAggregateInput
    _max?: UserSuspensionMaxOrderByAggregateInput
    _min?: UserSuspensionMinOrderByAggregateInput
  }

  export type UserSuspensionScalarWhereWithAggregatesInput = {
    AND?: UserSuspensionScalarWhereWithAggregatesInput | UserSuspensionScalarWhereWithAggregatesInput[]
    OR?: UserSuspensionScalarWhereWithAggregatesInput[]
    NOT?: UserSuspensionScalarWhereWithAggregatesInput | UserSuspensionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserSuspension"> | string
    ticketId?: StringWithAggregatesFilter<"UserSuspension"> | string
    userId?: StringWithAggregatesFilter<"UserSuspension"> | string
    reason?: StringWithAggregatesFilter<"UserSuspension"> | string
    suspendedBy?: StringWithAggregatesFilter<"UserSuspension"> | string
    status?: StringWithAggregatesFilter<"UserSuspension"> | string
    suspendedAt?: DateTimeWithAggregatesFilter<"UserSuspension"> | Date | string
    expiresAt?: DateTimeNullableWithAggregatesFilter<"UserSuspension"> | Date | string | null
    reinstatedAt?: DateTimeNullableWithAggregatesFilter<"UserSuspension"> | Date | string | null
    reinstatedBy?: StringNullableWithAggregatesFilter<"UserSuspension"> | string | null
    evidence?: JsonNullableWithAggregatesFilter<"UserSuspension">
    metadata?: JsonNullableWithAggregatesFilter<"UserSuspension">
    createdAt?: DateTimeWithAggregatesFilter<"UserSuspension"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"UserSuspension"> | Date | string
  }

  export type WebhookEventWhereInput = {
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    id?: StringFilter<"WebhookEvent"> | string
    type?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    provider?: StringFilter<"WebhookEvent"> | string
    processedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
    createdAt?: DateTimeFilter<"WebhookEvent"> | Date | string
    updatedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
  }

  export type WebhookEventOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    payload?: SortOrder
    provider?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    type?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    provider?: StringFilter<"WebhookEvent"> | string
    processedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
    createdAt?: DateTimeFilter<"WebhookEvent"> | Date | string
    updatedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
  }, "id">

  export type WebhookEventOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    payload?: SortOrder
    provider?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WebhookEventCountOrderByAggregateInput
    _max?: WebhookEventMaxOrderByAggregateInput
    _min?: WebhookEventMinOrderByAggregateInput
  }

  export type WebhookEventScalarWhereWithAggregatesInput = {
    AND?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    OR?: WebhookEventScalarWhereWithAggregatesInput[]
    NOT?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WebhookEvent"> | string
    type?: StringWithAggregatesFilter<"WebhookEvent"> | string
    payload?: JsonWithAggregatesFilter<"WebhookEvent">
    provider?: StringWithAggregatesFilter<"WebhookEvent"> | string
    processedAt?: DateTimeWithAggregatesFilter<"WebhookEvent"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"WebhookEvent"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WebhookEvent"> | Date | string
  }

  export type SupportTicketCreateInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateManyInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupportTicketUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportTicketUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportMessageCreateInput = {
    id?: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutMessagesInput
  }

  export type SupportMessageUncheckedCreateInput = {
    id?: string
    ticketId: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type SupportMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type SupportMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportMessageCreateManyInput = {
    id?: string
    ticketId: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type SupportMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefundCreateInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    refundReference?: string | null
    processedAt?: Date | string | null
    processedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutRefundInput
  }

  export type RefundUncheckedCreateInput = {
    id?: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    refundReference?: string | null
    processedAt?: Date | string | null
    processedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RefundUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutRefundNestedInput
  }

  export type RefundUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefundCreateManyInput = {
    id?: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    refundReference?: string | null
    processedAt?: Date | string | null
    processedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RefundUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefundUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChargebackCreateInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    disputeDeadline: Date | string
    evidenceDue: Date | string
    chargebackRef?: string | null
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutChargebackInput
  }

  export type ChargebackUncheckedCreateInput = {
    id?: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    disputeDeadline: Date | string
    evidenceDue: Date | string
    chargebackRef?: string | null
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChargebackUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutChargebackNestedInput
  }

  export type ChargebackUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChargebackCreateManyInput = {
    id?: string
    ticketId: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    disputeDeadline: Date | string
    evidenceDue: Date | string
    chargebackRef?: string | null
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChargebackUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChargebackUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppealCreateInput = {
    id?: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutAppealInput
  }

  export type AppealUncheckedCreateInput = {
    id?: string
    ticketId: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AppealUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutAppealNestedInput
  }

  export type AppealUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppealCreateManyInput = {
    id?: string
    ticketId: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AppealUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppealUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentTakedownCreateInput = {
    id?: string
    contentId: string
    reportedBy: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutTakedownInput
  }

  export type ContentTakedownUncheckedCreateInput = {
    id?: string
    ticketId: string
    contentId: string
    reportedBy: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentTakedownUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutTakedownNestedInput
  }

  export type ContentTakedownUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentTakedownCreateManyInput = {
    id?: string
    ticketId: string
    contentId: string
    reportedBy: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentTakedownUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentTakedownUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutDisputeCreateInput = {
    id?: string
    creatorId: string
    payoutId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    compensation?: Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutDisputeInput
  }

  export type PayoutDisputeUncheckedCreateInput = {
    id?: string
    ticketId: string
    creatorId: string
    payoutId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    compensation?: Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutDisputeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutDisputeNestedInput
  }

  export type PayoutDisputeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutDisputeCreateManyInput = {
    id?: string
    ticketId: string
    creatorId: string
    payoutId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    compensation?: Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutDisputeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutDisputeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSuspensionCreateInput = {
    id?: string
    userId: string
    reason: string
    suspendedBy: string
    status?: string
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    reinstatedAt?: Date | string | null
    reinstatedBy?: string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    ticket: SupportTicketCreateNestedOneWithoutSuspensionInput
  }

  export type UserSuspensionUncheckedCreateInput = {
    id?: string
    ticketId: string
    userId: string
    reason: string
    suspendedBy: string
    status?: string
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    reinstatedAt?: Date | string | null
    reinstatedBy?: string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserSuspensionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ticket?: SupportTicketUpdateOneRequiredWithoutSuspensionNestedInput
  }

  export type UserSuspensionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSuspensionCreateManyInput = {
    id?: string
    ticketId: string
    userId: string
    reason: string
    suspendedBy: string
    status?: string
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    reinstatedAt?: Date | string | null
    reinstatedBy?: string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserSuspensionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSuspensionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    ticketId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateInput = {
    id: string
    type: string
    payload: JsonNullValueInput | InputJsonValue
    provider: string
    processedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookEventUncheckedCreateInput = {
    id: string
    type: string
    payload: JsonNullValueInput | InputJsonValue
    provider: string
    processedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    provider?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    provider?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateManyInput = {
    id: string
    type: string
    payload: JsonNullValueInput | InputJsonValue
    provider: string
    processedAt: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WebhookEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    provider?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    provider?: StringFieldUpdateOperationsInput | string
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumSupportTicketCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketCategory | EnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketCategoryFilter<$PrismaModel> | $Enums.SupportTicketCategory
  }

  export type EnumSupportTicketPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketPriority | EnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketPriorityFilter<$PrismaModel> | $Enums.SupportTicketPriority
  }

  export type EnumSupportTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketStatus | EnumSupportTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketStatusFilter<$PrismaModel> | $Enums.SupportTicketStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SupportMessageListRelationFilter = {
    every?: SupportMessageWhereInput
    some?: SupportMessageWhereInput
    none?: SupportMessageWhereInput
  }

  export type RefundNullableRelationFilter = {
    is?: RefundWhereInput | null
    isNot?: RefundWhereInput | null
  }

  export type ChargebackNullableRelationFilter = {
    is?: ChargebackWhereInput | null
    isNot?: ChargebackWhereInput | null
  }

  export type AppealNullableRelationFilter = {
    is?: AppealWhereInput | null
    isNot?: AppealWhereInput | null
  }

  export type ContentTakedownNullableRelationFilter = {
    is?: ContentTakedownWhereInput | null
    isNot?: ContentTakedownWhereInput | null
  }

  export type PayoutDisputeNullableRelationFilter = {
    is?: PayoutDisputeWhereInput | null
    isNot?: PayoutDisputeWhereInput | null
  }

  export type UserSuspensionNullableRelationFilter = {
    is?: UserSuspensionWhereInput | null
    isNot?: UserSuspensionWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SupportMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SupportTicketCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    ticketId?: SortOrder
    category?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    metadata?: SortOrder
    assignedTo?: SortOrder
    resolvedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupportTicketMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    ticketId?: SortOrder
    category?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    assignedTo?: SortOrder
    resolvedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupportTicketMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    ticketId?: SortOrder
    category?: SortOrder
    priority?: SortOrder
    status?: SortOrder
    subject?: SortOrder
    description?: SortOrder
    assignedTo?: SortOrder
    resolvedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumSupportTicketCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketCategory | EnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketCategoryWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketCategoryFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketCategoryFilter<$PrismaModel>
  }

  export type EnumSupportTicketPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketPriority | EnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketPriorityWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketPriorityFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketPriorityFilter<$PrismaModel>
  }

  export type EnumSupportTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketStatus | EnumSupportTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type SupportTicketRelationFilter = {
    is?: SupportTicketWhereInput
    isNot?: SupportTicketWhereInput
  }

  export type SupportMessageCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    senderId?: SortOrder
    senderType?: SortOrder
    message?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type SupportMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    senderId?: SortOrder
    senderType?: SortOrder
    message?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type SupportMessageMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    senderId?: SortOrder
    senderType?: SortOrder
    message?: SortOrder
    isInternal?: SortOrder
    createdAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type RefundCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    refundReference?: SortOrder
    processedAt?: SortOrder
    processedBy?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RefundAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type RefundMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    refundReference?: SortOrder
    processedAt?: SortOrder
    processedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RefundMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    refundReference?: SortOrder
    processedAt?: SortOrder
    processedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RefundSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type ChargebackCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    disputeDeadline?: SortOrder
    evidenceDue?: SortOrder
    chargebackRef?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChargebackAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type ChargebackMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    disputeDeadline?: SortOrder
    evidenceDue?: SortOrder
    chargebackRef?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChargebackMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    paymentId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    disputeDeadline?: SortOrder
    evidenceDue?: SortOrder
    chargebackRef?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChargebackSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type AppealCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    appealType?: SortOrder
    resourceId?: SortOrder
    resourceType?: SortOrder
    originalDecision?: SortOrder
    reason?: SortOrder
    evidence?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppealMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    appealType?: SortOrder
    resourceId?: SortOrder
    resourceType?: SortOrder
    originalDecision?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AppealMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    appealType?: SortOrder
    resourceId?: SortOrder
    resourceType?: SortOrder
    originalDecision?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentTakedownCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    contentId?: SortOrder
    reportedBy?: SortOrder
    reason?: SortOrder
    evidence?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentTakedownMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    contentId?: SortOrder
    reportedBy?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentTakedownMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    contentId?: SortOrder
    reportedBy?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    decision?: SortOrder
    decidedAt?: SortOrder
    decidedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type PayoutDisputeCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    creatorId?: SortOrder
    payoutId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    evidence?: SortOrder
    status?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    compensation?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutDisputeAvgOrderByAggregateInput = {
    amount?: SortOrder
    compensation?: SortOrder
  }

  export type PayoutDisputeMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    creatorId?: SortOrder
    payoutId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    compensation?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutDisputeMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    creatorId?: SortOrder
    payoutId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    reason?: SortOrder
    status?: SortOrder
    resolution?: SortOrder
    resolvedAt?: SortOrder
    resolvedBy?: SortOrder
    compensation?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutDisputeSumOrderByAggregateInput = {
    amount?: SortOrder
    compensation?: SortOrder
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type UserSuspensionCountOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    reason?: SortOrder
    suspendedBy?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    reinstatedAt?: SortOrder
    reinstatedBy?: SortOrder
    evidence?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSuspensionMaxOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    reason?: SortOrder
    suspendedBy?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    reinstatedAt?: SortOrder
    reinstatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSuspensionMinOrderByAggregateInput = {
    id?: SortOrder
    ticketId?: SortOrder
    userId?: SortOrder
    reason?: SortOrder
    suspendedBy?: SortOrder
    status?: SortOrder
    suspendedAt?: SortOrder
    expiresAt?: SortOrder
    reinstatedAt?: SortOrder
    reinstatedBy?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type WebhookEventCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    payload?: SortOrder
    provider?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookEventMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WebhookEventMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type SupportMessageCreateNestedManyWithoutTicketInput = {
    create?: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput> | SupportMessageCreateWithoutTicketInput[] | SupportMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: SupportMessageCreateOrConnectWithoutTicketInput | SupportMessageCreateOrConnectWithoutTicketInput[]
    createMany?: SupportMessageCreateManyTicketInputEnvelope
    connect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
  }

  export type RefundCreateNestedOneWithoutTicketInput = {
    create?: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
    connectOrCreate?: RefundCreateOrConnectWithoutTicketInput
    connect?: RefundWhereUniqueInput
  }

  export type ChargebackCreateNestedOneWithoutTicketInput = {
    create?: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ChargebackCreateOrConnectWithoutTicketInput
    connect?: ChargebackWhereUniqueInput
  }

  export type AppealCreateNestedOneWithoutTicketInput = {
    create?: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
    connectOrCreate?: AppealCreateOrConnectWithoutTicketInput
    connect?: AppealWhereUniqueInput
  }

  export type ContentTakedownCreateNestedOneWithoutTicketInput = {
    create?: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ContentTakedownCreateOrConnectWithoutTicketInput
    connect?: ContentTakedownWhereUniqueInput
  }

  export type PayoutDisputeCreateNestedOneWithoutTicketInput = {
    create?: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
    connectOrCreate?: PayoutDisputeCreateOrConnectWithoutTicketInput
    connect?: PayoutDisputeWhereUniqueInput
  }

  export type UserSuspensionCreateNestedOneWithoutTicketInput = {
    create?: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
    connectOrCreate?: UserSuspensionCreateOrConnectWithoutTicketInput
    connect?: UserSuspensionWhereUniqueInput
  }

  export type SupportMessageUncheckedCreateNestedManyWithoutTicketInput = {
    create?: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput> | SupportMessageCreateWithoutTicketInput[] | SupportMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: SupportMessageCreateOrConnectWithoutTicketInput | SupportMessageCreateOrConnectWithoutTicketInput[]
    createMany?: SupportMessageCreateManyTicketInputEnvelope
    connect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
  }

  export type RefundUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
    connectOrCreate?: RefundCreateOrConnectWithoutTicketInput
    connect?: RefundWhereUniqueInput
  }

  export type ChargebackUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ChargebackCreateOrConnectWithoutTicketInput
    connect?: ChargebackWhereUniqueInput
  }

  export type AppealUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
    connectOrCreate?: AppealCreateOrConnectWithoutTicketInput
    connect?: AppealWhereUniqueInput
  }

  export type ContentTakedownUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ContentTakedownCreateOrConnectWithoutTicketInput
    connect?: ContentTakedownWhereUniqueInput
  }

  export type PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
    connectOrCreate?: PayoutDisputeCreateOrConnectWithoutTicketInput
    connect?: PayoutDisputeWhereUniqueInput
  }

  export type UserSuspensionUncheckedCreateNestedOneWithoutTicketInput = {
    create?: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
    connectOrCreate?: UserSuspensionCreateOrConnectWithoutTicketInput
    connect?: UserSuspensionWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumSupportTicketCategoryFieldUpdateOperationsInput = {
    set?: $Enums.SupportTicketCategory
  }

  export type EnumSupportTicketPriorityFieldUpdateOperationsInput = {
    set?: $Enums.SupportTicketPriority
  }

  export type EnumSupportTicketStatusFieldUpdateOperationsInput = {
    set?: $Enums.SupportTicketStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SupportMessageUpdateManyWithoutTicketNestedInput = {
    create?: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput> | SupportMessageCreateWithoutTicketInput[] | SupportMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: SupportMessageCreateOrConnectWithoutTicketInput | SupportMessageCreateOrConnectWithoutTicketInput[]
    upsert?: SupportMessageUpsertWithWhereUniqueWithoutTicketInput | SupportMessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: SupportMessageCreateManyTicketInputEnvelope
    set?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    disconnect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    delete?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    connect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    update?: SupportMessageUpdateWithWhereUniqueWithoutTicketInput | SupportMessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: SupportMessageUpdateManyWithWhereWithoutTicketInput | SupportMessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: SupportMessageScalarWhereInput | SupportMessageScalarWhereInput[]
  }

  export type RefundUpdateOneWithoutTicketNestedInput = {
    create?: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
    connectOrCreate?: RefundCreateOrConnectWithoutTicketInput
    upsert?: RefundUpsertWithoutTicketInput
    disconnect?: RefundWhereInput | boolean
    delete?: RefundWhereInput | boolean
    connect?: RefundWhereUniqueInput
    update?: XOR<XOR<RefundUpdateToOneWithWhereWithoutTicketInput, RefundUpdateWithoutTicketInput>, RefundUncheckedUpdateWithoutTicketInput>
  }

  export type ChargebackUpdateOneWithoutTicketNestedInput = {
    create?: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ChargebackCreateOrConnectWithoutTicketInput
    upsert?: ChargebackUpsertWithoutTicketInput
    disconnect?: ChargebackWhereInput | boolean
    delete?: ChargebackWhereInput | boolean
    connect?: ChargebackWhereUniqueInput
    update?: XOR<XOR<ChargebackUpdateToOneWithWhereWithoutTicketInput, ChargebackUpdateWithoutTicketInput>, ChargebackUncheckedUpdateWithoutTicketInput>
  }

  export type AppealUpdateOneWithoutTicketNestedInput = {
    create?: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
    connectOrCreate?: AppealCreateOrConnectWithoutTicketInput
    upsert?: AppealUpsertWithoutTicketInput
    disconnect?: AppealWhereInput | boolean
    delete?: AppealWhereInput | boolean
    connect?: AppealWhereUniqueInput
    update?: XOR<XOR<AppealUpdateToOneWithWhereWithoutTicketInput, AppealUpdateWithoutTicketInput>, AppealUncheckedUpdateWithoutTicketInput>
  }

  export type ContentTakedownUpdateOneWithoutTicketNestedInput = {
    create?: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ContentTakedownCreateOrConnectWithoutTicketInput
    upsert?: ContentTakedownUpsertWithoutTicketInput
    disconnect?: ContentTakedownWhereInput | boolean
    delete?: ContentTakedownWhereInput | boolean
    connect?: ContentTakedownWhereUniqueInput
    update?: XOR<XOR<ContentTakedownUpdateToOneWithWhereWithoutTicketInput, ContentTakedownUpdateWithoutTicketInput>, ContentTakedownUncheckedUpdateWithoutTicketInput>
  }

  export type PayoutDisputeUpdateOneWithoutTicketNestedInput = {
    create?: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
    connectOrCreate?: PayoutDisputeCreateOrConnectWithoutTicketInput
    upsert?: PayoutDisputeUpsertWithoutTicketInput
    disconnect?: PayoutDisputeWhereInput | boolean
    delete?: PayoutDisputeWhereInput | boolean
    connect?: PayoutDisputeWhereUniqueInput
    update?: XOR<XOR<PayoutDisputeUpdateToOneWithWhereWithoutTicketInput, PayoutDisputeUpdateWithoutTicketInput>, PayoutDisputeUncheckedUpdateWithoutTicketInput>
  }

  export type UserSuspensionUpdateOneWithoutTicketNestedInput = {
    create?: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
    connectOrCreate?: UserSuspensionCreateOrConnectWithoutTicketInput
    upsert?: UserSuspensionUpsertWithoutTicketInput
    disconnect?: UserSuspensionWhereInput | boolean
    delete?: UserSuspensionWhereInput | boolean
    connect?: UserSuspensionWhereUniqueInput
    update?: XOR<XOR<UserSuspensionUpdateToOneWithWhereWithoutTicketInput, UserSuspensionUpdateWithoutTicketInput>, UserSuspensionUncheckedUpdateWithoutTicketInput>
  }

  export type SupportMessageUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput> | SupportMessageCreateWithoutTicketInput[] | SupportMessageUncheckedCreateWithoutTicketInput[]
    connectOrCreate?: SupportMessageCreateOrConnectWithoutTicketInput | SupportMessageCreateOrConnectWithoutTicketInput[]
    upsert?: SupportMessageUpsertWithWhereUniqueWithoutTicketInput | SupportMessageUpsertWithWhereUniqueWithoutTicketInput[]
    createMany?: SupportMessageCreateManyTicketInputEnvelope
    set?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    disconnect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    delete?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    connect?: SupportMessageWhereUniqueInput | SupportMessageWhereUniqueInput[]
    update?: SupportMessageUpdateWithWhereUniqueWithoutTicketInput | SupportMessageUpdateWithWhereUniqueWithoutTicketInput[]
    updateMany?: SupportMessageUpdateManyWithWhereWithoutTicketInput | SupportMessageUpdateManyWithWhereWithoutTicketInput[]
    deleteMany?: SupportMessageScalarWhereInput | SupportMessageScalarWhereInput[]
  }

  export type RefundUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
    connectOrCreate?: RefundCreateOrConnectWithoutTicketInput
    upsert?: RefundUpsertWithoutTicketInput
    disconnect?: RefundWhereInput | boolean
    delete?: RefundWhereInput | boolean
    connect?: RefundWhereUniqueInput
    update?: XOR<XOR<RefundUpdateToOneWithWhereWithoutTicketInput, RefundUpdateWithoutTicketInput>, RefundUncheckedUpdateWithoutTicketInput>
  }

  export type ChargebackUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ChargebackCreateOrConnectWithoutTicketInput
    upsert?: ChargebackUpsertWithoutTicketInput
    disconnect?: ChargebackWhereInput | boolean
    delete?: ChargebackWhereInput | boolean
    connect?: ChargebackWhereUniqueInput
    update?: XOR<XOR<ChargebackUpdateToOneWithWhereWithoutTicketInput, ChargebackUpdateWithoutTicketInput>, ChargebackUncheckedUpdateWithoutTicketInput>
  }

  export type AppealUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
    connectOrCreate?: AppealCreateOrConnectWithoutTicketInput
    upsert?: AppealUpsertWithoutTicketInput
    disconnect?: AppealWhereInput | boolean
    delete?: AppealWhereInput | boolean
    connect?: AppealWhereUniqueInput
    update?: XOR<XOR<AppealUpdateToOneWithWhereWithoutTicketInput, AppealUpdateWithoutTicketInput>, AppealUncheckedUpdateWithoutTicketInput>
  }

  export type ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
    connectOrCreate?: ContentTakedownCreateOrConnectWithoutTicketInput
    upsert?: ContentTakedownUpsertWithoutTicketInput
    disconnect?: ContentTakedownWhereInput | boolean
    delete?: ContentTakedownWhereInput | boolean
    connect?: ContentTakedownWhereUniqueInput
    update?: XOR<XOR<ContentTakedownUpdateToOneWithWhereWithoutTicketInput, ContentTakedownUpdateWithoutTicketInput>, ContentTakedownUncheckedUpdateWithoutTicketInput>
  }

  export type PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
    connectOrCreate?: PayoutDisputeCreateOrConnectWithoutTicketInput
    upsert?: PayoutDisputeUpsertWithoutTicketInput
    disconnect?: PayoutDisputeWhereInput | boolean
    delete?: PayoutDisputeWhereInput | boolean
    connect?: PayoutDisputeWhereUniqueInput
    update?: XOR<XOR<PayoutDisputeUpdateToOneWithWhereWithoutTicketInput, PayoutDisputeUpdateWithoutTicketInput>, PayoutDisputeUncheckedUpdateWithoutTicketInput>
  }

  export type UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput = {
    create?: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
    connectOrCreate?: UserSuspensionCreateOrConnectWithoutTicketInput
    upsert?: UserSuspensionUpsertWithoutTicketInput
    disconnect?: UserSuspensionWhereInput | boolean
    delete?: UserSuspensionWhereInput | boolean
    connect?: UserSuspensionWhereUniqueInput
    update?: XOR<XOR<UserSuspensionUpdateToOneWithWhereWithoutTicketInput, UserSuspensionUpdateWithoutTicketInput>, UserSuspensionUncheckedUpdateWithoutTicketInput>
  }

  export type SupportTicketCreateNestedOneWithoutMessagesInput = {
    create?: XOR<SupportTicketCreateWithoutMessagesInput, SupportTicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutMessagesInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type SupportTicketUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<SupportTicketCreateWithoutMessagesInput, SupportTicketUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutMessagesInput
    upsert?: SupportTicketUpsertWithoutMessagesInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutMessagesInput, SupportTicketUpdateWithoutMessagesInput>, SupportTicketUncheckedUpdateWithoutMessagesInput>
  }

  export type SupportTicketCreateNestedOneWithoutRefundInput = {
    create?: XOR<SupportTicketCreateWithoutRefundInput, SupportTicketUncheckedCreateWithoutRefundInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutRefundInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type SupportTicketUpdateOneRequiredWithoutRefundNestedInput = {
    create?: XOR<SupportTicketCreateWithoutRefundInput, SupportTicketUncheckedCreateWithoutRefundInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutRefundInput
    upsert?: SupportTicketUpsertWithoutRefundInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutRefundInput, SupportTicketUpdateWithoutRefundInput>, SupportTicketUncheckedUpdateWithoutRefundInput>
  }

  export type SupportTicketCreateNestedOneWithoutChargebackInput = {
    create?: XOR<SupportTicketCreateWithoutChargebackInput, SupportTicketUncheckedCreateWithoutChargebackInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutChargebackInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type SupportTicketUpdateOneRequiredWithoutChargebackNestedInput = {
    create?: XOR<SupportTicketCreateWithoutChargebackInput, SupportTicketUncheckedCreateWithoutChargebackInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutChargebackInput
    upsert?: SupportTicketUpsertWithoutChargebackInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutChargebackInput, SupportTicketUpdateWithoutChargebackInput>, SupportTicketUncheckedUpdateWithoutChargebackInput>
  }

  export type SupportTicketCreateNestedOneWithoutAppealInput = {
    create?: XOR<SupportTicketCreateWithoutAppealInput, SupportTicketUncheckedCreateWithoutAppealInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutAppealInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type SupportTicketUpdateOneRequiredWithoutAppealNestedInput = {
    create?: XOR<SupportTicketCreateWithoutAppealInput, SupportTicketUncheckedCreateWithoutAppealInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutAppealInput
    upsert?: SupportTicketUpsertWithoutAppealInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutAppealInput, SupportTicketUpdateWithoutAppealInput>, SupportTicketUncheckedUpdateWithoutAppealInput>
  }

  export type SupportTicketCreateNestedOneWithoutTakedownInput = {
    create?: XOR<SupportTicketCreateWithoutTakedownInput, SupportTicketUncheckedCreateWithoutTakedownInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutTakedownInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type SupportTicketUpdateOneRequiredWithoutTakedownNestedInput = {
    create?: XOR<SupportTicketCreateWithoutTakedownInput, SupportTicketUncheckedCreateWithoutTakedownInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutTakedownInput
    upsert?: SupportTicketUpsertWithoutTakedownInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutTakedownInput, SupportTicketUpdateWithoutTakedownInput>, SupportTicketUncheckedUpdateWithoutTakedownInput>
  }

  export type SupportTicketCreateNestedOneWithoutDisputeInput = {
    create?: XOR<SupportTicketCreateWithoutDisputeInput, SupportTicketUncheckedCreateWithoutDisputeInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutDisputeInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type SupportTicketUpdateOneRequiredWithoutDisputeNestedInput = {
    create?: XOR<SupportTicketCreateWithoutDisputeInput, SupportTicketUncheckedCreateWithoutDisputeInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutDisputeInput
    upsert?: SupportTicketUpsertWithoutDisputeInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutDisputeInput, SupportTicketUpdateWithoutDisputeInput>, SupportTicketUncheckedUpdateWithoutDisputeInput>
  }

  export type SupportTicketCreateNestedOneWithoutSuspensionInput = {
    create?: XOR<SupportTicketCreateWithoutSuspensionInput, SupportTicketUncheckedCreateWithoutSuspensionInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutSuspensionInput
    connect?: SupportTicketWhereUniqueInput
  }

  export type SupportTicketUpdateOneRequiredWithoutSuspensionNestedInput = {
    create?: XOR<SupportTicketCreateWithoutSuspensionInput, SupportTicketUncheckedCreateWithoutSuspensionInput>
    connectOrCreate?: SupportTicketCreateOrConnectWithoutSuspensionInput
    upsert?: SupportTicketUpsertWithoutSuspensionInput
    connect?: SupportTicketWhereUniqueInput
    update?: XOR<XOR<SupportTicketUpdateToOneWithWhereWithoutSuspensionInput, SupportTicketUpdateWithoutSuspensionInput>, SupportTicketUncheckedUpdateWithoutSuspensionInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumSupportTicketCategoryFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketCategory | EnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketCategoryFilter<$PrismaModel> | $Enums.SupportTicketCategory
  }

  export type NestedEnumSupportTicketPriorityFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketPriority | EnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketPriorityFilter<$PrismaModel> | $Enums.SupportTicketPriority
  }

  export type NestedEnumSupportTicketStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketStatus | EnumSupportTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketStatusFilter<$PrismaModel> | $Enums.SupportTicketStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumSupportTicketCategoryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketCategory | EnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketCategory[] | ListEnumSupportTicketCategoryFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketCategoryWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketCategory
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketCategoryFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketCategoryFilter<$PrismaModel>
  }

  export type NestedEnumSupportTicketPriorityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketPriority | EnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketPriority[] | ListEnumSupportTicketPriorityFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketPriorityWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketPriority
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketPriorityFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketPriorityFilter<$PrismaModel>
  }

  export type NestedEnumSupportTicketStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SupportTicketStatus | EnumSupportTicketStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SupportTicketStatus[] | ListEnumSupportTicketStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSupportTicketStatusWithAggregatesFilter<$PrismaModel> | $Enums.SupportTicketStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSupportTicketStatusFilter<$PrismaModel>
    _max?: NestedEnumSupportTicketStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SupportMessageCreateWithoutTicketInput = {
    id?: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type SupportMessageUncheckedCreateWithoutTicketInput = {
    id?: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type SupportMessageCreateOrConnectWithoutTicketInput = {
    where: SupportMessageWhereUniqueInput
    create: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput>
  }

  export type SupportMessageCreateManyTicketInputEnvelope = {
    data: SupportMessageCreateManyTicketInput | SupportMessageCreateManyTicketInput[]
    skipDuplicates?: boolean
  }

  export type RefundCreateWithoutTicketInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    refundReference?: string | null
    processedAt?: Date | string | null
    processedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RefundUncheckedCreateWithoutTicketInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    refundReference?: string | null
    processedAt?: Date | string | null
    processedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RefundCreateOrConnectWithoutTicketInput = {
    where: RefundWhereUniqueInput
    create: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
  }

  export type ChargebackCreateWithoutTicketInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    disputeDeadline: Date | string
    evidenceDue: Date | string
    chargebackRef?: string | null
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChargebackUncheckedCreateWithoutTicketInput = {
    id?: string
    paymentId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    status?: string
    disputeDeadline: Date | string
    evidenceDue: Date | string
    chargebackRef?: string | null
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChargebackCreateOrConnectWithoutTicketInput = {
    where: ChargebackWhereUniqueInput
    create: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
  }

  export type AppealCreateWithoutTicketInput = {
    id?: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AppealUncheckedCreateWithoutTicketInput = {
    id?: string
    userId: string
    appealType: string
    resourceId: string
    resourceType: string
    originalDecision: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AppealCreateOrConnectWithoutTicketInput = {
    where: AppealWhereUniqueInput
    create: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
  }

  export type ContentTakedownCreateWithoutTicketInput = {
    id?: string
    contentId: string
    reportedBy: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentTakedownUncheckedCreateWithoutTicketInput = {
    id?: string
    contentId: string
    reportedBy: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    decision?: string | null
    decidedAt?: Date | string | null
    decidedBy?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentTakedownCreateOrConnectWithoutTicketInput = {
    where: ContentTakedownWhereUniqueInput
    create: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
  }

  export type PayoutDisputeCreateWithoutTicketInput = {
    id?: string
    creatorId: string
    payoutId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    compensation?: Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutDisputeUncheckedCreateWithoutTicketInput = {
    id?: string
    creatorId: string
    payoutId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    reason: string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    resolution?: string | null
    resolvedAt?: Date | string | null
    resolvedBy?: string | null
    compensation?: Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutDisputeCreateOrConnectWithoutTicketInput = {
    where: PayoutDisputeWhereUniqueInput
    create: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
  }

  export type UserSuspensionCreateWithoutTicketInput = {
    id?: string
    userId: string
    reason: string
    suspendedBy: string
    status?: string
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    reinstatedAt?: Date | string | null
    reinstatedBy?: string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserSuspensionUncheckedCreateWithoutTicketInput = {
    id?: string
    userId: string
    reason: string
    suspendedBy: string
    status?: string
    suspendedAt?: Date | string
    expiresAt?: Date | string | null
    reinstatedAt?: Date | string | null
    reinstatedBy?: string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserSuspensionCreateOrConnectWithoutTicketInput = {
    where: UserSuspensionWhereUniqueInput
    create: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
  }

  export type SupportMessageUpsertWithWhereUniqueWithoutTicketInput = {
    where: SupportMessageWhereUniqueInput
    update: XOR<SupportMessageUpdateWithoutTicketInput, SupportMessageUncheckedUpdateWithoutTicketInput>
    create: XOR<SupportMessageCreateWithoutTicketInput, SupportMessageUncheckedCreateWithoutTicketInput>
  }

  export type SupportMessageUpdateWithWhereUniqueWithoutTicketInput = {
    where: SupportMessageWhereUniqueInput
    data: XOR<SupportMessageUpdateWithoutTicketInput, SupportMessageUncheckedUpdateWithoutTicketInput>
  }

  export type SupportMessageUpdateManyWithWhereWithoutTicketInput = {
    where: SupportMessageScalarWhereInput
    data: XOR<SupportMessageUpdateManyMutationInput, SupportMessageUncheckedUpdateManyWithoutTicketInput>
  }

  export type SupportMessageScalarWhereInput = {
    AND?: SupportMessageScalarWhereInput | SupportMessageScalarWhereInput[]
    OR?: SupportMessageScalarWhereInput[]
    NOT?: SupportMessageScalarWhereInput | SupportMessageScalarWhereInput[]
    id?: StringFilter<"SupportMessage"> | string
    ticketId?: StringFilter<"SupportMessage"> | string
    senderId?: StringFilter<"SupportMessage"> | string
    senderType?: StringFilter<"SupportMessage"> | string
    message?: StringFilter<"SupportMessage"> | string
    isInternal?: BoolFilter<"SupportMessage"> | boolean
    createdAt?: DateTimeFilter<"SupportMessage"> | Date | string
  }

  export type RefundUpsertWithoutTicketInput = {
    update: XOR<RefundUpdateWithoutTicketInput, RefundUncheckedUpdateWithoutTicketInput>
    create: XOR<RefundCreateWithoutTicketInput, RefundUncheckedCreateWithoutTicketInput>
    where?: RefundWhereInput
  }

  export type RefundUpdateToOneWithWhereWithoutTicketInput = {
    where?: RefundWhereInput
    data: XOR<RefundUpdateWithoutTicketInput, RefundUncheckedUpdateWithoutTicketInput>
  }

  export type RefundUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefundUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    refundReference?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    processedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChargebackUpsertWithoutTicketInput = {
    update: XOR<ChargebackUpdateWithoutTicketInput, ChargebackUncheckedUpdateWithoutTicketInput>
    create: XOR<ChargebackCreateWithoutTicketInput, ChargebackUncheckedCreateWithoutTicketInput>
    where?: ChargebackWhereInput
  }

  export type ChargebackUpdateToOneWithWhereWithoutTicketInput = {
    where?: ChargebackWhereInput
    data: XOR<ChargebackUpdateWithoutTicketInput, ChargebackUncheckedUpdateWithoutTicketInput>
  }

  export type ChargebackUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChargebackUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    paymentId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    disputeDeadline?: DateTimeFieldUpdateOperationsInput | Date | string
    evidenceDue?: DateTimeFieldUpdateOperationsInput | Date | string
    chargebackRef?: NullableStringFieldUpdateOperationsInput | string | null
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppealUpsertWithoutTicketInput = {
    update: XOR<AppealUpdateWithoutTicketInput, AppealUncheckedUpdateWithoutTicketInput>
    create: XOR<AppealCreateWithoutTicketInput, AppealUncheckedCreateWithoutTicketInput>
    where?: AppealWhereInput
  }

  export type AppealUpdateToOneWithWhereWithoutTicketInput = {
    where?: AppealWhereInput
    data: XOR<AppealUpdateWithoutTicketInput, AppealUncheckedUpdateWithoutTicketInput>
  }

  export type AppealUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AppealUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appealType?: StringFieldUpdateOperationsInput | string
    resourceId?: StringFieldUpdateOperationsInput | string
    resourceType?: StringFieldUpdateOperationsInput | string
    originalDecision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentTakedownUpsertWithoutTicketInput = {
    update: XOR<ContentTakedownUpdateWithoutTicketInput, ContentTakedownUncheckedUpdateWithoutTicketInput>
    create: XOR<ContentTakedownCreateWithoutTicketInput, ContentTakedownUncheckedCreateWithoutTicketInput>
    where?: ContentTakedownWhereInput
  }

  export type ContentTakedownUpdateToOneWithWhereWithoutTicketInput = {
    where?: ContentTakedownWhereInput
    data: XOR<ContentTakedownUpdateWithoutTicketInput, ContentTakedownUncheckedUpdateWithoutTicketInput>
  }

  export type ContentTakedownUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentTakedownUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    contentId?: StringFieldUpdateOperationsInput | string
    reportedBy?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    decision?: NullableStringFieldUpdateOperationsInput | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedBy?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutDisputeUpsertWithoutTicketInput = {
    update: XOR<PayoutDisputeUpdateWithoutTicketInput, PayoutDisputeUncheckedUpdateWithoutTicketInput>
    create: XOR<PayoutDisputeCreateWithoutTicketInput, PayoutDisputeUncheckedCreateWithoutTicketInput>
    where?: PayoutDisputeWhereInput
  }

  export type PayoutDisputeUpdateToOneWithWhereWithoutTicketInput = {
    where?: PayoutDisputeWhereInput
    data: XOR<PayoutDisputeUpdateWithoutTicketInput, PayoutDisputeUncheckedUpdateWithoutTicketInput>
  }

  export type PayoutDisputeUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutDisputeUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    payoutId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    evidence?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    resolution?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    resolvedBy?: NullableStringFieldUpdateOperationsInput | string | null
    compensation?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSuspensionUpsertWithoutTicketInput = {
    update: XOR<UserSuspensionUpdateWithoutTicketInput, UserSuspensionUncheckedUpdateWithoutTicketInput>
    create: XOR<UserSuspensionCreateWithoutTicketInput, UserSuspensionUncheckedCreateWithoutTicketInput>
    where?: UserSuspensionWhereInput
  }

  export type UserSuspensionUpdateToOneWithWhereWithoutTicketInput = {
    where?: UserSuspensionWhereInput
    data: XOR<UserSuspensionUpdateWithoutTicketInput, UserSuspensionUncheckedUpdateWithoutTicketInput>
  }

  export type UserSuspensionUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSuspensionUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    suspendedBy?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    suspendedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reinstatedBy?: NullableStringFieldUpdateOperationsInput | string | null
    evidence?: NullableJsonNullValueInput | InputJsonValue
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportTicketCreateWithoutMessagesInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutMessagesInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutMessagesInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutMessagesInput, SupportTicketUncheckedCreateWithoutMessagesInput>
  }

  export type SupportTicketUpsertWithoutMessagesInput = {
    update: XOR<SupportTicketUpdateWithoutMessagesInput, SupportTicketUncheckedUpdateWithoutMessagesInput>
    create: XOR<SupportTicketCreateWithoutMessagesInput, SupportTicketUncheckedCreateWithoutMessagesInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutMessagesInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutMessagesInput, SupportTicketUncheckedUpdateWithoutMessagesInput>
  }

  export type SupportTicketUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutRefundInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutRefundInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutRefundInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutRefundInput, SupportTicketUncheckedCreateWithoutRefundInput>
  }

  export type SupportTicketUpsertWithoutRefundInput = {
    update: XOR<SupportTicketUpdateWithoutRefundInput, SupportTicketUncheckedUpdateWithoutRefundInput>
    create: XOR<SupportTicketCreateWithoutRefundInput, SupportTicketUncheckedCreateWithoutRefundInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutRefundInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutRefundInput, SupportTicketUncheckedUpdateWithoutRefundInput>
  }

  export type SupportTicketUpdateWithoutRefundInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutRefundInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutChargebackInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutChargebackInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutChargebackInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutChargebackInput, SupportTicketUncheckedCreateWithoutChargebackInput>
  }

  export type SupportTicketUpsertWithoutChargebackInput = {
    update: XOR<SupportTicketUpdateWithoutChargebackInput, SupportTicketUncheckedUpdateWithoutChargebackInput>
    create: XOR<SupportTicketCreateWithoutChargebackInput, SupportTicketUncheckedCreateWithoutChargebackInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutChargebackInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutChargebackInput, SupportTicketUncheckedUpdateWithoutChargebackInput>
  }

  export type SupportTicketUpdateWithoutChargebackInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutChargebackInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutAppealInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutAppealInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutAppealInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutAppealInput, SupportTicketUncheckedCreateWithoutAppealInput>
  }

  export type SupportTicketUpsertWithoutAppealInput = {
    update: XOR<SupportTicketUpdateWithoutAppealInput, SupportTicketUncheckedUpdateWithoutAppealInput>
    create: XOR<SupportTicketCreateWithoutAppealInput, SupportTicketUncheckedCreateWithoutAppealInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutAppealInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutAppealInput, SupportTicketUncheckedUpdateWithoutAppealInput>
  }

  export type SupportTicketUpdateWithoutAppealInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutAppealInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutTakedownInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutTakedownInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutTakedownInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutTakedownInput, SupportTicketUncheckedCreateWithoutTakedownInput>
  }

  export type SupportTicketUpsertWithoutTakedownInput = {
    update: XOR<SupportTicketUpdateWithoutTakedownInput, SupportTicketUncheckedUpdateWithoutTakedownInput>
    create: XOR<SupportTicketCreateWithoutTakedownInput, SupportTicketUncheckedCreateWithoutTakedownInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutTakedownInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutTakedownInput, SupportTicketUncheckedUpdateWithoutTakedownInput>
  }

  export type SupportTicketUpdateWithoutTakedownInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutTakedownInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutDisputeInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutDisputeInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    suspension?: UserSuspensionUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutDisputeInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutDisputeInput, SupportTicketUncheckedCreateWithoutDisputeInput>
  }

  export type SupportTicketUpsertWithoutDisputeInput = {
    update: XOR<SupportTicketUpdateWithoutDisputeInput, SupportTicketUncheckedUpdateWithoutDisputeInput>
    create: XOR<SupportTicketCreateWithoutDisputeInput, SupportTicketUncheckedCreateWithoutDisputeInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutDisputeInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutDisputeInput, SupportTicketUncheckedUpdateWithoutDisputeInput>
  }

  export type SupportTicketUpdateWithoutDisputeInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutDisputeInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    suspension?: UserSuspensionUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketCreateWithoutSuspensionInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageCreateNestedManyWithoutTicketInput
    refund?: RefundCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackCreateNestedOneWithoutTicketInput
    appeal?: AppealCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketUncheckedCreateWithoutSuspensionInput = {
    id?: string
    userId: string
    orderId?: string | null
    ticketId?: string
    category: $Enums.SupportTicketCategory
    priority?: $Enums.SupportTicketPriority
    status?: $Enums.SupportTicketStatus
    subject: string
    description: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: string | null
    resolvedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: SupportMessageUncheckedCreateNestedManyWithoutTicketInput
    refund?: RefundUncheckedCreateNestedOneWithoutTicketInput
    chargeback?: ChargebackUncheckedCreateNestedOneWithoutTicketInput
    appeal?: AppealUncheckedCreateNestedOneWithoutTicketInput
    takedown?: ContentTakedownUncheckedCreateNestedOneWithoutTicketInput
    dispute?: PayoutDisputeUncheckedCreateNestedOneWithoutTicketInput
  }

  export type SupportTicketCreateOrConnectWithoutSuspensionInput = {
    where: SupportTicketWhereUniqueInput
    create: XOR<SupportTicketCreateWithoutSuspensionInput, SupportTicketUncheckedCreateWithoutSuspensionInput>
  }

  export type SupportTicketUpsertWithoutSuspensionInput = {
    update: XOR<SupportTicketUpdateWithoutSuspensionInput, SupportTicketUncheckedUpdateWithoutSuspensionInput>
    create: XOR<SupportTicketCreateWithoutSuspensionInput, SupportTicketUncheckedCreateWithoutSuspensionInput>
    where?: SupportTicketWhereInput
  }

  export type SupportTicketUpdateToOneWithWhereWithoutSuspensionInput = {
    where?: SupportTicketWhereInput
    data: XOR<SupportTicketUpdateWithoutSuspensionInput, SupportTicketUncheckedUpdateWithoutSuspensionInput>
  }

  export type SupportTicketUpdateWithoutSuspensionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUpdateManyWithoutTicketNestedInput
    refund?: RefundUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUpdateOneWithoutTicketNestedInput
    appeal?: AppealUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUpdateOneWithoutTicketNestedInput
  }

  export type SupportTicketUncheckedUpdateWithoutSuspensionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: NullableStringFieldUpdateOperationsInput | string | null
    ticketId?: StringFieldUpdateOperationsInput | string
    category?: EnumSupportTicketCategoryFieldUpdateOperationsInput | $Enums.SupportTicketCategory
    priority?: EnumSupportTicketPriorityFieldUpdateOperationsInput | $Enums.SupportTicketPriority
    status?: EnumSupportTicketStatusFieldUpdateOperationsInput | $Enums.SupportTicketStatus
    subject?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    assignedTo?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: SupportMessageUncheckedUpdateManyWithoutTicketNestedInput
    refund?: RefundUncheckedUpdateOneWithoutTicketNestedInput
    chargeback?: ChargebackUncheckedUpdateOneWithoutTicketNestedInput
    appeal?: AppealUncheckedUpdateOneWithoutTicketNestedInput
    takedown?: ContentTakedownUncheckedUpdateOneWithoutTicketNestedInput
    dispute?: PayoutDisputeUncheckedUpdateOneWithoutTicketNestedInput
  }

  export type SupportMessageCreateManyTicketInput = {
    id?: string
    senderId: string
    senderType: string
    message: string
    isInternal?: boolean
    createdAt?: Date | string
  }

  export type SupportMessageUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportMessageUncheckedUpdateWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupportMessageUncheckedUpdateManyWithoutTicketInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    senderType?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isInternal?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use SupportTicketCountOutputTypeDefaultArgs instead
     */
    export type SupportTicketCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SupportTicketCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SupportTicketDefaultArgs instead
     */
    export type SupportTicketArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SupportTicketDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SupportMessageDefaultArgs instead
     */
    export type SupportMessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SupportMessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RefundDefaultArgs instead
     */
    export type RefundArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RefundDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChargebackDefaultArgs instead
     */
    export type ChargebackArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChargebackDefaultArgs<ExtArgs>
    /**
     * @deprecated Use AppealDefaultArgs instead
     */
    export type AppealArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = AppealDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ContentTakedownDefaultArgs instead
     */
    export type ContentTakedownArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ContentTakedownDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PayoutDisputeDefaultArgs instead
     */
    export type PayoutDisputeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PayoutDisputeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserSuspensionDefaultArgs instead
     */
    export type UserSuspensionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserSuspensionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WebhookEventDefaultArgs instead
     */
    export type WebhookEventArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WebhookEventDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}