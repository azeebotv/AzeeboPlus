
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
 * Model CreatorProfile
 * 
 */
export type CreatorProfile = $Result.DefaultSelection<Prisma.$CreatorProfilePayload>
/**
 * Model CreatorEarning
 * 
 */
export type CreatorEarning = $Result.DefaultSelection<Prisma.$CreatorEarningPayload>
/**
 * Model Channel
 * 
 */
export type Channel = $Result.DefaultSelection<Prisma.$ChannelPayload>
/**
 * Model CreatorChallenge
 * 
 */
export type CreatorChallenge = $Result.DefaultSelection<Prisma.$CreatorChallengePayload>
/**
 * Model ChallengeEntry
 * 
 */
export type ChallengeEntry = $Result.DefaultSelection<Prisma.$ChallengeEntryPayload>
/**
 * Model PayoutRequest
 * 
 */
export type PayoutRequest = $Result.DefaultSelection<Prisma.$PayoutRequestPayload>
/**
 * Model Subscription
 * 
 */
export type Subscription = $Result.DefaultSelection<Prisma.$SubscriptionPayload>
/**
 * Model Tip
 * 
 */
export type Tip = $Result.DefaultSelection<Prisma.$TipPayload>
/**
 * Model VerificationDocument
 * 
 */
export type VerificationDocument = $Result.DefaultSelection<Prisma.$VerificationDocumentPayload>
/**
 * Model MediaUpload
 * 
 */
export type MediaUpload = $Result.DefaultSelection<Prisma.$MediaUploadPayload>
/**
 * Model ContentItem
 * 
 */
export type ContentItem = $Result.DefaultSelection<Prisma.$ContentItemPayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model Wallet
 * 
 */
export type Wallet = $Result.DefaultSelection<Prisma.$WalletPayload>
/**
 * Model WalletTransaction
 * 
 */
export type WalletTransaction = $Result.DefaultSelection<Prisma.$WalletTransactionPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more CreatorProfiles
 * const creatorProfiles = await prisma.creatorProfile.findMany()
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
   * // Fetch zero or more CreatorProfiles
   * const creatorProfiles = await prisma.creatorProfile.findMany()
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
   * `prisma.creatorProfile`: Exposes CRUD operations for the **CreatorProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CreatorProfiles
    * const creatorProfiles = await prisma.creatorProfile.findMany()
    * ```
    */
  get creatorProfile(): Prisma.CreatorProfileDelegate<ExtArgs>;

  /**
   * `prisma.creatorEarning`: Exposes CRUD operations for the **CreatorEarning** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CreatorEarnings
    * const creatorEarnings = await prisma.creatorEarning.findMany()
    * ```
    */
  get creatorEarning(): Prisma.CreatorEarningDelegate<ExtArgs>;

  /**
   * `prisma.channel`: Exposes CRUD operations for the **Channel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Channels
    * const channels = await prisma.channel.findMany()
    * ```
    */
  get channel(): Prisma.ChannelDelegate<ExtArgs>;

  /**
   * `prisma.creatorChallenge`: Exposes CRUD operations for the **CreatorChallenge** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CreatorChallenges
    * const creatorChallenges = await prisma.creatorChallenge.findMany()
    * ```
    */
  get creatorChallenge(): Prisma.CreatorChallengeDelegate<ExtArgs>;

  /**
   * `prisma.challengeEntry`: Exposes CRUD operations for the **ChallengeEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChallengeEntries
    * const challengeEntries = await prisma.challengeEntry.findMany()
    * ```
    */
  get challengeEntry(): Prisma.ChallengeEntryDelegate<ExtArgs>;

  /**
   * `prisma.payoutRequest`: Exposes CRUD operations for the **PayoutRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PayoutRequests
    * const payoutRequests = await prisma.payoutRequest.findMany()
    * ```
    */
  get payoutRequest(): Prisma.PayoutRequestDelegate<ExtArgs>;

  /**
   * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subscriptions
    * const subscriptions = await prisma.subscription.findMany()
    * ```
    */
  get subscription(): Prisma.SubscriptionDelegate<ExtArgs>;

  /**
   * `prisma.tip`: Exposes CRUD operations for the **Tip** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tips
    * const tips = await prisma.tip.findMany()
    * ```
    */
  get tip(): Prisma.TipDelegate<ExtArgs>;

  /**
   * `prisma.verificationDocument`: Exposes CRUD operations for the **VerificationDocument** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationDocuments
    * const verificationDocuments = await prisma.verificationDocument.findMany()
    * ```
    */
  get verificationDocument(): Prisma.VerificationDocumentDelegate<ExtArgs>;

  /**
   * `prisma.mediaUpload`: Exposes CRUD operations for the **MediaUpload** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MediaUploads
    * const mediaUploads = await prisma.mediaUpload.findMany()
    * ```
    */
  get mediaUpload(): Prisma.MediaUploadDelegate<ExtArgs>;

  /**
   * `prisma.contentItem`: Exposes CRUD operations for the **ContentItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContentItems
    * const contentItems = await prisma.contentItem.findMany()
    * ```
    */
  get contentItem(): Prisma.ContentItemDelegate<ExtArgs>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs>;

  /**
   * `prisma.wallet`: Exposes CRUD operations for the **Wallet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Wallets
    * const wallets = await prisma.wallet.findMany()
    * ```
    */
  get wallet(): Prisma.WalletDelegate<ExtArgs>;

  /**
   * `prisma.walletTransaction`: Exposes CRUD operations for the **WalletTransaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WalletTransactions
    * const walletTransactions = await prisma.walletTransaction.findMany()
    * ```
    */
  get walletTransaction(): Prisma.WalletTransactionDelegate<ExtArgs>;
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
    CreatorProfile: 'CreatorProfile',
    CreatorEarning: 'CreatorEarning',
    Channel: 'Channel',
    CreatorChallenge: 'CreatorChallenge',
    ChallengeEntry: 'ChallengeEntry',
    PayoutRequest: 'PayoutRequest',
    Subscription: 'Subscription',
    Tip: 'Tip',
    VerificationDocument: 'VerificationDocument',
    MediaUpload: 'MediaUpload',
    ContentItem: 'ContentItem',
    Notification: 'Notification',
    Wallet: 'Wallet',
    WalletTransaction: 'WalletTransaction'
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
      modelProps: "creatorProfile" | "creatorEarning" | "channel" | "creatorChallenge" | "challengeEntry" | "payoutRequest" | "subscription" | "tip" | "verificationDocument" | "mediaUpload" | "contentItem" | "notification" | "wallet" | "walletTransaction"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      CreatorProfile: {
        payload: Prisma.$CreatorProfilePayload<ExtArgs>
        fields: Prisma.CreatorProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CreatorProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CreatorProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          findFirst: {
            args: Prisma.CreatorProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CreatorProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          findMany: {
            args: Prisma.CreatorProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>[]
          }
          create: {
            args: Prisma.CreatorProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          createMany: {
            args: Prisma.CreatorProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CreatorProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>[]
          }
          delete: {
            args: Prisma.CreatorProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          update: {
            args: Prisma.CreatorProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          deleteMany: {
            args: Prisma.CreatorProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CreatorProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CreatorProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorProfilePayload>
          }
          aggregate: {
            args: Prisma.CreatorProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCreatorProfile>
          }
          groupBy: {
            args: Prisma.CreatorProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<CreatorProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.CreatorProfileCountArgs<ExtArgs>
            result: $Utils.Optional<CreatorProfileCountAggregateOutputType> | number
          }
        }
      }
      CreatorEarning: {
        payload: Prisma.$CreatorEarningPayload<ExtArgs>
        fields: Prisma.CreatorEarningFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CreatorEarningFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CreatorEarningFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          findFirst: {
            args: Prisma.CreatorEarningFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CreatorEarningFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          findMany: {
            args: Prisma.CreatorEarningFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>[]
          }
          create: {
            args: Prisma.CreatorEarningCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          createMany: {
            args: Prisma.CreatorEarningCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CreatorEarningCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>[]
          }
          delete: {
            args: Prisma.CreatorEarningDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          update: {
            args: Prisma.CreatorEarningUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          deleteMany: {
            args: Prisma.CreatorEarningDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CreatorEarningUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CreatorEarningUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorEarningPayload>
          }
          aggregate: {
            args: Prisma.CreatorEarningAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCreatorEarning>
          }
          groupBy: {
            args: Prisma.CreatorEarningGroupByArgs<ExtArgs>
            result: $Utils.Optional<CreatorEarningGroupByOutputType>[]
          }
          count: {
            args: Prisma.CreatorEarningCountArgs<ExtArgs>
            result: $Utils.Optional<CreatorEarningCountAggregateOutputType> | number
          }
        }
      }
      Channel: {
        payload: Prisma.$ChannelPayload<ExtArgs>
        fields: Prisma.ChannelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChannelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChannelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          findFirst: {
            args: Prisma.ChannelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChannelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          findMany: {
            args: Prisma.ChannelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>[]
          }
          create: {
            args: Prisma.ChannelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          createMany: {
            args: Prisma.ChannelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChannelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>[]
          }
          delete: {
            args: Prisma.ChannelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          update: {
            args: Prisma.ChannelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          deleteMany: {
            args: Prisma.ChannelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChannelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChannelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChannelPayload>
          }
          aggregate: {
            args: Prisma.ChannelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChannel>
          }
          groupBy: {
            args: Prisma.ChannelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChannelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChannelCountArgs<ExtArgs>
            result: $Utils.Optional<ChannelCountAggregateOutputType> | number
          }
        }
      }
      CreatorChallenge: {
        payload: Prisma.$CreatorChallengePayload<ExtArgs>
        fields: Prisma.CreatorChallengeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CreatorChallengeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CreatorChallengeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          findFirst: {
            args: Prisma.CreatorChallengeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CreatorChallengeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          findMany: {
            args: Prisma.CreatorChallengeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>[]
          }
          create: {
            args: Prisma.CreatorChallengeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          createMany: {
            args: Prisma.CreatorChallengeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CreatorChallengeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>[]
          }
          delete: {
            args: Prisma.CreatorChallengeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          update: {
            args: Prisma.CreatorChallengeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          deleteMany: {
            args: Prisma.CreatorChallengeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CreatorChallengeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CreatorChallengeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CreatorChallengePayload>
          }
          aggregate: {
            args: Prisma.CreatorChallengeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCreatorChallenge>
          }
          groupBy: {
            args: Prisma.CreatorChallengeGroupByArgs<ExtArgs>
            result: $Utils.Optional<CreatorChallengeGroupByOutputType>[]
          }
          count: {
            args: Prisma.CreatorChallengeCountArgs<ExtArgs>
            result: $Utils.Optional<CreatorChallengeCountAggregateOutputType> | number
          }
        }
      }
      ChallengeEntry: {
        payload: Prisma.$ChallengeEntryPayload<ExtArgs>
        fields: Prisma.ChallengeEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChallengeEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChallengeEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          findFirst: {
            args: Prisma.ChallengeEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChallengeEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          findMany: {
            args: Prisma.ChallengeEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>[]
          }
          create: {
            args: Prisma.ChallengeEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          createMany: {
            args: Prisma.ChallengeEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChallengeEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>[]
          }
          delete: {
            args: Prisma.ChallengeEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          update: {
            args: Prisma.ChallengeEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          deleteMany: {
            args: Prisma.ChallengeEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChallengeEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChallengeEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChallengeEntryPayload>
          }
          aggregate: {
            args: Prisma.ChallengeEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChallengeEntry>
          }
          groupBy: {
            args: Prisma.ChallengeEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChallengeEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChallengeEntryCountArgs<ExtArgs>
            result: $Utils.Optional<ChallengeEntryCountAggregateOutputType> | number
          }
        }
      }
      PayoutRequest: {
        payload: Prisma.$PayoutRequestPayload<ExtArgs>
        fields: Prisma.PayoutRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PayoutRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PayoutRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          findFirst: {
            args: Prisma.PayoutRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PayoutRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          findMany: {
            args: Prisma.PayoutRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>[]
          }
          create: {
            args: Prisma.PayoutRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          createMany: {
            args: Prisma.PayoutRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PayoutRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>[]
          }
          delete: {
            args: Prisma.PayoutRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          update: {
            args: Prisma.PayoutRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          deleteMany: {
            args: Prisma.PayoutRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PayoutRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PayoutRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutRequestPayload>
          }
          aggregate: {
            args: Prisma.PayoutRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayoutRequest>
          }
          groupBy: {
            args: Prisma.PayoutRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<PayoutRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.PayoutRequestCountArgs<ExtArgs>
            result: $Utils.Optional<PayoutRequestCountAggregateOutputType> | number
          }
        }
      }
      Subscription: {
        payload: Prisma.$SubscriptionPayload<ExtArgs>
        fields: Prisma.SubscriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findFirst: {
            args: Prisma.SubscriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findMany: {
            args: Prisma.SubscriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          create: {
            args: Prisma.SubscriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          createMany: {
            args: Prisma.SubscriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          delete: {
            args: Prisma.SubscriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          update: {
            args: Prisma.SubscriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          deleteMany: {
            args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SubscriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          aggregate: {
            args: Prisma.SubscriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubscription>
          }
          groupBy: {
            args: Prisma.SubscriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubscriptionCountArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionCountAggregateOutputType> | number
          }
        }
      }
      Tip: {
        payload: Prisma.$TipPayload<ExtArgs>
        fields: Prisma.TipFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TipFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TipFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          findFirst: {
            args: Prisma.TipFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TipFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          findMany: {
            args: Prisma.TipFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>[]
          }
          create: {
            args: Prisma.TipCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          createMany: {
            args: Prisma.TipCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TipCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>[]
          }
          delete: {
            args: Prisma.TipDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          update: {
            args: Prisma.TipUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          deleteMany: {
            args: Prisma.TipDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TipUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TipUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TipPayload>
          }
          aggregate: {
            args: Prisma.TipAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTip>
          }
          groupBy: {
            args: Prisma.TipGroupByArgs<ExtArgs>
            result: $Utils.Optional<TipGroupByOutputType>[]
          }
          count: {
            args: Prisma.TipCountArgs<ExtArgs>
            result: $Utils.Optional<TipCountAggregateOutputType> | number
          }
        }
      }
      VerificationDocument: {
        payload: Prisma.$VerificationDocumentPayload<ExtArgs>
        fields: Prisma.VerificationDocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationDocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationDocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          findFirst: {
            args: Prisma.VerificationDocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationDocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          findMany: {
            args: Prisma.VerificationDocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>[]
          }
          create: {
            args: Prisma.VerificationDocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          createMany: {
            args: Prisma.VerificationDocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationDocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>[]
          }
          delete: {
            args: Prisma.VerificationDocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          update: {
            args: Prisma.VerificationDocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          deleteMany: {
            args: Prisma.VerificationDocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationDocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VerificationDocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationDocumentPayload>
          }
          aggregate: {
            args: Prisma.VerificationDocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationDocument>
          }
          groupBy: {
            args: Prisma.VerificationDocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationDocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationDocumentCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationDocumentCountAggregateOutputType> | number
          }
        }
      }
      MediaUpload: {
        payload: Prisma.$MediaUploadPayload<ExtArgs>
        fields: Prisma.MediaUploadFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MediaUploadFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MediaUploadFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          findFirst: {
            args: Prisma.MediaUploadFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MediaUploadFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          findMany: {
            args: Prisma.MediaUploadFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>[]
          }
          create: {
            args: Prisma.MediaUploadCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          createMany: {
            args: Prisma.MediaUploadCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MediaUploadCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>[]
          }
          delete: {
            args: Prisma.MediaUploadDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          update: {
            args: Prisma.MediaUploadUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          deleteMany: {
            args: Prisma.MediaUploadDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MediaUploadUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MediaUploadUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MediaUploadPayload>
          }
          aggregate: {
            args: Prisma.MediaUploadAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMediaUpload>
          }
          groupBy: {
            args: Prisma.MediaUploadGroupByArgs<ExtArgs>
            result: $Utils.Optional<MediaUploadGroupByOutputType>[]
          }
          count: {
            args: Prisma.MediaUploadCountArgs<ExtArgs>
            result: $Utils.Optional<MediaUploadCountAggregateOutputType> | number
          }
        }
      }
      ContentItem: {
        payload: Prisma.$ContentItemPayload<ExtArgs>
        fields: Prisma.ContentItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContentItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContentItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          findFirst: {
            args: Prisma.ContentItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContentItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          findMany: {
            args: Prisma.ContentItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>[]
          }
          create: {
            args: Prisma.ContentItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          createMany: {
            args: Prisma.ContentItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContentItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>[]
          }
          delete: {
            args: Prisma.ContentItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          update: {
            args: Prisma.ContentItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          deleteMany: {
            args: Prisma.ContentItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContentItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ContentItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContentItemPayload>
          }
          aggregate: {
            args: Prisma.ContentItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContentItem>
          }
          groupBy: {
            args: Prisma.ContentItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContentItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContentItemCountArgs<ExtArgs>
            result: $Utils.Optional<ContentItemCountAggregateOutputType> | number
          }
        }
      }
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
      Wallet: {
        payload: Prisma.$WalletPayload<ExtArgs>
        fields: Prisma.WalletFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findFirst: {
            args: Prisma.WalletFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findMany: {
            args: Prisma.WalletFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          create: {
            args: Prisma.WalletCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          createMany: {
            args: Prisma.WalletCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          delete: {
            args: Prisma.WalletDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          update: {
            args: Prisma.WalletUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          deleteMany: {
            args: Prisma.WalletDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WalletUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          aggregate: {
            args: Prisma.WalletAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWallet>
          }
          groupBy: {
            args: Prisma.WalletGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletCountArgs<ExtArgs>
            result: $Utils.Optional<WalletCountAggregateOutputType> | number
          }
        }
      }
      WalletTransaction: {
        payload: Prisma.$WalletTransactionPayload<ExtArgs>
        fields: Prisma.WalletTransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletTransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletTransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          findFirst: {
            args: Prisma.WalletTransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletTransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          findMany: {
            args: Prisma.WalletTransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>[]
          }
          create: {
            args: Prisma.WalletTransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          createMany: {
            args: Prisma.WalletTransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletTransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>[]
          }
          delete: {
            args: Prisma.WalletTransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          update: {
            args: Prisma.WalletTransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          deleteMany: {
            args: Prisma.WalletTransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletTransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WalletTransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletTransactionPayload>
          }
          aggregate: {
            args: Prisma.WalletTransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWalletTransaction>
          }
          groupBy: {
            args: Prisma.WalletTransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletTransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletTransactionCountArgs<ExtArgs>
            result: $Utils.Optional<WalletTransactionCountAggregateOutputType> | number
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
   * Count Type CreatorProfileCountOutputType
   */

  export type CreatorProfileCountOutputType = {
    earnings: number
    subscriptions: number
    channels: number
    challenges: number
    payoutRequests: number
  }

  export type CreatorProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    earnings?: boolean | CreatorProfileCountOutputTypeCountEarningsArgs
    subscriptions?: boolean | CreatorProfileCountOutputTypeCountSubscriptionsArgs
    channels?: boolean | CreatorProfileCountOutputTypeCountChannelsArgs
    challenges?: boolean | CreatorProfileCountOutputTypeCountChallengesArgs
    payoutRequests?: boolean | CreatorProfileCountOutputTypeCountPayoutRequestsArgs
  }

  // Custom InputTypes
  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfileCountOutputType
     */
    select?: CreatorProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeCountEarningsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreatorEarningWhereInput
  }

  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeCountSubscriptionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriptionWhereInput
  }

  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeCountChannelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelWhereInput
  }

  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeCountChallengesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreatorChallengeWhereInput
  }

  /**
   * CreatorProfileCountOutputType without action
   */
  export type CreatorProfileCountOutputTypeCountPayoutRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutRequestWhereInput
  }


  /**
   * Count Type CreatorChallengeCountOutputType
   */

  export type CreatorChallengeCountOutputType = {
    entries: number
  }

  export type CreatorChallengeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    entries?: boolean | CreatorChallengeCountOutputTypeCountEntriesArgs
  }

  // Custom InputTypes
  /**
   * CreatorChallengeCountOutputType without action
   */
  export type CreatorChallengeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallengeCountOutputType
     */
    select?: CreatorChallengeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CreatorChallengeCountOutputType without action
   */
  export type CreatorChallengeCountOutputTypeCountEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChallengeEntryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model CreatorProfile
   */

  export type AggregateCreatorProfile = {
    _count: CreatorProfileCountAggregateOutputType | null
    _min: CreatorProfileMinAggregateOutputType | null
    _max: CreatorProfileMaxAggregateOutputType | null
  }

  export type CreatorProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    displayName: string | null
    avatar: string | null
    bio: string | null
    banner: string | null
    verified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CreatorProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    displayName: string | null
    avatar: string | null
    bio: string | null
    banner: string | null
    verified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CreatorProfileCountAggregateOutputType = {
    id: number
    userId: number
    displayName: number
    avatar: number
    bio: number
    banner: number
    socialLinks: number
    verified: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CreatorProfileMinAggregateInputType = {
    id?: true
    userId?: true
    displayName?: true
    avatar?: true
    bio?: true
    banner?: true
    verified?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CreatorProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    displayName?: true
    avatar?: true
    bio?: true
    banner?: true
    verified?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CreatorProfileCountAggregateInputType = {
    id?: true
    userId?: true
    displayName?: true
    avatar?: true
    bio?: true
    banner?: true
    socialLinks?: true
    verified?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CreatorProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorProfile to aggregate.
     */
    where?: CreatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorProfiles to fetch.
     */
    orderBy?: CreatorProfileOrderByWithRelationInput | CreatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CreatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CreatorProfiles
    **/
    _count?: true | CreatorProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CreatorProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CreatorProfileMaxAggregateInputType
  }

  export type GetCreatorProfileAggregateType<T extends CreatorProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateCreatorProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCreatorProfile[P]>
      : GetScalarType<T[P], AggregateCreatorProfile[P]>
  }




  export type CreatorProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreatorProfileWhereInput
    orderBy?: CreatorProfileOrderByWithAggregationInput | CreatorProfileOrderByWithAggregationInput[]
    by: CreatorProfileScalarFieldEnum[] | CreatorProfileScalarFieldEnum
    having?: CreatorProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CreatorProfileCountAggregateInputType | true
    _min?: CreatorProfileMinAggregateInputType
    _max?: CreatorProfileMaxAggregateInputType
  }

  export type CreatorProfileGroupByOutputType = {
    id: string
    userId: string
    displayName: string | null
    avatar: string | null
    bio: string | null
    banner: string | null
    socialLinks: JsonValue | null
    verified: boolean
    createdAt: Date
    updatedAt: Date
    _count: CreatorProfileCountAggregateOutputType | null
    _min: CreatorProfileMinAggregateOutputType | null
    _max: CreatorProfileMaxAggregateOutputType | null
  }

  type GetCreatorProfileGroupByPayload<T extends CreatorProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CreatorProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CreatorProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CreatorProfileGroupByOutputType[P]>
            : GetScalarType<T[P], CreatorProfileGroupByOutputType[P]>
        }
      >
    >


  export type CreatorProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    displayName?: boolean
    avatar?: boolean
    bio?: boolean
    banner?: boolean
    socialLinks?: boolean
    verified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    earnings?: boolean | CreatorProfile$earningsArgs<ExtArgs>
    subscriptions?: boolean | CreatorProfile$subscriptionsArgs<ExtArgs>
    channels?: boolean | CreatorProfile$channelsArgs<ExtArgs>
    challenges?: boolean | CreatorProfile$challengesArgs<ExtArgs>
    payoutRequests?: boolean | CreatorProfile$payoutRequestsArgs<ExtArgs>
    _count?: boolean | CreatorProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creatorProfile"]>

  export type CreatorProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    displayName?: boolean
    avatar?: boolean
    bio?: boolean
    banner?: boolean
    socialLinks?: boolean
    verified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["creatorProfile"]>

  export type CreatorProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    displayName?: boolean
    avatar?: boolean
    bio?: boolean
    banner?: boolean
    socialLinks?: boolean
    verified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CreatorProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    earnings?: boolean | CreatorProfile$earningsArgs<ExtArgs>
    subscriptions?: boolean | CreatorProfile$subscriptionsArgs<ExtArgs>
    channels?: boolean | CreatorProfile$channelsArgs<ExtArgs>
    challenges?: boolean | CreatorProfile$challengesArgs<ExtArgs>
    payoutRequests?: boolean | CreatorProfile$payoutRequestsArgs<ExtArgs>
    _count?: boolean | CreatorProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CreatorProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CreatorProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CreatorProfile"
    objects: {
      earnings: Prisma.$CreatorEarningPayload<ExtArgs>[]
      subscriptions: Prisma.$SubscriptionPayload<ExtArgs>[]
      channels: Prisma.$ChannelPayload<ExtArgs>[]
      challenges: Prisma.$CreatorChallengePayload<ExtArgs>[]
      payoutRequests: Prisma.$PayoutRequestPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      displayName: string | null
      avatar: string | null
      bio: string | null
      banner: string | null
      socialLinks: Prisma.JsonValue | null
      verified: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["creatorProfile"]>
    composites: {}
  }

  type CreatorProfileGetPayload<S extends boolean | null | undefined | CreatorProfileDefaultArgs> = $Result.GetResult<Prisma.$CreatorProfilePayload, S>

  type CreatorProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CreatorProfileFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CreatorProfileCountAggregateInputType | true
    }

  export interface CreatorProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CreatorProfile'], meta: { name: 'CreatorProfile' } }
    /**
     * Find zero or one CreatorProfile that matches the filter.
     * @param {CreatorProfileFindUniqueArgs} args - Arguments to find a CreatorProfile
     * @example
     * // Get one CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CreatorProfileFindUniqueArgs>(args: SelectSubset<T, CreatorProfileFindUniqueArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CreatorProfile that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CreatorProfileFindUniqueOrThrowArgs} args - Arguments to find a CreatorProfile
     * @example
     * // Get one CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CreatorProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, CreatorProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CreatorProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileFindFirstArgs} args - Arguments to find a CreatorProfile
     * @example
     * // Get one CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CreatorProfileFindFirstArgs>(args?: SelectSubset<T, CreatorProfileFindFirstArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CreatorProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileFindFirstOrThrowArgs} args - Arguments to find a CreatorProfile
     * @example
     * // Get one CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CreatorProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, CreatorProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CreatorProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CreatorProfiles
     * const creatorProfiles = await prisma.creatorProfile.findMany()
     * 
     * // Get first 10 CreatorProfiles
     * const creatorProfiles = await prisma.creatorProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const creatorProfileWithIdOnly = await prisma.creatorProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CreatorProfileFindManyArgs>(args?: SelectSubset<T, CreatorProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CreatorProfile.
     * @param {CreatorProfileCreateArgs} args - Arguments to create a CreatorProfile.
     * @example
     * // Create one CreatorProfile
     * const CreatorProfile = await prisma.creatorProfile.create({
     *   data: {
     *     // ... data to create a CreatorProfile
     *   }
     * })
     * 
     */
    create<T extends CreatorProfileCreateArgs>(args: SelectSubset<T, CreatorProfileCreateArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CreatorProfiles.
     * @param {CreatorProfileCreateManyArgs} args - Arguments to create many CreatorProfiles.
     * @example
     * // Create many CreatorProfiles
     * const creatorProfile = await prisma.creatorProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CreatorProfileCreateManyArgs>(args?: SelectSubset<T, CreatorProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CreatorProfiles and returns the data saved in the database.
     * @param {CreatorProfileCreateManyAndReturnArgs} args - Arguments to create many CreatorProfiles.
     * @example
     * // Create many CreatorProfiles
     * const creatorProfile = await prisma.creatorProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CreatorProfiles and only return the `id`
     * const creatorProfileWithIdOnly = await prisma.creatorProfile.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CreatorProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, CreatorProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CreatorProfile.
     * @param {CreatorProfileDeleteArgs} args - Arguments to delete one CreatorProfile.
     * @example
     * // Delete one CreatorProfile
     * const CreatorProfile = await prisma.creatorProfile.delete({
     *   where: {
     *     // ... filter to delete one CreatorProfile
     *   }
     * })
     * 
     */
    delete<T extends CreatorProfileDeleteArgs>(args: SelectSubset<T, CreatorProfileDeleteArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CreatorProfile.
     * @param {CreatorProfileUpdateArgs} args - Arguments to update one CreatorProfile.
     * @example
     * // Update one CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CreatorProfileUpdateArgs>(args: SelectSubset<T, CreatorProfileUpdateArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CreatorProfiles.
     * @param {CreatorProfileDeleteManyArgs} args - Arguments to filter CreatorProfiles to delete.
     * @example
     * // Delete a few CreatorProfiles
     * const { count } = await prisma.creatorProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CreatorProfileDeleteManyArgs>(args?: SelectSubset<T, CreatorProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CreatorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CreatorProfiles
     * const creatorProfile = await prisma.creatorProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CreatorProfileUpdateManyArgs>(args: SelectSubset<T, CreatorProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CreatorProfile.
     * @param {CreatorProfileUpsertArgs} args - Arguments to update or create a CreatorProfile.
     * @example
     * // Update or create a CreatorProfile
     * const creatorProfile = await prisma.creatorProfile.upsert({
     *   create: {
     *     // ... data to create a CreatorProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CreatorProfile we want to update
     *   }
     * })
     */
    upsert<T extends CreatorProfileUpsertArgs>(args: SelectSubset<T, CreatorProfileUpsertArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CreatorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileCountArgs} args - Arguments to filter CreatorProfiles to count.
     * @example
     * // Count the number of CreatorProfiles
     * const count = await prisma.creatorProfile.count({
     *   where: {
     *     // ... the filter for the CreatorProfiles we want to count
     *   }
     * })
    **/
    count<T extends CreatorProfileCountArgs>(
      args?: Subset<T, CreatorProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CreatorProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CreatorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CreatorProfileAggregateArgs>(args: Subset<T, CreatorProfileAggregateArgs>): Prisma.PrismaPromise<GetCreatorProfileAggregateType<T>>

    /**
     * Group by CreatorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorProfileGroupByArgs} args - Group by arguments.
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
      T extends CreatorProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CreatorProfileGroupByArgs['orderBy'] }
        : { orderBy?: CreatorProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CreatorProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCreatorProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CreatorProfile model
   */
  readonly fields: CreatorProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CreatorProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CreatorProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    earnings<T extends CreatorProfile$earningsArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfile$earningsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findMany"> | Null>
    subscriptions<T extends CreatorProfile$subscriptionsArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfile$subscriptionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany"> | Null>
    channels<T extends CreatorProfile$channelsArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfile$channelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findMany"> | Null>
    challenges<T extends CreatorProfile$challengesArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfile$challengesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findMany"> | Null>
    payoutRequests<T extends CreatorProfile$payoutRequestsArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfile$payoutRequestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the CreatorProfile model
   */ 
  interface CreatorProfileFieldRefs {
    readonly id: FieldRef<"CreatorProfile", 'String'>
    readonly userId: FieldRef<"CreatorProfile", 'String'>
    readonly displayName: FieldRef<"CreatorProfile", 'String'>
    readonly avatar: FieldRef<"CreatorProfile", 'String'>
    readonly bio: FieldRef<"CreatorProfile", 'String'>
    readonly banner: FieldRef<"CreatorProfile", 'String'>
    readonly socialLinks: FieldRef<"CreatorProfile", 'Json'>
    readonly verified: FieldRef<"CreatorProfile", 'Boolean'>
    readonly createdAt: FieldRef<"CreatorProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"CreatorProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CreatorProfile findUnique
   */
  export type CreatorProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CreatorProfile to fetch.
     */
    where: CreatorProfileWhereUniqueInput
  }

  /**
   * CreatorProfile findUniqueOrThrow
   */
  export type CreatorProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CreatorProfile to fetch.
     */
    where: CreatorProfileWhereUniqueInput
  }

  /**
   * CreatorProfile findFirst
   */
  export type CreatorProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CreatorProfile to fetch.
     */
    where?: CreatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorProfiles to fetch.
     */
    orderBy?: CreatorProfileOrderByWithRelationInput | CreatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorProfiles.
     */
    cursor?: CreatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorProfiles.
     */
    distinct?: CreatorProfileScalarFieldEnum | CreatorProfileScalarFieldEnum[]
  }

  /**
   * CreatorProfile findFirstOrThrow
   */
  export type CreatorProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CreatorProfile to fetch.
     */
    where?: CreatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorProfiles to fetch.
     */
    orderBy?: CreatorProfileOrderByWithRelationInput | CreatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorProfiles.
     */
    cursor?: CreatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorProfiles.
     */
    distinct?: CreatorProfileScalarFieldEnum | CreatorProfileScalarFieldEnum[]
  }

  /**
   * CreatorProfile findMany
   */
  export type CreatorProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CreatorProfiles to fetch.
     */
    where?: CreatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorProfiles to fetch.
     */
    orderBy?: CreatorProfileOrderByWithRelationInput | CreatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CreatorProfiles.
     */
    cursor?: CreatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorProfiles.
     */
    skip?: number
    distinct?: CreatorProfileScalarFieldEnum | CreatorProfileScalarFieldEnum[]
  }

  /**
   * CreatorProfile create
   */
  export type CreatorProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a CreatorProfile.
     */
    data: XOR<CreatorProfileCreateInput, CreatorProfileUncheckedCreateInput>
  }

  /**
   * CreatorProfile createMany
   */
  export type CreatorProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CreatorProfiles.
     */
    data: CreatorProfileCreateManyInput | CreatorProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CreatorProfile createManyAndReturn
   */
  export type CreatorProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CreatorProfiles.
     */
    data: CreatorProfileCreateManyInput | CreatorProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CreatorProfile update
   */
  export type CreatorProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a CreatorProfile.
     */
    data: XOR<CreatorProfileUpdateInput, CreatorProfileUncheckedUpdateInput>
    /**
     * Choose, which CreatorProfile to update.
     */
    where: CreatorProfileWhereUniqueInput
  }

  /**
   * CreatorProfile updateMany
   */
  export type CreatorProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CreatorProfiles.
     */
    data: XOR<CreatorProfileUpdateManyMutationInput, CreatorProfileUncheckedUpdateManyInput>
    /**
     * Filter which CreatorProfiles to update
     */
    where?: CreatorProfileWhereInput
  }

  /**
   * CreatorProfile upsert
   */
  export type CreatorProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the CreatorProfile to update in case it exists.
     */
    where: CreatorProfileWhereUniqueInput
    /**
     * In case the CreatorProfile found by the `where` argument doesn't exist, create a new CreatorProfile with this data.
     */
    create: XOR<CreatorProfileCreateInput, CreatorProfileUncheckedCreateInput>
    /**
     * In case the CreatorProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CreatorProfileUpdateInput, CreatorProfileUncheckedUpdateInput>
  }

  /**
   * CreatorProfile delete
   */
  export type CreatorProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
    /**
     * Filter which CreatorProfile to delete.
     */
    where: CreatorProfileWhereUniqueInput
  }

  /**
   * CreatorProfile deleteMany
   */
  export type CreatorProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorProfiles to delete
     */
    where?: CreatorProfileWhereInput
  }

  /**
   * CreatorProfile.earnings
   */
  export type CreatorProfile$earningsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    where?: CreatorEarningWhereInput
    orderBy?: CreatorEarningOrderByWithRelationInput | CreatorEarningOrderByWithRelationInput[]
    cursor?: CreatorEarningWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CreatorEarningScalarFieldEnum | CreatorEarningScalarFieldEnum[]
  }

  /**
   * CreatorProfile.subscriptions
   */
  export type CreatorProfile$subscriptionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    where?: SubscriptionWhereInput
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    cursor?: SubscriptionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * CreatorProfile.channels
   */
  export type CreatorProfile$channelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    where?: ChannelWhereInput
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    cursor?: ChannelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * CreatorProfile.challenges
   */
  export type CreatorProfile$challengesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    where?: CreatorChallengeWhereInput
    orderBy?: CreatorChallengeOrderByWithRelationInput | CreatorChallengeOrderByWithRelationInput[]
    cursor?: CreatorChallengeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CreatorChallengeScalarFieldEnum | CreatorChallengeScalarFieldEnum[]
  }

  /**
   * CreatorProfile.payoutRequests
   */
  export type CreatorProfile$payoutRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    where?: PayoutRequestWhereInput
    orderBy?: PayoutRequestOrderByWithRelationInput | PayoutRequestOrderByWithRelationInput[]
    cursor?: PayoutRequestWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PayoutRequestScalarFieldEnum | PayoutRequestScalarFieldEnum[]
  }

  /**
   * CreatorProfile without action
   */
  export type CreatorProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorProfile
     */
    select?: CreatorProfileSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorProfileInclude<ExtArgs> | null
  }


  /**
   * Model CreatorEarning
   */

  export type AggregateCreatorEarning = {
    _count: CreatorEarningCountAggregateOutputType | null
    _avg: CreatorEarningAvgAggregateOutputType | null
    _sum: CreatorEarningSumAggregateOutputType | null
    _min: CreatorEarningMinAggregateOutputType | null
    _max: CreatorEarningMaxAggregateOutputType | null
  }

  export type CreatorEarningAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type CreatorEarningSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type CreatorEarningMinAggregateOutputType = {
    id: string | null
    creatorId: string | null
    amount: Decimal | null
    type: string | null
    referenceId: string | null
    status: string | null
    paidAt: Date | null
    createdAt: Date | null
  }

  export type CreatorEarningMaxAggregateOutputType = {
    id: string | null
    creatorId: string | null
    amount: Decimal | null
    type: string | null
    referenceId: string | null
    status: string | null
    paidAt: Date | null
    createdAt: Date | null
  }

  export type CreatorEarningCountAggregateOutputType = {
    id: number
    creatorId: number
    amount: number
    type: number
    referenceId: number
    status: number
    paidAt: number
    createdAt: number
    _all: number
  }


  export type CreatorEarningAvgAggregateInputType = {
    amount?: true
  }

  export type CreatorEarningSumAggregateInputType = {
    amount?: true
  }

  export type CreatorEarningMinAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    type?: true
    referenceId?: true
    status?: true
    paidAt?: true
    createdAt?: true
  }

  export type CreatorEarningMaxAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    type?: true
    referenceId?: true
    status?: true
    paidAt?: true
    createdAt?: true
  }

  export type CreatorEarningCountAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    type?: true
    referenceId?: true
    status?: true
    paidAt?: true
    createdAt?: true
    _all?: true
  }

  export type CreatorEarningAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorEarning to aggregate.
     */
    where?: CreatorEarningWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorEarnings to fetch.
     */
    orderBy?: CreatorEarningOrderByWithRelationInput | CreatorEarningOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CreatorEarningWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorEarnings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorEarnings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CreatorEarnings
    **/
    _count?: true | CreatorEarningCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CreatorEarningAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CreatorEarningSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CreatorEarningMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CreatorEarningMaxAggregateInputType
  }

  export type GetCreatorEarningAggregateType<T extends CreatorEarningAggregateArgs> = {
        [P in keyof T & keyof AggregateCreatorEarning]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCreatorEarning[P]>
      : GetScalarType<T[P], AggregateCreatorEarning[P]>
  }




  export type CreatorEarningGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreatorEarningWhereInput
    orderBy?: CreatorEarningOrderByWithAggregationInput | CreatorEarningOrderByWithAggregationInput[]
    by: CreatorEarningScalarFieldEnum[] | CreatorEarningScalarFieldEnum
    having?: CreatorEarningScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CreatorEarningCountAggregateInputType | true
    _avg?: CreatorEarningAvgAggregateInputType
    _sum?: CreatorEarningSumAggregateInputType
    _min?: CreatorEarningMinAggregateInputType
    _max?: CreatorEarningMaxAggregateInputType
  }

  export type CreatorEarningGroupByOutputType = {
    id: string
    creatorId: string
    amount: Decimal
    type: string
    referenceId: string | null
    status: string
    paidAt: Date | null
    createdAt: Date
    _count: CreatorEarningCountAggregateOutputType | null
    _avg: CreatorEarningAvgAggregateOutputType | null
    _sum: CreatorEarningSumAggregateOutputType | null
    _min: CreatorEarningMinAggregateOutputType | null
    _max: CreatorEarningMaxAggregateOutputType | null
  }

  type GetCreatorEarningGroupByPayload<T extends CreatorEarningGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CreatorEarningGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CreatorEarningGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CreatorEarningGroupByOutputType[P]>
            : GetScalarType<T[P], CreatorEarningGroupByOutputType[P]>
        }
      >
    >


  export type CreatorEarningSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    type?: boolean
    referenceId?: boolean
    status?: boolean
    paidAt?: boolean
    createdAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creatorEarning"]>

  export type CreatorEarningSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    type?: boolean
    referenceId?: boolean
    status?: boolean
    paidAt?: boolean
    createdAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creatorEarning"]>

  export type CreatorEarningSelectScalar = {
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    type?: boolean
    referenceId?: boolean
    status?: boolean
    paidAt?: boolean
    createdAt?: boolean
  }

  export type CreatorEarningInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }
  export type CreatorEarningIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }

  export type $CreatorEarningPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CreatorEarning"
    objects: {
      creator: Prisma.$CreatorProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      creatorId: string
      amount: Prisma.Decimal
      type: string
      referenceId: string | null
      status: string
      paidAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["creatorEarning"]>
    composites: {}
  }

  type CreatorEarningGetPayload<S extends boolean | null | undefined | CreatorEarningDefaultArgs> = $Result.GetResult<Prisma.$CreatorEarningPayload, S>

  type CreatorEarningCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CreatorEarningFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CreatorEarningCountAggregateInputType | true
    }

  export interface CreatorEarningDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CreatorEarning'], meta: { name: 'CreatorEarning' } }
    /**
     * Find zero or one CreatorEarning that matches the filter.
     * @param {CreatorEarningFindUniqueArgs} args - Arguments to find a CreatorEarning
     * @example
     * // Get one CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CreatorEarningFindUniqueArgs>(args: SelectSubset<T, CreatorEarningFindUniqueArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CreatorEarning that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CreatorEarningFindUniqueOrThrowArgs} args - Arguments to find a CreatorEarning
     * @example
     * // Get one CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CreatorEarningFindUniqueOrThrowArgs>(args: SelectSubset<T, CreatorEarningFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CreatorEarning that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningFindFirstArgs} args - Arguments to find a CreatorEarning
     * @example
     * // Get one CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CreatorEarningFindFirstArgs>(args?: SelectSubset<T, CreatorEarningFindFirstArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CreatorEarning that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningFindFirstOrThrowArgs} args - Arguments to find a CreatorEarning
     * @example
     * // Get one CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CreatorEarningFindFirstOrThrowArgs>(args?: SelectSubset<T, CreatorEarningFindFirstOrThrowArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CreatorEarnings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CreatorEarnings
     * const creatorEarnings = await prisma.creatorEarning.findMany()
     * 
     * // Get first 10 CreatorEarnings
     * const creatorEarnings = await prisma.creatorEarning.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const creatorEarningWithIdOnly = await prisma.creatorEarning.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CreatorEarningFindManyArgs>(args?: SelectSubset<T, CreatorEarningFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CreatorEarning.
     * @param {CreatorEarningCreateArgs} args - Arguments to create a CreatorEarning.
     * @example
     * // Create one CreatorEarning
     * const CreatorEarning = await prisma.creatorEarning.create({
     *   data: {
     *     // ... data to create a CreatorEarning
     *   }
     * })
     * 
     */
    create<T extends CreatorEarningCreateArgs>(args: SelectSubset<T, CreatorEarningCreateArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CreatorEarnings.
     * @param {CreatorEarningCreateManyArgs} args - Arguments to create many CreatorEarnings.
     * @example
     * // Create many CreatorEarnings
     * const creatorEarning = await prisma.creatorEarning.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CreatorEarningCreateManyArgs>(args?: SelectSubset<T, CreatorEarningCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CreatorEarnings and returns the data saved in the database.
     * @param {CreatorEarningCreateManyAndReturnArgs} args - Arguments to create many CreatorEarnings.
     * @example
     * // Create many CreatorEarnings
     * const creatorEarning = await prisma.creatorEarning.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CreatorEarnings and only return the `id`
     * const creatorEarningWithIdOnly = await prisma.creatorEarning.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CreatorEarningCreateManyAndReturnArgs>(args?: SelectSubset<T, CreatorEarningCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CreatorEarning.
     * @param {CreatorEarningDeleteArgs} args - Arguments to delete one CreatorEarning.
     * @example
     * // Delete one CreatorEarning
     * const CreatorEarning = await prisma.creatorEarning.delete({
     *   where: {
     *     // ... filter to delete one CreatorEarning
     *   }
     * })
     * 
     */
    delete<T extends CreatorEarningDeleteArgs>(args: SelectSubset<T, CreatorEarningDeleteArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CreatorEarning.
     * @param {CreatorEarningUpdateArgs} args - Arguments to update one CreatorEarning.
     * @example
     * // Update one CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CreatorEarningUpdateArgs>(args: SelectSubset<T, CreatorEarningUpdateArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CreatorEarnings.
     * @param {CreatorEarningDeleteManyArgs} args - Arguments to filter CreatorEarnings to delete.
     * @example
     * // Delete a few CreatorEarnings
     * const { count } = await prisma.creatorEarning.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CreatorEarningDeleteManyArgs>(args?: SelectSubset<T, CreatorEarningDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CreatorEarnings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CreatorEarnings
     * const creatorEarning = await prisma.creatorEarning.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CreatorEarningUpdateManyArgs>(args: SelectSubset<T, CreatorEarningUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CreatorEarning.
     * @param {CreatorEarningUpsertArgs} args - Arguments to update or create a CreatorEarning.
     * @example
     * // Update or create a CreatorEarning
     * const creatorEarning = await prisma.creatorEarning.upsert({
     *   create: {
     *     // ... data to create a CreatorEarning
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CreatorEarning we want to update
     *   }
     * })
     */
    upsert<T extends CreatorEarningUpsertArgs>(args: SelectSubset<T, CreatorEarningUpsertArgs<ExtArgs>>): Prisma__CreatorEarningClient<$Result.GetResult<Prisma.$CreatorEarningPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CreatorEarnings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningCountArgs} args - Arguments to filter CreatorEarnings to count.
     * @example
     * // Count the number of CreatorEarnings
     * const count = await prisma.creatorEarning.count({
     *   where: {
     *     // ... the filter for the CreatorEarnings we want to count
     *   }
     * })
    **/
    count<T extends CreatorEarningCountArgs>(
      args?: Subset<T, CreatorEarningCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CreatorEarningCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CreatorEarning.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CreatorEarningAggregateArgs>(args: Subset<T, CreatorEarningAggregateArgs>): Prisma.PrismaPromise<GetCreatorEarningAggregateType<T>>

    /**
     * Group by CreatorEarning.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorEarningGroupByArgs} args - Group by arguments.
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
      T extends CreatorEarningGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CreatorEarningGroupByArgs['orderBy'] }
        : { orderBy?: CreatorEarningGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CreatorEarningGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCreatorEarningGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CreatorEarning model
   */
  readonly fields: CreatorEarningFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CreatorEarning.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CreatorEarningClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends CreatorProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfileDefaultArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the CreatorEarning model
   */ 
  interface CreatorEarningFieldRefs {
    readonly id: FieldRef<"CreatorEarning", 'String'>
    readonly creatorId: FieldRef<"CreatorEarning", 'String'>
    readonly amount: FieldRef<"CreatorEarning", 'Decimal'>
    readonly type: FieldRef<"CreatorEarning", 'String'>
    readonly referenceId: FieldRef<"CreatorEarning", 'String'>
    readonly status: FieldRef<"CreatorEarning", 'String'>
    readonly paidAt: FieldRef<"CreatorEarning", 'DateTime'>
    readonly createdAt: FieldRef<"CreatorEarning", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CreatorEarning findUnique
   */
  export type CreatorEarningFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter, which CreatorEarning to fetch.
     */
    where: CreatorEarningWhereUniqueInput
  }

  /**
   * CreatorEarning findUniqueOrThrow
   */
  export type CreatorEarningFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter, which CreatorEarning to fetch.
     */
    where: CreatorEarningWhereUniqueInput
  }

  /**
   * CreatorEarning findFirst
   */
  export type CreatorEarningFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter, which CreatorEarning to fetch.
     */
    where?: CreatorEarningWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorEarnings to fetch.
     */
    orderBy?: CreatorEarningOrderByWithRelationInput | CreatorEarningOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorEarnings.
     */
    cursor?: CreatorEarningWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorEarnings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorEarnings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorEarnings.
     */
    distinct?: CreatorEarningScalarFieldEnum | CreatorEarningScalarFieldEnum[]
  }

  /**
   * CreatorEarning findFirstOrThrow
   */
  export type CreatorEarningFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter, which CreatorEarning to fetch.
     */
    where?: CreatorEarningWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorEarnings to fetch.
     */
    orderBy?: CreatorEarningOrderByWithRelationInput | CreatorEarningOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorEarnings.
     */
    cursor?: CreatorEarningWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorEarnings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorEarnings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorEarnings.
     */
    distinct?: CreatorEarningScalarFieldEnum | CreatorEarningScalarFieldEnum[]
  }

  /**
   * CreatorEarning findMany
   */
  export type CreatorEarningFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter, which CreatorEarnings to fetch.
     */
    where?: CreatorEarningWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorEarnings to fetch.
     */
    orderBy?: CreatorEarningOrderByWithRelationInput | CreatorEarningOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CreatorEarnings.
     */
    cursor?: CreatorEarningWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorEarnings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorEarnings.
     */
    skip?: number
    distinct?: CreatorEarningScalarFieldEnum | CreatorEarningScalarFieldEnum[]
  }

  /**
   * CreatorEarning create
   */
  export type CreatorEarningCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * The data needed to create a CreatorEarning.
     */
    data: XOR<CreatorEarningCreateInput, CreatorEarningUncheckedCreateInput>
  }

  /**
   * CreatorEarning createMany
   */
  export type CreatorEarningCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CreatorEarnings.
     */
    data: CreatorEarningCreateManyInput | CreatorEarningCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CreatorEarning createManyAndReturn
   */
  export type CreatorEarningCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CreatorEarnings.
     */
    data: CreatorEarningCreateManyInput | CreatorEarningCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CreatorEarning update
   */
  export type CreatorEarningUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * The data needed to update a CreatorEarning.
     */
    data: XOR<CreatorEarningUpdateInput, CreatorEarningUncheckedUpdateInput>
    /**
     * Choose, which CreatorEarning to update.
     */
    where: CreatorEarningWhereUniqueInput
  }

  /**
   * CreatorEarning updateMany
   */
  export type CreatorEarningUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CreatorEarnings.
     */
    data: XOR<CreatorEarningUpdateManyMutationInput, CreatorEarningUncheckedUpdateManyInput>
    /**
     * Filter which CreatorEarnings to update
     */
    where?: CreatorEarningWhereInput
  }

  /**
   * CreatorEarning upsert
   */
  export type CreatorEarningUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * The filter to search for the CreatorEarning to update in case it exists.
     */
    where: CreatorEarningWhereUniqueInput
    /**
     * In case the CreatorEarning found by the `where` argument doesn't exist, create a new CreatorEarning with this data.
     */
    create: XOR<CreatorEarningCreateInput, CreatorEarningUncheckedCreateInput>
    /**
     * In case the CreatorEarning was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CreatorEarningUpdateInput, CreatorEarningUncheckedUpdateInput>
  }

  /**
   * CreatorEarning delete
   */
  export type CreatorEarningDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
    /**
     * Filter which CreatorEarning to delete.
     */
    where: CreatorEarningWhereUniqueInput
  }

  /**
   * CreatorEarning deleteMany
   */
  export type CreatorEarningDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorEarnings to delete
     */
    where?: CreatorEarningWhereInput
  }

  /**
   * CreatorEarning without action
   */
  export type CreatorEarningDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorEarning
     */
    select?: CreatorEarningSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorEarningInclude<ExtArgs> | null
  }


  /**
   * Model Channel
   */

  export type AggregateChannel = {
    _count: ChannelCountAggregateOutputType | null
    _min: ChannelMinAggregateOutputType | null
    _max: ChannelMaxAggregateOutputType | null
  }

  export type ChannelMinAggregateOutputType = {
    id: string | null
    creatorId: string | null
    name: string | null
    description: string | null
    category: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChannelMaxAggregateOutputType = {
    id: string | null
    creatorId: string | null
    name: string | null
    description: string | null
    category: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ChannelCountAggregateOutputType = {
    id: number
    creatorId: number
    name: number
    description: number
    category: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ChannelMinAggregateInputType = {
    id?: true
    creatorId?: true
    name?: true
    description?: true
    category?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChannelMaxAggregateInputType = {
    id?: true
    creatorId?: true
    name?: true
    description?: true
    category?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ChannelCountAggregateInputType = {
    id?: true
    creatorId?: true
    name?: true
    description?: true
    category?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ChannelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Channel to aggregate.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Channels
    **/
    _count?: true | ChannelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChannelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChannelMaxAggregateInputType
  }

  export type GetChannelAggregateType<T extends ChannelAggregateArgs> = {
        [P in keyof T & keyof AggregateChannel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChannel[P]>
      : GetScalarType<T[P], AggregateChannel[P]>
  }




  export type ChannelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChannelWhereInput
    orderBy?: ChannelOrderByWithAggregationInput | ChannelOrderByWithAggregationInput[]
    by: ChannelScalarFieldEnum[] | ChannelScalarFieldEnum
    having?: ChannelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChannelCountAggregateInputType | true
    _min?: ChannelMinAggregateInputType
    _max?: ChannelMaxAggregateInputType
  }

  export type ChannelGroupByOutputType = {
    id: string
    creatorId: string
    name: string
    description: string | null
    category: string | null
    createdAt: Date
    updatedAt: Date
    _count: ChannelCountAggregateOutputType | null
    _min: ChannelMinAggregateOutputType | null
    _max: ChannelMaxAggregateOutputType | null
  }

  type GetChannelGroupByPayload<T extends ChannelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChannelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChannelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChannelGroupByOutputType[P]>
            : GetScalarType<T[P], ChannelGroupByOutputType[P]>
        }
      >
    >


  export type ChannelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channel"]>

  export type ChannelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["channel"]>

  export type ChannelSelectScalar = {
    id?: boolean
    creatorId?: boolean
    name?: boolean
    description?: boolean
    category?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ChannelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }
  export type ChannelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }

  export type $ChannelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Channel"
    objects: {
      creator: Prisma.$CreatorProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      creatorId: string
      name: string
      description: string | null
      category: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["channel"]>
    composites: {}
  }

  type ChannelGetPayload<S extends boolean | null | undefined | ChannelDefaultArgs> = $Result.GetResult<Prisma.$ChannelPayload, S>

  type ChannelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChannelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChannelCountAggregateInputType | true
    }

  export interface ChannelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Channel'], meta: { name: 'Channel' } }
    /**
     * Find zero or one Channel that matches the filter.
     * @param {ChannelFindUniqueArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChannelFindUniqueArgs>(args: SelectSubset<T, ChannelFindUniqueArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Channel that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChannelFindUniqueOrThrowArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChannelFindUniqueOrThrowArgs>(args: SelectSubset<T, ChannelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Channel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindFirstArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChannelFindFirstArgs>(args?: SelectSubset<T, ChannelFindFirstArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Channel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindFirstOrThrowArgs} args - Arguments to find a Channel
     * @example
     * // Get one Channel
     * const channel = await prisma.channel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChannelFindFirstOrThrowArgs>(args?: SelectSubset<T, ChannelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Channels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Channels
     * const channels = await prisma.channel.findMany()
     * 
     * // Get first 10 Channels
     * const channels = await prisma.channel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const channelWithIdOnly = await prisma.channel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChannelFindManyArgs>(args?: SelectSubset<T, ChannelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Channel.
     * @param {ChannelCreateArgs} args - Arguments to create a Channel.
     * @example
     * // Create one Channel
     * const Channel = await prisma.channel.create({
     *   data: {
     *     // ... data to create a Channel
     *   }
     * })
     * 
     */
    create<T extends ChannelCreateArgs>(args: SelectSubset<T, ChannelCreateArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Channels.
     * @param {ChannelCreateManyArgs} args - Arguments to create many Channels.
     * @example
     * // Create many Channels
     * const channel = await prisma.channel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChannelCreateManyArgs>(args?: SelectSubset<T, ChannelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Channels and returns the data saved in the database.
     * @param {ChannelCreateManyAndReturnArgs} args - Arguments to create many Channels.
     * @example
     * // Create many Channels
     * const channel = await prisma.channel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Channels and only return the `id`
     * const channelWithIdOnly = await prisma.channel.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChannelCreateManyAndReturnArgs>(args?: SelectSubset<T, ChannelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Channel.
     * @param {ChannelDeleteArgs} args - Arguments to delete one Channel.
     * @example
     * // Delete one Channel
     * const Channel = await prisma.channel.delete({
     *   where: {
     *     // ... filter to delete one Channel
     *   }
     * })
     * 
     */
    delete<T extends ChannelDeleteArgs>(args: SelectSubset<T, ChannelDeleteArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Channel.
     * @param {ChannelUpdateArgs} args - Arguments to update one Channel.
     * @example
     * // Update one Channel
     * const channel = await prisma.channel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChannelUpdateArgs>(args: SelectSubset<T, ChannelUpdateArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Channels.
     * @param {ChannelDeleteManyArgs} args - Arguments to filter Channels to delete.
     * @example
     * // Delete a few Channels
     * const { count } = await prisma.channel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChannelDeleteManyArgs>(args?: SelectSubset<T, ChannelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Channels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Channels
     * const channel = await prisma.channel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChannelUpdateManyArgs>(args: SelectSubset<T, ChannelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Channel.
     * @param {ChannelUpsertArgs} args - Arguments to update or create a Channel.
     * @example
     * // Update or create a Channel
     * const channel = await prisma.channel.upsert({
     *   create: {
     *     // ... data to create a Channel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Channel we want to update
     *   }
     * })
     */
    upsert<T extends ChannelUpsertArgs>(args: SelectSubset<T, ChannelUpsertArgs<ExtArgs>>): Prisma__ChannelClient<$Result.GetResult<Prisma.$ChannelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Channels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelCountArgs} args - Arguments to filter Channels to count.
     * @example
     * // Count the number of Channels
     * const count = await prisma.channel.count({
     *   where: {
     *     // ... the filter for the Channels we want to count
     *   }
     * })
    **/
    count<T extends ChannelCountArgs>(
      args?: Subset<T, ChannelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChannelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Channel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ChannelAggregateArgs>(args: Subset<T, ChannelAggregateArgs>): Prisma.PrismaPromise<GetChannelAggregateType<T>>

    /**
     * Group by Channel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChannelGroupByArgs} args - Group by arguments.
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
      T extends ChannelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChannelGroupByArgs['orderBy'] }
        : { orderBy?: ChannelGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ChannelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChannelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Channel model
   */
  readonly fields: ChannelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Channel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChannelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends CreatorProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfileDefaultArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Channel model
   */ 
  interface ChannelFieldRefs {
    readonly id: FieldRef<"Channel", 'String'>
    readonly creatorId: FieldRef<"Channel", 'String'>
    readonly name: FieldRef<"Channel", 'String'>
    readonly description: FieldRef<"Channel", 'String'>
    readonly category: FieldRef<"Channel", 'String'>
    readonly createdAt: FieldRef<"Channel", 'DateTime'>
    readonly updatedAt: FieldRef<"Channel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Channel findUnique
   */
  export type ChannelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel findUniqueOrThrow
   */
  export type ChannelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel findFirst
   */
  export type ChannelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Channels.
     */
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel findFirstOrThrow
   */
  export type ChannelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channel to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Channels.
     */
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel findMany
   */
  export type ChannelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter, which Channels to fetch.
     */
    where?: ChannelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Channels to fetch.
     */
    orderBy?: ChannelOrderByWithRelationInput | ChannelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Channels.
     */
    cursor?: ChannelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Channels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Channels.
     */
    skip?: number
    distinct?: ChannelScalarFieldEnum | ChannelScalarFieldEnum[]
  }

  /**
   * Channel create
   */
  export type ChannelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The data needed to create a Channel.
     */
    data: XOR<ChannelCreateInput, ChannelUncheckedCreateInput>
  }

  /**
   * Channel createMany
   */
  export type ChannelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Channels.
     */
    data: ChannelCreateManyInput | ChannelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Channel createManyAndReturn
   */
  export type ChannelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Channels.
     */
    data: ChannelCreateManyInput | ChannelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Channel update
   */
  export type ChannelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The data needed to update a Channel.
     */
    data: XOR<ChannelUpdateInput, ChannelUncheckedUpdateInput>
    /**
     * Choose, which Channel to update.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel updateMany
   */
  export type ChannelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Channels.
     */
    data: XOR<ChannelUpdateManyMutationInput, ChannelUncheckedUpdateManyInput>
    /**
     * Filter which Channels to update
     */
    where?: ChannelWhereInput
  }

  /**
   * Channel upsert
   */
  export type ChannelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * The filter to search for the Channel to update in case it exists.
     */
    where: ChannelWhereUniqueInput
    /**
     * In case the Channel found by the `where` argument doesn't exist, create a new Channel with this data.
     */
    create: XOR<ChannelCreateInput, ChannelUncheckedCreateInput>
    /**
     * In case the Channel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChannelUpdateInput, ChannelUncheckedUpdateInput>
  }

  /**
   * Channel delete
   */
  export type ChannelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
    /**
     * Filter which Channel to delete.
     */
    where: ChannelWhereUniqueInput
  }

  /**
   * Channel deleteMany
   */
  export type ChannelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Channels to delete
     */
    where?: ChannelWhereInput
  }

  /**
   * Channel without action
   */
  export type ChannelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Channel
     */
    select?: ChannelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChannelInclude<ExtArgs> | null
  }


  /**
   * Model CreatorChallenge
   */

  export type AggregateCreatorChallenge = {
    _count: CreatorChallengeCountAggregateOutputType | null
    _min: CreatorChallengeMinAggregateOutputType | null
    _max: CreatorChallengeMaxAggregateOutputType | null
  }

  export type CreatorChallengeMinAggregateOutputType = {
    id: string | null
    creatorId: string | null
    title: string | null
    description: string | null
    prize: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    createdAt: Date | null
  }

  export type CreatorChallengeMaxAggregateOutputType = {
    id: string | null
    creatorId: string | null
    title: string | null
    description: string | null
    prize: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    createdAt: Date | null
  }

  export type CreatorChallengeCountAggregateOutputType = {
    id: number
    creatorId: number
    title: number
    description: number
    prize: number
    startDate: number
    endDate: number
    status: number
    createdAt: number
    _all: number
  }


  export type CreatorChallengeMinAggregateInputType = {
    id?: true
    creatorId?: true
    title?: true
    description?: true
    prize?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
  }

  export type CreatorChallengeMaxAggregateInputType = {
    id?: true
    creatorId?: true
    title?: true
    description?: true
    prize?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
  }

  export type CreatorChallengeCountAggregateInputType = {
    id?: true
    creatorId?: true
    title?: true
    description?: true
    prize?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
    _all?: true
  }

  export type CreatorChallengeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorChallenge to aggregate.
     */
    where?: CreatorChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorChallenges to fetch.
     */
    orderBy?: CreatorChallengeOrderByWithRelationInput | CreatorChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CreatorChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CreatorChallenges
    **/
    _count?: true | CreatorChallengeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CreatorChallengeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CreatorChallengeMaxAggregateInputType
  }

  export type GetCreatorChallengeAggregateType<T extends CreatorChallengeAggregateArgs> = {
        [P in keyof T & keyof AggregateCreatorChallenge]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCreatorChallenge[P]>
      : GetScalarType<T[P], AggregateCreatorChallenge[P]>
  }




  export type CreatorChallengeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CreatorChallengeWhereInput
    orderBy?: CreatorChallengeOrderByWithAggregationInput | CreatorChallengeOrderByWithAggregationInput[]
    by: CreatorChallengeScalarFieldEnum[] | CreatorChallengeScalarFieldEnum
    having?: CreatorChallengeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CreatorChallengeCountAggregateInputType | true
    _min?: CreatorChallengeMinAggregateInputType
    _max?: CreatorChallengeMaxAggregateInputType
  }

  export type CreatorChallengeGroupByOutputType = {
    id: string
    creatorId: string
    title: string
    description: string
    prize: string
    startDate: Date
    endDate: Date
    status: string
    createdAt: Date
    _count: CreatorChallengeCountAggregateOutputType | null
    _min: CreatorChallengeMinAggregateOutputType | null
    _max: CreatorChallengeMaxAggregateOutputType | null
  }

  type GetCreatorChallengeGroupByPayload<T extends CreatorChallengeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CreatorChallengeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CreatorChallengeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CreatorChallengeGroupByOutputType[P]>
            : GetScalarType<T[P], CreatorChallengeGroupByOutputType[P]>
        }
      >
    >


  export type CreatorChallengeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    title?: boolean
    description?: boolean
    prize?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
    entries?: boolean | CreatorChallenge$entriesArgs<ExtArgs>
    _count?: boolean | CreatorChallengeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creatorChallenge"]>

  export type CreatorChallengeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    title?: boolean
    description?: boolean
    prize?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["creatorChallenge"]>

  export type CreatorChallengeSelectScalar = {
    id?: boolean
    creatorId?: boolean
    title?: boolean
    description?: boolean
    prize?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
  }

  export type CreatorChallengeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
    entries?: boolean | CreatorChallenge$entriesArgs<ExtArgs>
    _count?: boolean | CreatorChallengeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CreatorChallengeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }

  export type $CreatorChallengePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CreatorChallenge"
    objects: {
      creator: Prisma.$CreatorProfilePayload<ExtArgs>
      entries: Prisma.$ChallengeEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      creatorId: string
      title: string
      description: string
      prize: string
      startDate: Date
      endDate: Date
      status: string
      createdAt: Date
    }, ExtArgs["result"]["creatorChallenge"]>
    composites: {}
  }

  type CreatorChallengeGetPayload<S extends boolean | null | undefined | CreatorChallengeDefaultArgs> = $Result.GetResult<Prisma.$CreatorChallengePayload, S>

  type CreatorChallengeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CreatorChallengeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CreatorChallengeCountAggregateInputType | true
    }

  export interface CreatorChallengeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CreatorChallenge'], meta: { name: 'CreatorChallenge' } }
    /**
     * Find zero or one CreatorChallenge that matches the filter.
     * @param {CreatorChallengeFindUniqueArgs} args - Arguments to find a CreatorChallenge
     * @example
     * // Get one CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CreatorChallengeFindUniqueArgs>(args: SelectSubset<T, CreatorChallengeFindUniqueArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CreatorChallenge that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CreatorChallengeFindUniqueOrThrowArgs} args - Arguments to find a CreatorChallenge
     * @example
     * // Get one CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CreatorChallengeFindUniqueOrThrowArgs>(args: SelectSubset<T, CreatorChallengeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CreatorChallenge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeFindFirstArgs} args - Arguments to find a CreatorChallenge
     * @example
     * // Get one CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CreatorChallengeFindFirstArgs>(args?: SelectSubset<T, CreatorChallengeFindFirstArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CreatorChallenge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeFindFirstOrThrowArgs} args - Arguments to find a CreatorChallenge
     * @example
     * // Get one CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CreatorChallengeFindFirstOrThrowArgs>(args?: SelectSubset<T, CreatorChallengeFindFirstOrThrowArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CreatorChallenges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CreatorChallenges
     * const creatorChallenges = await prisma.creatorChallenge.findMany()
     * 
     * // Get first 10 CreatorChallenges
     * const creatorChallenges = await prisma.creatorChallenge.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const creatorChallengeWithIdOnly = await prisma.creatorChallenge.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CreatorChallengeFindManyArgs>(args?: SelectSubset<T, CreatorChallengeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CreatorChallenge.
     * @param {CreatorChallengeCreateArgs} args - Arguments to create a CreatorChallenge.
     * @example
     * // Create one CreatorChallenge
     * const CreatorChallenge = await prisma.creatorChallenge.create({
     *   data: {
     *     // ... data to create a CreatorChallenge
     *   }
     * })
     * 
     */
    create<T extends CreatorChallengeCreateArgs>(args: SelectSubset<T, CreatorChallengeCreateArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CreatorChallenges.
     * @param {CreatorChallengeCreateManyArgs} args - Arguments to create many CreatorChallenges.
     * @example
     * // Create many CreatorChallenges
     * const creatorChallenge = await prisma.creatorChallenge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CreatorChallengeCreateManyArgs>(args?: SelectSubset<T, CreatorChallengeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CreatorChallenges and returns the data saved in the database.
     * @param {CreatorChallengeCreateManyAndReturnArgs} args - Arguments to create many CreatorChallenges.
     * @example
     * // Create many CreatorChallenges
     * const creatorChallenge = await prisma.creatorChallenge.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CreatorChallenges and only return the `id`
     * const creatorChallengeWithIdOnly = await prisma.creatorChallenge.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CreatorChallengeCreateManyAndReturnArgs>(args?: SelectSubset<T, CreatorChallengeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CreatorChallenge.
     * @param {CreatorChallengeDeleteArgs} args - Arguments to delete one CreatorChallenge.
     * @example
     * // Delete one CreatorChallenge
     * const CreatorChallenge = await prisma.creatorChallenge.delete({
     *   where: {
     *     // ... filter to delete one CreatorChallenge
     *   }
     * })
     * 
     */
    delete<T extends CreatorChallengeDeleteArgs>(args: SelectSubset<T, CreatorChallengeDeleteArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CreatorChallenge.
     * @param {CreatorChallengeUpdateArgs} args - Arguments to update one CreatorChallenge.
     * @example
     * // Update one CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CreatorChallengeUpdateArgs>(args: SelectSubset<T, CreatorChallengeUpdateArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CreatorChallenges.
     * @param {CreatorChallengeDeleteManyArgs} args - Arguments to filter CreatorChallenges to delete.
     * @example
     * // Delete a few CreatorChallenges
     * const { count } = await prisma.creatorChallenge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CreatorChallengeDeleteManyArgs>(args?: SelectSubset<T, CreatorChallengeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CreatorChallenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CreatorChallenges
     * const creatorChallenge = await prisma.creatorChallenge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CreatorChallengeUpdateManyArgs>(args: SelectSubset<T, CreatorChallengeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CreatorChallenge.
     * @param {CreatorChallengeUpsertArgs} args - Arguments to update or create a CreatorChallenge.
     * @example
     * // Update or create a CreatorChallenge
     * const creatorChallenge = await prisma.creatorChallenge.upsert({
     *   create: {
     *     // ... data to create a CreatorChallenge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CreatorChallenge we want to update
     *   }
     * })
     */
    upsert<T extends CreatorChallengeUpsertArgs>(args: SelectSubset<T, CreatorChallengeUpsertArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CreatorChallenges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeCountArgs} args - Arguments to filter CreatorChallenges to count.
     * @example
     * // Count the number of CreatorChallenges
     * const count = await prisma.creatorChallenge.count({
     *   where: {
     *     // ... the filter for the CreatorChallenges we want to count
     *   }
     * })
    **/
    count<T extends CreatorChallengeCountArgs>(
      args?: Subset<T, CreatorChallengeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CreatorChallengeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CreatorChallenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CreatorChallengeAggregateArgs>(args: Subset<T, CreatorChallengeAggregateArgs>): Prisma.PrismaPromise<GetCreatorChallengeAggregateType<T>>

    /**
     * Group by CreatorChallenge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CreatorChallengeGroupByArgs} args - Group by arguments.
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
      T extends CreatorChallengeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CreatorChallengeGroupByArgs['orderBy'] }
        : { orderBy?: CreatorChallengeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CreatorChallengeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCreatorChallengeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CreatorChallenge model
   */
  readonly fields: CreatorChallengeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CreatorChallenge.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CreatorChallengeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends CreatorProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfileDefaultArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    entries<T extends CreatorChallenge$entriesArgs<ExtArgs> = {}>(args?: Subset<T, CreatorChallenge$entriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the CreatorChallenge model
   */ 
  interface CreatorChallengeFieldRefs {
    readonly id: FieldRef<"CreatorChallenge", 'String'>
    readonly creatorId: FieldRef<"CreatorChallenge", 'String'>
    readonly title: FieldRef<"CreatorChallenge", 'String'>
    readonly description: FieldRef<"CreatorChallenge", 'String'>
    readonly prize: FieldRef<"CreatorChallenge", 'String'>
    readonly startDate: FieldRef<"CreatorChallenge", 'DateTime'>
    readonly endDate: FieldRef<"CreatorChallenge", 'DateTime'>
    readonly status: FieldRef<"CreatorChallenge", 'String'>
    readonly createdAt: FieldRef<"CreatorChallenge", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CreatorChallenge findUnique
   */
  export type CreatorChallengeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter, which CreatorChallenge to fetch.
     */
    where: CreatorChallengeWhereUniqueInput
  }

  /**
   * CreatorChallenge findUniqueOrThrow
   */
  export type CreatorChallengeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter, which CreatorChallenge to fetch.
     */
    where: CreatorChallengeWhereUniqueInput
  }

  /**
   * CreatorChallenge findFirst
   */
  export type CreatorChallengeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter, which CreatorChallenge to fetch.
     */
    where?: CreatorChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorChallenges to fetch.
     */
    orderBy?: CreatorChallengeOrderByWithRelationInput | CreatorChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorChallenges.
     */
    cursor?: CreatorChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorChallenges.
     */
    distinct?: CreatorChallengeScalarFieldEnum | CreatorChallengeScalarFieldEnum[]
  }

  /**
   * CreatorChallenge findFirstOrThrow
   */
  export type CreatorChallengeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter, which CreatorChallenge to fetch.
     */
    where?: CreatorChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorChallenges to fetch.
     */
    orderBy?: CreatorChallengeOrderByWithRelationInput | CreatorChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CreatorChallenges.
     */
    cursor?: CreatorChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorChallenges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CreatorChallenges.
     */
    distinct?: CreatorChallengeScalarFieldEnum | CreatorChallengeScalarFieldEnum[]
  }

  /**
   * CreatorChallenge findMany
   */
  export type CreatorChallengeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter, which CreatorChallenges to fetch.
     */
    where?: CreatorChallengeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CreatorChallenges to fetch.
     */
    orderBy?: CreatorChallengeOrderByWithRelationInput | CreatorChallengeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CreatorChallenges.
     */
    cursor?: CreatorChallengeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CreatorChallenges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CreatorChallenges.
     */
    skip?: number
    distinct?: CreatorChallengeScalarFieldEnum | CreatorChallengeScalarFieldEnum[]
  }

  /**
   * CreatorChallenge create
   */
  export type CreatorChallengeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * The data needed to create a CreatorChallenge.
     */
    data: XOR<CreatorChallengeCreateInput, CreatorChallengeUncheckedCreateInput>
  }

  /**
   * CreatorChallenge createMany
   */
  export type CreatorChallengeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CreatorChallenges.
     */
    data: CreatorChallengeCreateManyInput | CreatorChallengeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CreatorChallenge createManyAndReturn
   */
  export type CreatorChallengeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CreatorChallenges.
     */
    data: CreatorChallengeCreateManyInput | CreatorChallengeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CreatorChallenge update
   */
  export type CreatorChallengeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * The data needed to update a CreatorChallenge.
     */
    data: XOR<CreatorChallengeUpdateInput, CreatorChallengeUncheckedUpdateInput>
    /**
     * Choose, which CreatorChallenge to update.
     */
    where: CreatorChallengeWhereUniqueInput
  }

  /**
   * CreatorChallenge updateMany
   */
  export type CreatorChallengeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CreatorChallenges.
     */
    data: XOR<CreatorChallengeUpdateManyMutationInput, CreatorChallengeUncheckedUpdateManyInput>
    /**
     * Filter which CreatorChallenges to update
     */
    where?: CreatorChallengeWhereInput
  }

  /**
   * CreatorChallenge upsert
   */
  export type CreatorChallengeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * The filter to search for the CreatorChallenge to update in case it exists.
     */
    where: CreatorChallengeWhereUniqueInput
    /**
     * In case the CreatorChallenge found by the `where` argument doesn't exist, create a new CreatorChallenge with this data.
     */
    create: XOR<CreatorChallengeCreateInput, CreatorChallengeUncheckedCreateInput>
    /**
     * In case the CreatorChallenge was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CreatorChallengeUpdateInput, CreatorChallengeUncheckedUpdateInput>
  }

  /**
   * CreatorChallenge delete
   */
  export type CreatorChallengeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
    /**
     * Filter which CreatorChallenge to delete.
     */
    where: CreatorChallengeWhereUniqueInput
  }

  /**
   * CreatorChallenge deleteMany
   */
  export type CreatorChallengeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CreatorChallenges to delete
     */
    where?: CreatorChallengeWhereInput
  }

  /**
   * CreatorChallenge.entries
   */
  export type CreatorChallenge$entriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    where?: ChallengeEntryWhereInput
    orderBy?: ChallengeEntryOrderByWithRelationInput | ChallengeEntryOrderByWithRelationInput[]
    cursor?: ChallengeEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChallengeEntryScalarFieldEnum | ChallengeEntryScalarFieldEnum[]
  }

  /**
   * CreatorChallenge without action
   */
  export type CreatorChallengeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CreatorChallenge
     */
    select?: CreatorChallengeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CreatorChallengeInclude<ExtArgs> | null
  }


  /**
   * Model ChallengeEntry
   */

  export type AggregateChallengeEntry = {
    _count: ChallengeEntryCountAggregateOutputType | null
    _min: ChallengeEntryMinAggregateOutputType | null
    _max: ChallengeEntryMaxAggregateOutputType | null
  }

  export type ChallengeEntryMinAggregateOutputType = {
    id: string | null
    userId: string | null
    challengeId: string | null
    contentUrl: string | null
    createdAt: Date | null
  }

  export type ChallengeEntryMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    challengeId: string | null
    contentUrl: string | null
    createdAt: Date | null
  }

  export type ChallengeEntryCountAggregateOutputType = {
    id: number
    userId: number
    challengeId: number
    contentUrl: number
    createdAt: number
    _all: number
  }


  export type ChallengeEntryMinAggregateInputType = {
    id?: true
    userId?: true
    challengeId?: true
    contentUrl?: true
    createdAt?: true
  }

  export type ChallengeEntryMaxAggregateInputType = {
    id?: true
    userId?: true
    challengeId?: true
    contentUrl?: true
    createdAt?: true
  }

  export type ChallengeEntryCountAggregateInputType = {
    id?: true
    userId?: true
    challengeId?: true
    contentUrl?: true
    createdAt?: true
    _all?: true
  }

  export type ChallengeEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChallengeEntry to aggregate.
     */
    where?: ChallengeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChallengeEntries to fetch.
     */
    orderBy?: ChallengeEntryOrderByWithRelationInput | ChallengeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChallengeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChallengeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChallengeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChallengeEntries
    **/
    _count?: true | ChallengeEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChallengeEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChallengeEntryMaxAggregateInputType
  }

  export type GetChallengeEntryAggregateType<T extends ChallengeEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateChallengeEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChallengeEntry[P]>
      : GetScalarType<T[P], AggregateChallengeEntry[P]>
  }




  export type ChallengeEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChallengeEntryWhereInput
    orderBy?: ChallengeEntryOrderByWithAggregationInput | ChallengeEntryOrderByWithAggregationInput[]
    by: ChallengeEntryScalarFieldEnum[] | ChallengeEntryScalarFieldEnum
    having?: ChallengeEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChallengeEntryCountAggregateInputType | true
    _min?: ChallengeEntryMinAggregateInputType
    _max?: ChallengeEntryMaxAggregateInputType
  }

  export type ChallengeEntryGroupByOutputType = {
    id: string
    userId: string
    challengeId: string
    contentUrl: string
    createdAt: Date
    _count: ChallengeEntryCountAggregateOutputType | null
    _min: ChallengeEntryMinAggregateOutputType | null
    _max: ChallengeEntryMaxAggregateOutputType | null
  }

  type GetChallengeEntryGroupByPayload<T extends ChallengeEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChallengeEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChallengeEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChallengeEntryGroupByOutputType[P]>
            : GetScalarType<T[P], ChallengeEntryGroupByOutputType[P]>
        }
      >
    >


  export type ChallengeEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    challengeId?: boolean
    contentUrl?: boolean
    createdAt?: boolean
    challenge?: boolean | CreatorChallengeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["challengeEntry"]>

  export type ChallengeEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    challengeId?: boolean
    contentUrl?: boolean
    createdAt?: boolean
    challenge?: boolean | CreatorChallengeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["challengeEntry"]>

  export type ChallengeEntrySelectScalar = {
    id?: boolean
    userId?: boolean
    challengeId?: boolean
    contentUrl?: boolean
    createdAt?: boolean
  }

  export type ChallengeEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    challenge?: boolean | CreatorChallengeDefaultArgs<ExtArgs>
  }
  export type ChallengeEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    challenge?: boolean | CreatorChallengeDefaultArgs<ExtArgs>
  }

  export type $ChallengeEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChallengeEntry"
    objects: {
      challenge: Prisma.$CreatorChallengePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      challengeId: string
      contentUrl: string
      createdAt: Date
    }, ExtArgs["result"]["challengeEntry"]>
    composites: {}
  }

  type ChallengeEntryGetPayload<S extends boolean | null | undefined | ChallengeEntryDefaultArgs> = $Result.GetResult<Prisma.$ChallengeEntryPayload, S>

  type ChallengeEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChallengeEntryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChallengeEntryCountAggregateInputType | true
    }

  export interface ChallengeEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChallengeEntry'], meta: { name: 'ChallengeEntry' } }
    /**
     * Find zero or one ChallengeEntry that matches the filter.
     * @param {ChallengeEntryFindUniqueArgs} args - Arguments to find a ChallengeEntry
     * @example
     * // Get one ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChallengeEntryFindUniqueArgs>(args: SelectSubset<T, ChallengeEntryFindUniqueArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ChallengeEntry that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChallengeEntryFindUniqueOrThrowArgs} args - Arguments to find a ChallengeEntry
     * @example
     * // Get one ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChallengeEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, ChallengeEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ChallengeEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryFindFirstArgs} args - Arguments to find a ChallengeEntry
     * @example
     * // Get one ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChallengeEntryFindFirstArgs>(args?: SelectSubset<T, ChallengeEntryFindFirstArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ChallengeEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryFindFirstOrThrowArgs} args - Arguments to find a ChallengeEntry
     * @example
     * // Get one ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChallengeEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, ChallengeEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ChallengeEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChallengeEntries
     * const challengeEntries = await prisma.challengeEntry.findMany()
     * 
     * // Get first 10 ChallengeEntries
     * const challengeEntries = await prisma.challengeEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const challengeEntryWithIdOnly = await prisma.challengeEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChallengeEntryFindManyArgs>(args?: SelectSubset<T, ChallengeEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ChallengeEntry.
     * @param {ChallengeEntryCreateArgs} args - Arguments to create a ChallengeEntry.
     * @example
     * // Create one ChallengeEntry
     * const ChallengeEntry = await prisma.challengeEntry.create({
     *   data: {
     *     // ... data to create a ChallengeEntry
     *   }
     * })
     * 
     */
    create<T extends ChallengeEntryCreateArgs>(args: SelectSubset<T, ChallengeEntryCreateArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ChallengeEntries.
     * @param {ChallengeEntryCreateManyArgs} args - Arguments to create many ChallengeEntries.
     * @example
     * // Create many ChallengeEntries
     * const challengeEntry = await prisma.challengeEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChallengeEntryCreateManyArgs>(args?: SelectSubset<T, ChallengeEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChallengeEntries and returns the data saved in the database.
     * @param {ChallengeEntryCreateManyAndReturnArgs} args - Arguments to create many ChallengeEntries.
     * @example
     * // Create many ChallengeEntries
     * const challengeEntry = await prisma.challengeEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChallengeEntries and only return the `id`
     * const challengeEntryWithIdOnly = await prisma.challengeEntry.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChallengeEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, ChallengeEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ChallengeEntry.
     * @param {ChallengeEntryDeleteArgs} args - Arguments to delete one ChallengeEntry.
     * @example
     * // Delete one ChallengeEntry
     * const ChallengeEntry = await prisma.challengeEntry.delete({
     *   where: {
     *     // ... filter to delete one ChallengeEntry
     *   }
     * })
     * 
     */
    delete<T extends ChallengeEntryDeleteArgs>(args: SelectSubset<T, ChallengeEntryDeleteArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ChallengeEntry.
     * @param {ChallengeEntryUpdateArgs} args - Arguments to update one ChallengeEntry.
     * @example
     * // Update one ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChallengeEntryUpdateArgs>(args: SelectSubset<T, ChallengeEntryUpdateArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ChallengeEntries.
     * @param {ChallengeEntryDeleteManyArgs} args - Arguments to filter ChallengeEntries to delete.
     * @example
     * // Delete a few ChallengeEntries
     * const { count } = await prisma.challengeEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChallengeEntryDeleteManyArgs>(args?: SelectSubset<T, ChallengeEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChallengeEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChallengeEntries
     * const challengeEntry = await prisma.challengeEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChallengeEntryUpdateManyArgs>(args: SelectSubset<T, ChallengeEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ChallengeEntry.
     * @param {ChallengeEntryUpsertArgs} args - Arguments to update or create a ChallengeEntry.
     * @example
     * // Update or create a ChallengeEntry
     * const challengeEntry = await prisma.challengeEntry.upsert({
     *   create: {
     *     // ... data to create a ChallengeEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChallengeEntry we want to update
     *   }
     * })
     */
    upsert<T extends ChallengeEntryUpsertArgs>(args: SelectSubset<T, ChallengeEntryUpsertArgs<ExtArgs>>): Prisma__ChallengeEntryClient<$Result.GetResult<Prisma.$ChallengeEntryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ChallengeEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryCountArgs} args - Arguments to filter ChallengeEntries to count.
     * @example
     * // Count the number of ChallengeEntries
     * const count = await prisma.challengeEntry.count({
     *   where: {
     *     // ... the filter for the ChallengeEntries we want to count
     *   }
     * })
    **/
    count<T extends ChallengeEntryCountArgs>(
      args?: Subset<T, ChallengeEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChallengeEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChallengeEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ChallengeEntryAggregateArgs>(args: Subset<T, ChallengeEntryAggregateArgs>): Prisma.PrismaPromise<GetChallengeEntryAggregateType<T>>

    /**
     * Group by ChallengeEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChallengeEntryGroupByArgs} args - Group by arguments.
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
      T extends ChallengeEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChallengeEntryGroupByArgs['orderBy'] }
        : { orderBy?: ChallengeEntryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ChallengeEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChallengeEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChallengeEntry model
   */
  readonly fields: ChallengeEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChallengeEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChallengeEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    challenge<T extends CreatorChallengeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorChallengeDefaultArgs<ExtArgs>>): Prisma__CreatorChallengeClient<$Result.GetResult<Prisma.$CreatorChallengePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the ChallengeEntry model
   */ 
  interface ChallengeEntryFieldRefs {
    readonly id: FieldRef<"ChallengeEntry", 'String'>
    readonly userId: FieldRef<"ChallengeEntry", 'String'>
    readonly challengeId: FieldRef<"ChallengeEntry", 'String'>
    readonly contentUrl: FieldRef<"ChallengeEntry", 'String'>
    readonly createdAt: FieldRef<"ChallengeEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChallengeEntry findUnique
   */
  export type ChallengeEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter, which ChallengeEntry to fetch.
     */
    where: ChallengeEntryWhereUniqueInput
  }

  /**
   * ChallengeEntry findUniqueOrThrow
   */
  export type ChallengeEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter, which ChallengeEntry to fetch.
     */
    where: ChallengeEntryWhereUniqueInput
  }

  /**
   * ChallengeEntry findFirst
   */
  export type ChallengeEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter, which ChallengeEntry to fetch.
     */
    where?: ChallengeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChallengeEntries to fetch.
     */
    orderBy?: ChallengeEntryOrderByWithRelationInput | ChallengeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChallengeEntries.
     */
    cursor?: ChallengeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChallengeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChallengeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChallengeEntries.
     */
    distinct?: ChallengeEntryScalarFieldEnum | ChallengeEntryScalarFieldEnum[]
  }

  /**
   * ChallengeEntry findFirstOrThrow
   */
  export type ChallengeEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter, which ChallengeEntry to fetch.
     */
    where?: ChallengeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChallengeEntries to fetch.
     */
    orderBy?: ChallengeEntryOrderByWithRelationInput | ChallengeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChallengeEntries.
     */
    cursor?: ChallengeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChallengeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChallengeEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChallengeEntries.
     */
    distinct?: ChallengeEntryScalarFieldEnum | ChallengeEntryScalarFieldEnum[]
  }

  /**
   * ChallengeEntry findMany
   */
  export type ChallengeEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter, which ChallengeEntries to fetch.
     */
    where?: ChallengeEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChallengeEntries to fetch.
     */
    orderBy?: ChallengeEntryOrderByWithRelationInput | ChallengeEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChallengeEntries.
     */
    cursor?: ChallengeEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChallengeEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChallengeEntries.
     */
    skip?: number
    distinct?: ChallengeEntryScalarFieldEnum | ChallengeEntryScalarFieldEnum[]
  }

  /**
   * ChallengeEntry create
   */
  export type ChallengeEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a ChallengeEntry.
     */
    data: XOR<ChallengeEntryCreateInput, ChallengeEntryUncheckedCreateInput>
  }

  /**
   * ChallengeEntry createMany
   */
  export type ChallengeEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChallengeEntries.
     */
    data: ChallengeEntryCreateManyInput | ChallengeEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ChallengeEntry createManyAndReturn
   */
  export type ChallengeEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ChallengeEntries.
     */
    data: ChallengeEntryCreateManyInput | ChallengeEntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChallengeEntry update
   */
  export type ChallengeEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a ChallengeEntry.
     */
    data: XOR<ChallengeEntryUpdateInput, ChallengeEntryUncheckedUpdateInput>
    /**
     * Choose, which ChallengeEntry to update.
     */
    where: ChallengeEntryWhereUniqueInput
  }

  /**
   * ChallengeEntry updateMany
   */
  export type ChallengeEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChallengeEntries.
     */
    data: XOR<ChallengeEntryUpdateManyMutationInput, ChallengeEntryUncheckedUpdateManyInput>
    /**
     * Filter which ChallengeEntries to update
     */
    where?: ChallengeEntryWhereInput
  }

  /**
   * ChallengeEntry upsert
   */
  export type ChallengeEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the ChallengeEntry to update in case it exists.
     */
    where: ChallengeEntryWhereUniqueInput
    /**
     * In case the ChallengeEntry found by the `where` argument doesn't exist, create a new ChallengeEntry with this data.
     */
    create: XOR<ChallengeEntryCreateInput, ChallengeEntryUncheckedCreateInput>
    /**
     * In case the ChallengeEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChallengeEntryUpdateInput, ChallengeEntryUncheckedUpdateInput>
  }

  /**
   * ChallengeEntry delete
   */
  export type ChallengeEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
    /**
     * Filter which ChallengeEntry to delete.
     */
    where: ChallengeEntryWhereUniqueInput
  }

  /**
   * ChallengeEntry deleteMany
   */
  export type ChallengeEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChallengeEntries to delete
     */
    where?: ChallengeEntryWhereInput
  }

  /**
   * ChallengeEntry without action
   */
  export type ChallengeEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChallengeEntry
     */
    select?: ChallengeEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChallengeEntryInclude<ExtArgs> | null
  }


  /**
   * Model PayoutRequest
   */

  export type AggregatePayoutRequest = {
    _count: PayoutRequestCountAggregateOutputType | null
    _avg: PayoutRequestAvgAggregateOutputType | null
    _sum: PayoutRequestSumAggregateOutputType | null
    _min: PayoutRequestMinAggregateOutputType | null
    _max: PayoutRequestMaxAggregateOutputType | null
  }

  export type PayoutRequestAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type PayoutRequestSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type PayoutRequestMinAggregateOutputType = {
    id: string | null
    creatorId: string | null
    amount: Decimal | null
    method: string | null
    status: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutRequestMaxAggregateOutputType = {
    id: string | null
    creatorId: string | null
    amount: Decimal | null
    method: string | null
    status: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutRequestCountAggregateOutputType = {
    id: number
    creatorId: number
    amount: number
    method: number
    accountDetails: number
    status: number
    processedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PayoutRequestAvgAggregateInputType = {
    amount?: true
  }

  export type PayoutRequestSumAggregateInputType = {
    amount?: true
  }

  export type PayoutRequestMinAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    method?: true
    status?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutRequestMaxAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    method?: true
    status?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutRequestCountAggregateInputType = {
    id?: true
    creatorId?: true
    amount?: true
    method?: true
    accountDetails?: true
    status?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PayoutRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutRequest to aggregate.
     */
    where?: PayoutRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutRequests to fetch.
     */
    orderBy?: PayoutRequestOrderByWithRelationInput | PayoutRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PayoutRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PayoutRequests
    **/
    _count?: true | PayoutRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PayoutRequestAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PayoutRequestSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PayoutRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PayoutRequestMaxAggregateInputType
  }

  export type GetPayoutRequestAggregateType<T extends PayoutRequestAggregateArgs> = {
        [P in keyof T & keyof AggregatePayoutRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayoutRequest[P]>
      : GetScalarType<T[P], AggregatePayoutRequest[P]>
  }




  export type PayoutRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutRequestWhereInput
    orderBy?: PayoutRequestOrderByWithAggregationInput | PayoutRequestOrderByWithAggregationInput[]
    by: PayoutRequestScalarFieldEnum[] | PayoutRequestScalarFieldEnum
    having?: PayoutRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PayoutRequestCountAggregateInputType | true
    _avg?: PayoutRequestAvgAggregateInputType
    _sum?: PayoutRequestSumAggregateInputType
    _min?: PayoutRequestMinAggregateInputType
    _max?: PayoutRequestMaxAggregateInputType
  }

  export type PayoutRequestGroupByOutputType = {
    id: string
    creatorId: string
    amount: Decimal
    method: string
    accountDetails: JsonValue
    status: string
    processedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PayoutRequestCountAggregateOutputType | null
    _avg: PayoutRequestAvgAggregateOutputType | null
    _sum: PayoutRequestSumAggregateOutputType | null
    _min: PayoutRequestMinAggregateOutputType | null
    _max: PayoutRequestMaxAggregateOutputType | null
  }

  type GetPayoutRequestGroupByPayload<T extends PayoutRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PayoutRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PayoutRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PayoutRequestGroupByOutputType[P]>
            : GetScalarType<T[P], PayoutRequestGroupByOutputType[P]>
        }
      >
    >


  export type PayoutRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    method?: boolean
    accountDetails?: boolean
    status?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutRequest"]>

  export type PayoutRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    method?: boolean
    accountDetails?: boolean
    status?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payoutRequest"]>

  export type PayoutRequestSelectScalar = {
    id?: boolean
    creatorId?: boolean
    amount?: boolean
    method?: boolean
    accountDetails?: boolean
    status?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PayoutRequestInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }
  export type PayoutRequestIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }

  export type $PayoutRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PayoutRequest"
    objects: {
      creator: Prisma.$CreatorProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      creatorId: string
      amount: Prisma.Decimal
      method: string
      accountDetails: Prisma.JsonValue
      status: string
      processedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payoutRequest"]>
    composites: {}
  }

  type PayoutRequestGetPayload<S extends boolean | null | undefined | PayoutRequestDefaultArgs> = $Result.GetResult<Prisma.$PayoutRequestPayload, S>

  type PayoutRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<PayoutRequestFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: PayoutRequestCountAggregateInputType | true
    }

  export interface PayoutRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PayoutRequest'], meta: { name: 'PayoutRequest' } }
    /**
     * Find zero or one PayoutRequest that matches the filter.
     * @param {PayoutRequestFindUniqueArgs} args - Arguments to find a PayoutRequest
     * @example
     * // Get one PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PayoutRequestFindUniqueArgs>(args: SelectSubset<T, PayoutRequestFindUniqueArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one PayoutRequest that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {PayoutRequestFindUniqueOrThrowArgs} args - Arguments to find a PayoutRequest
     * @example
     * // Get one PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PayoutRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, PayoutRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first PayoutRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestFindFirstArgs} args - Arguments to find a PayoutRequest
     * @example
     * // Get one PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PayoutRequestFindFirstArgs>(args?: SelectSubset<T, PayoutRequestFindFirstArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first PayoutRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestFindFirstOrThrowArgs} args - Arguments to find a PayoutRequest
     * @example
     * // Get one PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PayoutRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, PayoutRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more PayoutRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PayoutRequests
     * const payoutRequests = await prisma.payoutRequest.findMany()
     * 
     * // Get first 10 PayoutRequests
     * const payoutRequests = await prisma.payoutRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const payoutRequestWithIdOnly = await prisma.payoutRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PayoutRequestFindManyArgs>(args?: SelectSubset<T, PayoutRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a PayoutRequest.
     * @param {PayoutRequestCreateArgs} args - Arguments to create a PayoutRequest.
     * @example
     * // Create one PayoutRequest
     * const PayoutRequest = await prisma.payoutRequest.create({
     *   data: {
     *     // ... data to create a PayoutRequest
     *   }
     * })
     * 
     */
    create<T extends PayoutRequestCreateArgs>(args: SelectSubset<T, PayoutRequestCreateArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many PayoutRequests.
     * @param {PayoutRequestCreateManyArgs} args - Arguments to create many PayoutRequests.
     * @example
     * // Create many PayoutRequests
     * const payoutRequest = await prisma.payoutRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PayoutRequestCreateManyArgs>(args?: SelectSubset<T, PayoutRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PayoutRequests and returns the data saved in the database.
     * @param {PayoutRequestCreateManyAndReturnArgs} args - Arguments to create many PayoutRequests.
     * @example
     * // Create many PayoutRequests
     * const payoutRequest = await prisma.payoutRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PayoutRequests and only return the `id`
     * const payoutRequestWithIdOnly = await prisma.payoutRequest.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PayoutRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, PayoutRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a PayoutRequest.
     * @param {PayoutRequestDeleteArgs} args - Arguments to delete one PayoutRequest.
     * @example
     * // Delete one PayoutRequest
     * const PayoutRequest = await prisma.payoutRequest.delete({
     *   where: {
     *     // ... filter to delete one PayoutRequest
     *   }
     * })
     * 
     */
    delete<T extends PayoutRequestDeleteArgs>(args: SelectSubset<T, PayoutRequestDeleteArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one PayoutRequest.
     * @param {PayoutRequestUpdateArgs} args - Arguments to update one PayoutRequest.
     * @example
     * // Update one PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PayoutRequestUpdateArgs>(args: SelectSubset<T, PayoutRequestUpdateArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more PayoutRequests.
     * @param {PayoutRequestDeleteManyArgs} args - Arguments to filter PayoutRequests to delete.
     * @example
     * // Delete a few PayoutRequests
     * const { count } = await prisma.payoutRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PayoutRequestDeleteManyArgs>(args?: SelectSubset<T, PayoutRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PayoutRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PayoutRequests
     * const payoutRequest = await prisma.payoutRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PayoutRequestUpdateManyArgs>(args: SelectSubset<T, PayoutRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PayoutRequest.
     * @param {PayoutRequestUpsertArgs} args - Arguments to update or create a PayoutRequest.
     * @example
     * // Update or create a PayoutRequest
     * const payoutRequest = await prisma.payoutRequest.upsert({
     *   create: {
     *     // ... data to create a PayoutRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PayoutRequest we want to update
     *   }
     * })
     */
    upsert<T extends PayoutRequestUpsertArgs>(args: SelectSubset<T, PayoutRequestUpsertArgs<ExtArgs>>): Prisma__PayoutRequestClient<$Result.GetResult<Prisma.$PayoutRequestPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of PayoutRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestCountArgs} args - Arguments to filter PayoutRequests to count.
     * @example
     * // Count the number of PayoutRequests
     * const count = await prisma.payoutRequest.count({
     *   where: {
     *     // ... the filter for the PayoutRequests we want to count
     *   }
     * })
    **/
    count<T extends PayoutRequestCountArgs>(
      args?: Subset<T, PayoutRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PayoutRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PayoutRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PayoutRequestAggregateArgs>(args: Subset<T, PayoutRequestAggregateArgs>): Prisma.PrismaPromise<GetPayoutRequestAggregateType<T>>

    /**
     * Group by PayoutRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutRequestGroupByArgs} args - Group by arguments.
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
      T extends PayoutRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PayoutRequestGroupByArgs['orderBy'] }
        : { orderBy?: PayoutRequestGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PayoutRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPayoutRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PayoutRequest model
   */
  readonly fields: PayoutRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PayoutRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PayoutRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends CreatorProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfileDefaultArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the PayoutRequest model
   */ 
  interface PayoutRequestFieldRefs {
    readonly id: FieldRef<"PayoutRequest", 'String'>
    readonly creatorId: FieldRef<"PayoutRequest", 'String'>
    readonly amount: FieldRef<"PayoutRequest", 'Decimal'>
    readonly method: FieldRef<"PayoutRequest", 'String'>
    readonly accountDetails: FieldRef<"PayoutRequest", 'Json'>
    readonly status: FieldRef<"PayoutRequest", 'String'>
    readonly processedAt: FieldRef<"PayoutRequest", 'DateTime'>
    readonly createdAt: FieldRef<"PayoutRequest", 'DateTime'>
    readonly updatedAt: FieldRef<"PayoutRequest", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PayoutRequest findUnique
   */
  export type PayoutRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter, which PayoutRequest to fetch.
     */
    where: PayoutRequestWhereUniqueInput
  }

  /**
   * PayoutRequest findUniqueOrThrow
   */
  export type PayoutRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter, which PayoutRequest to fetch.
     */
    where: PayoutRequestWhereUniqueInput
  }

  /**
   * PayoutRequest findFirst
   */
  export type PayoutRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter, which PayoutRequest to fetch.
     */
    where?: PayoutRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutRequests to fetch.
     */
    orderBy?: PayoutRequestOrderByWithRelationInput | PayoutRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutRequests.
     */
    cursor?: PayoutRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutRequests.
     */
    distinct?: PayoutRequestScalarFieldEnum | PayoutRequestScalarFieldEnum[]
  }

  /**
   * PayoutRequest findFirstOrThrow
   */
  export type PayoutRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter, which PayoutRequest to fetch.
     */
    where?: PayoutRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutRequests to fetch.
     */
    orderBy?: PayoutRequestOrderByWithRelationInput | PayoutRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PayoutRequests.
     */
    cursor?: PayoutRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PayoutRequests.
     */
    distinct?: PayoutRequestScalarFieldEnum | PayoutRequestScalarFieldEnum[]
  }

  /**
   * PayoutRequest findMany
   */
  export type PayoutRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter, which PayoutRequests to fetch.
     */
    where?: PayoutRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PayoutRequests to fetch.
     */
    orderBy?: PayoutRequestOrderByWithRelationInput | PayoutRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PayoutRequests.
     */
    cursor?: PayoutRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PayoutRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PayoutRequests.
     */
    skip?: number
    distinct?: PayoutRequestScalarFieldEnum | PayoutRequestScalarFieldEnum[]
  }

  /**
   * PayoutRequest create
   */
  export type PayoutRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * The data needed to create a PayoutRequest.
     */
    data: XOR<PayoutRequestCreateInput, PayoutRequestUncheckedCreateInput>
  }

  /**
   * PayoutRequest createMany
   */
  export type PayoutRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PayoutRequests.
     */
    data: PayoutRequestCreateManyInput | PayoutRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PayoutRequest createManyAndReturn
   */
  export type PayoutRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many PayoutRequests.
     */
    data: PayoutRequestCreateManyInput | PayoutRequestCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PayoutRequest update
   */
  export type PayoutRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * The data needed to update a PayoutRequest.
     */
    data: XOR<PayoutRequestUpdateInput, PayoutRequestUncheckedUpdateInput>
    /**
     * Choose, which PayoutRequest to update.
     */
    where: PayoutRequestWhereUniqueInput
  }

  /**
   * PayoutRequest updateMany
   */
  export type PayoutRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PayoutRequests.
     */
    data: XOR<PayoutRequestUpdateManyMutationInput, PayoutRequestUncheckedUpdateManyInput>
    /**
     * Filter which PayoutRequests to update
     */
    where?: PayoutRequestWhereInput
  }

  /**
   * PayoutRequest upsert
   */
  export type PayoutRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * The filter to search for the PayoutRequest to update in case it exists.
     */
    where: PayoutRequestWhereUniqueInput
    /**
     * In case the PayoutRequest found by the `where` argument doesn't exist, create a new PayoutRequest with this data.
     */
    create: XOR<PayoutRequestCreateInput, PayoutRequestUncheckedCreateInput>
    /**
     * In case the PayoutRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PayoutRequestUpdateInput, PayoutRequestUncheckedUpdateInput>
  }

  /**
   * PayoutRequest delete
   */
  export type PayoutRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
    /**
     * Filter which PayoutRequest to delete.
     */
    where: PayoutRequestWhereUniqueInput
  }

  /**
   * PayoutRequest deleteMany
   */
  export type PayoutRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PayoutRequests to delete
     */
    where?: PayoutRequestWhereInput
  }

  /**
   * PayoutRequest without action
   */
  export type PayoutRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PayoutRequest
     */
    select?: PayoutRequestSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutRequestInclude<ExtArgs> | null
  }


  /**
   * Model Subscription
   */

  export type AggregateSubscription = {
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  export type SubscriptionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    creatorId: string | null
    tier: string | null
    status: string | null
    startDate: Date | null
    endDate: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriptionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    creatorId: string | null
    tier: string | null
    status: string | null
    startDate: Date | null
    endDate: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriptionCountAggregateOutputType = {
    id: number
    userId: number
    creatorId: number
    tier: number
    status: number
    startDate: number
    endDate: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubscriptionMinAggregateInputType = {
    id?: true
    userId?: true
    creatorId?: true
    tier?: true
    status?: true
    startDate?: true
    endDate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriptionMaxAggregateInputType = {
    id?: true
    userId?: true
    creatorId?: true
    tier?: true
    status?: true
    startDate?: true
    endDate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriptionCountAggregateInputType = {
    id?: true
    userId?: true
    creatorId?: true
    tier?: true
    status?: true
    startDate?: true
    endDate?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscription to aggregate.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subscriptions
    **/
    _count?: true | SubscriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubscriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubscriptionMaxAggregateInputType
  }

  export type GetSubscriptionAggregateType<T extends SubscriptionAggregateArgs> = {
        [P in keyof T & keyof AggregateSubscription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubscription[P]>
      : GetScalarType<T[P], AggregateSubscription[P]>
  }




  export type SubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriptionWhereInput
    orderBy?: SubscriptionOrderByWithAggregationInput | SubscriptionOrderByWithAggregationInput[]
    by: SubscriptionScalarFieldEnum[] | SubscriptionScalarFieldEnum
    having?: SubscriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubscriptionCountAggregateInputType | true
    _min?: SubscriptionMinAggregateInputType
    _max?: SubscriptionMaxAggregateInputType
  }

  export type SubscriptionGroupByOutputType = {
    id: string
    userId: string
    creatorId: string
    tier: string
    status: string
    startDate: Date
    endDate: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  type GetSubscriptionGroupByPayload<T extends SubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubscriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubscriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
            : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
        }
      >
    >


  export type SubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    creatorId?: boolean
    tier?: boolean
    status?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    creatorId?: boolean
    tier?: boolean
    status?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectScalar = {
    id?: boolean
    userId?: boolean
    creatorId?: boolean
    tier?: boolean
    status?: boolean
    startDate?: boolean
    endDate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubscriptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }
  export type SubscriptionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | CreatorProfileDefaultArgs<ExtArgs>
  }

  export type $SubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subscription"
    objects: {
      creator: Prisma.$CreatorProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      creatorId: string
      tier: string
      status: string
      startDate: Date
      endDate: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subscription"]>
    composites: {}
  }

  type SubscriptionGetPayload<S extends boolean | null | undefined | SubscriptionDefaultArgs> = $Result.GetResult<Prisma.$SubscriptionPayload, S>

  type SubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SubscriptionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SubscriptionCountAggregateInputType | true
    }

  export interface SubscriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subscription'], meta: { name: 'Subscription' } }
    /**
     * Find zero or one Subscription that matches the filter.
     * @param {SubscriptionFindUniqueArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubscriptionFindUniqueArgs>(args: SelectSubset<T, SubscriptionFindUniqueArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Subscription that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SubscriptionFindUniqueOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubscriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, SubscriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Subscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubscriptionFindFirstArgs>(args?: SelectSubset<T, SubscriptionFindFirstArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Subscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubscriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, SubscriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Subscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subscriptions
     * const subscriptions = await prisma.subscription.findMany()
     * 
     * // Get first 10 Subscriptions
     * const subscriptions = await prisma.subscription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubscriptionFindManyArgs>(args?: SelectSubset<T, SubscriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Subscription.
     * @param {SubscriptionCreateArgs} args - Arguments to create a Subscription.
     * @example
     * // Create one Subscription
     * const Subscription = await prisma.subscription.create({
     *   data: {
     *     // ... data to create a Subscription
     *   }
     * })
     * 
     */
    create<T extends SubscriptionCreateArgs>(args: SelectSubset<T, SubscriptionCreateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Subscriptions.
     * @param {SubscriptionCreateManyArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubscriptionCreateManyArgs>(args?: SelectSubset<T, SubscriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subscriptions and returns the data saved in the database.
     * @param {SubscriptionCreateManyAndReturnArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubscriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, SubscriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Subscription.
     * @param {SubscriptionDeleteArgs} args - Arguments to delete one Subscription.
     * @example
     * // Delete one Subscription
     * const Subscription = await prisma.subscription.delete({
     *   where: {
     *     // ... filter to delete one Subscription
     *   }
     * })
     * 
     */
    delete<T extends SubscriptionDeleteArgs>(args: SelectSubset<T, SubscriptionDeleteArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Subscription.
     * @param {SubscriptionUpdateArgs} args - Arguments to update one Subscription.
     * @example
     * // Update one Subscription
     * const subscription = await prisma.subscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubscriptionUpdateArgs>(args: SelectSubset<T, SubscriptionUpdateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Subscriptions.
     * @param {SubscriptionDeleteManyArgs} args - Arguments to filter Subscriptions to delete.
     * @example
     * // Delete a few Subscriptions
     * const { count } = await prisma.subscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubscriptionDeleteManyArgs>(args?: SelectSubset<T, SubscriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubscriptionUpdateManyArgs>(args: SelectSubset<T, SubscriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Subscription.
     * @param {SubscriptionUpsertArgs} args - Arguments to update or create a Subscription.
     * @example
     * // Update or create a Subscription
     * const subscription = await prisma.subscription.upsert({
     *   create: {
     *     // ... data to create a Subscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subscription we want to update
     *   }
     * })
     */
    upsert<T extends SubscriptionUpsertArgs>(args: SelectSubset<T, SubscriptionUpsertArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionCountArgs} args - Arguments to filter Subscriptions to count.
     * @example
     * // Count the number of Subscriptions
     * const count = await prisma.subscription.count({
     *   where: {
     *     // ... the filter for the Subscriptions we want to count
     *   }
     * })
    **/
    count<T extends SubscriptionCountArgs>(
      args?: Subset<T, SubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubscriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SubscriptionAggregateArgs>(args: Subset<T, SubscriptionAggregateArgs>): Prisma.PrismaPromise<GetSubscriptionAggregateType<T>>

    /**
     * Group by Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionGroupByArgs} args - Group by arguments.
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
      T extends SubscriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubscriptionGroupByArgs['orderBy'] }
        : { orderBy?: SubscriptionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SubscriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subscription model
   */
  readonly fields: SubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubscriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends CreatorProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CreatorProfileDefaultArgs<ExtArgs>>): Prisma__CreatorProfileClient<$Result.GetResult<Prisma.$CreatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Subscription model
   */ 
  interface SubscriptionFieldRefs {
    readonly id: FieldRef<"Subscription", 'String'>
    readonly userId: FieldRef<"Subscription", 'String'>
    readonly creatorId: FieldRef<"Subscription", 'String'>
    readonly tier: FieldRef<"Subscription", 'String'>
    readonly status: FieldRef<"Subscription", 'String'>
    readonly startDate: FieldRef<"Subscription", 'DateTime'>
    readonly endDate: FieldRef<"Subscription", 'DateTime'>
    readonly createdAt: FieldRef<"Subscription", 'DateTime'>
    readonly updatedAt: FieldRef<"Subscription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subscription findUnique
   */
  export type SubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findUniqueOrThrow
   */
  export type SubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findFirst
   */
  export type SubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findFirstOrThrow
   */
  export type SubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findMany
   */
  export type SubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscriptions to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription create
   */
  export type SubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to create a Subscription.
     */
    data: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
  }

  /**
   * Subscription createMany
   */
  export type SubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subscription createManyAndReturn
   */
  export type SubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subscription update
   */
  export type SubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to update a Subscription.
     */
    data: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
    /**
     * Choose, which Subscription to update.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription updateMany
   */
  export type SubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput
  }

  /**
   * Subscription upsert
   */
  export type SubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The filter to search for the Subscription to update in case it exists.
     */
    where: SubscriptionWhereUniqueInput
    /**
     * In case the Subscription found by the `where` argument doesn't exist, create a new Subscription with this data.
     */
    create: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
    /**
     * In case the Subscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
  }

  /**
   * Subscription delete
   */
  export type SubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter which Subscription to delete.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription deleteMany
   */
  export type SubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscriptions to delete
     */
    where?: SubscriptionWhereInput
  }

  /**
   * Subscription without action
   */
  export type SubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
  }


  /**
   * Model Tip
   */

  export type AggregateTip = {
    _count: TipCountAggregateOutputType | null
    _avg: TipAvgAggregateOutputType | null
    _sum: TipSumAggregateOutputType | null
    _min: TipMinAggregateOutputType | null
    _max: TipMaxAggregateOutputType | null
  }

  export type TipAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type TipSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type TipMinAggregateOutputType = {
    id: string | null
    fromUserId: string | null
    toUserId: string | null
    amount: Decimal | null
    createdAt: Date | null
  }

  export type TipMaxAggregateOutputType = {
    id: string | null
    fromUserId: string | null
    toUserId: string | null
    amount: Decimal | null
    createdAt: Date | null
  }

  export type TipCountAggregateOutputType = {
    id: number
    fromUserId: number
    toUserId: number
    amount: number
    createdAt: number
    _all: number
  }


  export type TipAvgAggregateInputType = {
    amount?: true
  }

  export type TipSumAggregateInputType = {
    amount?: true
  }

  export type TipMinAggregateInputType = {
    id?: true
    fromUserId?: true
    toUserId?: true
    amount?: true
    createdAt?: true
  }

  export type TipMaxAggregateInputType = {
    id?: true
    fromUserId?: true
    toUserId?: true
    amount?: true
    createdAt?: true
  }

  export type TipCountAggregateInputType = {
    id?: true
    fromUserId?: true
    toUserId?: true
    amount?: true
    createdAt?: true
    _all?: true
  }

  export type TipAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tip to aggregate.
     */
    where?: TipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tips to fetch.
     */
    orderBy?: TipOrderByWithRelationInput | TipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tips from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tips.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tips
    **/
    _count?: true | TipCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TipAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TipSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TipMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TipMaxAggregateInputType
  }

  export type GetTipAggregateType<T extends TipAggregateArgs> = {
        [P in keyof T & keyof AggregateTip]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTip[P]>
      : GetScalarType<T[P], AggregateTip[P]>
  }




  export type TipGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TipWhereInput
    orderBy?: TipOrderByWithAggregationInput | TipOrderByWithAggregationInput[]
    by: TipScalarFieldEnum[] | TipScalarFieldEnum
    having?: TipScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TipCountAggregateInputType | true
    _avg?: TipAvgAggregateInputType
    _sum?: TipSumAggregateInputType
    _min?: TipMinAggregateInputType
    _max?: TipMaxAggregateInputType
  }

  export type TipGroupByOutputType = {
    id: string
    fromUserId: string
    toUserId: string
    amount: Decimal
    createdAt: Date
    _count: TipCountAggregateOutputType | null
    _avg: TipAvgAggregateOutputType | null
    _sum: TipSumAggregateOutputType | null
    _min: TipMinAggregateOutputType | null
    _max: TipMaxAggregateOutputType | null
  }

  type GetTipGroupByPayload<T extends TipGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TipGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TipGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TipGroupByOutputType[P]>
            : GetScalarType<T[P], TipGroupByOutputType[P]>
        }
      >
    >


  export type TipSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromUserId?: boolean
    toUserId?: boolean
    amount?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["tip"]>

  export type TipSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromUserId?: boolean
    toUserId?: boolean
    amount?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["tip"]>

  export type TipSelectScalar = {
    id?: boolean
    fromUserId?: boolean
    toUserId?: boolean
    amount?: boolean
    createdAt?: boolean
  }


  export type $TipPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Tip"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fromUserId: string
      toUserId: string
      amount: Prisma.Decimal
      createdAt: Date
    }, ExtArgs["result"]["tip"]>
    composites: {}
  }

  type TipGetPayload<S extends boolean | null | undefined | TipDefaultArgs> = $Result.GetResult<Prisma.$TipPayload, S>

  type TipCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TipFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TipCountAggregateInputType | true
    }

  export interface TipDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Tip'], meta: { name: 'Tip' } }
    /**
     * Find zero or one Tip that matches the filter.
     * @param {TipFindUniqueArgs} args - Arguments to find a Tip
     * @example
     * // Get one Tip
     * const tip = await prisma.tip.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TipFindUniqueArgs>(args: SelectSubset<T, TipFindUniqueArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Tip that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TipFindUniqueOrThrowArgs} args - Arguments to find a Tip
     * @example
     * // Get one Tip
     * const tip = await prisma.tip.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TipFindUniqueOrThrowArgs>(args: SelectSubset<T, TipFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Tip that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipFindFirstArgs} args - Arguments to find a Tip
     * @example
     * // Get one Tip
     * const tip = await prisma.tip.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TipFindFirstArgs>(args?: SelectSubset<T, TipFindFirstArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Tip that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipFindFirstOrThrowArgs} args - Arguments to find a Tip
     * @example
     * // Get one Tip
     * const tip = await prisma.tip.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TipFindFirstOrThrowArgs>(args?: SelectSubset<T, TipFindFirstOrThrowArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Tips that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tips
     * const tips = await prisma.tip.findMany()
     * 
     * // Get first 10 Tips
     * const tips = await prisma.tip.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tipWithIdOnly = await prisma.tip.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TipFindManyArgs>(args?: SelectSubset<T, TipFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Tip.
     * @param {TipCreateArgs} args - Arguments to create a Tip.
     * @example
     * // Create one Tip
     * const Tip = await prisma.tip.create({
     *   data: {
     *     // ... data to create a Tip
     *   }
     * })
     * 
     */
    create<T extends TipCreateArgs>(args: SelectSubset<T, TipCreateArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Tips.
     * @param {TipCreateManyArgs} args - Arguments to create many Tips.
     * @example
     * // Create many Tips
     * const tip = await prisma.tip.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TipCreateManyArgs>(args?: SelectSubset<T, TipCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tips and returns the data saved in the database.
     * @param {TipCreateManyAndReturnArgs} args - Arguments to create many Tips.
     * @example
     * // Create many Tips
     * const tip = await prisma.tip.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tips and only return the `id`
     * const tipWithIdOnly = await prisma.tip.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TipCreateManyAndReturnArgs>(args?: SelectSubset<T, TipCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Tip.
     * @param {TipDeleteArgs} args - Arguments to delete one Tip.
     * @example
     * // Delete one Tip
     * const Tip = await prisma.tip.delete({
     *   where: {
     *     // ... filter to delete one Tip
     *   }
     * })
     * 
     */
    delete<T extends TipDeleteArgs>(args: SelectSubset<T, TipDeleteArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Tip.
     * @param {TipUpdateArgs} args - Arguments to update one Tip.
     * @example
     * // Update one Tip
     * const tip = await prisma.tip.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TipUpdateArgs>(args: SelectSubset<T, TipUpdateArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Tips.
     * @param {TipDeleteManyArgs} args - Arguments to filter Tips to delete.
     * @example
     * // Delete a few Tips
     * const { count } = await prisma.tip.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TipDeleteManyArgs>(args?: SelectSubset<T, TipDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tips.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tips
     * const tip = await prisma.tip.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TipUpdateManyArgs>(args: SelectSubset<T, TipUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Tip.
     * @param {TipUpsertArgs} args - Arguments to update or create a Tip.
     * @example
     * // Update or create a Tip
     * const tip = await prisma.tip.upsert({
     *   create: {
     *     // ... data to create a Tip
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tip we want to update
     *   }
     * })
     */
    upsert<T extends TipUpsertArgs>(args: SelectSubset<T, TipUpsertArgs<ExtArgs>>): Prisma__TipClient<$Result.GetResult<Prisma.$TipPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Tips.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipCountArgs} args - Arguments to filter Tips to count.
     * @example
     * // Count the number of Tips
     * const count = await prisma.tip.count({
     *   where: {
     *     // ... the filter for the Tips we want to count
     *   }
     * })
    **/
    count<T extends TipCountArgs>(
      args?: Subset<T, TipCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TipCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tip.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TipAggregateArgs>(args: Subset<T, TipAggregateArgs>): Prisma.PrismaPromise<GetTipAggregateType<T>>

    /**
     * Group by Tip.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TipGroupByArgs} args - Group by arguments.
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
      T extends TipGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TipGroupByArgs['orderBy'] }
        : { orderBy?: TipGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TipGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTipGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Tip model
   */
  readonly fields: TipFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Tip.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TipClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Tip model
   */ 
  interface TipFieldRefs {
    readonly id: FieldRef<"Tip", 'String'>
    readonly fromUserId: FieldRef<"Tip", 'String'>
    readonly toUserId: FieldRef<"Tip", 'String'>
    readonly amount: FieldRef<"Tip", 'Decimal'>
    readonly createdAt: FieldRef<"Tip", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Tip findUnique
   */
  export type TipFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter, which Tip to fetch.
     */
    where: TipWhereUniqueInput
  }

  /**
   * Tip findUniqueOrThrow
   */
  export type TipFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter, which Tip to fetch.
     */
    where: TipWhereUniqueInput
  }

  /**
   * Tip findFirst
   */
  export type TipFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter, which Tip to fetch.
     */
    where?: TipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tips to fetch.
     */
    orderBy?: TipOrderByWithRelationInput | TipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tips.
     */
    cursor?: TipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tips from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tips.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tips.
     */
    distinct?: TipScalarFieldEnum | TipScalarFieldEnum[]
  }

  /**
   * Tip findFirstOrThrow
   */
  export type TipFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter, which Tip to fetch.
     */
    where?: TipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tips to fetch.
     */
    orderBy?: TipOrderByWithRelationInput | TipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tips.
     */
    cursor?: TipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tips from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tips.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tips.
     */
    distinct?: TipScalarFieldEnum | TipScalarFieldEnum[]
  }

  /**
   * Tip findMany
   */
  export type TipFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter, which Tips to fetch.
     */
    where?: TipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tips to fetch.
     */
    orderBy?: TipOrderByWithRelationInput | TipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tips.
     */
    cursor?: TipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tips from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tips.
     */
    skip?: number
    distinct?: TipScalarFieldEnum | TipScalarFieldEnum[]
  }

  /**
   * Tip create
   */
  export type TipCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * The data needed to create a Tip.
     */
    data: XOR<TipCreateInput, TipUncheckedCreateInput>
  }

  /**
   * Tip createMany
   */
  export type TipCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tips.
     */
    data: TipCreateManyInput | TipCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tip createManyAndReturn
   */
  export type TipCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Tips.
     */
    data: TipCreateManyInput | TipCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Tip update
   */
  export type TipUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * The data needed to update a Tip.
     */
    data: XOR<TipUpdateInput, TipUncheckedUpdateInput>
    /**
     * Choose, which Tip to update.
     */
    where: TipWhereUniqueInput
  }

  /**
   * Tip updateMany
   */
  export type TipUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tips.
     */
    data: XOR<TipUpdateManyMutationInput, TipUncheckedUpdateManyInput>
    /**
     * Filter which Tips to update
     */
    where?: TipWhereInput
  }

  /**
   * Tip upsert
   */
  export type TipUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * The filter to search for the Tip to update in case it exists.
     */
    where: TipWhereUniqueInput
    /**
     * In case the Tip found by the `where` argument doesn't exist, create a new Tip with this data.
     */
    create: XOR<TipCreateInput, TipUncheckedCreateInput>
    /**
     * In case the Tip was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TipUpdateInput, TipUncheckedUpdateInput>
  }

  /**
   * Tip delete
   */
  export type TipDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
    /**
     * Filter which Tip to delete.
     */
    where: TipWhereUniqueInput
  }

  /**
   * Tip deleteMany
   */
  export type TipDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tips to delete
     */
    where?: TipWhereInput
  }

  /**
   * Tip without action
   */
  export type TipDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Tip
     */
    select?: TipSelect<ExtArgs> | null
  }


  /**
   * Model VerificationDocument
   */

  export type AggregateVerificationDocument = {
    _count: VerificationDocumentCountAggregateOutputType | null
    _min: VerificationDocumentMinAggregateOutputType | null
    _max: VerificationDocumentMaxAggregateOutputType | null
  }

  export type VerificationDocumentMinAggregateOutputType = {
    id: string | null
    userId: string | null
    documentType: string | null
    documentUrl: string | null
    status: string | null
    reviewedBy: string | null
    reviewedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationDocumentMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    documentType: string | null
    documentUrl: string | null
    status: string | null
    reviewedBy: string | null
    reviewedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationDocumentCountAggregateOutputType = {
    id: number
    userId: number
    documentType: number
    documentUrl: number
    status: number
    reviewedBy: number
    reviewedAt: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VerificationDocumentMinAggregateInputType = {
    id?: true
    userId?: true
    documentType?: true
    documentUrl?: true
    status?: true
    reviewedBy?: true
    reviewedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationDocumentMaxAggregateInputType = {
    id?: true
    userId?: true
    documentType?: true
    documentUrl?: true
    status?: true
    reviewedBy?: true
    reviewedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationDocumentCountAggregateInputType = {
    id?: true
    userId?: true
    documentType?: true
    documentUrl?: true
    status?: true
    reviewedBy?: true
    reviewedAt?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VerificationDocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationDocument to aggregate.
     */
    where?: VerificationDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationDocuments to fetch.
     */
    orderBy?: VerificationDocumentOrderByWithRelationInput | VerificationDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationDocuments
    **/
    _count?: true | VerificationDocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationDocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationDocumentMaxAggregateInputType
  }

  export type GetVerificationDocumentAggregateType<T extends VerificationDocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationDocument[P]>
      : GetScalarType<T[P], AggregateVerificationDocument[P]>
  }




  export type VerificationDocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationDocumentWhereInput
    orderBy?: VerificationDocumentOrderByWithAggregationInput | VerificationDocumentOrderByWithAggregationInput[]
    by: VerificationDocumentScalarFieldEnum[] | VerificationDocumentScalarFieldEnum
    having?: VerificationDocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationDocumentCountAggregateInputType | true
    _min?: VerificationDocumentMinAggregateInputType
    _max?: VerificationDocumentMaxAggregateInputType
  }

  export type VerificationDocumentGroupByOutputType = {
    id: string
    userId: string
    documentType: string
    documentUrl: string
    status: string
    reviewedBy: string | null
    reviewedAt: Date | null
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: VerificationDocumentCountAggregateOutputType | null
    _min: VerificationDocumentMinAggregateOutputType | null
    _max: VerificationDocumentMaxAggregateOutputType | null
  }

  type GetVerificationDocumentGroupByPayload<T extends VerificationDocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationDocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationDocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationDocumentGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationDocumentGroupByOutputType[P]>
        }
      >
    >


  export type VerificationDocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    documentType?: boolean
    documentUrl?: boolean
    status?: boolean
    reviewedBy?: boolean
    reviewedAt?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["verificationDocument"]>

  export type VerificationDocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    documentType?: boolean
    documentUrl?: boolean
    status?: boolean
    reviewedBy?: boolean
    reviewedAt?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["verificationDocument"]>

  export type VerificationDocumentSelectScalar = {
    id?: boolean
    userId?: boolean
    documentType?: boolean
    documentUrl?: boolean
    status?: boolean
    reviewedBy?: boolean
    reviewedAt?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $VerificationDocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationDocument"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      documentType: string
      documentUrl: string
      status: string
      reviewedBy: string | null
      reviewedAt: Date | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["verificationDocument"]>
    composites: {}
  }

  type VerificationDocumentGetPayload<S extends boolean | null | undefined | VerificationDocumentDefaultArgs> = $Result.GetResult<Prisma.$VerificationDocumentPayload, S>

  type VerificationDocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VerificationDocumentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VerificationDocumentCountAggregateInputType | true
    }

  export interface VerificationDocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationDocument'], meta: { name: 'VerificationDocument' } }
    /**
     * Find zero or one VerificationDocument that matches the filter.
     * @param {VerificationDocumentFindUniqueArgs} args - Arguments to find a VerificationDocument
     * @example
     * // Get one VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationDocumentFindUniqueArgs>(args: SelectSubset<T, VerificationDocumentFindUniqueArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one VerificationDocument that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VerificationDocumentFindUniqueOrThrowArgs} args - Arguments to find a VerificationDocument
     * @example
     * // Get one VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationDocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationDocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first VerificationDocument that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentFindFirstArgs} args - Arguments to find a VerificationDocument
     * @example
     * // Get one VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationDocumentFindFirstArgs>(args?: SelectSubset<T, VerificationDocumentFindFirstArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first VerificationDocument that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentFindFirstOrThrowArgs} args - Arguments to find a VerificationDocument
     * @example
     * // Get one VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationDocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationDocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more VerificationDocuments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationDocuments
     * const verificationDocuments = await prisma.verificationDocument.findMany()
     * 
     * // Get first 10 VerificationDocuments
     * const verificationDocuments = await prisma.verificationDocument.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationDocumentWithIdOnly = await prisma.verificationDocument.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationDocumentFindManyArgs>(args?: SelectSubset<T, VerificationDocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a VerificationDocument.
     * @param {VerificationDocumentCreateArgs} args - Arguments to create a VerificationDocument.
     * @example
     * // Create one VerificationDocument
     * const VerificationDocument = await prisma.verificationDocument.create({
     *   data: {
     *     // ... data to create a VerificationDocument
     *   }
     * })
     * 
     */
    create<T extends VerificationDocumentCreateArgs>(args: SelectSubset<T, VerificationDocumentCreateArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many VerificationDocuments.
     * @param {VerificationDocumentCreateManyArgs} args - Arguments to create many VerificationDocuments.
     * @example
     * // Create many VerificationDocuments
     * const verificationDocument = await prisma.verificationDocument.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationDocumentCreateManyArgs>(args?: SelectSubset<T, VerificationDocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationDocuments and returns the data saved in the database.
     * @param {VerificationDocumentCreateManyAndReturnArgs} args - Arguments to create many VerificationDocuments.
     * @example
     * // Create many VerificationDocuments
     * const verificationDocument = await prisma.verificationDocument.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationDocuments and only return the `id`
     * const verificationDocumentWithIdOnly = await prisma.verificationDocument.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationDocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationDocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a VerificationDocument.
     * @param {VerificationDocumentDeleteArgs} args - Arguments to delete one VerificationDocument.
     * @example
     * // Delete one VerificationDocument
     * const VerificationDocument = await prisma.verificationDocument.delete({
     *   where: {
     *     // ... filter to delete one VerificationDocument
     *   }
     * })
     * 
     */
    delete<T extends VerificationDocumentDeleteArgs>(args: SelectSubset<T, VerificationDocumentDeleteArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one VerificationDocument.
     * @param {VerificationDocumentUpdateArgs} args - Arguments to update one VerificationDocument.
     * @example
     * // Update one VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationDocumentUpdateArgs>(args: SelectSubset<T, VerificationDocumentUpdateArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more VerificationDocuments.
     * @param {VerificationDocumentDeleteManyArgs} args - Arguments to filter VerificationDocuments to delete.
     * @example
     * // Delete a few VerificationDocuments
     * const { count } = await prisma.verificationDocument.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationDocumentDeleteManyArgs>(args?: SelectSubset<T, VerificationDocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationDocuments
     * const verificationDocument = await prisma.verificationDocument.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationDocumentUpdateManyArgs>(args: SelectSubset<T, VerificationDocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one VerificationDocument.
     * @param {VerificationDocumentUpsertArgs} args - Arguments to update or create a VerificationDocument.
     * @example
     * // Update or create a VerificationDocument
     * const verificationDocument = await prisma.verificationDocument.upsert({
     *   create: {
     *     // ... data to create a VerificationDocument
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationDocument we want to update
     *   }
     * })
     */
    upsert<T extends VerificationDocumentUpsertArgs>(args: SelectSubset<T, VerificationDocumentUpsertArgs<ExtArgs>>): Prisma__VerificationDocumentClient<$Result.GetResult<Prisma.$VerificationDocumentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of VerificationDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentCountArgs} args - Arguments to filter VerificationDocuments to count.
     * @example
     * // Count the number of VerificationDocuments
     * const count = await prisma.verificationDocument.count({
     *   where: {
     *     // ... the filter for the VerificationDocuments we want to count
     *   }
     * })
    **/
    count<T extends VerificationDocumentCountArgs>(
      args?: Subset<T, VerificationDocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationDocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends VerificationDocumentAggregateArgs>(args: Subset<T, VerificationDocumentAggregateArgs>): Prisma.PrismaPromise<GetVerificationDocumentAggregateType<T>>

    /**
     * Group by VerificationDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationDocumentGroupByArgs} args - Group by arguments.
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
      T extends VerificationDocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationDocumentGroupByArgs['orderBy'] }
        : { orderBy?: VerificationDocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, VerificationDocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationDocument model
   */
  readonly fields: VerificationDocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationDocument.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationDocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the VerificationDocument model
   */ 
  interface VerificationDocumentFieldRefs {
    readonly id: FieldRef<"VerificationDocument", 'String'>
    readonly userId: FieldRef<"VerificationDocument", 'String'>
    readonly documentType: FieldRef<"VerificationDocument", 'String'>
    readonly documentUrl: FieldRef<"VerificationDocument", 'String'>
    readonly status: FieldRef<"VerificationDocument", 'String'>
    readonly reviewedBy: FieldRef<"VerificationDocument", 'String'>
    readonly reviewedAt: FieldRef<"VerificationDocument", 'DateTime'>
    readonly metadata: FieldRef<"VerificationDocument", 'Json'>
    readonly createdAt: FieldRef<"VerificationDocument", 'DateTime'>
    readonly updatedAt: FieldRef<"VerificationDocument", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationDocument findUnique
   */
  export type VerificationDocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter, which VerificationDocument to fetch.
     */
    where: VerificationDocumentWhereUniqueInput
  }

  /**
   * VerificationDocument findUniqueOrThrow
   */
  export type VerificationDocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter, which VerificationDocument to fetch.
     */
    where: VerificationDocumentWhereUniqueInput
  }

  /**
   * VerificationDocument findFirst
   */
  export type VerificationDocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter, which VerificationDocument to fetch.
     */
    where?: VerificationDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationDocuments to fetch.
     */
    orderBy?: VerificationDocumentOrderByWithRelationInput | VerificationDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationDocuments.
     */
    cursor?: VerificationDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationDocuments.
     */
    distinct?: VerificationDocumentScalarFieldEnum | VerificationDocumentScalarFieldEnum[]
  }

  /**
   * VerificationDocument findFirstOrThrow
   */
  export type VerificationDocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter, which VerificationDocument to fetch.
     */
    where?: VerificationDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationDocuments to fetch.
     */
    orderBy?: VerificationDocumentOrderByWithRelationInput | VerificationDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationDocuments.
     */
    cursor?: VerificationDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationDocuments.
     */
    distinct?: VerificationDocumentScalarFieldEnum | VerificationDocumentScalarFieldEnum[]
  }

  /**
   * VerificationDocument findMany
   */
  export type VerificationDocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter, which VerificationDocuments to fetch.
     */
    where?: VerificationDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationDocuments to fetch.
     */
    orderBy?: VerificationDocumentOrderByWithRelationInput | VerificationDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationDocuments.
     */
    cursor?: VerificationDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationDocuments.
     */
    skip?: number
    distinct?: VerificationDocumentScalarFieldEnum | VerificationDocumentScalarFieldEnum[]
  }

  /**
   * VerificationDocument create
   */
  export type VerificationDocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * The data needed to create a VerificationDocument.
     */
    data: XOR<VerificationDocumentCreateInput, VerificationDocumentUncheckedCreateInput>
  }

  /**
   * VerificationDocument createMany
   */
  export type VerificationDocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationDocuments.
     */
    data: VerificationDocumentCreateManyInput | VerificationDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationDocument createManyAndReturn
   */
  export type VerificationDocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many VerificationDocuments.
     */
    data: VerificationDocumentCreateManyInput | VerificationDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationDocument update
   */
  export type VerificationDocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * The data needed to update a VerificationDocument.
     */
    data: XOR<VerificationDocumentUpdateInput, VerificationDocumentUncheckedUpdateInput>
    /**
     * Choose, which VerificationDocument to update.
     */
    where: VerificationDocumentWhereUniqueInput
  }

  /**
   * VerificationDocument updateMany
   */
  export type VerificationDocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationDocuments.
     */
    data: XOR<VerificationDocumentUpdateManyMutationInput, VerificationDocumentUncheckedUpdateManyInput>
    /**
     * Filter which VerificationDocuments to update
     */
    where?: VerificationDocumentWhereInput
  }

  /**
   * VerificationDocument upsert
   */
  export type VerificationDocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * The filter to search for the VerificationDocument to update in case it exists.
     */
    where: VerificationDocumentWhereUniqueInput
    /**
     * In case the VerificationDocument found by the `where` argument doesn't exist, create a new VerificationDocument with this data.
     */
    create: XOR<VerificationDocumentCreateInput, VerificationDocumentUncheckedCreateInput>
    /**
     * In case the VerificationDocument was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationDocumentUpdateInput, VerificationDocumentUncheckedUpdateInput>
  }

  /**
   * VerificationDocument delete
   */
  export type VerificationDocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
    /**
     * Filter which VerificationDocument to delete.
     */
    where: VerificationDocumentWhereUniqueInput
  }

  /**
   * VerificationDocument deleteMany
   */
  export type VerificationDocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationDocuments to delete
     */
    where?: VerificationDocumentWhereInput
  }

  /**
   * VerificationDocument without action
   */
  export type VerificationDocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationDocument
     */
    select?: VerificationDocumentSelect<ExtArgs> | null
  }


  /**
   * Model MediaUpload
   */

  export type AggregateMediaUpload = {
    _count: MediaUploadCountAggregateOutputType | null
    _avg: MediaUploadAvgAggregateOutputType | null
    _sum: MediaUploadSumAggregateOutputType | null
    _min: MediaUploadMinAggregateOutputType | null
    _max: MediaUploadMaxAggregateOutputType | null
  }

  export type MediaUploadAvgAggregateOutputType = {
    size: number | null
  }

  export type MediaUploadSumAggregateOutputType = {
    size: bigint | null
  }

  export type MediaUploadMinAggregateOutputType = {
    id: string | null
    userId: string | null
    fileName: string | null
    mimeType: string | null
    size: bigint | null
    status: string | null
    uploadId: string | null
    assetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MediaUploadMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    fileName: string | null
    mimeType: string | null
    size: bigint | null
    status: string | null
    uploadId: string | null
    assetId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type MediaUploadCountAggregateOutputType = {
    id: number
    userId: number
    fileName: number
    mimeType: number
    size: number
    status: number
    uploadId: number
    assetId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type MediaUploadAvgAggregateInputType = {
    size?: true
  }

  export type MediaUploadSumAggregateInputType = {
    size?: true
  }

  export type MediaUploadMinAggregateInputType = {
    id?: true
    userId?: true
    fileName?: true
    mimeType?: true
    size?: true
    status?: true
    uploadId?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MediaUploadMaxAggregateInputType = {
    id?: true
    userId?: true
    fileName?: true
    mimeType?: true
    size?: true
    status?: true
    uploadId?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type MediaUploadCountAggregateInputType = {
    id?: true
    userId?: true
    fileName?: true
    mimeType?: true
    size?: true
    status?: true
    uploadId?: true
    assetId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type MediaUploadAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MediaUpload to aggregate.
     */
    where?: MediaUploadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MediaUploads to fetch.
     */
    orderBy?: MediaUploadOrderByWithRelationInput | MediaUploadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MediaUploadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MediaUploads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MediaUploads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MediaUploads
    **/
    _count?: true | MediaUploadCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MediaUploadAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MediaUploadSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MediaUploadMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MediaUploadMaxAggregateInputType
  }

  export type GetMediaUploadAggregateType<T extends MediaUploadAggregateArgs> = {
        [P in keyof T & keyof AggregateMediaUpload]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMediaUpload[P]>
      : GetScalarType<T[P], AggregateMediaUpload[P]>
  }




  export type MediaUploadGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MediaUploadWhereInput
    orderBy?: MediaUploadOrderByWithAggregationInput | MediaUploadOrderByWithAggregationInput[]
    by: MediaUploadScalarFieldEnum[] | MediaUploadScalarFieldEnum
    having?: MediaUploadScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MediaUploadCountAggregateInputType | true
    _avg?: MediaUploadAvgAggregateInputType
    _sum?: MediaUploadSumAggregateInputType
    _min?: MediaUploadMinAggregateInputType
    _max?: MediaUploadMaxAggregateInputType
  }

  export type MediaUploadGroupByOutputType = {
    id: string
    userId: string
    fileName: string
    mimeType: string
    size: bigint
    status: string
    uploadId: string
    assetId: string | null
    createdAt: Date
    updatedAt: Date
    _count: MediaUploadCountAggregateOutputType | null
    _avg: MediaUploadAvgAggregateOutputType | null
    _sum: MediaUploadSumAggregateOutputType | null
    _min: MediaUploadMinAggregateOutputType | null
    _max: MediaUploadMaxAggregateOutputType | null
  }

  type GetMediaUploadGroupByPayload<T extends MediaUploadGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MediaUploadGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MediaUploadGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MediaUploadGroupByOutputType[P]>
            : GetScalarType<T[P], MediaUploadGroupByOutputType[P]>
        }
      >
    >


  export type MediaUploadSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    fileName?: boolean
    mimeType?: boolean
    size?: boolean
    status?: boolean
    uploadId?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["mediaUpload"]>

  export type MediaUploadSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    fileName?: boolean
    mimeType?: boolean
    size?: boolean
    status?: boolean
    uploadId?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["mediaUpload"]>

  export type MediaUploadSelectScalar = {
    id?: boolean
    userId?: boolean
    fileName?: boolean
    mimeType?: boolean
    size?: boolean
    status?: boolean
    uploadId?: boolean
    assetId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $MediaUploadPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MediaUpload"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      fileName: string
      mimeType: string
      size: bigint
      status: string
      uploadId: string
      assetId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["mediaUpload"]>
    composites: {}
  }

  type MediaUploadGetPayload<S extends boolean | null | undefined | MediaUploadDefaultArgs> = $Result.GetResult<Prisma.$MediaUploadPayload, S>

  type MediaUploadCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MediaUploadFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MediaUploadCountAggregateInputType | true
    }

  export interface MediaUploadDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MediaUpload'], meta: { name: 'MediaUpload' } }
    /**
     * Find zero or one MediaUpload that matches the filter.
     * @param {MediaUploadFindUniqueArgs} args - Arguments to find a MediaUpload
     * @example
     * // Get one MediaUpload
     * const mediaUpload = await prisma.mediaUpload.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MediaUploadFindUniqueArgs>(args: SelectSubset<T, MediaUploadFindUniqueArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one MediaUpload that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MediaUploadFindUniqueOrThrowArgs} args - Arguments to find a MediaUpload
     * @example
     * // Get one MediaUpload
     * const mediaUpload = await prisma.mediaUpload.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MediaUploadFindUniqueOrThrowArgs>(args: SelectSubset<T, MediaUploadFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first MediaUpload that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadFindFirstArgs} args - Arguments to find a MediaUpload
     * @example
     * // Get one MediaUpload
     * const mediaUpload = await prisma.mediaUpload.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MediaUploadFindFirstArgs>(args?: SelectSubset<T, MediaUploadFindFirstArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first MediaUpload that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadFindFirstOrThrowArgs} args - Arguments to find a MediaUpload
     * @example
     * // Get one MediaUpload
     * const mediaUpload = await prisma.mediaUpload.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MediaUploadFindFirstOrThrowArgs>(args?: SelectSubset<T, MediaUploadFindFirstOrThrowArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more MediaUploads that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MediaUploads
     * const mediaUploads = await prisma.mediaUpload.findMany()
     * 
     * // Get first 10 MediaUploads
     * const mediaUploads = await prisma.mediaUpload.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const mediaUploadWithIdOnly = await prisma.mediaUpload.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MediaUploadFindManyArgs>(args?: SelectSubset<T, MediaUploadFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a MediaUpload.
     * @param {MediaUploadCreateArgs} args - Arguments to create a MediaUpload.
     * @example
     * // Create one MediaUpload
     * const MediaUpload = await prisma.mediaUpload.create({
     *   data: {
     *     // ... data to create a MediaUpload
     *   }
     * })
     * 
     */
    create<T extends MediaUploadCreateArgs>(args: SelectSubset<T, MediaUploadCreateArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many MediaUploads.
     * @param {MediaUploadCreateManyArgs} args - Arguments to create many MediaUploads.
     * @example
     * // Create many MediaUploads
     * const mediaUpload = await prisma.mediaUpload.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MediaUploadCreateManyArgs>(args?: SelectSubset<T, MediaUploadCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many MediaUploads and returns the data saved in the database.
     * @param {MediaUploadCreateManyAndReturnArgs} args - Arguments to create many MediaUploads.
     * @example
     * // Create many MediaUploads
     * const mediaUpload = await prisma.mediaUpload.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many MediaUploads and only return the `id`
     * const mediaUploadWithIdOnly = await prisma.mediaUpload.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MediaUploadCreateManyAndReturnArgs>(args?: SelectSubset<T, MediaUploadCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a MediaUpload.
     * @param {MediaUploadDeleteArgs} args - Arguments to delete one MediaUpload.
     * @example
     * // Delete one MediaUpload
     * const MediaUpload = await prisma.mediaUpload.delete({
     *   where: {
     *     // ... filter to delete one MediaUpload
     *   }
     * })
     * 
     */
    delete<T extends MediaUploadDeleteArgs>(args: SelectSubset<T, MediaUploadDeleteArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one MediaUpload.
     * @param {MediaUploadUpdateArgs} args - Arguments to update one MediaUpload.
     * @example
     * // Update one MediaUpload
     * const mediaUpload = await prisma.mediaUpload.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MediaUploadUpdateArgs>(args: SelectSubset<T, MediaUploadUpdateArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more MediaUploads.
     * @param {MediaUploadDeleteManyArgs} args - Arguments to filter MediaUploads to delete.
     * @example
     * // Delete a few MediaUploads
     * const { count } = await prisma.mediaUpload.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MediaUploadDeleteManyArgs>(args?: SelectSubset<T, MediaUploadDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MediaUploads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MediaUploads
     * const mediaUpload = await prisma.mediaUpload.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MediaUploadUpdateManyArgs>(args: SelectSubset<T, MediaUploadUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one MediaUpload.
     * @param {MediaUploadUpsertArgs} args - Arguments to update or create a MediaUpload.
     * @example
     * // Update or create a MediaUpload
     * const mediaUpload = await prisma.mediaUpload.upsert({
     *   create: {
     *     // ... data to create a MediaUpload
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MediaUpload we want to update
     *   }
     * })
     */
    upsert<T extends MediaUploadUpsertArgs>(args: SelectSubset<T, MediaUploadUpsertArgs<ExtArgs>>): Prisma__MediaUploadClient<$Result.GetResult<Prisma.$MediaUploadPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of MediaUploads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadCountArgs} args - Arguments to filter MediaUploads to count.
     * @example
     * // Count the number of MediaUploads
     * const count = await prisma.mediaUpload.count({
     *   where: {
     *     // ... the filter for the MediaUploads we want to count
     *   }
     * })
    **/
    count<T extends MediaUploadCountArgs>(
      args?: Subset<T, MediaUploadCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MediaUploadCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MediaUpload.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MediaUploadAggregateArgs>(args: Subset<T, MediaUploadAggregateArgs>): Prisma.PrismaPromise<GetMediaUploadAggregateType<T>>

    /**
     * Group by MediaUpload.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MediaUploadGroupByArgs} args - Group by arguments.
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
      T extends MediaUploadGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MediaUploadGroupByArgs['orderBy'] }
        : { orderBy?: MediaUploadGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, MediaUploadGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMediaUploadGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MediaUpload model
   */
  readonly fields: MediaUploadFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MediaUpload.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MediaUploadClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the MediaUpload model
   */ 
  interface MediaUploadFieldRefs {
    readonly id: FieldRef<"MediaUpload", 'String'>
    readonly userId: FieldRef<"MediaUpload", 'String'>
    readonly fileName: FieldRef<"MediaUpload", 'String'>
    readonly mimeType: FieldRef<"MediaUpload", 'String'>
    readonly size: FieldRef<"MediaUpload", 'BigInt'>
    readonly status: FieldRef<"MediaUpload", 'String'>
    readonly uploadId: FieldRef<"MediaUpload", 'String'>
    readonly assetId: FieldRef<"MediaUpload", 'String'>
    readonly createdAt: FieldRef<"MediaUpload", 'DateTime'>
    readonly updatedAt: FieldRef<"MediaUpload", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MediaUpload findUnique
   */
  export type MediaUploadFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter, which MediaUpload to fetch.
     */
    where: MediaUploadWhereUniqueInput
  }

  /**
   * MediaUpload findUniqueOrThrow
   */
  export type MediaUploadFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter, which MediaUpload to fetch.
     */
    where: MediaUploadWhereUniqueInput
  }

  /**
   * MediaUpload findFirst
   */
  export type MediaUploadFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter, which MediaUpload to fetch.
     */
    where?: MediaUploadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MediaUploads to fetch.
     */
    orderBy?: MediaUploadOrderByWithRelationInput | MediaUploadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MediaUploads.
     */
    cursor?: MediaUploadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MediaUploads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MediaUploads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MediaUploads.
     */
    distinct?: MediaUploadScalarFieldEnum | MediaUploadScalarFieldEnum[]
  }

  /**
   * MediaUpload findFirstOrThrow
   */
  export type MediaUploadFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter, which MediaUpload to fetch.
     */
    where?: MediaUploadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MediaUploads to fetch.
     */
    orderBy?: MediaUploadOrderByWithRelationInput | MediaUploadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MediaUploads.
     */
    cursor?: MediaUploadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MediaUploads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MediaUploads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MediaUploads.
     */
    distinct?: MediaUploadScalarFieldEnum | MediaUploadScalarFieldEnum[]
  }

  /**
   * MediaUpload findMany
   */
  export type MediaUploadFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter, which MediaUploads to fetch.
     */
    where?: MediaUploadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MediaUploads to fetch.
     */
    orderBy?: MediaUploadOrderByWithRelationInput | MediaUploadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MediaUploads.
     */
    cursor?: MediaUploadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MediaUploads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MediaUploads.
     */
    skip?: number
    distinct?: MediaUploadScalarFieldEnum | MediaUploadScalarFieldEnum[]
  }

  /**
   * MediaUpload create
   */
  export type MediaUploadCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * The data needed to create a MediaUpload.
     */
    data: XOR<MediaUploadCreateInput, MediaUploadUncheckedCreateInput>
  }

  /**
   * MediaUpload createMany
   */
  export type MediaUploadCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MediaUploads.
     */
    data: MediaUploadCreateManyInput | MediaUploadCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MediaUpload createManyAndReturn
   */
  export type MediaUploadCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many MediaUploads.
     */
    data: MediaUploadCreateManyInput | MediaUploadCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MediaUpload update
   */
  export type MediaUploadUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * The data needed to update a MediaUpload.
     */
    data: XOR<MediaUploadUpdateInput, MediaUploadUncheckedUpdateInput>
    /**
     * Choose, which MediaUpload to update.
     */
    where: MediaUploadWhereUniqueInput
  }

  /**
   * MediaUpload updateMany
   */
  export type MediaUploadUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MediaUploads.
     */
    data: XOR<MediaUploadUpdateManyMutationInput, MediaUploadUncheckedUpdateManyInput>
    /**
     * Filter which MediaUploads to update
     */
    where?: MediaUploadWhereInput
  }

  /**
   * MediaUpload upsert
   */
  export type MediaUploadUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * The filter to search for the MediaUpload to update in case it exists.
     */
    where: MediaUploadWhereUniqueInput
    /**
     * In case the MediaUpload found by the `where` argument doesn't exist, create a new MediaUpload with this data.
     */
    create: XOR<MediaUploadCreateInput, MediaUploadUncheckedCreateInput>
    /**
     * In case the MediaUpload was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MediaUploadUpdateInput, MediaUploadUncheckedUpdateInput>
  }

  /**
   * MediaUpload delete
   */
  export type MediaUploadDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
    /**
     * Filter which MediaUpload to delete.
     */
    where: MediaUploadWhereUniqueInput
  }

  /**
   * MediaUpload deleteMany
   */
  export type MediaUploadDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MediaUploads to delete
     */
    where?: MediaUploadWhereInput
  }

  /**
   * MediaUpload without action
   */
  export type MediaUploadDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MediaUpload
     */
    select?: MediaUploadSelect<ExtArgs> | null
  }


  /**
   * Model ContentItem
   */

  export type AggregateContentItem = {
    _count: ContentItemCountAggregateOutputType | null
    _min: ContentItemMinAggregateOutputType | null
    _max: ContentItemMaxAggregateOutputType | null
  }

  export type ContentItemMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    thumbnail: string | null
    mediaUrl: string | null
    universeId: string | null
    creatorId: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContentItemMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    thumbnail: string | null
    mediaUrl: string | null
    universeId: string | null
    creatorId: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContentItemCountAggregateOutputType = {
    id: number
    title: number
    description: number
    thumbnail: number
    mediaUrl: number
    universeId: number
    creatorId: number
    status: number
    metadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContentItemMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    thumbnail?: true
    mediaUrl?: true
    universeId?: true
    creatorId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContentItemMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    thumbnail?: true
    mediaUrl?: true
    universeId?: true
    creatorId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContentItemCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    thumbnail?: true
    mediaUrl?: true
    universeId?: true
    creatorId?: true
    status?: true
    metadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContentItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentItem to aggregate.
     */
    where?: ContentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentItems to fetch.
     */
    orderBy?: ContentItemOrderByWithRelationInput | ContentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContentItems
    **/
    _count?: true | ContentItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContentItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContentItemMaxAggregateInputType
  }

  export type GetContentItemAggregateType<T extends ContentItemAggregateArgs> = {
        [P in keyof T & keyof AggregateContentItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContentItem[P]>
      : GetScalarType<T[P], AggregateContentItem[P]>
  }




  export type ContentItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContentItemWhereInput
    orderBy?: ContentItemOrderByWithAggregationInput | ContentItemOrderByWithAggregationInput[]
    by: ContentItemScalarFieldEnum[] | ContentItemScalarFieldEnum
    having?: ContentItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContentItemCountAggregateInputType | true
    _min?: ContentItemMinAggregateInputType
    _max?: ContentItemMaxAggregateInputType
  }

  export type ContentItemGroupByOutputType = {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    mediaUrl: string
    universeId: string
    creatorId: string
    status: string
    metadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ContentItemCountAggregateOutputType | null
    _min: ContentItemMinAggregateOutputType | null
    _max: ContentItemMaxAggregateOutputType | null
  }

  type GetContentItemGroupByPayload<T extends ContentItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContentItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContentItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContentItemGroupByOutputType[P]>
            : GetScalarType<T[P], ContentItemGroupByOutputType[P]>
        }
      >
    >


  export type ContentItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    thumbnail?: boolean
    mediaUrl?: boolean
    universeId?: boolean
    creatorId?: boolean
    status?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contentItem"]>

  export type ContentItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    thumbnail?: boolean
    mediaUrl?: boolean
    universeId?: boolean
    creatorId?: boolean
    status?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contentItem"]>

  export type ContentItemSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    thumbnail?: boolean
    mediaUrl?: boolean
    universeId?: boolean
    creatorId?: boolean
    status?: boolean
    metadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ContentItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContentItem"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      thumbnail: string | null
      mediaUrl: string
      universeId: string
      creatorId: string
      status: string
      metadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contentItem"]>
    composites: {}
  }

  type ContentItemGetPayload<S extends boolean | null | undefined | ContentItemDefaultArgs> = $Result.GetResult<Prisma.$ContentItemPayload, S>

  type ContentItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ContentItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ContentItemCountAggregateInputType | true
    }

  export interface ContentItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContentItem'], meta: { name: 'ContentItem' } }
    /**
     * Find zero or one ContentItem that matches the filter.
     * @param {ContentItemFindUniqueArgs} args - Arguments to find a ContentItem
     * @example
     * // Get one ContentItem
     * const contentItem = await prisma.contentItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContentItemFindUniqueArgs>(args: SelectSubset<T, ContentItemFindUniqueArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ContentItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ContentItemFindUniqueOrThrowArgs} args - Arguments to find a ContentItem
     * @example
     * // Get one ContentItem
     * const contentItem = await prisma.contentItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContentItemFindUniqueOrThrowArgs>(args: SelectSubset<T, ContentItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ContentItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemFindFirstArgs} args - Arguments to find a ContentItem
     * @example
     * // Get one ContentItem
     * const contentItem = await prisma.contentItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContentItemFindFirstArgs>(args?: SelectSubset<T, ContentItemFindFirstArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ContentItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemFindFirstOrThrowArgs} args - Arguments to find a ContentItem
     * @example
     * // Get one ContentItem
     * const contentItem = await prisma.contentItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContentItemFindFirstOrThrowArgs>(args?: SelectSubset<T, ContentItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ContentItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContentItems
     * const contentItems = await prisma.contentItem.findMany()
     * 
     * // Get first 10 ContentItems
     * const contentItems = await prisma.contentItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contentItemWithIdOnly = await prisma.contentItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContentItemFindManyArgs>(args?: SelectSubset<T, ContentItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ContentItem.
     * @param {ContentItemCreateArgs} args - Arguments to create a ContentItem.
     * @example
     * // Create one ContentItem
     * const ContentItem = await prisma.contentItem.create({
     *   data: {
     *     // ... data to create a ContentItem
     *   }
     * })
     * 
     */
    create<T extends ContentItemCreateArgs>(args: SelectSubset<T, ContentItemCreateArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ContentItems.
     * @param {ContentItemCreateManyArgs} args - Arguments to create many ContentItems.
     * @example
     * // Create many ContentItems
     * const contentItem = await prisma.contentItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContentItemCreateManyArgs>(args?: SelectSubset<T, ContentItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContentItems and returns the data saved in the database.
     * @param {ContentItemCreateManyAndReturnArgs} args - Arguments to create many ContentItems.
     * @example
     * // Create many ContentItems
     * const contentItem = await prisma.contentItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContentItems and only return the `id`
     * const contentItemWithIdOnly = await prisma.contentItem.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContentItemCreateManyAndReturnArgs>(args?: SelectSubset<T, ContentItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ContentItem.
     * @param {ContentItemDeleteArgs} args - Arguments to delete one ContentItem.
     * @example
     * // Delete one ContentItem
     * const ContentItem = await prisma.contentItem.delete({
     *   where: {
     *     // ... filter to delete one ContentItem
     *   }
     * })
     * 
     */
    delete<T extends ContentItemDeleteArgs>(args: SelectSubset<T, ContentItemDeleteArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ContentItem.
     * @param {ContentItemUpdateArgs} args - Arguments to update one ContentItem.
     * @example
     * // Update one ContentItem
     * const contentItem = await prisma.contentItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContentItemUpdateArgs>(args: SelectSubset<T, ContentItemUpdateArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ContentItems.
     * @param {ContentItemDeleteManyArgs} args - Arguments to filter ContentItems to delete.
     * @example
     * // Delete a few ContentItems
     * const { count } = await prisma.contentItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContentItemDeleteManyArgs>(args?: SelectSubset<T, ContentItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContentItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContentItems
     * const contentItem = await prisma.contentItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContentItemUpdateManyArgs>(args: SelectSubset<T, ContentItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ContentItem.
     * @param {ContentItemUpsertArgs} args - Arguments to update or create a ContentItem.
     * @example
     * // Update or create a ContentItem
     * const contentItem = await prisma.contentItem.upsert({
     *   create: {
     *     // ... data to create a ContentItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContentItem we want to update
     *   }
     * })
     */
    upsert<T extends ContentItemUpsertArgs>(args: SelectSubset<T, ContentItemUpsertArgs<ExtArgs>>): Prisma__ContentItemClient<$Result.GetResult<Prisma.$ContentItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ContentItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemCountArgs} args - Arguments to filter ContentItems to count.
     * @example
     * // Count the number of ContentItems
     * const count = await prisma.contentItem.count({
     *   where: {
     *     // ... the filter for the ContentItems we want to count
     *   }
     * })
    **/
    count<T extends ContentItemCountArgs>(
      args?: Subset<T, ContentItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContentItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContentItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContentItemAggregateArgs>(args: Subset<T, ContentItemAggregateArgs>): Prisma.PrismaPromise<GetContentItemAggregateType<T>>

    /**
     * Group by ContentItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContentItemGroupByArgs} args - Group by arguments.
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
      T extends ContentItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContentItemGroupByArgs['orderBy'] }
        : { orderBy?: ContentItemGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ContentItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContentItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContentItem model
   */
  readonly fields: ContentItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContentItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContentItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ContentItem model
   */ 
  interface ContentItemFieldRefs {
    readonly id: FieldRef<"ContentItem", 'String'>
    readonly title: FieldRef<"ContentItem", 'String'>
    readonly description: FieldRef<"ContentItem", 'String'>
    readonly thumbnail: FieldRef<"ContentItem", 'String'>
    readonly mediaUrl: FieldRef<"ContentItem", 'String'>
    readonly universeId: FieldRef<"ContentItem", 'String'>
    readonly creatorId: FieldRef<"ContentItem", 'String'>
    readonly status: FieldRef<"ContentItem", 'String'>
    readonly metadata: FieldRef<"ContentItem", 'Json'>
    readonly createdAt: FieldRef<"ContentItem", 'DateTime'>
    readonly updatedAt: FieldRef<"ContentItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContentItem findUnique
   */
  export type ContentItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter, which ContentItem to fetch.
     */
    where: ContentItemWhereUniqueInput
  }

  /**
   * ContentItem findUniqueOrThrow
   */
  export type ContentItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter, which ContentItem to fetch.
     */
    where: ContentItemWhereUniqueInput
  }

  /**
   * ContentItem findFirst
   */
  export type ContentItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter, which ContentItem to fetch.
     */
    where?: ContentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentItems to fetch.
     */
    orderBy?: ContentItemOrderByWithRelationInput | ContentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentItems.
     */
    cursor?: ContentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentItems.
     */
    distinct?: ContentItemScalarFieldEnum | ContentItemScalarFieldEnum[]
  }

  /**
   * ContentItem findFirstOrThrow
   */
  export type ContentItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter, which ContentItem to fetch.
     */
    where?: ContentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentItems to fetch.
     */
    orderBy?: ContentItemOrderByWithRelationInput | ContentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContentItems.
     */
    cursor?: ContentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContentItems.
     */
    distinct?: ContentItemScalarFieldEnum | ContentItemScalarFieldEnum[]
  }

  /**
   * ContentItem findMany
   */
  export type ContentItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter, which ContentItems to fetch.
     */
    where?: ContentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContentItems to fetch.
     */
    orderBy?: ContentItemOrderByWithRelationInput | ContentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContentItems.
     */
    cursor?: ContentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContentItems.
     */
    skip?: number
    distinct?: ContentItemScalarFieldEnum | ContentItemScalarFieldEnum[]
  }

  /**
   * ContentItem create
   */
  export type ContentItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * The data needed to create a ContentItem.
     */
    data: XOR<ContentItemCreateInput, ContentItemUncheckedCreateInput>
  }

  /**
   * ContentItem createMany
   */
  export type ContentItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContentItems.
     */
    data: ContentItemCreateManyInput | ContentItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContentItem createManyAndReturn
   */
  export type ContentItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ContentItems.
     */
    data: ContentItemCreateManyInput | ContentItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContentItem update
   */
  export type ContentItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * The data needed to update a ContentItem.
     */
    data: XOR<ContentItemUpdateInput, ContentItemUncheckedUpdateInput>
    /**
     * Choose, which ContentItem to update.
     */
    where: ContentItemWhereUniqueInput
  }

  /**
   * ContentItem updateMany
   */
  export type ContentItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContentItems.
     */
    data: XOR<ContentItemUpdateManyMutationInput, ContentItemUncheckedUpdateManyInput>
    /**
     * Filter which ContentItems to update
     */
    where?: ContentItemWhereInput
  }

  /**
   * ContentItem upsert
   */
  export type ContentItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * The filter to search for the ContentItem to update in case it exists.
     */
    where: ContentItemWhereUniqueInput
    /**
     * In case the ContentItem found by the `where` argument doesn't exist, create a new ContentItem with this data.
     */
    create: XOR<ContentItemCreateInput, ContentItemUncheckedCreateInput>
    /**
     * In case the ContentItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContentItemUpdateInput, ContentItemUncheckedUpdateInput>
  }

  /**
   * ContentItem delete
   */
  export type ContentItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
    /**
     * Filter which ContentItem to delete.
     */
    where: ContentItemWhereUniqueInput
  }

  /**
   * ContentItem deleteMany
   */
  export type ContentItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContentItems to delete
     */
    where?: ContentItemWhereInput
  }

  /**
   * ContentItem without action
   */
  export type ContentItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContentItem
     */
    select?: ContentItemSelect<ExtArgs> | null
  }


  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: string | null
    title: string | null
    message: string | null
    readAt: Date | null
    createdAt: Date | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: string | null
    title: string | null
    message: string | null
    readAt: Date | null
    createdAt: Date | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    title: number
    message: number
    metadata: number
    readAt: number
    createdAt: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    readAt?: true
    createdAt?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    readAt?: true
    createdAt?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    metadata?: true
    readAt?: true
    createdAt?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    userId: string
    type: string
    title: string
    message: string
    metadata: JsonValue | null
    readAt: Date | null
    createdAt: Date
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    metadata?: boolean
    readAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    metadata?: boolean
    readAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    metadata?: boolean
    readAt?: boolean
    createdAt?: boolean
  }


  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: string
      title: string
      message: string
      metadata: Prisma.JsonValue | null
      readAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications and returns the data saved in the database.
     * @param {NotificationCreateManyAndReturnArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
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
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Notification model
   */ 
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'String'>
    readonly userId: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'String'>
    readonly title: FieldRef<"Notification", 'String'>
    readonly message: FieldRef<"Notification", 'String'>
    readonly metadata: FieldRef<"Notification", 'Json'>
    readonly readAt: FieldRef<"Notification", 'DateTime'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification createManyAndReturn
   */
  export type NotificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
  }


  /**
   * Model Wallet
   */

  export type AggregateWallet = {
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  export type WalletAvgAggregateOutputType = {
    balance: Decimal | null
  }

  export type WalletSumAggregateOutputType = {
    balance: Decimal | null
  }

  export type WalletMinAggregateOutputType = {
    id: string | null
    userId: string | null
    balance: Decimal | null
    currency: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    balance: Decimal | null
    currency: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletCountAggregateOutputType = {
    id: number
    userId: number
    balance: number
    currency: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WalletAvgAggregateInputType = {
    balance?: true
  }

  export type WalletSumAggregateInputType = {
    balance?: true
  }

  export type WalletMinAggregateInputType = {
    id?: true
    userId?: true
    balance?: true
    currency?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletMaxAggregateInputType = {
    id?: true
    userId?: true
    balance?: true
    currency?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletCountAggregateInputType = {
    id?: true
    userId?: true
    balance?: true
    currency?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WalletAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallet to aggregate.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Wallets
    **/
    _count?: true | WalletCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletMaxAggregateInputType
  }

  export type GetWalletAggregateType<T extends WalletAggregateArgs> = {
        [P in keyof T & keyof AggregateWallet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWallet[P]>
      : GetScalarType<T[P], AggregateWallet[P]>
  }




  export type WalletGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletWhereInput
    orderBy?: WalletOrderByWithAggregationInput | WalletOrderByWithAggregationInput[]
    by: WalletScalarFieldEnum[] | WalletScalarFieldEnum
    having?: WalletScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletCountAggregateInputType | true
    _avg?: WalletAvgAggregateInputType
    _sum?: WalletSumAggregateInputType
    _min?: WalletMinAggregateInputType
    _max?: WalletMaxAggregateInputType
  }

  export type WalletGroupByOutputType = {
    id: string
    userId: string
    balance: Decimal
    currency: string
    createdAt: Date
    updatedAt: Date
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  type GetWalletGroupByPayload<T extends WalletGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletGroupByOutputType[P]>
            : GetScalarType<T[P], WalletGroupByOutputType[P]>
        }
      >
    >


  export type WalletSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    balance?: boolean
    currency?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    balance?: boolean
    currency?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectScalar = {
    id?: boolean
    userId?: boolean
    balance?: boolean
    currency?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $WalletPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Wallet"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      balance: Prisma.Decimal
      currency: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["wallet"]>
    composites: {}
  }

  type WalletGetPayload<S extends boolean | null | undefined | WalletDefaultArgs> = $Result.GetResult<Prisma.$WalletPayload, S>

  type WalletCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WalletFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WalletCountAggregateInputType | true
    }

  export interface WalletDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Wallet'], meta: { name: 'Wallet' } }
    /**
     * Find zero or one Wallet that matches the filter.
     * @param {WalletFindUniqueArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletFindUniqueArgs>(args: SelectSubset<T, WalletFindUniqueArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Wallet that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WalletFindUniqueOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Wallet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletFindFirstArgs>(args?: SelectSubset<T, WalletFindFirstArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Wallet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Wallets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Wallets
     * const wallets = await prisma.wallet.findMany()
     * 
     * // Get first 10 Wallets
     * const wallets = await prisma.wallet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletWithIdOnly = await prisma.wallet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletFindManyArgs>(args?: SelectSubset<T, WalletFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Wallet.
     * @param {WalletCreateArgs} args - Arguments to create a Wallet.
     * @example
     * // Create one Wallet
     * const Wallet = await prisma.wallet.create({
     *   data: {
     *     // ... data to create a Wallet
     *   }
     * })
     * 
     */
    create<T extends WalletCreateArgs>(args: SelectSubset<T, WalletCreateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Wallets.
     * @param {WalletCreateManyArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletCreateManyArgs>(args?: SelectSubset<T, WalletCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Wallets and returns the data saved in the database.
     * @param {WalletCreateManyAndReturnArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Wallet.
     * @param {WalletDeleteArgs} args - Arguments to delete one Wallet.
     * @example
     * // Delete one Wallet
     * const Wallet = await prisma.wallet.delete({
     *   where: {
     *     // ... filter to delete one Wallet
     *   }
     * })
     * 
     */
    delete<T extends WalletDeleteArgs>(args: SelectSubset<T, WalletDeleteArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Wallet.
     * @param {WalletUpdateArgs} args - Arguments to update one Wallet.
     * @example
     * // Update one Wallet
     * const wallet = await prisma.wallet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletUpdateArgs>(args: SelectSubset<T, WalletUpdateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Wallets.
     * @param {WalletDeleteManyArgs} args - Arguments to filter Wallets to delete.
     * @example
     * // Delete a few Wallets
     * const { count } = await prisma.wallet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletDeleteManyArgs>(args?: SelectSubset<T, WalletDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletUpdateManyArgs>(args: SelectSubset<T, WalletUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Wallet.
     * @param {WalletUpsertArgs} args - Arguments to update or create a Wallet.
     * @example
     * // Update or create a Wallet
     * const wallet = await prisma.wallet.upsert({
     *   create: {
     *     // ... data to create a Wallet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Wallet we want to update
     *   }
     * })
     */
    upsert<T extends WalletUpsertArgs>(args: SelectSubset<T, WalletUpsertArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletCountArgs} args - Arguments to filter Wallets to count.
     * @example
     * // Count the number of Wallets
     * const count = await prisma.wallet.count({
     *   where: {
     *     // ... the filter for the Wallets we want to count
     *   }
     * })
    **/
    count<T extends WalletCountArgs>(
      args?: Subset<T, WalletCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends WalletAggregateArgs>(args: Subset<T, WalletAggregateArgs>): Prisma.PrismaPromise<GetWalletAggregateType<T>>

    /**
     * Group by Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletGroupByArgs} args - Group by arguments.
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
      T extends WalletGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletGroupByArgs['orderBy'] }
        : { orderBy?: WalletGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, WalletGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Wallet model
   */
  readonly fields: WalletFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Wallet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Wallet model
   */ 
  interface WalletFieldRefs {
    readonly id: FieldRef<"Wallet", 'String'>
    readonly userId: FieldRef<"Wallet", 'String'>
    readonly balance: FieldRef<"Wallet", 'Decimal'>
    readonly currency: FieldRef<"Wallet", 'String'>
    readonly createdAt: FieldRef<"Wallet", 'DateTime'>
    readonly updatedAt: FieldRef<"Wallet", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Wallet findUnique
   */
  export type WalletFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findUniqueOrThrow
   */
  export type WalletFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findFirst
   */
  export type WalletFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findFirstOrThrow
   */
  export type WalletFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findMany
   */
  export type WalletFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter, which Wallets to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet create
   */
  export type WalletCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * The data needed to create a Wallet.
     */
    data: XOR<WalletCreateInput, WalletUncheckedCreateInput>
  }

  /**
   * Wallet createMany
   */
  export type WalletCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Wallet createManyAndReturn
   */
  export type WalletCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Wallet update
   */
  export type WalletUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * The data needed to update a Wallet.
     */
    data: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
    /**
     * Choose, which Wallet to update.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet updateMany
   */
  export type WalletUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
  }

  /**
   * Wallet upsert
   */
  export type WalletUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * The filter to search for the Wallet to update in case it exists.
     */
    where: WalletWhereUniqueInput
    /**
     * In case the Wallet found by the `where` argument doesn't exist, create a new Wallet with this data.
     */
    create: XOR<WalletCreateInput, WalletUncheckedCreateInput>
    /**
     * In case the Wallet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
  }

  /**
   * Wallet delete
   */
  export type WalletDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Filter which Wallet to delete.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet deleteMany
   */
  export type WalletDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallets to delete
     */
    where?: WalletWhereInput
  }

  /**
   * Wallet without action
   */
  export type WalletDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
  }


  /**
   * Model WalletTransaction
   */

  export type AggregateWalletTransaction = {
    _count: WalletTransactionCountAggregateOutputType | null
    _avg: WalletTransactionAvgAggregateOutputType | null
    _sum: WalletTransactionSumAggregateOutputType | null
    _min: WalletTransactionMinAggregateOutputType | null
    _max: WalletTransactionMaxAggregateOutputType | null
  }

  export type WalletTransactionAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type WalletTransactionSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type WalletTransactionMinAggregateOutputType = {
    id: string | null
    walletId: string | null
    type: string | null
    amount: Decimal | null
    description: string | null
    reference: string | null
    createdAt: Date | null
  }

  export type WalletTransactionMaxAggregateOutputType = {
    id: string | null
    walletId: string | null
    type: string | null
    amount: Decimal | null
    description: string | null
    reference: string | null
    createdAt: Date | null
  }

  export type WalletTransactionCountAggregateOutputType = {
    id: number
    walletId: number
    type: number
    amount: number
    description: number
    reference: number
    createdAt: number
    _all: number
  }


  export type WalletTransactionAvgAggregateInputType = {
    amount?: true
  }

  export type WalletTransactionSumAggregateInputType = {
    amount?: true
  }

  export type WalletTransactionMinAggregateInputType = {
    id?: true
    walletId?: true
    type?: true
    amount?: true
    description?: true
    reference?: true
    createdAt?: true
  }

  export type WalletTransactionMaxAggregateInputType = {
    id?: true
    walletId?: true
    type?: true
    amount?: true
    description?: true
    reference?: true
    createdAt?: true
  }

  export type WalletTransactionCountAggregateInputType = {
    id?: true
    walletId?: true
    type?: true
    amount?: true
    description?: true
    reference?: true
    createdAt?: true
    _all?: true
  }

  export type WalletTransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WalletTransaction to aggregate.
     */
    where?: WalletTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletTransactions to fetch.
     */
    orderBy?: WalletTransactionOrderByWithRelationInput | WalletTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WalletTransactions
    **/
    _count?: true | WalletTransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletTransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletTransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletTransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletTransactionMaxAggregateInputType
  }

  export type GetWalletTransactionAggregateType<T extends WalletTransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateWalletTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWalletTransaction[P]>
      : GetScalarType<T[P], AggregateWalletTransaction[P]>
  }




  export type WalletTransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletTransactionWhereInput
    orderBy?: WalletTransactionOrderByWithAggregationInput | WalletTransactionOrderByWithAggregationInput[]
    by: WalletTransactionScalarFieldEnum[] | WalletTransactionScalarFieldEnum
    having?: WalletTransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletTransactionCountAggregateInputType | true
    _avg?: WalletTransactionAvgAggregateInputType
    _sum?: WalletTransactionSumAggregateInputType
    _min?: WalletTransactionMinAggregateInputType
    _max?: WalletTransactionMaxAggregateInputType
  }

  export type WalletTransactionGroupByOutputType = {
    id: string
    walletId: string
    type: string
    amount: Decimal
    description: string
    reference: string | null
    createdAt: Date
    _count: WalletTransactionCountAggregateOutputType | null
    _avg: WalletTransactionAvgAggregateOutputType | null
    _sum: WalletTransactionSumAggregateOutputType | null
    _min: WalletTransactionMinAggregateOutputType | null
    _max: WalletTransactionMaxAggregateOutputType | null
  }

  type GetWalletTransactionGroupByPayload<T extends WalletTransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletTransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletTransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletTransactionGroupByOutputType[P]>
            : GetScalarType<T[P], WalletTransactionGroupByOutputType[P]>
        }
      >
    >


  export type WalletTransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletId?: boolean
    type?: boolean
    amount?: boolean
    description?: boolean
    reference?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["walletTransaction"]>

  export type WalletTransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletId?: boolean
    type?: boolean
    amount?: boolean
    description?: boolean
    reference?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["walletTransaction"]>

  export type WalletTransactionSelectScalar = {
    id?: boolean
    walletId?: boolean
    type?: boolean
    amount?: boolean
    description?: boolean
    reference?: boolean
    createdAt?: boolean
  }


  export type $WalletTransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WalletTransaction"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletId: string
      type: string
      amount: Prisma.Decimal
      description: string
      reference: string | null
      createdAt: Date
    }, ExtArgs["result"]["walletTransaction"]>
    composites: {}
  }

  type WalletTransactionGetPayload<S extends boolean | null | undefined | WalletTransactionDefaultArgs> = $Result.GetResult<Prisma.$WalletTransactionPayload, S>

  type WalletTransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WalletTransactionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WalletTransactionCountAggregateInputType | true
    }

  export interface WalletTransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WalletTransaction'], meta: { name: 'WalletTransaction' } }
    /**
     * Find zero or one WalletTransaction that matches the filter.
     * @param {WalletTransactionFindUniqueArgs} args - Arguments to find a WalletTransaction
     * @example
     * // Get one WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletTransactionFindUniqueArgs>(args: SelectSubset<T, WalletTransactionFindUniqueArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one WalletTransaction that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WalletTransactionFindUniqueOrThrowArgs} args - Arguments to find a WalletTransaction
     * @example
     * // Get one WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletTransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletTransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first WalletTransaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionFindFirstArgs} args - Arguments to find a WalletTransaction
     * @example
     * // Get one WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletTransactionFindFirstArgs>(args?: SelectSubset<T, WalletTransactionFindFirstArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first WalletTransaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionFindFirstOrThrowArgs} args - Arguments to find a WalletTransaction
     * @example
     * // Get one WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletTransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletTransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more WalletTransactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WalletTransactions
     * const walletTransactions = await prisma.walletTransaction.findMany()
     * 
     * // Get first 10 WalletTransactions
     * const walletTransactions = await prisma.walletTransaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletTransactionWithIdOnly = await prisma.walletTransaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletTransactionFindManyArgs>(args?: SelectSubset<T, WalletTransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a WalletTransaction.
     * @param {WalletTransactionCreateArgs} args - Arguments to create a WalletTransaction.
     * @example
     * // Create one WalletTransaction
     * const WalletTransaction = await prisma.walletTransaction.create({
     *   data: {
     *     // ... data to create a WalletTransaction
     *   }
     * })
     * 
     */
    create<T extends WalletTransactionCreateArgs>(args: SelectSubset<T, WalletTransactionCreateArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many WalletTransactions.
     * @param {WalletTransactionCreateManyArgs} args - Arguments to create many WalletTransactions.
     * @example
     * // Create many WalletTransactions
     * const walletTransaction = await prisma.walletTransaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletTransactionCreateManyArgs>(args?: SelectSubset<T, WalletTransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WalletTransactions and returns the data saved in the database.
     * @param {WalletTransactionCreateManyAndReturnArgs} args - Arguments to create many WalletTransactions.
     * @example
     * // Create many WalletTransactions
     * const walletTransaction = await prisma.walletTransaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WalletTransactions and only return the `id`
     * const walletTransactionWithIdOnly = await prisma.walletTransaction.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletTransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletTransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a WalletTransaction.
     * @param {WalletTransactionDeleteArgs} args - Arguments to delete one WalletTransaction.
     * @example
     * // Delete one WalletTransaction
     * const WalletTransaction = await prisma.walletTransaction.delete({
     *   where: {
     *     // ... filter to delete one WalletTransaction
     *   }
     * })
     * 
     */
    delete<T extends WalletTransactionDeleteArgs>(args: SelectSubset<T, WalletTransactionDeleteArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one WalletTransaction.
     * @param {WalletTransactionUpdateArgs} args - Arguments to update one WalletTransaction.
     * @example
     * // Update one WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletTransactionUpdateArgs>(args: SelectSubset<T, WalletTransactionUpdateArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more WalletTransactions.
     * @param {WalletTransactionDeleteManyArgs} args - Arguments to filter WalletTransactions to delete.
     * @example
     * // Delete a few WalletTransactions
     * const { count } = await prisma.walletTransaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletTransactionDeleteManyArgs>(args?: SelectSubset<T, WalletTransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WalletTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WalletTransactions
     * const walletTransaction = await prisma.walletTransaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletTransactionUpdateManyArgs>(args: SelectSubset<T, WalletTransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one WalletTransaction.
     * @param {WalletTransactionUpsertArgs} args - Arguments to update or create a WalletTransaction.
     * @example
     * // Update or create a WalletTransaction
     * const walletTransaction = await prisma.walletTransaction.upsert({
     *   create: {
     *     // ... data to create a WalletTransaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WalletTransaction we want to update
     *   }
     * })
     */
    upsert<T extends WalletTransactionUpsertArgs>(args: SelectSubset<T, WalletTransactionUpsertArgs<ExtArgs>>): Prisma__WalletTransactionClient<$Result.GetResult<Prisma.$WalletTransactionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of WalletTransactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionCountArgs} args - Arguments to filter WalletTransactions to count.
     * @example
     * // Count the number of WalletTransactions
     * const count = await prisma.walletTransaction.count({
     *   where: {
     *     // ... the filter for the WalletTransactions we want to count
     *   }
     * })
    **/
    count<T extends WalletTransactionCountArgs>(
      args?: Subset<T, WalletTransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletTransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WalletTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends WalletTransactionAggregateArgs>(args: Subset<T, WalletTransactionAggregateArgs>): Prisma.PrismaPromise<GetWalletTransactionAggregateType<T>>

    /**
     * Group by WalletTransaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletTransactionGroupByArgs} args - Group by arguments.
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
      T extends WalletTransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletTransactionGroupByArgs['orderBy'] }
        : { orderBy?: WalletTransactionGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, WalletTransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WalletTransaction model
   */
  readonly fields: WalletTransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WalletTransaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletTransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the WalletTransaction model
   */ 
  interface WalletTransactionFieldRefs {
    readonly id: FieldRef<"WalletTransaction", 'String'>
    readonly walletId: FieldRef<"WalletTransaction", 'String'>
    readonly type: FieldRef<"WalletTransaction", 'String'>
    readonly amount: FieldRef<"WalletTransaction", 'Decimal'>
    readonly description: FieldRef<"WalletTransaction", 'String'>
    readonly reference: FieldRef<"WalletTransaction", 'String'>
    readonly createdAt: FieldRef<"WalletTransaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WalletTransaction findUnique
   */
  export type WalletTransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter, which WalletTransaction to fetch.
     */
    where: WalletTransactionWhereUniqueInput
  }

  /**
   * WalletTransaction findUniqueOrThrow
   */
  export type WalletTransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter, which WalletTransaction to fetch.
     */
    where: WalletTransactionWhereUniqueInput
  }

  /**
   * WalletTransaction findFirst
   */
  export type WalletTransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter, which WalletTransaction to fetch.
     */
    where?: WalletTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletTransactions to fetch.
     */
    orderBy?: WalletTransactionOrderByWithRelationInput | WalletTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WalletTransactions.
     */
    cursor?: WalletTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WalletTransactions.
     */
    distinct?: WalletTransactionScalarFieldEnum | WalletTransactionScalarFieldEnum[]
  }

  /**
   * WalletTransaction findFirstOrThrow
   */
  export type WalletTransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter, which WalletTransaction to fetch.
     */
    where?: WalletTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletTransactions to fetch.
     */
    orderBy?: WalletTransactionOrderByWithRelationInput | WalletTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WalletTransactions.
     */
    cursor?: WalletTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletTransactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WalletTransactions.
     */
    distinct?: WalletTransactionScalarFieldEnum | WalletTransactionScalarFieldEnum[]
  }

  /**
   * WalletTransaction findMany
   */
  export type WalletTransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter, which WalletTransactions to fetch.
     */
    where?: WalletTransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WalletTransactions to fetch.
     */
    orderBy?: WalletTransactionOrderByWithRelationInput | WalletTransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WalletTransactions.
     */
    cursor?: WalletTransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WalletTransactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WalletTransactions.
     */
    skip?: number
    distinct?: WalletTransactionScalarFieldEnum | WalletTransactionScalarFieldEnum[]
  }

  /**
   * WalletTransaction create
   */
  export type WalletTransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * The data needed to create a WalletTransaction.
     */
    data: XOR<WalletTransactionCreateInput, WalletTransactionUncheckedCreateInput>
  }

  /**
   * WalletTransaction createMany
   */
  export type WalletTransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WalletTransactions.
     */
    data: WalletTransactionCreateManyInput | WalletTransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WalletTransaction createManyAndReturn
   */
  export type WalletTransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many WalletTransactions.
     */
    data: WalletTransactionCreateManyInput | WalletTransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WalletTransaction update
   */
  export type WalletTransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * The data needed to update a WalletTransaction.
     */
    data: XOR<WalletTransactionUpdateInput, WalletTransactionUncheckedUpdateInput>
    /**
     * Choose, which WalletTransaction to update.
     */
    where: WalletTransactionWhereUniqueInput
  }

  /**
   * WalletTransaction updateMany
   */
  export type WalletTransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WalletTransactions.
     */
    data: XOR<WalletTransactionUpdateManyMutationInput, WalletTransactionUncheckedUpdateManyInput>
    /**
     * Filter which WalletTransactions to update
     */
    where?: WalletTransactionWhereInput
  }

  /**
   * WalletTransaction upsert
   */
  export type WalletTransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * The filter to search for the WalletTransaction to update in case it exists.
     */
    where: WalletTransactionWhereUniqueInput
    /**
     * In case the WalletTransaction found by the `where` argument doesn't exist, create a new WalletTransaction with this data.
     */
    create: XOR<WalletTransactionCreateInput, WalletTransactionUncheckedCreateInput>
    /**
     * In case the WalletTransaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletTransactionUpdateInput, WalletTransactionUncheckedUpdateInput>
  }

  /**
   * WalletTransaction delete
   */
  export type WalletTransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
    /**
     * Filter which WalletTransaction to delete.
     */
    where: WalletTransactionWhereUniqueInput
  }

  /**
   * WalletTransaction deleteMany
   */
  export type WalletTransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WalletTransactions to delete
     */
    where?: WalletTransactionWhereInput
  }

  /**
   * WalletTransaction without action
   */
  export type WalletTransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletTransaction
     */
    select?: WalletTransactionSelect<ExtArgs> | null
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


  export const CreatorProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    displayName: 'displayName',
    avatar: 'avatar',
    bio: 'bio',
    banner: 'banner',
    socialLinks: 'socialLinks',
    verified: 'verified',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CreatorProfileScalarFieldEnum = (typeof CreatorProfileScalarFieldEnum)[keyof typeof CreatorProfileScalarFieldEnum]


  export const CreatorEarningScalarFieldEnum: {
    id: 'id',
    creatorId: 'creatorId',
    amount: 'amount',
    type: 'type',
    referenceId: 'referenceId',
    status: 'status',
    paidAt: 'paidAt',
    createdAt: 'createdAt'
  };

  export type CreatorEarningScalarFieldEnum = (typeof CreatorEarningScalarFieldEnum)[keyof typeof CreatorEarningScalarFieldEnum]


  export const ChannelScalarFieldEnum: {
    id: 'id',
    creatorId: 'creatorId',
    name: 'name',
    description: 'description',
    category: 'category',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ChannelScalarFieldEnum = (typeof ChannelScalarFieldEnum)[keyof typeof ChannelScalarFieldEnum]


  export const CreatorChallengeScalarFieldEnum: {
    id: 'id',
    creatorId: 'creatorId',
    title: 'title',
    description: 'description',
    prize: 'prize',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    createdAt: 'createdAt'
  };

  export type CreatorChallengeScalarFieldEnum = (typeof CreatorChallengeScalarFieldEnum)[keyof typeof CreatorChallengeScalarFieldEnum]


  export const ChallengeEntryScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    challengeId: 'challengeId',
    contentUrl: 'contentUrl',
    createdAt: 'createdAt'
  };

  export type ChallengeEntryScalarFieldEnum = (typeof ChallengeEntryScalarFieldEnum)[keyof typeof ChallengeEntryScalarFieldEnum]


  export const PayoutRequestScalarFieldEnum: {
    id: 'id',
    creatorId: 'creatorId',
    amount: 'amount',
    method: 'method',
    accountDetails: 'accountDetails',
    status: 'status',
    processedAt: 'processedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PayoutRequestScalarFieldEnum = (typeof PayoutRequestScalarFieldEnum)[keyof typeof PayoutRequestScalarFieldEnum]


  export const SubscriptionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    creatorId: 'creatorId',
    tier: 'tier',
    status: 'status',
    startDate: 'startDate',
    endDate: 'endDate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum]


  export const TipScalarFieldEnum: {
    id: 'id',
    fromUserId: 'fromUserId',
    toUserId: 'toUserId',
    amount: 'amount',
    createdAt: 'createdAt'
  };

  export type TipScalarFieldEnum = (typeof TipScalarFieldEnum)[keyof typeof TipScalarFieldEnum]


  export const VerificationDocumentScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    documentType: 'documentType',
    documentUrl: 'documentUrl',
    status: 'status',
    reviewedBy: 'reviewedBy',
    reviewedAt: 'reviewedAt',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VerificationDocumentScalarFieldEnum = (typeof VerificationDocumentScalarFieldEnum)[keyof typeof VerificationDocumentScalarFieldEnum]


  export const MediaUploadScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    fileName: 'fileName',
    mimeType: 'mimeType',
    size: 'size',
    status: 'status',
    uploadId: 'uploadId',
    assetId: 'assetId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type MediaUploadScalarFieldEnum = (typeof MediaUploadScalarFieldEnum)[keyof typeof MediaUploadScalarFieldEnum]


  export const ContentItemScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    thumbnail: 'thumbnail',
    mediaUrl: 'mediaUrl',
    universeId: 'universeId',
    creatorId: 'creatorId',
    status: 'status',
    metadata: 'metadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContentItemScalarFieldEnum = (typeof ContentItemScalarFieldEnum)[keyof typeof ContentItemScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    message: 'message',
    metadata: 'metadata',
    readAt: 'readAt',
    createdAt: 'createdAt'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const WalletScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    balance: 'balance',
    currency: 'currency',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WalletScalarFieldEnum = (typeof WalletScalarFieldEnum)[keyof typeof WalletScalarFieldEnum]


  export const WalletTransactionScalarFieldEnum: {
    id: 'id',
    walletId: 'walletId',
    type: 'type',
    amount: 'amount',
    description: 'description',
    reference: 'reference',
    createdAt: 'createdAt'
  };

  export type WalletTransactionScalarFieldEnum = (typeof WalletTransactionScalarFieldEnum)[keyof typeof WalletTransactionScalarFieldEnum]


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
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type CreatorProfileWhereInput = {
    AND?: CreatorProfileWhereInput | CreatorProfileWhereInput[]
    OR?: CreatorProfileWhereInput[]
    NOT?: CreatorProfileWhereInput | CreatorProfileWhereInput[]
    id?: StringFilter<"CreatorProfile"> | string
    userId?: StringFilter<"CreatorProfile"> | string
    displayName?: StringNullableFilter<"CreatorProfile"> | string | null
    avatar?: StringNullableFilter<"CreatorProfile"> | string | null
    bio?: StringNullableFilter<"CreatorProfile"> | string | null
    banner?: StringNullableFilter<"CreatorProfile"> | string | null
    socialLinks?: JsonNullableFilter<"CreatorProfile">
    verified?: BoolFilter<"CreatorProfile"> | boolean
    createdAt?: DateTimeFilter<"CreatorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"CreatorProfile"> | Date | string
    earnings?: CreatorEarningListRelationFilter
    subscriptions?: SubscriptionListRelationFilter
    channels?: ChannelListRelationFilter
    challenges?: CreatorChallengeListRelationFilter
    payoutRequests?: PayoutRequestListRelationFilter
  }

  export type CreatorProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    displayName?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    banner?: SortOrderInput | SortOrder
    socialLinks?: SortOrderInput | SortOrder
    verified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    earnings?: CreatorEarningOrderByRelationAggregateInput
    subscriptions?: SubscriptionOrderByRelationAggregateInput
    channels?: ChannelOrderByRelationAggregateInput
    challenges?: CreatorChallengeOrderByRelationAggregateInput
    payoutRequests?: PayoutRequestOrderByRelationAggregateInput
  }

  export type CreatorProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: CreatorProfileWhereInput | CreatorProfileWhereInput[]
    OR?: CreatorProfileWhereInput[]
    NOT?: CreatorProfileWhereInput | CreatorProfileWhereInput[]
    displayName?: StringNullableFilter<"CreatorProfile"> | string | null
    avatar?: StringNullableFilter<"CreatorProfile"> | string | null
    bio?: StringNullableFilter<"CreatorProfile"> | string | null
    banner?: StringNullableFilter<"CreatorProfile"> | string | null
    socialLinks?: JsonNullableFilter<"CreatorProfile">
    verified?: BoolFilter<"CreatorProfile"> | boolean
    createdAt?: DateTimeFilter<"CreatorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"CreatorProfile"> | Date | string
    earnings?: CreatorEarningListRelationFilter
    subscriptions?: SubscriptionListRelationFilter
    channels?: ChannelListRelationFilter
    challenges?: CreatorChallengeListRelationFilter
    payoutRequests?: PayoutRequestListRelationFilter
  }, "id" | "userId">

  export type CreatorProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    displayName?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    banner?: SortOrderInput | SortOrder
    socialLinks?: SortOrderInput | SortOrder
    verified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CreatorProfileCountOrderByAggregateInput
    _max?: CreatorProfileMaxOrderByAggregateInput
    _min?: CreatorProfileMinOrderByAggregateInput
  }

  export type CreatorProfileScalarWhereWithAggregatesInput = {
    AND?: CreatorProfileScalarWhereWithAggregatesInput | CreatorProfileScalarWhereWithAggregatesInput[]
    OR?: CreatorProfileScalarWhereWithAggregatesInput[]
    NOT?: CreatorProfileScalarWhereWithAggregatesInput | CreatorProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CreatorProfile"> | string
    userId?: StringWithAggregatesFilter<"CreatorProfile"> | string
    displayName?: StringNullableWithAggregatesFilter<"CreatorProfile"> | string | null
    avatar?: StringNullableWithAggregatesFilter<"CreatorProfile"> | string | null
    bio?: StringNullableWithAggregatesFilter<"CreatorProfile"> | string | null
    banner?: StringNullableWithAggregatesFilter<"CreatorProfile"> | string | null
    socialLinks?: JsonNullableWithAggregatesFilter<"CreatorProfile">
    verified?: BoolWithAggregatesFilter<"CreatorProfile"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CreatorProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CreatorProfile"> | Date | string
  }

  export type CreatorEarningWhereInput = {
    AND?: CreatorEarningWhereInput | CreatorEarningWhereInput[]
    OR?: CreatorEarningWhereInput[]
    NOT?: CreatorEarningWhereInput | CreatorEarningWhereInput[]
    id?: StringFilter<"CreatorEarning"> | string
    creatorId?: StringFilter<"CreatorEarning"> | string
    amount?: DecimalFilter<"CreatorEarning"> | Decimal | DecimalJsLike | number | string
    type?: StringFilter<"CreatorEarning"> | string
    referenceId?: StringNullableFilter<"CreatorEarning"> | string | null
    status?: StringFilter<"CreatorEarning"> | string
    paidAt?: DateTimeNullableFilter<"CreatorEarning"> | Date | string | null
    createdAt?: DateTimeFilter<"CreatorEarning"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }

  export type CreatorEarningOrderByWithRelationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    status?: SortOrder
    paidAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    creator?: CreatorProfileOrderByWithRelationInput
  }

  export type CreatorEarningWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CreatorEarningWhereInput | CreatorEarningWhereInput[]
    OR?: CreatorEarningWhereInput[]
    NOT?: CreatorEarningWhereInput | CreatorEarningWhereInput[]
    creatorId?: StringFilter<"CreatorEarning"> | string
    amount?: DecimalFilter<"CreatorEarning"> | Decimal | DecimalJsLike | number | string
    type?: StringFilter<"CreatorEarning"> | string
    referenceId?: StringNullableFilter<"CreatorEarning"> | string | null
    status?: StringFilter<"CreatorEarning"> | string
    paidAt?: DateTimeNullableFilter<"CreatorEarning"> | Date | string | null
    createdAt?: DateTimeFilter<"CreatorEarning"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }, "id">

  export type CreatorEarningOrderByWithAggregationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    status?: SortOrder
    paidAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CreatorEarningCountOrderByAggregateInput
    _avg?: CreatorEarningAvgOrderByAggregateInput
    _max?: CreatorEarningMaxOrderByAggregateInput
    _min?: CreatorEarningMinOrderByAggregateInput
    _sum?: CreatorEarningSumOrderByAggregateInput
  }

  export type CreatorEarningScalarWhereWithAggregatesInput = {
    AND?: CreatorEarningScalarWhereWithAggregatesInput | CreatorEarningScalarWhereWithAggregatesInput[]
    OR?: CreatorEarningScalarWhereWithAggregatesInput[]
    NOT?: CreatorEarningScalarWhereWithAggregatesInput | CreatorEarningScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CreatorEarning"> | string
    creatorId?: StringWithAggregatesFilter<"CreatorEarning"> | string
    amount?: DecimalWithAggregatesFilter<"CreatorEarning"> | Decimal | DecimalJsLike | number | string
    type?: StringWithAggregatesFilter<"CreatorEarning"> | string
    referenceId?: StringNullableWithAggregatesFilter<"CreatorEarning"> | string | null
    status?: StringWithAggregatesFilter<"CreatorEarning"> | string
    paidAt?: DateTimeNullableWithAggregatesFilter<"CreatorEarning"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CreatorEarning"> | Date | string
  }

  export type ChannelWhereInput = {
    AND?: ChannelWhereInput | ChannelWhereInput[]
    OR?: ChannelWhereInput[]
    NOT?: ChannelWhereInput | ChannelWhereInput[]
    id?: StringFilter<"Channel"> | string
    creatorId?: StringFilter<"Channel"> | string
    name?: StringFilter<"Channel"> | string
    description?: StringNullableFilter<"Channel"> | string | null
    category?: StringNullableFilter<"Channel"> | string | null
    createdAt?: DateTimeFilter<"Channel"> | Date | string
    updatedAt?: DateTimeFilter<"Channel"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }

  export type ChannelOrderByWithRelationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creator?: CreatorProfileOrderByWithRelationInput
  }

  export type ChannelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChannelWhereInput | ChannelWhereInput[]
    OR?: ChannelWhereInput[]
    NOT?: ChannelWhereInput | ChannelWhereInput[]
    creatorId?: StringFilter<"Channel"> | string
    name?: StringFilter<"Channel"> | string
    description?: StringNullableFilter<"Channel"> | string | null
    category?: StringNullableFilter<"Channel"> | string | null
    createdAt?: DateTimeFilter<"Channel"> | Date | string
    updatedAt?: DateTimeFilter<"Channel"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }, "id">

  export type ChannelOrderByWithAggregationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ChannelCountOrderByAggregateInput
    _max?: ChannelMaxOrderByAggregateInput
    _min?: ChannelMinOrderByAggregateInput
  }

  export type ChannelScalarWhereWithAggregatesInput = {
    AND?: ChannelScalarWhereWithAggregatesInput | ChannelScalarWhereWithAggregatesInput[]
    OR?: ChannelScalarWhereWithAggregatesInput[]
    NOT?: ChannelScalarWhereWithAggregatesInput | ChannelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Channel"> | string
    creatorId?: StringWithAggregatesFilter<"Channel"> | string
    name?: StringWithAggregatesFilter<"Channel"> | string
    description?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    category?: StringNullableWithAggregatesFilter<"Channel"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Channel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Channel"> | Date | string
  }

  export type CreatorChallengeWhereInput = {
    AND?: CreatorChallengeWhereInput | CreatorChallengeWhereInput[]
    OR?: CreatorChallengeWhereInput[]
    NOT?: CreatorChallengeWhereInput | CreatorChallengeWhereInput[]
    id?: StringFilter<"CreatorChallenge"> | string
    creatorId?: StringFilter<"CreatorChallenge"> | string
    title?: StringFilter<"CreatorChallenge"> | string
    description?: StringFilter<"CreatorChallenge"> | string
    prize?: StringFilter<"CreatorChallenge"> | string
    startDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    endDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    status?: StringFilter<"CreatorChallenge"> | string
    createdAt?: DateTimeFilter<"CreatorChallenge"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
    entries?: ChallengeEntryListRelationFilter
  }

  export type CreatorChallengeOrderByWithRelationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    prize?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    creator?: CreatorProfileOrderByWithRelationInput
    entries?: ChallengeEntryOrderByRelationAggregateInput
  }

  export type CreatorChallengeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CreatorChallengeWhereInput | CreatorChallengeWhereInput[]
    OR?: CreatorChallengeWhereInput[]
    NOT?: CreatorChallengeWhereInput | CreatorChallengeWhereInput[]
    creatorId?: StringFilter<"CreatorChallenge"> | string
    title?: StringFilter<"CreatorChallenge"> | string
    description?: StringFilter<"CreatorChallenge"> | string
    prize?: StringFilter<"CreatorChallenge"> | string
    startDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    endDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    status?: StringFilter<"CreatorChallenge"> | string
    createdAt?: DateTimeFilter<"CreatorChallenge"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
    entries?: ChallengeEntryListRelationFilter
  }, "id">

  export type CreatorChallengeOrderByWithAggregationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    prize?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    _count?: CreatorChallengeCountOrderByAggregateInput
    _max?: CreatorChallengeMaxOrderByAggregateInput
    _min?: CreatorChallengeMinOrderByAggregateInput
  }

  export type CreatorChallengeScalarWhereWithAggregatesInput = {
    AND?: CreatorChallengeScalarWhereWithAggregatesInput | CreatorChallengeScalarWhereWithAggregatesInput[]
    OR?: CreatorChallengeScalarWhereWithAggregatesInput[]
    NOT?: CreatorChallengeScalarWhereWithAggregatesInput | CreatorChallengeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    creatorId?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    title?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    description?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    prize?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    startDate?: DateTimeWithAggregatesFilter<"CreatorChallenge"> | Date | string
    endDate?: DateTimeWithAggregatesFilter<"CreatorChallenge"> | Date | string
    status?: StringWithAggregatesFilter<"CreatorChallenge"> | string
    createdAt?: DateTimeWithAggregatesFilter<"CreatorChallenge"> | Date | string
  }

  export type ChallengeEntryWhereInput = {
    AND?: ChallengeEntryWhereInput | ChallengeEntryWhereInput[]
    OR?: ChallengeEntryWhereInput[]
    NOT?: ChallengeEntryWhereInput | ChallengeEntryWhereInput[]
    id?: StringFilter<"ChallengeEntry"> | string
    userId?: StringFilter<"ChallengeEntry"> | string
    challengeId?: StringFilter<"ChallengeEntry"> | string
    contentUrl?: StringFilter<"ChallengeEntry"> | string
    createdAt?: DateTimeFilter<"ChallengeEntry"> | Date | string
    challenge?: XOR<CreatorChallengeRelationFilter, CreatorChallengeWhereInput>
  }

  export type ChallengeEntryOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    challengeId?: SortOrder
    contentUrl?: SortOrder
    createdAt?: SortOrder
    challenge?: CreatorChallengeOrderByWithRelationInput
  }

  export type ChallengeEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_challengeId?: ChallengeEntryUserIdChallengeIdCompoundUniqueInput
    AND?: ChallengeEntryWhereInput | ChallengeEntryWhereInput[]
    OR?: ChallengeEntryWhereInput[]
    NOT?: ChallengeEntryWhereInput | ChallengeEntryWhereInput[]
    userId?: StringFilter<"ChallengeEntry"> | string
    challengeId?: StringFilter<"ChallengeEntry"> | string
    contentUrl?: StringFilter<"ChallengeEntry"> | string
    createdAt?: DateTimeFilter<"ChallengeEntry"> | Date | string
    challenge?: XOR<CreatorChallengeRelationFilter, CreatorChallengeWhereInput>
  }, "id" | "userId_challengeId">

  export type ChallengeEntryOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    challengeId?: SortOrder
    contentUrl?: SortOrder
    createdAt?: SortOrder
    _count?: ChallengeEntryCountOrderByAggregateInput
    _max?: ChallengeEntryMaxOrderByAggregateInput
    _min?: ChallengeEntryMinOrderByAggregateInput
  }

  export type ChallengeEntryScalarWhereWithAggregatesInput = {
    AND?: ChallengeEntryScalarWhereWithAggregatesInput | ChallengeEntryScalarWhereWithAggregatesInput[]
    OR?: ChallengeEntryScalarWhereWithAggregatesInput[]
    NOT?: ChallengeEntryScalarWhereWithAggregatesInput | ChallengeEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChallengeEntry"> | string
    userId?: StringWithAggregatesFilter<"ChallengeEntry"> | string
    challengeId?: StringWithAggregatesFilter<"ChallengeEntry"> | string
    contentUrl?: StringWithAggregatesFilter<"ChallengeEntry"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ChallengeEntry"> | Date | string
  }

  export type PayoutRequestWhereInput = {
    AND?: PayoutRequestWhereInput | PayoutRequestWhereInput[]
    OR?: PayoutRequestWhereInput[]
    NOT?: PayoutRequestWhereInput | PayoutRequestWhereInput[]
    id?: StringFilter<"PayoutRequest"> | string
    creatorId?: StringFilter<"PayoutRequest"> | string
    amount?: DecimalFilter<"PayoutRequest"> | Decimal | DecimalJsLike | number | string
    method?: StringFilter<"PayoutRequest"> | string
    accountDetails?: JsonFilter<"PayoutRequest">
    status?: StringFilter<"PayoutRequest"> | string
    processedAt?: DateTimeNullableFilter<"PayoutRequest"> | Date | string | null
    createdAt?: DateTimeFilter<"PayoutRequest"> | Date | string
    updatedAt?: DateTimeFilter<"PayoutRequest"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }

  export type PayoutRequestOrderByWithRelationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    method?: SortOrder
    accountDetails?: SortOrder
    status?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creator?: CreatorProfileOrderByWithRelationInput
  }

  export type PayoutRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PayoutRequestWhereInput | PayoutRequestWhereInput[]
    OR?: PayoutRequestWhereInput[]
    NOT?: PayoutRequestWhereInput | PayoutRequestWhereInput[]
    creatorId?: StringFilter<"PayoutRequest"> | string
    amount?: DecimalFilter<"PayoutRequest"> | Decimal | DecimalJsLike | number | string
    method?: StringFilter<"PayoutRequest"> | string
    accountDetails?: JsonFilter<"PayoutRequest">
    status?: StringFilter<"PayoutRequest"> | string
    processedAt?: DateTimeNullableFilter<"PayoutRequest"> | Date | string | null
    createdAt?: DateTimeFilter<"PayoutRequest"> | Date | string
    updatedAt?: DateTimeFilter<"PayoutRequest"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }, "id">

  export type PayoutRequestOrderByWithAggregationInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    method?: SortOrder
    accountDetails?: SortOrder
    status?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PayoutRequestCountOrderByAggregateInput
    _avg?: PayoutRequestAvgOrderByAggregateInput
    _max?: PayoutRequestMaxOrderByAggregateInput
    _min?: PayoutRequestMinOrderByAggregateInput
    _sum?: PayoutRequestSumOrderByAggregateInput
  }

  export type PayoutRequestScalarWhereWithAggregatesInput = {
    AND?: PayoutRequestScalarWhereWithAggregatesInput | PayoutRequestScalarWhereWithAggregatesInput[]
    OR?: PayoutRequestScalarWhereWithAggregatesInput[]
    NOT?: PayoutRequestScalarWhereWithAggregatesInput | PayoutRequestScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PayoutRequest"> | string
    creatorId?: StringWithAggregatesFilter<"PayoutRequest"> | string
    amount?: DecimalWithAggregatesFilter<"PayoutRequest"> | Decimal | DecimalJsLike | number | string
    method?: StringWithAggregatesFilter<"PayoutRequest"> | string
    accountDetails?: JsonWithAggregatesFilter<"PayoutRequest">
    status?: StringWithAggregatesFilter<"PayoutRequest"> | string
    processedAt?: DateTimeNullableWithAggregatesFilter<"PayoutRequest"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PayoutRequest"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PayoutRequest"> | Date | string
  }

  export type SubscriptionWhereInput = {
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    id?: StringFilter<"Subscription"> | string
    userId?: StringFilter<"Subscription"> | string
    creatorId?: StringFilter<"Subscription"> | string
    tier?: StringFilter<"Subscription"> | string
    status?: StringFilter<"Subscription"> | string
    startDate?: DateTimeFilter<"Subscription"> | Date | string
    endDate?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    createdAt?: DateTimeFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeFilter<"Subscription"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }

  export type SubscriptionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    creatorId?: SortOrder
    tier?: SortOrder
    status?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creator?: CreatorProfileOrderByWithRelationInput
  }

  export type SubscriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_creatorId?: SubscriptionUserIdCreatorIdCompoundUniqueInput
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    userId?: StringFilter<"Subscription"> | string
    creatorId?: StringFilter<"Subscription"> | string
    tier?: StringFilter<"Subscription"> | string
    status?: StringFilter<"Subscription"> | string
    startDate?: DateTimeFilter<"Subscription"> | Date | string
    endDate?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    createdAt?: DateTimeFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeFilter<"Subscription"> | Date | string
    creator?: XOR<CreatorProfileRelationFilter, CreatorProfileWhereInput>
  }, "id" | "userId_creatorId">

  export type SubscriptionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    creatorId?: SortOrder
    tier?: SortOrder
    status?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubscriptionCountOrderByAggregateInput
    _max?: SubscriptionMaxOrderByAggregateInput
    _min?: SubscriptionMinOrderByAggregateInput
  }

  export type SubscriptionScalarWhereWithAggregatesInput = {
    AND?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    OR?: SubscriptionScalarWhereWithAggregatesInput[]
    NOT?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subscription"> | string
    userId?: StringWithAggregatesFilter<"Subscription"> | string
    creatorId?: StringWithAggregatesFilter<"Subscription"> | string
    tier?: StringWithAggregatesFilter<"Subscription"> | string
    status?: StringWithAggregatesFilter<"Subscription"> | string
    startDate?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
    endDate?: DateTimeNullableWithAggregatesFilter<"Subscription"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
  }

  export type TipWhereInput = {
    AND?: TipWhereInput | TipWhereInput[]
    OR?: TipWhereInput[]
    NOT?: TipWhereInput | TipWhereInput[]
    id?: StringFilter<"Tip"> | string
    fromUserId?: StringFilter<"Tip"> | string
    toUserId?: StringFilter<"Tip"> | string
    amount?: DecimalFilter<"Tip"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"Tip"> | Date | string
  }

  export type TipOrderByWithRelationInput = {
    id?: SortOrder
    fromUserId?: SortOrder
    toUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
  }

  export type TipWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TipWhereInput | TipWhereInput[]
    OR?: TipWhereInput[]
    NOT?: TipWhereInput | TipWhereInput[]
    fromUserId?: StringFilter<"Tip"> | string
    toUserId?: StringFilter<"Tip"> | string
    amount?: DecimalFilter<"Tip"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"Tip"> | Date | string
  }, "id">

  export type TipOrderByWithAggregationInput = {
    id?: SortOrder
    fromUserId?: SortOrder
    toUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    _count?: TipCountOrderByAggregateInput
    _avg?: TipAvgOrderByAggregateInput
    _max?: TipMaxOrderByAggregateInput
    _min?: TipMinOrderByAggregateInput
    _sum?: TipSumOrderByAggregateInput
  }

  export type TipScalarWhereWithAggregatesInput = {
    AND?: TipScalarWhereWithAggregatesInput | TipScalarWhereWithAggregatesInput[]
    OR?: TipScalarWhereWithAggregatesInput[]
    NOT?: TipScalarWhereWithAggregatesInput | TipScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Tip"> | string
    fromUserId?: StringWithAggregatesFilter<"Tip"> | string
    toUserId?: StringWithAggregatesFilter<"Tip"> | string
    amount?: DecimalWithAggregatesFilter<"Tip"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"Tip"> | Date | string
  }

  export type VerificationDocumentWhereInput = {
    AND?: VerificationDocumentWhereInput | VerificationDocumentWhereInput[]
    OR?: VerificationDocumentWhereInput[]
    NOT?: VerificationDocumentWhereInput | VerificationDocumentWhereInput[]
    id?: StringFilter<"VerificationDocument"> | string
    userId?: StringFilter<"VerificationDocument"> | string
    documentType?: StringFilter<"VerificationDocument"> | string
    documentUrl?: StringFilter<"VerificationDocument"> | string
    status?: StringFilter<"VerificationDocument"> | string
    reviewedBy?: StringNullableFilter<"VerificationDocument"> | string | null
    reviewedAt?: DateTimeNullableFilter<"VerificationDocument"> | Date | string | null
    metadata?: JsonNullableFilter<"VerificationDocument">
    createdAt?: DateTimeFilter<"VerificationDocument"> | Date | string
    updatedAt?: DateTimeFilter<"VerificationDocument"> | Date | string
  }

  export type VerificationDocumentOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    documentType?: SortOrder
    documentUrl?: SortOrder
    status?: SortOrder
    reviewedBy?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationDocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationDocumentWhereInput | VerificationDocumentWhereInput[]
    OR?: VerificationDocumentWhereInput[]
    NOT?: VerificationDocumentWhereInput | VerificationDocumentWhereInput[]
    userId?: StringFilter<"VerificationDocument"> | string
    documentType?: StringFilter<"VerificationDocument"> | string
    documentUrl?: StringFilter<"VerificationDocument"> | string
    status?: StringFilter<"VerificationDocument"> | string
    reviewedBy?: StringNullableFilter<"VerificationDocument"> | string | null
    reviewedAt?: DateTimeNullableFilter<"VerificationDocument"> | Date | string | null
    metadata?: JsonNullableFilter<"VerificationDocument">
    createdAt?: DateTimeFilter<"VerificationDocument"> | Date | string
    updatedAt?: DateTimeFilter<"VerificationDocument"> | Date | string
  }, "id">

  export type VerificationDocumentOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    documentType?: SortOrder
    documentUrl?: SortOrder
    status?: SortOrder
    reviewedBy?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VerificationDocumentCountOrderByAggregateInput
    _max?: VerificationDocumentMaxOrderByAggregateInput
    _min?: VerificationDocumentMinOrderByAggregateInput
  }

  export type VerificationDocumentScalarWhereWithAggregatesInput = {
    AND?: VerificationDocumentScalarWhereWithAggregatesInput | VerificationDocumentScalarWhereWithAggregatesInput[]
    OR?: VerificationDocumentScalarWhereWithAggregatesInput[]
    NOT?: VerificationDocumentScalarWhereWithAggregatesInput | VerificationDocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationDocument"> | string
    userId?: StringWithAggregatesFilter<"VerificationDocument"> | string
    documentType?: StringWithAggregatesFilter<"VerificationDocument"> | string
    documentUrl?: StringWithAggregatesFilter<"VerificationDocument"> | string
    status?: StringWithAggregatesFilter<"VerificationDocument"> | string
    reviewedBy?: StringNullableWithAggregatesFilter<"VerificationDocument"> | string | null
    reviewedAt?: DateTimeNullableWithAggregatesFilter<"VerificationDocument"> | Date | string | null
    metadata?: JsonNullableWithAggregatesFilter<"VerificationDocument">
    createdAt?: DateTimeWithAggregatesFilter<"VerificationDocument"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"VerificationDocument"> | Date | string
  }

  export type MediaUploadWhereInput = {
    AND?: MediaUploadWhereInput | MediaUploadWhereInput[]
    OR?: MediaUploadWhereInput[]
    NOT?: MediaUploadWhereInput | MediaUploadWhereInput[]
    id?: StringFilter<"MediaUpload"> | string
    userId?: StringFilter<"MediaUpload"> | string
    fileName?: StringFilter<"MediaUpload"> | string
    mimeType?: StringFilter<"MediaUpload"> | string
    size?: BigIntFilter<"MediaUpload"> | bigint | number
    status?: StringFilter<"MediaUpload"> | string
    uploadId?: StringFilter<"MediaUpload"> | string
    assetId?: StringNullableFilter<"MediaUpload"> | string | null
    createdAt?: DateTimeFilter<"MediaUpload"> | Date | string
    updatedAt?: DateTimeFilter<"MediaUpload"> | Date | string
  }

  export type MediaUploadOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    status?: SortOrder
    uploadId?: SortOrder
    assetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MediaUploadWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    uploadId?: string
    AND?: MediaUploadWhereInput | MediaUploadWhereInput[]
    OR?: MediaUploadWhereInput[]
    NOT?: MediaUploadWhereInput | MediaUploadWhereInput[]
    userId?: StringFilter<"MediaUpload"> | string
    fileName?: StringFilter<"MediaUpload"> | string
    mimeType?: StringFilter<"MediaUpload"> | string
    size?: BigIntFilter<"MediaUpload"> | bigint | number
    status?: StringFilter<"MediaUpload"> | string
    assetId?: StringNullableFilter<"MediaUpload"> | string | null
    createdAt?: DateTimeFilter<"MediaUpload"> | Date | string
    updatedAt?: DateTimeFilter<"MediaUpload"> | Date | string
  }, "id" | "uploadId">

  export type MediaUploadOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    status?: SortOrder
    uploadId?: SortOrder
    assetId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: MediaUploadCountOrderByAggregateInput
    _avg?: MediaUploadAvgOrderByAggregateInput
    _max?: MediaUploadMaxOrderByAggregateInput
    _min?: MediaUploadMinOrderByAggregateInput
    _sum?: MediaUploadSumOrderByAggregateInput
  }

  export type MediaUploadScalarWhereWithAggregatesInput = {
    AND?: MediaUploadScalarWhereWithAggregatesInput | MediaUploadScalarWhereWithAggregatesInput[]
    OR?: MediaUploadScalarWhereWithAggregatesInput[]
    NOT?: MediaUploadScalarWhereWithAggregatesInput | MediaUploadScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MediaUpload"> | string
    userId?: StringWithAggregatesFilter<"MediaUpload"> | string
    fileName?: StringWithAggregatesFilter<"MediaUpload"> | string
    mimeType?: StringWithAggregatesFilter<"MediaUpload"> | string
    size?: BigIntWithAggregatesFilter<"MediaUpload"> | bigint | number
    status?: StringWithAggregatesFilter<"MediaUpload"> | string
    uploadId?: StringWithAggregatesFilter<"MediaUpload"> | string
    assetId?: StringNullableWithAggregatesFilter<"MediaUpload"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"MediaUpload"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"MediaUpload"> | Date | string
  }

  export type ContentItemWhereInput = {
    AND?: ContentItemWhereInput | ContentItemWhereInput[]
    OR?: ContentItemWhereInput[]
    NOT?: ContentItemWhereInput | ContentItemWhereInput[]
    id?: StringFilter<"ContentItem"> | string
    title?: StringFilter<"ContentItem"> | string
    description?: StringNullableFilter<"ContentItem"> | string | null
    thumbnail?: StringNullableFilter<"ContentItem"> | string | null
    mediaUrl?: StringFilter<"ContentItem"> | string
    universeId?: StringFilter<"ContentItem"> | string
    creatorId?: StringFilter<"ContentItem"> | string
    status?: StringFilter<"ContentItem"> | string
    metadata?: JsonNullableFilter<"ContentItem">
    createdAt?: DateTimeFilter<"ContentItem"> | Date | string
    updatedAt?: DateTimeFilter<"ContentItem"> | Date | string
  }

  export type ContentItemOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    thumbnail?: SortOrderInput | SortOrder
    mediaUrl?: SortOrder
    universeId?: SortOrder
    creatorId?: SortOrder
    status?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ContentItemWhereInput | ContentItemWhereInput[]
    OR?: ContentItemWhereInput[]
    NOT?: ContentItemWhereInput | ContentItemWhereInput[]
    title?: StringFilter<"ContentItem"> | string
    description?: StringNullableFilter<"ContentItem"> | string | null
    thumbnail?: StringNullableFilter<"ContentItem"> | string | null
    mediaUrl?: StringFilter<"ContentItem"> | string
    universeId?: StringFilter<"ContentItem"> | string
    creatorId?: StringFilter<"ContentItem"> | string
    status?: StringFilter<"ContentItem"> | string
    metadata?: JsonNullableFilter<"ContentItem">
    createdAt?: DateTimeFilter<"ContentItem"> | Date | string
    updatedAt?: DateTimeFilter<"ContentItem"> | Date | string
  }, "id">

  export type ContentItemOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    thumbnail?: SortOrderInput | SortOrder
    mediaUrl?: SortOrder
    universeId?: SortOrder
    creatorId?: SortOrder
    status?: SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContentItemCountOrderByAggregateInput
    _max?: ContentItemMaxOrderByAggregateInput
    _min?: ContentItemMinOrderByAggregateInput
  }

  export type ContentItemScalarWhereWithAggregatesInput = {
    AND?: ContentItemScalarWhereWithAggregatesInput | ContentItemScalarWhereWithAggregatesInput[]
    OR?: ContentItemScalarWhereWithAggregatesInput[]
    NOT?: ContentItemScalarWhereWithAggregatesInput | ContentItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContentItem"> | string
    title?: StringWithAggregatesFilter<"ContentItem"> | string
    description?: StringNullableWithAggregatesFilter<"ContentItem"> | string | null
    thumbnail?: StringNullableWithAggregatesFilter<"ContentItem"> | string | null
    mediaUrl?: StringWithAggregatesFilter<"ContentItem"> | string
    universeId?: StringWithAggregatesFilter<"ContentItem"> | string
    creatorId?: StringWithAggregatesFilter<"ContentItem"> | string
    status?: StringWithAggregatesFilter<"ContentItem"> | string
    metadata?: JsonNullableWithAggregatesFilter<"ContentItem">
    createdAt?: DateTimeWithAggregatesFilter<"ContentItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContentItem"> | Date | string
  }

  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: StringFilter<"Notification"> | string
    userId?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    title?: StringFilter<"Notification"> | string
    message?: StringFilter<"Notification"> | string
    metadata?: JsonNullableFilter<"Notification">
    readAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    metadata?: SortOrderInput | SortOrder
    readAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    userId?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    title?: StringFilter<"Notification"> | string
    message?: StringFilter<"Notification"> | string
    metadata?: JsonNullableFilter<"Notification">
    readAt?: DateTimeNullableFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeFilter<"Notification"> | Date | string
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    metadata?: SortOrderInput | SortOrder
    readAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Notification"> | string
    userId?: StringWithAggregatesFilter<"Notification"> | string
    type?: StringWithAggregatesFilter<"Notification"> | string
    title?: StringWithAggregatesFilter<"Notification"> | string
    message?: StringWithAggregatesFilter<"Notification"> | string
    metadata?: JsonNullableWithAggregatesFilter<"Notification">
    readAt?: DateTimeNullableWithAggregatesFilter<"Notification"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
  }

  export type WalletWhereInput = {
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    id?: StringFilter<"Wallet"> | string
    userId?: StringFilter<"Wallet"> | string
    balance?: DecimalFilter<"Wallet"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Wallet"> | string
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeFilter<"Wallet"> | Date | string
  }

  export type WalletOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    balance?: SortOrder
    currency?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    balance?: DecimalFilter<"Wallet"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Wallet"> | string
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeFilter<"Wallet"> | Date | string
  }, "id" | "userId">

  export type WalletOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    balance?: SortOrder
    currency?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WalletCountOrderByAggregateInput
    _avg?: WalletAvgOrderByAggregateInput
    _max?: WalletMaxOrderByAggregateInput
    _min?: WalletMinOrderByAggregateInput
    _sum?: WalletSumOrderByAggregateInput
  }

  export type WalletScalarWhereWithAggregatesInput = {
    AND?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    OR?: WalletScalarWhereWithAggregatesInput[]
    NOT?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Wallet"> | string
    userId?: StringWithAggregatesFilter<"Wallet"> | string
    balance?: DecimalWithAggregatesFilter<"Wallet"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Wallet"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Wallet"> | Date | string
  }

  export type WalletTransactionWhereInput = {
    AND?: WalletTransactionWhereInput | WalletTransactionWhereInput[]
    OR?: WalletTransactionWhereInput[]
    NOT?: WalletTransactionWhereInput | WalletTransactionWhereInput[]
    id?: StringFilter<"WalletTransaction"> | string
    walletId?: StringFilter<"WalletTransaction"> | string
    type?: StringFilter<"WalletTransaction"> | string
    amount?: DecimalFilter<"WalletTransaction"> | Decimal | DecimalJsLike | number | string
    description?: StringFilter<"WalletTransaction"> | string
    reference?: StringNullableFilter<"WalletTransaction"> | string | null
    createdAt?: DateTimeFilter<"WalletTransaction"> | Date | string
  }

  export type WalletTransactionOrderByWithRelationInput = {
    id?: SortOrder
    walletId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    description?: SortOrder
    reference?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type WalletTransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WalletTransactionWhereInput | WalletTransactionWhereInput[]
    OR?: WalletTransactionWhereInput[]
    NOT?: WalletTransactionWhereInput | WalletTransactionWhereInput[]
    walletId?: StringFilter<"WalletTransaction"> | string
    type?: StringFilter<"WalletTransaction"> | string
    amount?: DecimalFilter<"WalletTransaction"> | Decimal | DecimalJsLike | number | string
    description?: StringFilter<"WalletTransaction"> | string
    reference?: StringNullableFilter<"WalletTransaction"> | string | null
    createdAt?: DateTimeFilter<"WalletTransaction"> | Date | string
  }, "id">

  export type WalletTransactionOrderByWithAggregationInput = {
    id?: SortOrder
    walletId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    description?: SortOrder
    reference?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: WalletTransactionCountOrderByAggregateInput
    _avg?: WalletTransactionAvgOrderByAggregateInput
    _max?: WalletTransactionMaxOrderByAggregateInput
    _min?: WalletTransactionMinOrderByAggregateInput
    _sum?: WalletTransactionSumOrderByAggregateInput
  }

  export type WalletTransactionScalarWhereWithAggregatesInput = {
    AND?: WalletTransactionScalarWhereWithAggregatesInput | WalletTransactionScalarWhereWithAggregatesInput[]
    OR?: WalletTransactionScalarWhereWithAggregatesInput[]
    NOT?: WalletTransactionScalarWhereWithAggregatesInput | WalletTransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WalletTransaction"> | string
    walletId?: StringWithAggregatesFilter<"WalletTransaction"> | string
    type?: StringWithAggregatesFilter<"WalletTransaction"> | string
    amount?: DecimalWithAggregatesFilter<"WalletTransaction"> | Decimal | DecimalJsLike | number | string
    description?: StringWithAggregatesFilter<"WalletTransaction"> | string
    reference?: StringNullableWithAggregatesFilter<"WalletTransaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"WalletTransaction"> | Date | string
  }

  export type CreatorProfileCreateInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionCreateNestedManyWithoutCreatorInput
    channels?: ChannelCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutCreatorInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileCreateManyInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CreatorProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorEarningCreateInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutEarningsInput
  }

  export type CreatorEarningUncheckedCreateInput = {
    id?: string
    creatorId: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CreatorEarningUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutEarningsNestedInput
  }

  export type CreatorEarningUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorEarningCreateManyInput = {
    id?: string
    creatorId: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CreatorEarningUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorEarningUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelCreateInput = {
    id?: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutChannelsInput
  }

  export type ChannelUncheckedCreateInput = {
    id?: string
    creatorId: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChannelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutChannelsNestedInput
  }

  export type ChannelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelCreateManyInput = {
    id?: string
    creatorId: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChannelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorChallengeCreateInput = {
    id?: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutChallengesInput
    entries?: ChallengeEntryCreateNestedManyWithoutChallengeInput
  }

  export type CreatorChallengeUncheckedCreateInput = {
    id?: string
    creatorId: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
    entries?: ChallengeEntryUncheckedCreateNestedManyWithoutChallengeInput
  }

  export type CreatorChallengeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutChallengesNestedInput
    entries?: ChallengeEntryUpdateManyWithoutChallengeNestedInput
  }

  export type CreatorChallengeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: ChallengeEntryUncheckedUpdateManyWithoutChallengeNestedInput
  }

  export type CreatorChallengeCreateManyInput = {
    id?: string
    creatorId: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
  }

  export type CreatorChallengeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorChallengeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryCreateInput = {
    id?: string
    userId: string
    contentUrl: string
    createdAt?: Date | string
    challenge: CreatorChallengeCreateNestedOneWithoutEntriesInput
  }

  export type ChallengeEntryUncheckedCreateInput = {
    id?: string
    userId: string
    challengeId: string
    contentUrl: string
    createdAt?: Date | string
  }

  export type ChallengeEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    challenge?: CreatorChallengeUpdateOneRequiredWithoutEntriesNestedInput
  }

  export type ChallengeEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    challengeId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryCreateManyInput = {
    id?: string
    userId: string
    challengeId: string
    contentUrl: string
    createdAt?: Date | string
  }

  export type ChallengeEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    challengeId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestCreateInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutPayoutRequestsInput
  }

  export type PayoutRequestUncheckedCreateInput = {
    id?: string
    creatorId: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutRequestUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutPayoutRequestsNestedInput
  }

  export type PayoutRequestUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestCreateManyInput = {
    id?: string
    creatorId: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutRequestUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateInput = {
    id?: string
    userId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutSubscriptionsInput
  }

  export type SubscriptionUncheckedCreateInput = {
    id?: string
    userId: string
    creatorId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutSubscriptionsNestedInput
  }

  export type SubscriptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateManyInput = {
    id?: string
    userId: string
    creatorId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TipCreateInput = {
    id?: string
    fromUserId: string
    toUserId: string
    amount: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type TipUncheckedCreateInput = {
    id?: string
    fromUserId: string
    toUserId: string
    amount: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type TipUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromUserId?: StringFieldUpdateOperationsInput | string
    toUserId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TipUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromUserId?: StringFieldUpdateOperationsInput | string
    toUserId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TipCreateManyInput = {
    id?: string
    fromUserId: string
    toUserId: string
    amount: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
  }

  export type TipUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromUserId?: StringFieldUpdateOperationsInput | string
    toUserId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TipUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromUserId?: StringFieldUpdateOperationsInput | string
    toUserId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationDocumentCreateInput = {
    id?: string
    userId: string
    documentType: string
    documentUrl: string
    status?: string
    reviewedBy?: string | null
    reviewedAt?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationDocumentUncheckedCreateInput = {
    id?: string
    userId: string
    documentType: string
    documentUrl: string
    status?: string
    reviewedBy?: string | null
    reviewedAt?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationDocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    documentUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationDocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    documentUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationDocumentCreateManyInput = {
    id?: string
    userId: string
    documentType: string
    documentUrl: string
    status?: string
    reviewedBy?: string | null
    reviewedAt?: Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationDocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    documentUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationDocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    documentUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaUploadCreateInput = {
    id?: string
    userId: string
    fileName: string
    mimeType: string
    size: bigint | number
    status?: string
    uploadId: string
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MediaUploadUncheckedCreateInput = {
    id?: string
    userId: string
    fileName: string
    mimeType: string
    size: bigint | number
    status?: string
    uploadId: string
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MediaUploadUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    uploadId?: StringFieldUpdateOperationsInput | string
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaUploadUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    uploadId?: StringFieldUpdateOperationsInput | string
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaUploadCreateManyInput = {
    id?: string
    userId: string
    fileName: string
    mimeType: string
    size: bigint | number
    status?: string
    uploadId: string
    assetId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type MediaUploadUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    uploadId?: StringFieldUpdateOperationsInput | string
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MediaUploadUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fileName?: StringFieldUpdateOperationsInput | string
    mimeType?: StringFieldUpdateOperationsInput | string
    size?: BigIntFieldUpdateOperationsInput | bigint | number
    status?: StringFieldUpdateOperationsInput | string
    uploadId?: StringFieldUpdateOperationsInput | string
    assetId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentItemCreateInput = {
    id?: string
    title: string
    description?: string | null
    thumbnail?: string | null
    mediaUrl: string
    universeId: string
    creatorId: string
    status?: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentItemUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    thumbnail?: string | null
    mediaUrl: string
    universeId: string
    creatorId: string
    status?: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentItemCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    thumbnail?: string | null
    mediaUrl: string
    universeId: string
    creatorId: string
    status?: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContentItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContentItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateInput = {
    id?: string
    userId: string
    type: string
    title: string
    message: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: Date | string | null
    createdAt?: Date | string
  }

  export type NotificationUncheckedCreateInput = {
    id?: string
    userId: string
    type: string
    title: string
    message: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: Date | string | null
    createdAt?: Date | string
  }

  export type NotificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateManyInput = {
    id?: string
    userId: string
    type: string
    title: string
    message: string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: Date | string | null
    createdAt?: Date | string
  }

  export type NotificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    metadata?: NullableJsonNullValueInput | InputJsonValue
    readAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletCreateInput = {
    id?: string
    userId: string
    balance?: Decimal | DecimalJsLike | number | string
    currency?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletUncheckedCreateInput = {
    id?: string
    userId: string
    balance?: Decimal | DecimalJsLike | number | string
    currency?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletCreateManyInput = {
    id?: string
    userId: string
    balance?: Decimal | DecimalJsLike | number | string
    currency?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    balance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletTransactionCreateInput = {
    id?: string
    walletId: string
    type: string
    amount: Decimal | DecimalJsLike | number | string
    description: string
    reference?: string | null
    createdAt?: Date | string
  }

  export type WalletTransactionUncheckedCreateInput = {
    id?: string
    walletId: string
    type: string
    amount: Decimal | DecimalJsLike | number | string
    description: string
    reference?: string | null
    createdAt?: Date | string
  }

  export type WalletTransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletTransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletTransactionCreateManyInput = {
    id?: string
    walletId: string
    type: string
    amount: Decimal | DecimalJsLike | number | string
    description: string
    reference?: string | null
    createdAt?: Date | string
  }

  export type WalletTransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletTransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: StringFieldUpdateOperationsInput | string
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type CreatorEarningListRelationFilter = {
    every?: CreatorEarningWhereInput
    some?: CreatorEarningWhereInput
    none?: CreatorEarningWhereInput
  }

  export type SubscriptionListRelationFilter = {
    every?: SubscriptionWhereInput
    some?: SubscriptionWhereInput
    none?: SubscriptionWhereInput
  }

  export type ChannelListRelationFilter = {
    every?: ChannelWhereInput
    some?: ChannelWhereInput
    none?: ChannelWhereInput
  }

  export type CreatorChallengeListRelationFilter = {
    every?: CreatorChallengeWhereInput
    some?: CreatorChallengeWhereInput
    none?: CreatorChallengeWhereInput
  }

  export type PayoutRequestListRelationFilter = {
    every?: PayoutRequestWhereInput
    some?: PayoutRequestWhereInput
    none?: PayoutRequestWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CreatorEarningOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SubscriptionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChannelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CreatorChallengeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PayoutRequestOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CreatorProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    displayName?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    banner?: SortOrder
    socialLinks?: SortOrder
    verified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CreatorProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    displayName?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    banner?: SortOrder
    verified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CreatorProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    displayName?: SortOrder
    avatar?: SortOrder
    bio?: SortOrder
    banner?: SortOrder
    verified?: SortOrder
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

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type CreatorProfileRelationFilter = {
    is?: CreatorProfileWhereInput
    isNot?: CreatorProfileWhereInput
  }

  export type CreatorEarningCountOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    referenceId?: SortOrder
    status?: SortOrder
    paidAt?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorEarningAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type CreatorEarningMaxOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    referenceId?: SortOrder
    status?: SortOrder
    paidAt?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorEarningMinOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    referenceId?: SortOrder
    status?: SortOrder
    paidAt?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorEarningSumOrderByAggregateInput = {
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

  export type ChannelCountOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChannelMaxOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChannelMinOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    category?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ChallengeEntryListRelationFilter = {
    every?: ChallengeEntryWhereInput
    some?: ChallengeEntryWhereInput
    none?: ChallengeEntryWhereInput
  }

  export type ChallengeEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CreatorChallengeCountOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    prize?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorChallengeMaxOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    prize?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorChallengeMinOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    prize?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type CreatorChallengeRelationFilter = {
    is?: CreatorChallengeWhereInput
    isNot?: CreatorChallengeWhereInput
  }

  export type ChallengeEntryUserIdChallengeIdCompoundUniqueInput = {
    userId: string
    challengeId: string
  }

  export type ChallengeEntryCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    challengeId?: SortOrder
    contentUrl?: SortOrder
    createdAt?: SortOrder
  }

  export type ChallengeEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    challengeId?: SortOrder
    contentUrl?: SortOrder
    createdAt?: SortOrder
  }

  export type ChallengeEntryMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    challengeId?: SortOrder
    contentUrl?: SortOrder
    createdAt?: SortOrder
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

  export type PayoutRequestCountOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    method?: SortOrder
    accountDetails?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutRequestAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type PayoutRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    method?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutRequestMinOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
    amount?: SortOrder
    method?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutRequestSumOrderByAggregateInput = {
    amount?: SortOrder
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

  export type SubscriptionUserIdCreatorIdCompoundUniqueInput = {
    userId: string
    creatorId: string
  }

  export type SubscriptionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    creatorId?: SortOrder
    tier?: SortOrder
    status?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    creatorId?: SortOrder
    tier?: SortOrder
    status?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriptionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    creatorId?: SortOrder
    tier?: SortOrder
    status?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TipCountOrderByAggregateInput = {
    id?: SortOrder
    fromUserId?: SortOrder
    toUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
  }

  export type TipAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type TipMaxOrderByAggregateInput = {
    id?: SortOrder
    fromUserId?: SortOrder
    toUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
  }

  export type TipMinOrderByAggregateInput = {
    id?: SortOrder
    fromUserId?: SortOrder
    toUserId?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
  }

  export type TipSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type VerificationDocumentCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    documentType?: SortOrder
    documentUrl?: SortOrder
    status?: SortOrder
    reviewedBy?: SortOrder
    reviewedAt?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationDocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    documentType?: SortOrder
    documentUrl?: SortOrder
    status?: SortOrder
    reviewedBy?: SortOrder
    reviewedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationDocumentMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    documentType?: SortOrder
    documentUrl?: SortOrder
    status?: SortOrder
    reviewedBy?: SortOrder
    reviewedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type MediaUploadCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    status?: SortOrder
    uploadId?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MediaUploadAvgOrderByAggregateInput = {
    size?: SortOrder
  }

  export type MediaUploadMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    status?: SortOrder
    uploadId?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MediaUploadMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    fileName?: SortOrder
    mimeType?: SortOrder
    size?: SortOrder
    status?: SortOrder
    uploadId?: SortOrder
    assetId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type MediaUploadSumOrderByAggregateInput = {
    size?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type ContentItemCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    thumbnail?: SortOrder
    mediaUrl?: SortOrder
    universeId?: SortOrder
    creatorId?: SortOrder
    status?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentItemMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    thumbnail?: SortOrder
    mediaUrl?: SortOrder
    universeId?: SortOrder
    creatorId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContentItemMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    thumbnail?: SortOrder
    mediaUrl?: SortOrder
    universeId?: SortOrder
    creatorId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    metadata?: SortOrder
    readAt?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    readAt?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    readAt?: SortOrder
    createdAt?: SortOrder
  }

  export type WalletCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    balance?: SortOrder
    currency?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletAvgOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type WalletMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    balance?: SortOrder
    currency?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    balance?: SortOrder
    currency?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletSumOrderByAggregateInput = {
    balance?: SortOrder
  }

  export type WalletTransactionCountOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    description?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type WalletTransactionAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type WalletTransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    description?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type WalletTransactionMinOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    type?: SortOrder
    amount?: SortOrder
    description?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type WalletTransactionSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type CreatorEarningCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput> | CreatorEarningCreateWithoutCreatorInput[] | CreatorEarningUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorEarningCreateOrConnectWithoutCreatorInput | CreatorEarningCreateOrConnectWithoutCreatorInput[]
    createMany?: CreatorEarningCreateManyCreatorInputEnvelope
    connect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
  }

  export type SubscriptionCreateNestedManyWithoutCreatorInput = {
    create?: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput> | SubscriptionCreateWithoutCreatorInput[] | SubscriptionUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: SubscriptionCreateOrConnectWithoutCreatorInput | SubscriptionCreateOrConnectWithoutCreatorInput[]
    createMany?: SubscriptionCreateManyCreatorInputEnvelope
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
  }

  export type ChannelCreateNestedManyWithoutCreatorInput = {
    create?: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput> | ChannelCreateWithoutCreatorInput[] | ChannelUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCreatorInput | ChannelCreateOrConnectWithoutCreatorInput[]
    createMany?: ChannelCreateManyCreatorInputEnvelope
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
  }

  export type CreatorChallengeCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput> | CreatorChallengeCreateWithoutCreatorInput[] | CreatorChallengeUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutCreatorInput | CreatorChallengeCreateOrConnectWithoutCreatorInput[]
    createMany?: CreatorChallengeCreateManyCreatorInputEnvelope
    connect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
  }

  export type PayoutRequestCreateNestedManyWithoutCreatorInput = {
    create?: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput> | PayoutRequestCreateWithoutCreatorInput[] | PayoutRequestUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: PayoutRequestCreateOrConnectWithoutCreatorInput | PayoutRequestCreateOrConnectWithoutCreatorInput[]
    createMany?: PayoutRequestCreateManyCreatorInputEnvelope
    connect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
  }

  export type CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput> | CreatorEarningCreateWithoutCreatorInput[] | CreatorEarningUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorEarningCreateOrConnectWithoutCreatorInput | CreatorEarningCreateOrConnectWithoutCreatorInput[]
    createMany?: CreatorEarningCreateManyCreatorInputEnvelope
    connect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
  }

  export type SubscriptionUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput> | SubscriptionCreateWithoutCreatorInput[] | SubscriptionUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: SubscriptionCreateOrConnectWithoutCreatorInput | SubscriptionCreateOrConnectWithoutCreatorInput[]
    createMany?: SubscriptionCreateManyCreatorInputEnvelope
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
  }

  export type ChannelUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput> | ChannelCreateWithoutCreatorInput[] | ChannelUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCreatorInput | ChannelCreateOrConnectWithoutCreatorInput[]
    createMany?: ChannelCreateManyCreatorInputEnvelope
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
  }

  export type CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput> | CreatorChallengeCreateWithoutCreatorInput[] | CreatorChallengeUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutCreatorInput | CreatorChallengeCreateOrConnectWithoutCreatorInput[]
    createMany?: CreatorChallengeCreateManyCreatorInputEnvelope
    connect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
  }

  export type PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput> | PayoutRequestCreateWithoutCreatorInput[] | PayoutRequestUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: PayoutRequestCreateOrConnectWithoutCreatorInput | PayoutRequestCreateOrConnectWithoutCreatorInput[]
    createMany?: PayoutRequestCreateManyCreatorInputEnvelope
    connect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CreatorEarningUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput> | CreatorEarningCreateWithoutCreatorInput[] | CreatorEarningUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorEarningCreateOrConnectWithoutCreatorInput | CreatorEarningCreateOrConnectWithoutCreatorInput[]
    upsert?: CreatorEarningUpsertWithWhereUniqueWithoutCreatorInput | CreatorEarningUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CreatorEarningCreateManyCreatorInputEnvelope
    set?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    disconnect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    delete?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    connect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    update?: CreatorEarningUpdateWithWhereUniqueWithoutCreatorInput | CreatorEarningUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CreatorEarningUpdateManyWithWhereWithoutCreatorInput | CreatorEarningUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CreatorEarningScalarWhereInput | CreatorEarningScalarWhereInput[]
  }

  export type SubscriptionUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput> | SubscriptionCreateWithoutCreatorInput[] | SubscriptionUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: SubscriptionCreateOrConnectWithoutCreatorInput | SubscriptionCreateOrConnectWithoutCreatorInput[]
    upsert?: SubscriptionUpsertWithWhereUniqueWithoutCreatorInput | SubscriptionUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: SubscriptionCreateManyCreatorInputEnvelope
    set?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    disconnect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    delete?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    update?: SubscriptionUpdateWithWhereUniqueWithoutCreatorInput | SubscriptionUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: SubscriptionUpdateManyWithWhereWithoutCreatorInput | SubscriptionUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[]
  }

  export type ChannelUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput> | ChannelCreateWithoutCreatorInput[] | ChannelUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCreatorInput | ChannelCreateOrConnectWithoutCreatorInput[]
    upsert?: ChannelUpsertWithWhereUniqueWithoutCreatorInput | ChannelUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: ChannelCreateManyCreatorInputEnvelope
    set?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    disconnect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    delete?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    update?: ChannelUpdateWithWhereUniqueWithoutCreatorInput | ChannelUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: ChannelUpdateManyWithWhereWithoutCreatorInput | ChannelUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
  }

  export type CreatorChallengeUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput> | CreatorChallengeCreateWithoutCreatorInput[] | CreatorChallengeUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutCreatorInput | CreatorChallengeCreateOrConnectWithoutCreatorInput[]
    upsert?: CreatorChallengeUpsertWithWhereUniqueWithoutCreatorInput | CreatorChallengeUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CreatorChallengeCreateManyCreatorInputEnvelope
    set?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    disconnect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    delete?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    connect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    update?: CreatorChallengeUpdateWithWhereUniqueWithoutCreatorInput | CreatorChallengeUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CreatorChallengeUpdateManyWithWhereWithoutCreatorInput | CreatorChallengeUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CreatorChallengeScalarWhereInput | CreatorChallengeScalarWhereInput[]
  }

  export type PayoutRequestUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput> | PayoutRequestCreateWithoutCreatorInput[] | PayoutRequestUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: PayoutRequestCreateOrConnectWithoutCreatorInput | PayoutRequestCreateOrConnectWithoutCreatorInput[]
    upsert?: PayoutRequestUpsertWithWhereUniqueWithoutCreatorInput | PayoutRequestUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: PayoutRequestCreateManyCreatorInputEnvelope
    set?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    disconnect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    delete?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    connect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    update?: PayoutRequestUpdateWithWhereUniqueWithoutCreatorInput | PayoutRequestUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: PayoutRequestUpdateManyWithWhereWithoutCreatorInput | PayoutRequestUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: PayoutRequestScalarWhereInput | PayoutRequestScalarWhereInput[]
  }

  export type CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput> | CreatorEarningCreateWithoutCreatorInput[] | CreatorEarningUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorEarningCreateOrConnectWithoutCreatorInput | CreatorEarningCreateOrConnectWithoutCreatorInput[]
    upsert?: CreatorEarningUpsertWithWhereUniqueWithoutCreatorInput | CreatorEarningUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CreatorEarningCreateManyCreatorInputEnvelope
    set?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    disconnect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    delete?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    connect?: CreatorEarningWhereUniqueInput | CreatorEarningWhereUniqueInput[]
    update?: CreatorEarningUpdateWithWhereUniqueWithoutCreatorInput | CreatorEarningUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CreatorEarningUpdateManyWithWhereWithoutCreatorInput | CreatorEarningUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CreatorEarningScalarWhereInput | CreatorEarningScalarWhereInput[]
  }

  export type SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput> | SubscriptionCreateWithoutCreatorInput[] | SubscriptionUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: SubscriptionCreateOrConnectWithoutCreatorInput | SubscriptionCreateOrConnectWithoutCreatorInput[]
    upsert?: SubscriptionUpsertWithWhereUniqueWithoutCreatorInput | SubscriptionUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: SubscriptionCreateManyCreatorInputEnvelope
    set?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    disconnect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    delete?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[]
    update?: SubscriptionUpdateWithWhereUniqueWithoutCreatorInput | SubscriptionUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: SubscriptionUpdateManyWithWhereWithoutCreatorInput | SubscriptionUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[]
  }

  export type ChannelUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput> | ChannelCreateWithoutCreatorInput[] | ChannelUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: ChannelCreateOrConnectWithoutCreatorInput | ChannelCreateOrConnectWithoutCreatorInput[]
    upsert?: ChannelUpsertWithWhereUniqueWithoutCreatorInput | ChannelUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: ChannelCreateManyCreatorInputEnvelope
    set?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    disconnect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    delete?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    connect?: ChannelWhereUniqueInput | ChannelWhereUniqueInput[]
    update?: ChannelUpdateWithWhereUniqueWithoutCreatorInput | ChannelUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: ChannelUpdateManyWithWhereWithoutCreatorInput | ChannelUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
  }

  export type CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput> | CreatorChallengeCreateWithoutCreatorInput[] | CreatorChallengeUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutCreatorInput | CreatorChallengeCreateOrConnectWithoutCreatorInput[]
    upsert?: CreatorChallengeUpsertWithWhereUniqueWithoutCreatorInput | CreatorChallengeUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CreatorChallengeCreateManyCreatorInputEnvelope
    set?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    disconnect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    delete?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    connect?: CreatorChallengeWhereUniqueInput | CreatorChallengeWhereUniqueInput[]
    update?: CreatorChallengeUpdateWithWhereUniqueWithoutCreatorInput | CreatorChallengeUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CreatorChallengeUpdateManyWithWhereWithoutCreatorInput | CreatorChallengeUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CreatorChallengeScalarWhereInput | CreatorChallengeScalarWhereInput[]
  }

  export type PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput> | PayoutRequestCreateWithoutCreatorInput[] | PayoutRequestUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: PayoutRequestCreateOrConnectWithoutCreatorInput | PayoutRequestCreateOrConnectWithoutCreatorInput[]
    upsert?: PayoutRequestUpsertWithWhereUniqueWithoutCreatorInput | PayoutRequestUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: PayoutRequestCreateManyCreatorInputEnvelope
    set?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    disconnect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    delete?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    connect?: PayoutRequestWhereUniqueInput | PayoutRequestWhereUniqueInput[]
    update?: PayoutRequestUpdateWithWhereUniqueWithoutCreatorInput | PayoutRequestUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: PayoutRequestUpdateManyWithWhereWithoutCreatorInput | PayoutRequestUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: PayoutRequestScalarWhereInput | PayoutRequestScalarWhereInput[]
  }

  export type CreatorProfileCreateNestedOneWithoutEarningsInput = {
    create?: XOR<CreatorProfileCreateWithoutEarningsInput, CreatorProfileUncheckedCreateWithoutEarningsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutEarningsInput
    connect?: CreatorProfileWhereUniqueInput
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type CreatorProfileUpdateOneRequiredWithoutEarningsNestedInput = {
    create?: XOR<CreatorProfileCreateWithoutEarningsInput, CreatorProfileUncheckedCreateWithoutEarningsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutEarningsInput
    upsert?: CreatorProfileUpsertWithoutEarningsInput
    connect?: CreatorProfileWhereUniqueInput
    update?: XOR<XOR<CreatorProfileUpdateToOneWithWhereWithoutEarningsInput, CreatorProfileUpdateWithoutEarningsInput>, CreatorProfileUncheckedUpdateWithoutEarningsInput>
  }

  export type CreatorProfileCreateNestedOneWithoutChannelsInput = {
    create?: XOR<CreatorProfileCreateWithoutChannelsInput, CreatorProfileUncheckedCreateWithoutChannelsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutChannelsInput
    connect?: CreatorProfileWhereUniqueInput
  }

  export type CreatorProfileUpdateOneRequiredWithoutChannelsNestedInput = {
    create?: XOR<CreatorProfileCreateWithoutChannelsInput, CreatorProfileUncheckedCreateWithoutChannelsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutChannelsInput
    upsert?: CreatorProfileUpsertWithoutChannelsInput
    connect?: CreatorProfileWhereUniqueInput
    update?: XOR<XOR<CreatorProfileUpdateToOneWithWhereWithoutChannelsInput, CreatorProfileUpdateWithoutChannelsInput>, CreatorProfileUncheckedUpdateWithoutChannelsInput>
  }

  export type CreatorProfileCreateNestedOneWithoutChallengesInput = {
    create?: XOR<CreatorProfileCreateWithoutChallengesInput, CreatorProfileUncheckedCreateWithoutChallengesInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutChallengesInput
    connect?: CreatorProfileWhereUniqueInput
  }

  export type ChallengeEntryCreateNestedManyWithoutChallengeInput = {
    create?: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput> | ChallengeEntryCreateWithoutChallengeInput[] | ChallengeEntryUncheckedCreateWithoutChallengeInput[]
    connectOrCreate?: ChallengeEntryCreateOrConnectWithoutChallengeInput | ChallengeEntryCreateOrConnectWithoutChallengeInput[]
    createMany?: ChallengeEntryCreateManyChallengeInputEnvelope
    connect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
  }

  export type ChallengeEntryUncheckedCreateNestedManyWithoutChallengeInput = {
    create?: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput> | ChallengeEntryCreateWithoutChallengeInput[] | ChallengeEntryUncheckedCreateWithoutChallengeInput[]
    connectOrCreate?: ChallengeEntryCreateOrConnectWithoutChallengeInput | ChallengeEntryCreateOrConnectWithoutChallengeInput[]
    createMany?: ChallengeEntryCreateManyChallengeInputEnvelope
    connect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
  }

  export type CreatorProfileUpdateOneRequiredWithoutChallengesNestedInput = {
    create?: XOR<CreatorProfileCreateWithoutChallengesInput, CreatorProfileUncheckedCreateWithoutChallengesInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutChallengesInput
    upsert?: CreatorProfileUpsertWithoutChallengesInput
    connect?: CreatorProfileWhereUniqueInput
    update?: XOR<XOR<CreatorProfileUpdateToOneWithWhereWithoutChallengesInput, CreatorProfileUpdateWithoutChallengesInput>, CreatorProfileUncheckedUpdateWithoutChallengesInput>
  }

  export type ChallengeEntryUpdateManyWithoutChallengeNestedInput = {
    create?: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput> | ChallengeEntryCreateWithoutChallengeInput[] | ChallengeEntryUncheckedCreateWithoutChallengeInput[]
    connectOrCreate?: ChallengeEntryCreateOrConnectWithoutChallengeInput | ChallengeEntryCreateOrConnectWithoutChallengeInput[]
    upsert?: ChallengeEntryUpsertWithWhereUniqueWithoutChallengeInput | ChallengeEntryUpsertWithWhereUniqueWithoutChallengeInput[]
    createMany?: ChallengeEntryCreateManyChallengeInputEnvelope
    set?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    disconnect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    delete?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    connect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    update?: ChallengeEntryUpdateWithWhereUniqueWithoutChallengeInput | ChallengeEntryUpdateWithWhereUniqueWithoutChallengeInput[]
    updateMany?: ChallengeEntryUpdateManyWithWhereWithoutChallengeInput | ChallengeEntryUpdateManyWithWhereWithoutChallengeInput[]
    deleteMany?: ChallengeEntryScalarWhereInput | ChallengeEntryScalarWhereInput[]
  }

  export type ChallengeEntryUncheckedUpdateManyWithoutChallengeNestedInput = {
    create?: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput> | ChallengeEntryCreateWithoutChallengeInput[] | ChallengeEntryUncheckedCreateWithoutChallengeInput[]
    connectOrCreate?: ChallengeEntryCreateOrConnectWithoutChallengeInput | ChallengeEntryCreateOrConnectWithoutChallengeInput[]
    upsert?: ChallengeEntryUpsertWithWhereUniqueWithoutChallengeInput | ChallengeEntryUpsertWithWhereUniqueWithoutChallengeInput[]
    createMany?: ChallengeEntryCreateManyChallengeInputEnvelope
    set?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    disconnect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    delete?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    connect?: ChallengeEntryWhereUniqueInput | ChallengeEntryWhereUniqueInput[]
    update?: ChallengeEntryUpdateWithWhereUniqueWithoutChallengeInput | ChallengeEntryUpdateWithWhereUniqueWithoutChallengeInput[]
    updateMany?: ChallengeEntryUpdateManyWithWhereWithoutChallengeInput | ChallengeEntryUpdateManyWithWhereWithoutChallengeInput[]
    deleteMany?: ChallengeEntryScalarWhereInput | ChallengeEntryScalarWhereInput[]
  }

  export type CreatorChallengeCreateNestedOneWithoutEntriesInput = {
    create?: XOR<CreatorChallengeCreateWithoutEntriesInput, CreatorChallengeUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutEntriesInput
    connect?: CreatorChallengeWhereUniqueInput
  }

  export type CreatorChallengeUpdateOneRequiredWithoutEntriesNestedInput = {
    create?: XOR<CreatorChallengeCreateWithoutEntriesInput, CreatorChallengeUncheckedCreateWithoutEntriesInput>
    connectOrCreate?: CreatorChallengeCreateOrConnectWithoutEntriesInput
    upsert?: CreatorChallengeUpsertWithoutEntriesInput
    connect?: CreatorChallengeWhereUniqueInput
    update?: XOR<XOR<CreatorChallengeUpdateToOneWithWhereWithoutEntriesInput, CreatorChallengeUpdateWithoutEntriesInput>, CreatorChallengeUncheckedUpdateWithoutEntriesInput>
  }

  export type CreatorProfileCreateNestedOneWithoutPayoutRequestsInput = {
    create?: XOR<CreatorProfileCreateWithoutPayoutRequestsInput, CreatorProfileUncheckedCreateWithoutPayoutRequestsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutPayoutRequestsInput
    connect?: CreatorProfileWhereUniqueInput
  }

  export type CreatorProfileUpdateOneRequiredWithoutPayoutRequestsNestedInput = {
    create?: XOR<CreatorProfileCreateWithoutPayoutRequestsInput, CreatorProfileUncheckedCreateWithoutPayoutRequestsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutPayoutRequestsInput
    upsert?: CreatorProfileUpsertWithoutPayoutRequestsInput
    connect?: CreatorProfileWhereUniqueInput
    update?: XOR<XOR<CreatorProfileUpdateToOneWithWhereWithoutPayoutRequestsInput, CreatorProfileUpdateWithoutPayoutRequestsInput>, CreatorProfileUncheckedUpdateWithoutPayoutRequestsInput>
  }

  export type CreatorProfileCreateNestedOneWithoutSubscriptionsInput = {
    create?: XOR<CreatorProfileCreateWithoutSubscriptionsInput, CreatorProfileUncheckedCreateWithoutSubscriptionsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutSubscriptionsInput
    connect?: CreatorProfileWhereUniqueInput
  }

  export type CreatorProfileUpdateOneRequiredWithoutSubscriptionsNestedInput = {
    create?: XOR<CreatorProfileCreateWithoutSubscriptionsInput, CreatorProfileUncheckedCreateWithoutSubscriptionsInput>
    connectOrCreate?: CreatorProfileCreateOrConnectWithoutSubscriptionsInput
    upsert?: CreatorProfileUpsertWithoutSubscriptionsInput
    connect?: CreatorProfileWhereUniqueInput
    update?: XOR<XOR<CreatorProfileUpdateToOneWithWhereWithoutSubscriptionsInput, CreatorProfileUpdateWithoutSubscriptionsInput>, CreatorProfileUncheckedUpdateWithoutSubscriptionsInput>
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type CreatorEarningCreateWithoutCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CreatorEarningUncheckedCreateWithoutCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CreatorEarningCreateOrConnectWithoutCreatorInput = {
    where: CreatorEarningWhereUniqueInput
    create: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput>
  }

  export type CreatorEarningCreateManyCreatorInputEnvelope = {
    data: CreatorEarningCreateManyCreatorInput | CreatorEarningCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type SubscriptionCreateWithoutCreatorInput = {
    id?: string
    userId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUncheckedCreateWithoutCreatorInput = {
    id?: string
    userId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionCreateOrConnectWithoutCreatorInput = {
    where: SubscriptionWhereUniqueInput
    create: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput>
  }

  export type SubscriptionCreateManyCreatorInputEnvelope = {
    data: SubscriptionCreateManyCreatorInput | SubscriptionCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type ChannelCreateWithoutCreatorInput = {
    id?: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChannelUncheckedCreateWithoutCreatorInput = {
    id?: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChannelCreateOrConnectWithoutCreatorInput = {
    where: ChannelWhereUniqueInput
    create: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput>
  }

  export type ChannelCreateManyCreatorInputEnvelope = {
    data: ChannelCreateManyCreatorInput | ChannelCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type CreatorChallengeCreateWithoutCreatorInput = {
    id?: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
    entries?: ChallengeEntryCreateNestedManyWithoutChallengeInput
  }

  export type CreatorChallengeUncheckedCreateWithoutCreatorInput = {
    id?: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
    entries?: ChallengeEntryUncheckedCreateNestedManyWithoutChallengeInput
  }

  export type CreatorChallengeCreateOrConnectWithoutCreatorInput = {
    where: CreatorChallengeWhereUniqueInput
    create: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput>
  }

  export type CreatorChallengeCreateManyCreatorInputEnvelope = {
    data: CreatorChallengeCreateManyCreatorInput | CreatorChallengeCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type PayoutRequestCreateWithoutCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutRequestUncheckedCreateWithoutCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutRequestCreateOrConnectWithoutCreatorInput = {
    where: PayoutRequestWhereUniqueInput
    create: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput>
  }

  export type PayoutRequestCreateManyCreatorInputEnvelope = {
    data: PayoutRequestCreateManyCreatorInput | PayoutRequestCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type CreatorEarningUpsertWithWhereUniqueWithoutCreatorInput = {
    where: CreatorEarningWhereUniqueInput
    update: XOR<CreatorEarningUpdateWithoutCreatorInput, CreatorEarningUncheckedUpdateWithoutCreatorInput>
    create: XOR<CreatorEarningCreateWithoutCreatorInput, CreatorEarningUncheckedCreateWithoutCreatorInput>
  }

  export type CreatorEarningUpdateWithWhereUniqueWithoutCreatorInput = {
    where: CreatorEarningWhereUniqueInput
    data: XOR<CreatorEarningUpdateWithoutCreatorInput, CreatorEarningUncheckedUpdateWithoutCreatorInput>
  }

  export type CreatorEarningUpdateManyWithWhereWithoutCreatorInput = {
    where: CreatorEarningScalarWhereInput
    data: XOR<CreatorEarningUpdateManyMutationInput, CreatorEarningUncheckedUpdateManyWithoutCreatorInput>
  }

  export type CreatorEarningScalarWhereInput = {
    AND?: CreatorEarningScalarWhereInput | CreatorEarningScalarWhereInput[]
    OR?: CreatorEarningScalarWhereInput[]
    NOT?: CreatorEarningScalarWhereInput | CreatorEarningScalarWhereInput[]
    id?: StringFilter<"CreatorEarning"> | string
    creatorId?: StringFilter<"CreatorEarning"> | string
    amount?: DecimalFilter<"CreatorEarning"> | Decimal | DecimalJsLike | number | string
    type?: StringFilter<"CreatorEarning"> | string
    referenceId?: StringNullableFilter<"CreatorEarning"> | string | null
    status?: StringFilter<"CreatorEarning"> | string
    paidAt?: DateTimeNullableFilter<"CreatorEarning"> | Date | string | null
    createdAt?: DateTimeFilter<"CreatorEarning"> | Date | string
  }

  export type SubscriptionUpsertWithWhereUniqueWithoutCreatorInput = {
    where: SubscriptionWhereUniqueInput
    update: XOR<SubscriptionUpdateWithoutCreatorInput, SubscriptionUncheckedUpdateWithoutCreatorInput>
    create: XOR<SubscriptionCreateWithoutCreatorInput, SubscriptionUncheckedCreateWithoutCreatorInput>
  }

  export type SubscriptionUpdateWithWhereUniqueWithoutCreatorInput = {
    where: SubscriptionWhereUniqueInput
    data: XOR<SubscriptionUpdateWithoutCreatorInput, SubscriptionUncheckedUpdateWithoutCreatorInput>
  }

  export type SubscriptionUpdateManyWithWhereWithoutCreatorInput = {
    where: SubscriptionScalarWhereInput
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyWithoutCreatorInput>
  }

  export type SubscriptionScalarWhereInput = {
    AND?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[]
    OR?: SubscriptionScalarWhereInput[]
    NOT?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[]
    id?: StringFilter<"Subscription"> | string
    userId?: StringFilter<"Subscription"> | string
    creatorId?: StringFilter<"Subscription"> | string
    tier?: StringFilter<"Subscription"> | string
    status?: StringFilter<"Subscription"> | string
    startDate?: DateTimeFilter<"Subscription"> | Date | string
    endDate?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    createdAt?: DateTimeFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeFilter<"Subscription"> | Date | string
  }

  export type ChannelUpsertWithWhereUniqueWithoutCreatorInput = {
    where: ChannelWhereUniqueInput
    update: XOR<ChannelUpdateWithoutCreatorInput, ChannelUncheckedUpdateWithoutCreatorInput>
    create: XOR<ChannelCreateWithoutCreatorInput, ChannelUncheckedCreateWithoutCreatorInput>
  }

  export type ChannelUpdateWithWhereUniqueWithoutCreatorInput = {
    where: ChannelWhereUniqueInput
    data: XOR<ChannelUpdateWithoutCreatorInput, ChannelUncheckedUpdateWithoutCreatorInput>
  }

  export type ChannelUpdateManyWithWhereWithoutCreatorInput = {
    where: ChannelScalarWhereInput
    data: XOR<ChannelUpdateManyMutationInput, ChannelUncheckedUpdateManyWithoutCreatorInput>
  }

  export type ChannelScalarWhereInput = {
    AND?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
    OR?: ChannelScalarWhereInput[]
    NOT?: ChannelScalarWhereInput | ChannelScalarWhereInput[]
    id?: StringFilter<"Channel"> | string
    creatorId?: StringFilter<"Channel"> | string
    name?: StringFilter<"Channel"> | string
    description?: StringNullableFilter<"Channel"> | string | null
    category?: StringNullableFilter<"Channel"> | string | null
    createdAt?: DateTimeFilter<"Channel"> | Date | string
    updatedAt?: DateTimeFilter<"Channel"> | Date | string
  }

  export type CreatorChallengeUpsertWithWhereUniqueWithoutCreatorInput = {
    where: CreatorChallengeWhereUniqueInput
    update: XOR<CreatorChallengeUpdateWithoutCreatorInput, CreatorChallengeUncheckedUpdateWithoutCreatorInput>
    create: XOR<CreatorChallengeCreateWithoutCreatorInput, CreatorChallengeUncheckedCreateWithoutCreatorInput>
  }

  export type CreatorChallengeUpdateWithWhereUniqueWithoutCreatorInput = {
    where: CreatorChallengeWhereUniqueInput
    data: XOR<CreatorChallengeUpdateWithoutCreatorInput, CreatorChallengeUncheckedUpdateWithoutCreatorInput>
  }

  export type CreatorChallengeUpdateManyWithWhereWithoutCreatorInput = {
    where: CreatorChallengeScalarWhereInput
    data: XOR<CreatorChallengeUpdateManyMutationInput, CreatorChallengeUncheckedUpdateManyWithoutCreatorInput>
  }

  export type CreatorChallengeScalarWhereInput = {
    AND?: CreatorChallengeScalarWhereInput | CreatorChallengeScalarWhereInput[]
    OR?: CreatorChallengeScalarWhereInput[]
    NOT?: CreatorChallengeScalarWhereInput | CreatorChallengeScalarWhereInput[]
    id?: StringFilter<"CreatorChallenge"> | string
    creatorId?: StringFilter<"CreatorChallenge"> | string
    title?: StringFilter<"CreatorChallenge"> | string
    description?: StringFilter<"CreatorChallenge"> | string
    prize?: StringFilter<"CreatorChallenge"> | string
    startDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    endDate?: DateTimeFilter<"CreatorChallenge"> | Date | string
    status?: StringFilter<"CreatorChallenge"> | string
    createdAt?: DateTimeFilter<"CreatorChallenge"> | Date | string
  }

  export type PayoutRequestUpsertWithWhereUniqueWithoutCreatorInput = {
    where: PayoutRequestWhereUniqueInput
    update: XOR<PayoutRequestUpdateWithoutCreatorInput, PayoutRequestUncheckedUpdateWithoutCreatorInput>
    create: XOR<PayoutRequestCreateWithoutCreatorInput, PayoutRequestUncheckedCreateWithoutCreatorInput>
  }

  export type PayoutRequestUpdateWithWhereUniqueWithoutCreatorInput = {
    where: PayoutRequestWhereUniqueInput
    data: XOR<PayoutRequestUpdateWithoutCreatorInput, PayoutRequestUncheckedUpdateWithoutCreatorInput>
  }

  export type PayoutRequestUpdateManyWithWhereWithoutCreatorInput = {
    where: PayoutRequestScalarWhereInput
    data: XOR<PayoutRequestUpdateManyMutationInput, PayoutRequestUncheckedUpdateManyWithoutCreatorInput>
  }

  export type PayoutRequestScalarWhereInput = {
    AND?: PayoutRequestScalarWhereInput | PayoutRequestScalarWhereInput[]
    OR?: PayoutRequestScalarWhereInput[]
    NOT?: PayoutRequestScalarWhereInput | PayoutRequestScalarWhereInput[]
    id?: StringFilter<"PayoutRequest"> | string
    creatorId?: StringFilter<"PayoutRequest"> | string
    amount?: DecimalFilter<"PayoutRequest"> | Decimal | DecimalJsLike | number | string
    method?: StringFilter<"PayoutRequest"> | string
    accountDetails?: JsonFilter<"PayoutRequest">
    status?: StringFilter<"PayoutRequest"> | string
    processedAt?: DateTimeNullableFilter<"PayoutRequest"> | Date | string | null
    createdAt?: DateTimeFilter<"PayoutRequest"> | Date | string
    updatedAt?: DateTimeFilter<"PayoutRequest"> | Date | string
  }

  export type CreatorProfileCreateWithoutEarningsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subscriptions?: SubscriptionCreateNestedManyWithoutCreatorInput
    channels?: ChannelCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateWithoutEarningsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutCreatorInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileCreateOrConnectWithoutEarningsInput = {
    where: CreatorProfileWhereUniqueInput
    create: XOR<CreatorProfileCreateWithoutEarningsInput, CreatorProfileUncheckedCreateWithoutEarningsInput>
  }

  export type CreatorProfileUpsertWithoutEarningsInput = {
    update: XOR<CreatorProfileUpdateWithoutEarningsInput, CreatorProfileUncheckedUpdateWithoutEarningsInput>
    create: XOR<CreatorProfileCreateWithoutEarningsInput, CreatorProfileUncheckedCreateWithoutEarningsInput>
    where?: CreatorProfileWhereInput
  }

  export type CreatorProfileUpdateToOneWithWhereWithoutEarningsInput = {
    where?: CreatorProfileWhereInput
    data: XOR<CreatorProfileUpdateWithoutEarningsInput, CreatorProfileUncheckedUpdateWithoutEarningsInput>
  }

  export type CreatorProfileUpdateWithoutEarningsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subscriptions?: SubscriptionUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateWithoutEarningsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileCreateWithoutChannelsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateWithoutChannelsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileCreateOrConnectWithoutChannelsInput = {
    where: CreatorProfileWhereUniqueInput
    create: XOR<CreatorProfileCreateWithoutChannelsInput, CreatorProfileUncheckedCreateWithoutChannelsInput>
  }

  export type CreatorProfileUpsertWithoutChannelsInput = {
    update: XOR<CreatorProfileUpdateWithoutChannelsInput, CreatorProfileUncheckedUpdateWithoutChannelsInput>
    create: XOR<CreatorProfileCreateWithoutChannelsInput, CreatorProfileUncheckedCreateWithoutChannelsInput>
    where?: CreatorProfileWhereInput
  }

  export type CreatorProfileUpdateToOneWithWhereWithoutChannelsInput = {
    where?: CreatorProfileWhereInput
    data: XOR<CreatorProfileUpdateWithoutChannelsInput, CreatorProfileUncheckedUpdateWithoutChannelsInput>
  }

  export type CreatorProfileUpdateWithoutChannelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateWithoutChannelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileCreateWithoutChallengesInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionCreateNestedManyWithoutCreatorInput
    channels?: ChannelCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateWithoutChallengesInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutCreatorInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileCreateOrConnectWithoutChallengesInput = {
    where: CreatorProfileWhereUniqueInput
    create: XOR<CreatorProfileCreateWithoutChallengesInput, CreatorProfileUncheckedCreateWithoutChallengesInput>
  }

  export type ChallengeEntryCreateWithoutChallengeInput = {
    id?: string
    userId: string
    contentUrl: string
    createdAt?: Date | string
  }

  export type ChallengeEntryUncheckedCreateWithoutChallengeInput = {
    id?: string
    userId: string
    contentUrl: string
    createdAt?: Date | string
  }

  export type ChallengeEntryCreateOrConnectWithoutChallengeInput = {
    where: ChallengeEntryWhereUniqueInput
    create: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput>
  }

  export type ChallengeEntryCreateManyChallengeInputEnvelope = {
    data: ChallengeEntryCreateManyChallengeInput | ChallengeEntryCreateManyChallengeInput[]
    skipDuplicates?: boolean
  }

  export type CreatorProfileUpsertWithoutChallengesInput = {
    update: XOR<CreatorProfileUpdateWithoutChallengesInput, CreatorProfileUncheckedUpdateWithoutChallengesInput>
    create: XOR<CreatorProfileCreateWithoutChallengesInput, CreatorProfileUncheckedCreateWithoutChallengesInput>
    where?: CreatorProfileWhereInput
  }

  export type CreatorProfileUpdateToOneWithWhereWithoutChallengesInput = {
    where?: CreatorProfileWhereInput
    data: XOR<CreatorProfileUpdateWithoutChallengesInput, CreatorProfileUncheckedUpdateWithoutChallengesInput>
  }

  export type CreatorProfileUpdateWithoutChallengesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateWithoutChallengesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type ChallengeEntryUpsertWithWhereUniqueWithoutChallengeInput = {
    where: ChallengeEntryWhereUniqueInput
    update: XOR<ChallengeEntryUpdateWithoutChallengeInput, ChallengeEntryUncheckedUpdateWithoutChallengeInput>
    create: XOR<ChallengeEntryCreateWithoutChallengeInput, ChallengeEntryUncheckedCreateWithoutChallengeInput>
  }

  export type ChallengeEntryUpdateWithWhereUniqueWithoutChallengeInput = {
    where: ChallengeEntryWhereUniqueInput
    data: XOR<ChallengeEntryUpdateWithoutChallengeInput, ChallengeEntryUncheckedUpdateWithoutChallengeInput>
  }

  export type ChallengeEntryUpdateManyWithWhereWithoutChallengeInput = {
    where: ChallengeEntryScalarWhereInput
    data: XOR<ChallengeEntryUpdateManyMutationInput, ChallengeEntryUncheckedUpdateManyWithoutChallengeInput>
  }

  export type ChallengeEntryScalarWhereInput = {
    AND?: ChallengeEntryScalarWhereInput | ChallengeEntryScalarWhereInput[]
    OR?: ChallengeEntryScalarWhereInput[]
    NOT?: ChallengeEntryScalarWhereInput | ChallengeEntryScalarWhereInput[]
    id?: StringFilter<"ChallengeEntry"> | string
    userId?: StringFilter<"ChallengeEntry"> | string
    challengeId?: StringFilter<"ChallengeEntry"> | string
    contentUrl?: StringFilter<"ChallengeEntry"> | string
    createdAt?: DateTimeFilter<"ChallengeEntry"> | Date | string
  }

  export type CreatorChallengeCreateWithoutEntriesInput = {
    id?: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
    creator: CreatorProfileCreateNestedOneWithoutChallengesInput
  }

  export type CreatorChallengeUncheckedCreateWithoutEntriesInput = {
    id?: string
    creatorId: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
  }

  export type CreatorChallengeCreateOrConnectWithoutEntriesInput = {
    where: CreatorChallengeWhereUniqueInput
    create: XOR<CreatorChallengeCreateWithoutEntriesInput, CreatorChallengeUncheckedCreateWithoutEntriesInput>
  }

  export type CreatorChallengeUpsertWithoutEntriesInput = {
    update: XOR<CreatorChallengeUpdateWithoutEntriesInput, CreatorChallengeUncheckedUpdateWithoutEntriesInput>
    create: XOR<CreatorChallengeCreateWithoutEntriesInput, CreatorChallengeUncheckedCreateWithoutEntriesInput>
    where?: CreatorChallengeWhereInput
  }

  export type CreatorChallengeUpdateToOneWithWhereWithoutEntriesInput = {
    where?: CreatorChallengeWhereInput
    data: XOR<CreatorChallengeUpdateWithoutEntriesInput, CreatorChallengeUncheckedUpdateWithoutEntriesInput>
  }

  export type CreatorChallengeUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: CreatorProfileUpdateOneRequiredWithoutChallengesNestedInput
  }

  export type CreatorChallengeUncheckedUpdateWithoutEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    creatorId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorProfileCreateWithoutPayoutRequestsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionCreateNestedManyWithoutCreatorInput
    channels?: ChannelCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateWithoutPayoutRequestsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutCreatorInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileCreateOrConnectWithoutPayoutRequestsInput = {
    where: CreatorProfileWhereUniqueInput
    create: XOR<CreatorProfileCreateWithoutPayoutRequestsInput, CreatorProfileUncheckedCreateWithoutPayoutRequestsInput>
  }

  export type CreatorProfileUpsertWithoutPayoutRequestsInput = {
    update: XOR<CreatorProfileUpdateWithoutPayoutRequestsInput, CreatorProfileUncheckedUpdateWithoutPayoutRequestsInput>
    create: XOR<CreatorProfileCreateWithoutPayoutRequestsInput, CreatorProfileUncheckedCreateWithoutPayoutRequestsInput>
    where?: CreatorProfileWhereInput
  }

  export type CreatorProfileUpdateToOneWithWhereWithoutPayoutRequestsInput = {
    where?: CreatorProfileWhereInput
    data: XOR<CreatorProfileUpdateWithoutPayoutRequestsInput, CreatorProfileUncheckedUpdateWithoutPayoutRequestsInput>
  }

  export type CreatorProfileUpdateWithoutPayoutRequestsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateWithoutPayoutRequestsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileCreateWithoutSubscriptionsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningCreateNestedManyWithoutCreatorInput
    channels?: ChannelCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileUncheckedCreateWithoutSubscriptionsInput = {
    id?: string
    userId: string
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    banner?: string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    earnings?: CreatorEarningUncheckedCreateNestedManyWithoutCreatorInput
    channels?: ChannelUncheckedCreateNestedManyWithoutCreatorInput
    challenges?: CreatorChallengeUncheckedCreateNestedManyWithoutCreatorInput
    payoutRequests?: PayoutRequestUncheckedCreateNestedManyWithoutCreatorInput
  }

  export type CreatorProfileCreateOrConnectWithoutSubscriptionsInput = {
    where: CreatorProfileWhereUniqueInput
    create: XOR<CreatorProfileCreateWithoutSubscriptionsInput, CreatorProfileUncheckedCreateWithoutSubscriptionsInput>
  }

  export type CreatorProfileUpsertWithoutSubscriptionsInput = {
    update: XOR<CreatorProfileUpdateWithoutSubscriptionsInput, CreatorProfileUncheckedUpdateWithoutSubscriptionsInput>
    create: XOR<CreatorProfileCreateWithoutSubscriptionsInput, CreatorProfileUncheckedCreateWithoutSubscriptionsInput>
    where?: CreatorProfileWhereInput
  }

  export type CreatorProfileUpdateToOneWithWhereWithoutSubscriptionsInput = {
    where?: CreatorProfileWhereInput
    data: XOR<CreatorProfileUpdateWithoutSubscriptionsInput, CreatorProfileUncheckedUpdateWithoutSubscriptionsInput>
  }

  export type CreatorProfileUpdateWithoutSubscriptionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorProfileUncheckedUpdateWithoutSubscriptionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    banner?: NullableStringFieldUpdateOperationsInput | string | null
    socialLinks?: NullableJsonNullValueInput | InputJsonValue
    verified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    earnings?: CreatorEarningUncheckedUpdateManyWithoutCreatorNestedInput
    channels?: ChannelUncheckedUpdateManyWithoutCreatorNestedInput
    challenges?: CreatorChallengeUncheckedUpdateManyWithoutCreatorNestedInput
    payoutRequests?: PayoutRequestUncheckedUpdateManyWithoutCreatorNestedInput
  }

  export type CreatorEarningCreateManyCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    referenceId?: string | null
    status?: string
    paidAt?: Date | string | null
    createdAt?: Date | string
  }

  export type SubscriptionCreateManyCreatorInput = {
    id?: string
    userId: string
    tier?: string
    status?: string
    startDate?: Date | string
    endDate?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ChannelCreateManyCreatorInput = {
    id?: string
    name: string
    description?: string | null
    category?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CreatorChallengeCreateManyCreatorInput = {
    id?: string
    title: string
    description: string
    prize: string
    startDate: Date | string
    endDate: Date | string
    status?: string
    createdAt?: Date | string
  }

  export type PayoutRequestCreateManyCreatorInput = {
    id?: string
    amount: Decimal | DecimalJsLike | number | string
    method: string
    accountDetails: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CreatorEarningUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorEarningUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorEarningUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    tier?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChannelUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CreatorChallengeUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: ChallengeEntryUpdateManyWithoutChallengeNestedInput
  }

  export type CreatorChallengeUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    entries?: ChallengeEntryUncheckedUpdateManyWithoutChallengeNestedInput
  }

  export type CreatorChallengeUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    prize?: StringFieldUpdateOperationsInput | string
    startDate?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutRequestUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    method?: StringFieldUpdateOperationsInput | string
    accountDetails?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryCreateManyChallengeInput = {
    id?: string
    userId: string
    contentUrl: string
    createdAt?: Date | string
  }

  export type ChallengeEntryUpdateWithoutChallengeInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryUncheckedUpdateWithoutChallengeInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChallengeEntryUncheckedUpdateManyWithoutChallengeInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    contentUrl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use CreatorProfileCountOutputTypeDefaultArgs instead
     */
    export type CreatorProfileCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CreatorProfileCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CreatorChallengeCountOutputTypeDefaultArgs instead
     */
    export type CreatorChallengeCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CreatorChallengeCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CreatorProfileDefaultArgs instead
     */
    export type CreatorProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CreatorProfileDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CreatorEarningDefaultArgs instead
     */
    export type CreatorEarningArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CreatorEarningDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChannelDefaultArgs instead
     */
    export type ChannelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChannelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CreatorChallengeDefaultArgs instead
     */
    export type CreatorChallengeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CreatorChallengeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChallengeEntryDefaultArgs instead
     */
    export type ChallengeEntryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChallengeEntryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use PayoutRequestDefaultArgs instead
     */
    export type PayoutRequestArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = PayoutRequestDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SubscriptionDefaultArgs instead
     */
    export type SubscriptionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SubscriptionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TipDefaultArgs instead
     */
    export type TipArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TipDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VerificationDocumentDefaultArgs instead
     */
    export type VerificationDocumentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VerificationDocumentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MediaUploadDefaultArgs instead
     */
    export type MediaUploadArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MediaUploadDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ContentItemDefaultArgs instead
     */
    export type ContentItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ContentItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationDefaultArgs instead
     */
    export type NotificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WalletDefaultArgs instead
     */
    export type WalletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WalletDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WalletTransactionDefaultArgs instead
     */
    export type WalletTransactionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WalletTransactionDefaultArgs<ExtArgs>

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