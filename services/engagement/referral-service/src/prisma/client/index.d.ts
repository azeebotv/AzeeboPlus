
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
 * Model ReferralCode
 * 
 */
export type ReferralCode = $Result.DefaultSelection<Prisma.$ReferralCodePayload>
/**
 * Model Referral
 * 
 */
export type Referral = $Result.DefaultSelection<Prisma.$ReferralPayload>
/**
 * Model ReferralReward
 * 
 */
export type ReferralReward = $Result.DefaultSelection<Prisma.$ReferralRewardPayload>
/**
 * Model ReferralConfig
 * 
 */
export type ReferralConfig = $Result.DefaultSelection<Prisma.$ReferralConfigPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ReferralCodes
 * const referralCodes = await prisma.referralCode.findMany()
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
   * // Fetch zero or more ReferralCodes
   * const referralCodes = await prisma.referralCode.findMany()
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
   * `prisma.referralCode`: Exposes CRUD operations for the **ReferralCode** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReferralCodes
    * const referralCodes = await prisma.referralCode.findMany()
    * ```
    */
  get referralCode(): Prisma.ReferralCodeDelegate<ExtArgs>;

  /**
   * `prisma.referral`: Exposes CRUD operations for the **Referral** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Referrals
    * const referrals = await prisma.referral.findMany()
    * ```
    */
  get referral(): Prisma.ReferralDelegate<ExtArgs>;

  /**
   * `prisma.referralReward`: Exposes CRUD operations for the **ReferralReward** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReferralRewards
    * const referralRewards = await prisma.referralReward.findMany()
    * ```
    */
  get referralReward(): Prisma.ReferralRewardDelegate<ExtArgs>;

  /**
   * `prisma.referralConfig`: Exposes CRUD operations for the **ReferralConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReferralConfigs
    * const referralConfigs = await prisma.referralConfig.findMany()
    * ```
    */
  get referralConfig(): Prisma.ReferralConfigDelegate<ExtArgs>;
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
    ReferralCode: 'ReferralCode',
    Referral: 'Referral',
    ReferralReward: 'ReferralReward',
    ReferralConfig: 'ReferralConfig'
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
      modelProps: "referralCode" | "referral" | "referralReward" | "referralConfig"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ReferralCode: {
        payload: Prisma.$ReferralCodePayload<ExtArgs>
        fields: Prisma.ReferralCodeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralCodeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralCodeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          findFirst: {
            args: Prisma.ReferralCodeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralCodeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          findMany: {
            args: Prisma.ReferralCodeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>[]
          }
          create: {
            args: Prisma.ReferralCodeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          createMany: {
            args: Prisma.ReferralCodeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralCodeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>[]
          }
          delete: {
            args: Prisma.ReferralCodeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          update: {
            args: Prisma.ReferralCodeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          deleteMany: {
            args: Prisma.ReferralCodeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralCodeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReferralCodeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralCodePayload>
          }
          aggregate: {
            args: Prisma.ReferralCodeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferralCode>
          }
          groupBy: {
            args: Prisma.ReferralCodeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralCodeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralCodeCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralCodeCountAggregateOutputType> | number
          }
        }
      }
      Referral: {
        payload: Prisma.$ReferralPayload<ExtArgs>
        fields: Prisma.ReferralFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          findFirst: {
            args: Prisma.ReferralFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          findMany: {
            args: Prisma.ReferralFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>[]
          }
          create: {
            args: Prisma.ReferralCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          createMany: {
            args: Prisma.ReferralCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>[]
          }
          delete: {
            args: Prisma.ReferralDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          update: {
            args: Prisma.ReferralUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          deleteMany: {
            args: Prisma.ReferralDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReferralUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          aggregate: {
            args: Prisma.ReferralAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferral>
          }
          groupBy: {
            args: Prisma.ReferralGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralCountAggregateOutputType> | number
          }
        }
      }
      ReferralReward: {
        payload: Prisma.$ReferralRewardPayload<ExtArgs>
        fields: Prisma.ReferralRewardFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralRewardFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralRewardFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          findFirst: {
            args: Prisma.ReferralRewardFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralRewardFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          findMany: {
            args: Prisma.ReferralRewardFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>[]
          }
          create: {
            args: Prisma.ReferralRewardCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          createMany: {
            args: Prisma.ReferralRewardCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralRewardCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>[]
          }
          delete: {
            args: Prisma.ReferralRewardDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          update: {
            args: Prisma.ReferralRewardUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          deleteMany: {
            args: Prisma.ReferralRewardDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralRewardUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReferralRewardUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralRewardPayload>
          }
          aggregate: {
            args: Prisma.ReferralRewardAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferralReward>
          }
          groupBy: {
            args: Prisma.ReferralRewardGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralRewardGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralRewardCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralRewardCountAggregateOutputType> | number
          }
        }
      }
      ReferralConfig: {
        payload: Prisma.$ReferralConfigPayload<ExtArgs>
        fields: Prisma.ReferralConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          findFirst: {
            args: Prisma.ReferralConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          findMany: {
            args: Prisma.ReferralConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>[]
          }
          create: {
            args: Prisma.ReferralConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          createMany: {
            args: Prisma.ReferralConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>[]
          }
          delete: {
            args: Prisma.ReferralConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          update: {
            args: Prisma.ReferralConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          deleteMany: {
            args: Prisma.ReferralConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReferralConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralConfigPayload>
          }
          aggregate: {
            args: Prisma.ReferralConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferralConfig>
          }
          groupBy: {
            args: Prisma.ReferralConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralConfigCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralConfigCountAggregateOutputType> | number
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
   * Count Type ReferralCodeCountOutputType
   */

  export type ReferralCodeCountOutputType = {
    referrals: number
  }

  export type ReferralCodeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    referrals?: boolean | ReferralCodeCountOutputTypeCountReferralsArgs
  }

  // Custom InputTypes
  /**
   * ReferralCodeCountOutputType without action
   */
  export type ReferralCodeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCodeCountOutputType
     */
    select?: ReferralCodeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ReferralCodeCountOutputType without action
   */
  export type ReferralCodeCountOutputTypeCountReferralsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralWhereInput
  }


  /**
   * Models
   */

  /**
   * Model ReferralCode
   */

  export type AggregateReferralCode = {
    _count: ReferralCodeCountAggregateOutputType | null
    _avg: ReferralCodeAvgAggregateOutputType | null
    _sum: ReferralCodeSumAggregateOutputType | null
    _min: ReferralCodeMinAggregateOutputType | null
    _max: ReferralCodeMaxAggregateOutputType | null
  }

  export type ReferralCodeAvgAggregateOutputType = {
    maxUses: number | null
    currentUses: number | null
  }

  export type ReferralCodeSumAggregateOutputType = {
    maxUses: number | null
    currentUses: number | null
  }

  export type ReferralCodeMinAggregateOutputType = {
    id: string | null
    userId: string | null
    code: string | null
    isActive: boolean | null
    maxUses: number | null
    currentUses: number | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralCodeMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    code: string | null
    isActive: boolean | null
    maxUses: number | null
    currentUses: number | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralCodeCountAggregateOutputType = {
    id: number
    userId: number
    code: number
    isActive: number
    maxUses: number
    currentUses: number
    expiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralCodeAvgAggregateInputType = {
    maxUses?: true
    currentUses?: true
  }

  export type ReferralCodeSumAggregateInputType = {
    maxUses?: true
    currentUses?: true
  }

  export type ReferralCodeMinAggregateInputType = {
    id?: true
    userId?: true
    code?: true
    isActive?: true
    maxUses?: true
    currentUses?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralCodeMaxAggregateInputType = {
    id?: true
    userId?: true
    code?: true
    isActive?: true
    maxUses?: true
    currentUses?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralCodeCountAggregateInputType = {
    id?: true
    userId?: true
    code?: true
    isActive?: true
    maxUses?: true
    currentUses?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralCodeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralCode to aggregate.
     */
    where?: ReferralCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralCodes to fetch.
     */
    orderBy?: ReferralCodeOrderByWithRelationInput | ReferralCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReferralCodes
    **/
    _count?: true | ReferralCodeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralCodeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralCodeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralCodeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralCodeMaxAggregateInputType
  }

  export type GetReferralCodeAggregateType<T extends ReferralCodeAggregateArgs> = {
        [P in keyof T & keyof AggregateReferralCode]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferralCode[P]>
      : GetScalarType<T[P], AggregateReferralCode[P]>
  }




  export type ReferralCodeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralCodeWhereInput
    orderBy?: ReferralCodeOrderByWithAggregationInput | ReferralCodeOrderByWithAggregationInput[]
    by: ReferralCodeScalarFieldEnum[] | ReferralCodeScalarFieldEnum
    having?: ReferralCodeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralCodeCountAggregateInputType | true
    _avg?: ReferralCodeAvgAggregateInputType
    _sum?: ReferralCodeSumAggregateInputType
    _min?: ReferralCodeMinAggregateInputType
    _max?: ReferralCodeMaxAggregateInputType
  }

  export type ReferralCodeGroupByOutputType = {
    id: string
    userId: string
    code: string
    isActive: boolean
    maxUses: number | null
    currentUses: number
    expiresAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReferralCodeCountAggregateOutputType | null
    _avg: ReferralCodeAvgAggregateOutputType | null
    _sum: ReferralCodeSumAggregateOutputType | null
    _min: ReferralCodeMinAggregateOutputType | null
    _max: ReferralCodeMaxAggregateOutputType | null
  }

  type GetReferralCodeGroupByPayload<T extends ReferralCodeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralCodeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralCodeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralCodeGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralCodeGroupByOutputType[P]>
        }
      >
    >


  export type ReferralCodeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    code?: boolean
    isActive?: boolean
    maxUses?: boolean
    currentUses?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    referrals?: boolean | ReferralCode$referralsArgs<ExtArgs>
    _count?: boolean | ReferralCodeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["referralCode"]>

  export type ReferralCodeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    code?: boolean
    isActive?: boolean
    maxUses?: boolean
    currentUses?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralCode"]>

  export type ReferralCodeSelectScalar = {
    id?: boolean
    userId?: boolean
    code?: boolean
    isActive?: boolean
    maxUses?: boolean
    currentUses?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReferralCodeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    referrals?: boolean | ReferralCode$referralsArgs<ExtArgs>
    _count?: boolean | ReferralCodeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ReferralCodeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ReferralCodePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReferralCode"
    objects: {
      referrals: Prisma.$ReferralPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      code: string
      isActive: boolean
      maxUses: number | null
      currentUses: number
      expiresAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referralCode"]>
    composites: {}
  }

  type ReferralCodeGetPayload<S extends boolean | null | undefined | ReferralCodeDefaultArgs> = $Result.GetResult<Prisma.$ReferralCodePayload, S>

  type ReferralCodeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReferralCodeFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReferralCodeCountAggregateInputType | true
    }

  export interface ReferralCodeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReferralCode'], meta: { name: 'ReferralCode' } }
    /**
     * Find zero or one ReferralCode that matches the filter.
     * @param {ReferralCodeFindUniqueArgs} args - Arguments to find a ReferralCode
     * @example
     * // Get one ReferralCode
     * const referralCode = await prisma.referralCode.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralCodeFindUniqueArgs>(args: SelectSubset<T, ReferralCodeFindUniqueArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ReferralCode that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReferralCodeFindUniqueOrThrowArgs} args - Arguments to find a ReferralCode
     * @example
     * // Get one ReferralCode
     * const referralCode = await prisma.referralCode.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralCodeFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralCodeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ReferralCode that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeFindFirstArgs} args - Arguments to find a ReferralCode
     * @example
     * // Get one ReferralCode
     * const referralCode = await prisma.referralCode.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralCodeFindFirstArgs>(args?: SelectSubset<T, ReferralCodeFindFirstArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ReferralCode that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeFindFirstOrThrowArgs} args - Arguments to find a ReferralCode
     * @example
     * // Get one ReferralCode
     * const referralCode = await prisma.referralCode.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralCodeFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralCodeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ReferralCodes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReferralCodes
     * const referralCodes = await prisma.referralCode.findMany()
     * 
     * // Get first 10 ReferralCodes
     * const referralCodes = await prisma.referralCode.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralCodeWithIdOnly = await prisma.referralCode.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralCodeFindManyArgs>(args?: SelectSubset<T, ReferralCodeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ReferralCode.
     * @param {ReferralCodeCreateArgs} args - Arguments to create a ReferralCode.
     * @example
     * // Create one ReferralCode
     * const ReferralCode = await prisma.referralCode.create({
     *   data: {
     *     // ... data to create a ReferralCode
     *   }
     * })
     * 
     */
    create<T extends ReferralCodeCreateArgs>(args: SelectSubset<T, ReferralCodeCreateArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ReferralCodes.
     * @param {ReferralCodeCreateManyArgs} args - Arguments to create many ReferralCodes.
     * @example
     * // Create many ReferralCodes
     * const referralCode = await prisma.referralCode.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralCodeCreateManyArgs>(args?: SelectSubset<T, ReferralCodeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReferralCodes and returns the data saved in the database.
     * @param {ReferralCodeCreateManyAndReturnArgs} args - Arguments to create many ReferralCodes.
     * @example
     * // Create many ReferralCodes
     * const referralCode = await prisma.referralCode.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReferralCodes and only return the `id`
     * const referralCodeWithIdOnly = await prisma.referralCode.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralCodeCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralCodeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ReferralCode.
     * @param {ReferralCodeDeleteArgs} args - Arguments to delete one ReferralCode.
     * @example
     * // Delete one ReferralCode
     * const ReferralCode = await prisma.referralCode.delete({
     *   where: {
     *     // ... filter to delete one ReferralCode
     *   }
     * })
     * 
     */
    delete<T extends ReferralCodeDeleteArgs>(args: SelectSubset<T, ReferralCodeDeleteArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ReferralCode.
     * @param {ReferralCodeUpdateArgs} args - Arguments to update one ReferralCode.
     * @example
     * // Update one ReferralCode
     * const referralCode = await prisma.referralCode.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralCodeUpdateArgs>(args: SelectSubset<T, ReferralCodeUpdateArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ReferralCodes.
     * @param {ReferralCodeDeleteManyArgs} args - Arguments to filter ReferralCodes to delete.
     * @example
     * // Delete a few ReferralCodes
     * const { count } = await prisma.referralCode.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralCodeDeleteManyArgs>(args?: SelectSubset<T, ReferralCodeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReferralCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReferralCodes
     * const referralCode = await prisma.referralCode.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralCodeUpdateManyArgs>(args: SelectSubset<T, ReferralCodeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ReferralCode.
     * @param {ReferralCodeUpsertArgs} args - Arguments to update or create a ReferralCode.
     * @example
     * // Update or create a ReferralCode
     * const referralCode = await prisma.referralCode.upsert({
     *   create: {
     *     // ... data to create a ReferralCode
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReferralCode we want to update
     *   }
     * })
     */
    upsert<T extends ReferralCodeUpsertArgs>(args: SelectSubset<T, ReferralCodeUpsertArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ReferralCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeCountArgs} args - Arguments to filter ReferralCodes to count.
     * @example
     * // Count the number of ReferralCodes
     * const count = await prisma.referralCode.count({
     *   where: {
     *     // ... the filter for the ReferralCodes we want to count
     *   }
     * })
    **/
    count<T extends ReferralCodeCountArgs>(
      args?: Subset<T, ReferralCodeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralCodeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReferralCode.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReferralCodeAggregateArgs>(args: Subset<T, ReferralCodeAggregateArgs>): Prisma.PrismaPromise<GetReferralCodeAggregateType<T>>

    /**
     * Group by ReferralCode.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCodeGroupByArgs} args - Group by arguments.
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
      T extends ReferralCodeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralCodeGroupByArgs['orderBy'] }
        : { orderBy?: ReferralCodeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReferralCodeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralCodeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReferralCode model
   */
  readonly fields: ReferralCodeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReferralCode.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralCodeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    referrals<T extends ReferralCode$referralsArgs<ExtArgs> = {}>(args?: Subset<T, ReferralCode$referralsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the ReferralCode model
   */ 
  interface ReferralCodeFieldRefs {
    readonly id: FieldRef<"ReferralCode", 'String'>
    readonly userId: FieldRef<"ReferralCode", 'String'>
    readonly code: FieldRef<"ReferralCode", 'String'>
    readonly isActive: FieldRef<"ReferralCode", 'Boolean'>
    readonly maxUses: FieldRef<"ReferralCode", 'Int'>
    readonly currentUses: FieldRef<"ReferralCode", 'Int'>
    readonly expiresAt: FieldRef<"ReferralCode", 'DateTime'>
    readonly createdAt: FieldRef<"ReferralCode", 'DateTime'>
    readonly updatedAt: FieldRef<"ReferralCode", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReferralCode findUnique
   */
  export type ReferralCodeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter, which ReferralCode to fetch.
     */
    where: ReferralCodeWhereUniqueInput
  }

  /**
   * ReferralCode findUniqueOrThrow
   */
  export type ReferralCodeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter, which ReferralCode to fetch.
     */
    where: ReferralCodeWhereUniqueInput
  }

  /**
   * ReferralCode findFirst
   */
  export type ReferralCodeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter, which ReferralCode to fetch.
     */
    where?: ReferralCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralCodes to fetch.
     */
    orderBy?: ReferralCodeOrderByWithRelationInput | ReferralCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralCodes.
     */
    cursor?: ReferralCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralCodes.
     */
    distinct?: ReferralCodeScalarFieldEnum | ReferralCodeScalarFieldEnum[]
  }

  /**
   * ReferralCode findFirstOrThrow
   */
  export type ReferralCodeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter, which ReferralCode to fetch.
     */
    where?: ReferralCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralCodes to fetch.
     */
    orderBy?: ReferralCodeOrderByWithRelationInput | ReferralCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralCodes.
     */
    cursor?: ReferralCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralCodes.
     */
    distinct?: ReferralCodeScalarFieldEnum | ReferralCodeScalarFieldEnum[]
  }

  /**
   * ReferralCode findMany
   */
  export type ReferralCodeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter, which ReferralCodes to fetch.
     */
    where?: ReferralCodeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralCodes to fetch.
     */
    orderBy?: ReferralCodeOrderByWithRelationInput | ReferralCodeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReferralCodes.
     */
    cursor?: ReferralCodeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralCodes.
     */
    skip?: number
    distinct?: ReferralCodeScalarFieldEnum | ReferralCodeScalarFieldEnum[]
  }

  /**
   * ReferralCode create
   */
  export type ReferralCodeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * The data needed to create a ReferralCode.
     */
    data: XOR<ReferralCodeCreateInput, ReferralCodeUncheckedCreateInput>
  }

  /**
   * ReferralCode createMany
   */
  export type ReferralCodeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReferralCodes.
     */
    data: ReferralCodeCreateManyInput | ReferralCodeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralCode createManyAndReturn
   */
  export type ReferralCodeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ReferralCodes.
     */
    data: ReferralCodeCreateManyInput | ReferralCodeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralCode update
   */
  export type ReferralCodeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * The data needed to update a ReferralCode.
     */
    data: XOR<ReferralCodeUpdateInput, ReferralCodeUncheckedUpdateInput>
    /**
     * Choose, which ReferralCode to update.
     */
    where: ReferralCodeWhereUniqueInput
  }

  /**
   * ReferralCode updateMany
   */
  export type ReferralCodeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReferralCodes.
     */
    data: XOR<ReferralCodeUpdateManyMutationInput, ReferralCodeUncheckedUpdateManyInput>
    /**
     * Filter which ReferralCodes to update
     */
    where?: ReferralCodeWhereInput
  }

  /**
   * ReferralCode upsert
   */
  export type ReferralCodeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * The filter to search for the ReferralCode to update in case it exists.
     */
    where: ReferralCodeWhereUniqueInput
    /**
     * In case the ReferralCode found by the `where` argument doesn't exist, create a new ReferralCode with this data.
     */
    create: XOR<ReferralCodeCreateInput, ReferralCodeUncheckedCreateInput>
    /**
     * In case the ReferralCode was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralCodeUpdateInput, ReferralCodeUncheckedUpdateInput>
  }

  /**
   * ReferralCode delete
   */
  export type ReferralCodeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
    /**
     * Filter which ReferralCode to delete.
     */
    where: ReferralCodeWhereUniqueInput
  }

  /**
   * ReferralCode deleteMany
   */
  export type ReferralCodeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralCodes to delete
     */
    where?: ReferralCodeWhereInput
  }

  /**
   * ReferralCode.referrals
   */
  export type ReferralCode$referralsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    where?: ReferralWhereInput
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    cursor?: ReferralWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * ReferralCode without action
   */
  export type ReferralCodeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralCode
     */
    select?: ReferralCodeSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralCodeInclude<ExtArgs> | null
  }


  /**
   * Model Referral
   */

  export type AggregateReferral = {
    _count: ReferralCountAggregateOutputType | null
    _avg: ReferralAvgAggregateOutputType | null
    _sum: ReferralSumAggregateOutputType | null
    _min: ReferralMinAggregateOutputType | null
    _max: ReferralMaxAggregateOutputType | null
  }

  export type ReferralAvgAggregateOutputType = {
    rewardAmount: Decimal | null
  }

  export type ReferralSumAggregateOutputType = {
    rewardAmount: Decimal | null
  }

  export type ReferralMinAggregateOutputType = {
    id: string | null
    referrerId: string | null
    referredId: string | null
    referralCodeId: string | null
    status: string | null
    rewardAmount: Decimal | null
    rewardStatus: string | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralMaxAggregateOutputType = {
    id: string | null
    referrerId: string | null
    referredId: string | null
    referralCodeId: string | null
    status: string | null
    rewardAmount: Decimal | null
    rewardStatus: string | null
    completedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralCountAggregateOutputType = {
    id: number
    referrerId: number
    referredId: number
    referralCodeId: number
    status: number
    rewardAmount: number
    rewardStatus: number
    completedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralAvgAggregateInputType = {
    rewardAmount?: true
  }

  export type ReferralSumAggregateInputType = {
    rewardAmount?: true
  }

  export type ReferralMinAggregateInputType = {
    id?: true
    referrerId?: true
    referredId?: true
    referralCodeId?: true
    status?: true
    rewardAmount?: true
    rewardStatus?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralMaxAggregateInputType = {
    id?: true
    referrerId?: true
    referredId?: true
    referralCodeId?: true
    status?: true
    rewardAmount?: true
    rewardStatus?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralCountAggregateInputType = {
    id?: true
    referrerId?: true
    referredId?: true
    referralCodeId?: true
    status?: true
    rewardAmount?: true
    rewardStatus?: true
    completedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Referral to aggregate.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Referrals
    **/
    _count?: true | ReferralCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralMaxAggregateInputType
  }

  export type GetReferralAggregateType<T extends ReferralAggregateArgs> = {
        [P in keyof T & keyof AggregateReferral]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferral[P]>
      : GetScalarType<T[P], AggregateReferral[P]>
  }




  export type ReferralGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralWhereInput
    orderBy?: ReferralOrderByWithAggregationInput | ReferralOrderByWithAggregationInput[]
    by: ReferralScalarFieldEnum[] | ReferralScalarFieldEnum
    having?: ReferralScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralCountAggregateInputType | true
    _avg?: ReferralAvgAggregateInputType
    _sum?: ReferralSumAggregateInputType
    _min?: ReferralMinAggregateInputType
    _max?: ReferralMaxAggregateInputType
  }

  export type ReferralGroupByOutputType = {
    id: string
    referrerId: string
    referredId: string
    referralCodeId: string
    status: string
    rewardAmount: Decimal | null
    rewardStatus: string
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReferralCountAggregateOutputType | null
    _avg: ReferralAvgAggregateOutputType | null
    _sum: ReferralSumAggregateOutputType | null
    _min: ReferralMinAggregateOutputType | null
    _max: ReferralMaxAggregateOutputType | null
  }

  type GetReferralGroupByPayload<T extends ReferralGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralGroupByOutputType[P]>
        }
      >
    >


  export type ReferralSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    referrerId?: boolean
    referredId?: boolean
    referralCodeId?: boolean
    status?: boolean
    rewardAmount?: boolean
    rewardStatus?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    referralCode?: boolean | ReferralCodeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["referral"]>

  export type ReferralSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    referrerId?: boolean
    referredId?: boolean
    referralCodeId?: boolean
    status?: boolean
    rewardAmount?: boolean
    rewardStatus?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    referralCode?: boolean | ReferralCodeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["referral"]>

  export type ReferralSelectScalar = {
    id?: boolean
    referrerId?: boolean
    referredId?: boolean
    referralCodeId?: boolean
    status?: boolean
    rewardAmount?: boolean
    rewardStatus?: boolean
    completedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReferralInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    referralCode?: boolean | ReferralCodeDefaultArgs<ExtArgs>
  }
  export type ReferralIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    referralCode?: boolean | ReferralCodeDefaultArgs<ExtArgs>
  }

  export type $ReferralPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Referral"
    objects: {
      referralCode: Prisma.$ReferralCodePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      referrerId: string
      referredId: string
      referralCodeId: string
      status: string
      rewardAmount: Prisma.Decimal | null
      rewardStatus: string
      completedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referral"]>
    composites: {}
  }

  type ReferralGetPayload<S extends boolean | null | undefined | ReferralDefaultArgs> = $Result.GetResult<Prisma.$ReferralPayload, S>

  type ReferralCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReferralFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReferralCountAggregateInputType | true
    }

  export interface ReferralDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Referral'], meta: { name: 'Referral' } }
    /**
     * Find zero or one Referral that matches the filter.
     * @param {ReferralFindUniqueArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralFindUniqueArgs>(args: SelectSubset<T, ReferralFindUniqueArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Referral that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReferralFindUniqueOrThrowArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Referral that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindFirstArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralFindFirstArgs>(args?: SelectSubset<T, ReferralFindFirstArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Referral that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindFirstOrThrowArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Referrals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Referrals
     * const referrals = await prisma.referral.findMany()
     * 
     * // Get first 10 Referrals
     * const referrals = await prisma.referral.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralWithIdOnly = await prisma.referral.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralFindManyArgs>(args?: SelectSubset<T, ReferralFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Referral.
     * @param {ReferralCreateArgs} args - Arguments to create a Referral.
     * @example
     * // Create one Referral
     * const Referral = await prisma.referral.create({
     *   data: {
     *     // ... data to create a Referral
     *   }
     * })
     * 
     */
    create<T extends ReferralCreateArgs>(args: SelectSubset<T, ReferralCreateArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Referrals.
     * @param {ReferralCreateManyArgs} args - Arguments to create many Referrals.
     * @example
     * // Create many Referrals
     * const referral = await prisma.referral.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralCreateManyArgs>(args?: SelectSubset<T, ReferralCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Referrals and returns the data saved in the database.
     * @param {ReferralCreateManyAndReturnArgs} args - Arguments to create many Referrals.
     * @example
     * // Create many Referrals
     * const referral = await prisma.referral.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Referrals and only return the `id`
     * const referralWithIdOnly = await prisma.referral.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Referral.
     * @param {ReferralDeleteArgs} args - Arguments to delete one Referral.
     * @example
     * // Delete one Referral
     * const Referral = await prisma.referral.delete({
     *   where: {
     *     // ... filter to delete one Referral
     *   }
     * })
     * 
     */
    delete<T extends ReferralDeleteArgs>(args: SelectSubset<T, ReferralDeleteArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Referral.
     * @param {ReferralUpdateArgs} args - Arguments to update one Referral.
     * @example
     * // Update one Referral
     * const referral = await prisma.referral.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralUpdateArgs>(args: SelectSubset<T, ReferralUpdateArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Referrals.
     * @param {ReferralDeleteManyArgs} args - Arguments to filter Referrals to delete.
     * @example
     * // Delete a few Referrals
     * const { count } = await prisma.referral.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralDeleteManyArgs>(args?: SelectSubset<T, ReferralDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Referrals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Referrals
     * const referral = await prisma.referral.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralUpdateManyArgs>(args: SelectSubset<T, ReferralUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Referral.
     * @param {ReferralUpsertArgs} args - Arguments to update or create a Referral.
     * @example
     * // Update or create a Referral
     * const referral = await prisma.referral.upsert({
     *   create: {
     *     // ... data to create a Referral
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Referral we want to update
     *   }
     * })
     */
    upsert<T extends ReferralUpsertArgs>(args: SelectSubset<T, ReferralUpsertArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Referrals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCountArgs} args - Arguments to filter Referrals to count.
     * @example
     * // Count the number of Referrals
     * const count = await prisma.referral.count({
     *   where: {
     *     // ... the filter for the Referrals we want to count
     *   }
     * })
    **/
    count<T extends ReferralCountArgs>(
      args?: Subset<T, ReferralCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Referral.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReferralAggregateArgs>(args: Subset<T, ReferralAggregateArgs>): Prisma.PrismaPromise<GetReferralAggregateType<T>>

    /**
     * Group by Referral.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralGroupByArgs} args - Group by arguments.
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
      T extends ReferralGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralGroupByArgs['orderBy'] }
        : { orderBy?: ReferralGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReferralGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Referral model
   */
  readonly fields: ReferralFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Referral.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    referralCode<T extends ReferralCodeDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ReferralCodeDefaultArgs<ExtArgs>>): Prisma__ReferralCodeClient<$Result.GetResult<Prisma.$ReferralCodePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Referral model
   */ 
  interface ReferralFieldRefs {
    readonly id: FieldRef<"Referral", 'String'>
    readonly referrerId: FieldRef<"Referral", 'String'>
    readonly referredId: FieldRef<"Referral", 'String'>
    readonly referralCodeId: FieldRef<"Referral", 'String'>
    readonly status: FieldRef<"Referral", 'String'>
    readonly rewardAmount: FieldRef<"Referral", 'Decimal'>
    readonly rewardStatus: FieldRef<"Referral", 'String'>
    readonly completedAt: FieldRef<"Referral", 'DateTime'>
    readonly createdAt: FieldRef<"Referral", 'DateTime'>
    readonly updatedAt: FieldRef<"Referral", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Referral findUnique
   */
  export type ReferralFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral findUniqueOrThrow
   */
  export type ReferralFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral findFirst
   */
  export type ReferralFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Referrals.
     */
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral findFirstOrThrow
   */
  export type ReferralFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Referrals.
     */
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral findMany
   */
  export type ReferralFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter, which Referrals to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral create
   */
  export type ReferralCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * The data needed to create a Referral.
     */
    data: XOR<ReferralCreateInput, ReferralUncheckedCreateInput>
  }

  /**
   * Referral createMany
   */
  export type ReferralCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Referrals.
     */
    data: ReferralCreateManyInput | ReferralCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Referral createManyAndReturn
   */
  export type ReferralCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Referrals.
     */
    data: ReferralCreateManyInput | ReferralCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Referral update
   */
  export type ReferralUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * The data needed to update a Referral.
     */
    data: XOR<ReferralUpdateInput, ReferralUncheckedUpdateInput>
    /**
     * Choose, which Referral to update.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral updateMany
   */
  export type ReferralUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Referrals.
     */
    data: XOR<ReferralUpdateManyMutationInput, ReferralUncheckedUpdateManyInput>
    /**
     * Filter which Referrals to update
     */
    where?: ReferralWhereInput
  }

  /**
   * Referral upsert
   */
  export type ReferralUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * The filter to search for the Referral to update in case it exists.
     */
    where: ReferralWhereUniqueInput
    /**
     * In case the Referral found by the `where` argument doesn't exist, create a new Referral with this data.
     */
    create: XOR<ReferralCreateInput, ReferralUncheckedCreateInput>
    /**
     * In case the Referral was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralUpdateInput, ReferralUncheckedUpdateInput>
  }

  /**
   * Referral delete
   */
  export type ReferralDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
    /**
     * Filter which Referral to delete.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral deleteMany
   */
  export type ReferralDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Referrals to delete
     */
    where?: ReferralWhereInput
  }

  /**
   * Referral without action
   */
  export type ReferralDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReferralInclude<ExtArgs> | null
  }


  /**
   * Model ReferralReward
   */

  export type AggregateReferralReward = {
    _count: ReferralRewardCountAggregateOutputType | null
    _avg: ReferralRewardAvgAggregateOutputType | null
    _sum: ReferralRewardSumAggregateOutputType | null
    _min: ReferralRewardMinAggregateOutputType | null
    _max: ReferralRewardMaxAggregateOutputType | null
  }

  export type ReferralRewardAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type ReferralRewardSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type ReferralRewardMinAggregateOutputType = {
    id: string | null
    referralId: string | null
    userId: string | null
    amount: Decimal | null
    type: string | null
    status: string | null
    creditedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralRewardMaxAggregateOutputType = {
    id: string | null
    referralId: string | null
    userId: string | null
    amount: Decimal | null
    type: string | null
    status: string | null
    creditedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralRewardCountAggregateOutputType = {
    id: number
    referralId: number
    userId: number
    amount: number
    type: number
    status: number
    creditedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralRewardAvgAggregateInputType = {
    amount?: true
  }

  export type ReferralRewardSumAggregateInputType = {
    amount?: true
  }

  export type ReferralRewardMinAggregateInputType = {
    id?: true
    referralId?: true
    userId?: true
    amount?: true
    type?: true
    status?: true
    creditedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralRewardMaxAggregateInputType = {
    id?: true
    referralId?: true
    userId?: true
    amount?: true
    type?: true
    status?: true
    creditedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralRewardCountAggregateInputType = {
    id?: true
    referralId?: true
    userId?: true
    amount?: true
    type?: true
    status?: true
    creditedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralRewardAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralReward to aggregate.
     */
    where?: ReferralRewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralRewards to fetch.
     */
    orderBy?: ReferralRewardOrderByWithRelationInput | ReferralRewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralRewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralRewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralRewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReferralRewards
    **/
    _count?: true | ReferralRewardCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralRewardAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralRewardSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralRewardMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralRewardMaxAggregateInputType
  }

  export type GetReferralRewardAggregateType<T extends ReferralRewardAggregateArgs> = {
        [P in keyof T & keyof AggregateReferralReward]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferralReward[P]>
      : GetScalarType<T[P], AggregateReferralReward[P]>
  }




  export type ReferralRewardGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralRewardWhereInput
    orderBy?: ReferralRewardOrderByWithAggregationInput | ReferralRewardOrderByWithAggregationInput[]
    by: ReferralRewardScalarFieldEnum[] | ReferralRewardScalarFieldEnum
    having?: ReferralRewardScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralRewardCountAggregateInputType | true
    _avg?: ReferralRewardAvgAggregateInputType
    _sum?: ReferralRewardSumAggregateInputType
    _min?: ReferralRewardMinAggregateInputType
    _max?: ReferralRewardMaxAggregateInputType
  }

  export type ReferralRewardGroupByOutputType = {
    id: string
    referralId: string
    userId: string
    amount: Decimal
    type: string
    status: string
    creditedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReferralRewardCountAggregateOutputType | null
    _avg: ReferralRewardAvgAggregateOutputType | null
    _sum: ReferralRewardSumAggregateOutputType | null
    _min: ReferralRewardMinAggregateOutputType | null
    _max: ReferralRewardMaxAggregateOutputType | null
  }

  type GetReferralRewardGroupByPayload<T extends ReferralRewardGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralRewardGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralRewardGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralRewardGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralRewardGroupByOutputType[P]>
        }
      >
    >


  export type ReferralRewardSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    referralId?: boolean
    userId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    creditedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralReward"]>

  export type ReferralRewardSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    referralId?: boolean
    userId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    creditedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralReward"]>

  export type ReferralRewardSelectScalar = {
    id?: boolean
    referralId?: boolean
    userId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    creditedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ReferralRewardPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReferralReward"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      referralId: string
      userId: string
      amount: Prisma.Decimal
      type: string
      status: string
      creditedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referralReward"]>
    composites: {}
  }

  type ReferralRewardGetPayload<S extends boolean | null | undefined | ReferralRewardDefaultArgs> = $Result.GetResult<Prisma.$ReferralRewardPayload, S>

  type ReferralRewardCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReferralRewardFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReferralRewardCountAggregateInputType | true
    }

  export interface ReferralRewardDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReferralReward'], meta: { name: 'ReferralReward' } }
    /**
     * Find zero or one ReferralReward that matches the filter.
     * @param {ReferralRewardFindUniqueArgs} args - Arguments to find a ReferralReward
     * @example
     * // Get one ReferralReward
     * const referralReward = await prisma.referralReward.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralRewardFindUniqueArgs>(args: SelectSubset<T, ReferralRewardFindUniqueArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ReferralReward that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReferralRewardFindUniqueOrThrowArgs} args - Arguments to find a ReferralReward
     * @example
     * // Get one ReferralReward
     * const referralReward = await prisma.referralReward.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralRewardFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralRewardFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ReferralReward that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardFindFirstArgs} args - Arguments to find a ReferralReward
     * @example
     * // Get one ReferralReward
     * const referralReward = await prisma.referralReward.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralRewardFindFirstArgs>(args?: SelectSubset<T, ReferralRewardFindFirstArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ReferralReward that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardFindFirstOrThrowArgs} args - Arguments to find a ReferralReward
     * @example
     * // Get one ReferralReward
     * const referralReward = await prisma.referralReward.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralRewardFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralRewardFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ReferralRewards that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReferralRewards
     * const referralRewards = await prisma.referralReward.findMany()
     * 
     * // Get first 10 ReferralRewards
     * const referralRewards = await prisma.referralReward.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralRewardWithIdOnly = await prisma.referralReward.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralRewardFindManyArgs>(args?: SelectSubset<T, ReferralRewardFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ReferralReward.
     * @param {ReferralRewardCreateArgs} args - Arguments to create a ReferralReward.
     * @example
     * // Create one ReferralReward
     * const ReferralReward = await prisma.referralReward.create({
     *   data: {
     *     // ... data to create a ReferralReward
     *   }
     * })
     * 
     */
    create<T extends ReferralRewardCreateArgs>(args: SelectSubset<T, ReferralRewardCreateArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ReferralRewards.
     * @param {ReferralRewardCreateManyArgs} args - Arguments to create many ReferralRewards.
     * @example
     * // Create many ReferralRewards
     * const referralReward = await prisma.referralReward.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralRewardCreateManyArgs>(args?: SelectSubset<T, ReferralRewardCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReferralRewards and returns the data saved in the database.
     * @param {ReferralRewardCreateManyAndReturnArgs} args - Arguments to create many ReferralRewards.
     * @example
     * // Create many ReferralRewards
     * const referralReward = await prisma.referralReward.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReferralRewards and only return the `id`
     * const referralRewardWithIdOnly = await prisma.referralReward.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralRewardCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralRewardCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ReferralReward.
     * @param {ReferralRewardDeleteArgs} args - Arguments to delete one ReferralReward.
     * @example
     * // Delete one ReferralReward
     * const ReferralReward = await prisma.referralReward.delete({
     *   where: {
     *     // ... filter to delete one ReferralReward
     *   }
     * })
     * 
     */
    delete<T extends ReferralRewardDeleteArgs>(args: SelectSubset<T, ReferralRewardDeleteArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ReferralReward.
     * @param {ReferralRewardUpdateArgs} args - Arguments to update one ReferralReward.
     * @example
     * // Update one ReferralReward
     * const referralReward = await prisma.referralReward.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralRewardUpdateArgs>(args: SelectSubset<T, ReferralRewardUpdateArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ReferralRewards.
     * @param {ReferralRewardDeleteManyArgs} args - Arguments to filter ReferralRewards to delete.
     * @example
     * // Delete a few ReferralRewards
     * const { count } = await prisma.referralReward.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralRewardDeleteManyArgs>(args?: SelectSubset<T, ReferralRewardDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReferralRewards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReferralRewards
     * const referralReward = await prisma.referralReward.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralRewardUpdateManyArgs>(args: SelectSubset<T, ReferralRewardUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ReferralReward.
     * @param {ReferralRewardUpsertArgs} args - Arguments to update or create a ReferralReward.
     * @example
     * // Update or create a ReferralReward
     * const referralReward = await prisma.referralReward.upsert({
     *   create: {
     *     // ... data to create a ReferralReward
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReferralReward we want to update
     *   }
     * })
     */
    upsert<T extends ReferralRewardUpsertArgs>(args: SelectSubset<T, ReferralRewardUpsertArgs<ExtArgs>>): Prisma__ReferralRewardClient<$Result.GetResult<Prisma.$ReferralRewardPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ReferralRewards.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardCountArgs} args - Arguments to filter ReferralRewards to count.
     * @example
     * // Count the number of ReferralRewards
     * const count = await prisma.referralReward.count({
     *   where: {
     *     // ... the filter for the ReferralRewards we want to count
     *   }
     * })
    **/
    count<T extends ReferralRewardCountArgs>(
      args?: Subset<T, ReferralRewardCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralRewardCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReferralReward.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReferralRewardAggregateArgs>(args: Subset<T, ReferralRewardAggregateArgs>): Prisma.PrismaPromise<GetReferralRewardAggregateType<T>>

    /**
     * Group by ReferralReward.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralRewardGroupByArgs} args - Group by arguments.
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
      T extends ReferralRewardGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralRewardGroupByArgs['orderBy'] }
        : { orderBy?: ReferralRewardGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReferralRewardGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralRewardGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReferralReward model
   */
  readonly fields: ReferralRewardFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReferralReward.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralRewardClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ReferralReward model
   */ 
  interface ReferralRewardFieldRefs {
    readonly id: FieldRef<"ReferralReward", 'String'>
    readonly referralId: FieldRef<"ReferralReward", 'String'>
    readonly userId: FieldRef<"ReferralReward", 'String'>
    readonly amount: FieldRef<"ReferralReward", 'Decimal'>
    readonly type: FieldRef<"ReferralReward", 'String'>
    readonly status: FieldRef<"ReferralReward", 'String'>
    readonly creditedAt: FieldRef<"ReferralReward", 'DateTime'>
    readonly createdAt: FieldRef<"ReferralReward", 'DateTime'>
    readonly updatedAt: FieldRef<"ReferralReward", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReferralReward findUnique
   */
  export type ReferralRewardFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter, which ReferralReward to fetch.
     */
    where: ReferralRewardWhereUniqueInput
  }

  /**
   * ReferralReward findUniqueOrThrow
   */
  export type ReferralRewardFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter, which ReferralReward to fetch.
     */
    where: ReferralRewardWhereUniqueInput
  }

  /**
   * ReferralReward findFirst
   */
  export type ReferralRewardFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter, which ReferralReward to fetch.
     */
    where?: ReferralRewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralRewards to fetch.
     */
    orderBy?: ReferralRewardOrderByWithRelationInput | ReferralRewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralRewards.
     */
    cursor?: ReferralRewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralRewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralRewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralRewards.
     */
    distinct?: ReferralRewardScalarFieldEnum | ReferralRewardScalarFieldEnum[]
  }

  /**
   * ReferralReward findFirstOrThrow
   */
  export type ReferralRewardFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter, which ReferralReward to fetch.
     */
    where?: ReferralRewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralRewards to fetch.
     */
    orderBy?: ReferralRewardOrderByWithRelationInput | ReferralRewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralRewards.
     */
    cursor?: ReferralRewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralRewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralRewards.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralRewards.
     */
    distinct?: ReferralRewardScalarFieldEnum | ReferralRewardScalarFieldEnum[]
  }

  /**
   * ReferralReward findMany
   */
  export type ReferralRewardFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter, which ReferralRewards to fetch.
     */
    where?: ReferralRewardWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralRewards to fetch.
     */
    orderBy?: ReferralRewardOrderByWithRelationInput | ReferralRewardOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReferralRewards.
     */
    cursor?: ReferralRewardWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralRewards from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralRewards.
     */
    skip?: number
    distinct?: ReferralRewardScalarFieldEnum | ReferralRewardScalarFieldEnum[]
  }

  /**
   * ReferralReward create
   */
  export type ReferralRewardCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * The data needed to create a ReferralReward.
     */
    data: XOR<ReferralRewardCreateInput, ReferralRewardUncheckedCreateInput>
  }

  /**
   * ReferralReward createMany
   */
  export type ReferralRewardCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReferralRewards.
     */
    data: ReferralRewardCreateManyInput | ReferralRewardCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralReward createManyAndReturn
   */
  export type ReferralRewardCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ReferralRewards.
     */
    data: ReferralRewardCreateManyInput | ReferralRewardCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralReward update
   */
  export type ReferralRewardUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * The data needed to update a ReferralReward.
     */
    data: XOR<ReferralRewardUpdateInput, ReferralRewardUncheckedUpdateInput>
    /**
     * Choose, which ReferralReward to update.
     */
    where: ReferralRewardWhereUniqueInput
  }

  /**
   * ReferralReward updateMany
   */
  export type ReferralRewardUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReferralRewards.
     */
    data: XOR<ReferralRewardUpdateManyMutationInput, ReferralRewardUncheckedUpdateManyInput>
    /**
     * Filter which ReferralRewards to update
     */
    where?: ReferralRewardWhereInput
  }

  /**
   * ReferralReward upsert
   */
  export type ReferralRewardUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * The filter to search for the ReferralReward to update in case it exists.
     */
    where: ReferralRewardWhereUniqueInput
    /**
     * In case the ReferralReward found by the `where` argument doesn't exist, create a new ReferralReward with this data.
     */
    create: XOR<ReferralRewardCreateInput, ReferralRewardUncheckedCreateInput>
    /**
     * In case the ReferralReward was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralRewardUpdateInput, ReferralRewardUncheckedUpdateInput>
  }

  /**
   * ReferralReward delete
   */
  export type ReferralRewardDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
    /**
     * Filter which ReferralReward to delete.
     */
    where: ReferralRewardWhereUniqueInput
  }

  /**
   * ReferralReward deleteMany
   */
  export type ReferralRewardDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralRewards to delete
     */
    where?: ReferralRewardWhereInput
  }

  /**
   * ReferralReward without action
   */
  export type ReferralRewardDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralReward
     */
    select?: ReferralRewardSelect<ExtArgs> | null
  }


  /**
   * Model ReferralConfig
   */

  export type AggregateReferralConfig = {
    _count: ReferralConfigCountAggregateOutputType | null
    _avg: ReferralConfigAvgAggregateOutputType | null
    _sum: ReferralConfigSumAggregateOutputType | null
    _min: ReferralConfigMinAggregateOutputType | null
    _max: ReferralConfigMaxAggregateOutputType | null
  }

  export type ReferralConfigAvgAggregateOutputType = {
    value: Decimal | null
  }

  export type ReferralConfigSumAggregateOutputType = {
    value: Decimal | null
  }

  export type ReferralConfigMinAggregateOutputType = {
    id: string | null
    key: string | null
    value: Decimal | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralConfigMaxAggregateOutputType = {
    id: string | null
    key: string | null
    value: Decimal | null
    description: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralConfigCountAggregateOutputType = {
    id: number
    key: number
    value: number
    description: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralConfigAvgAggregateInputType = {
    value?: true
  }

  export type ReferralConfigSumAggregateInputType = {
    value?: true
  }

  export type ReferralConfigMinAggregateInputType = {
    id?: true
    key?: true
    value?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralConfigMaxAggregateInputType = {
    id?: true
    key?: true
    value?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralConfigCountAggregateInputType = {
    id?: true
    key?: true
    value?: true
    description?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralConfig to aggregate.
     */
    where?: ReferralConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralConfigs to fetch.
     */
    orderBy?: ReferralConfigOrderByWithRelationInput | ReferralConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReferralConfigs
    **/
    _count?: true | ReferralConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralConfigMaxAggregateInputType
  }

  export type GetReferralConfigAggregateType<T extends ReferralConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateReferralConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferralConfig[P]>
      : GetScalarType<T[P], AggregateReferralConfig[P]>
  }




  export type ReferralConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralConfigWhereInput
    orderBy?: ReferralConfigOrderByWithAggregationInput | ReferralConfigOrderByWithAggregationInput[]
    by: ReferralConfigScalarFieldEnum[] | ReferralConfigScalarFieldEnum
    having?: ReferralConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralConfigCountAggregateInputType | true
    _avg?: ReferralConfigAvgAggregateInputType
    _sum?: ReferralConfigSumAggregateInputType
    _min?: ReferralConfigMinAggregateInputType
    _max?: ReferralConfigMaxAggregateInputType
  }

  export type ReferralConfigGroupByOutputType = {
    id: string
    key: string
    value: Decimal
    description: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: ReferralConfigCountAggregateOutputType | null
    _avg: ReferralConfigAvgAggregateOutputType | null
    _sum: ReferralConfigSumAggregateOutputType | null
    _min: ReferralConfigMinAggregateOutputType | null
    _max: ReferralConfigMaxAggregateOutputType | null
  }

  type GetReferralConfigGroupByPayload<T extends ReferralConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralConfigGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralConfigGroupByOutputType[P]>
        }
      >
    >


  export type ReferralConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralConfig"]>

  export type ReferralConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralConfig"]>

  export type ReferralConfigSelectScalar = {
    id?: boolean
    key?: boolean
    value?: boolean
    description?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ReferralConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReferralConfig"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      key: string
      value: Prisma.Decimal
      description: string | null
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referralConfig"]>
    composites: {}
  }

  type ReferralConfigGetPayload<S extends boolean | null | undefined | ReferralConfigDefaultArgs> = $Result.GetResult<Prisma.$ReferralConfigPayload, S>

  type ReferralConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReferralConfigFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReferralConfigCountAggregateInputType | true
    }

  export interface ReferralConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReferralConfig'], meta: { name: 'ReferralConfig' } }
    /**
     * Find zero or one ReferralConfig that matches the filter.
     * @param {ReferralConfigFindUniqueArgs} args - Arguments to find a ReferralConfig
     * @example
     * // Get one ReferralConfig
     * const referralConfig = await prisma.referralConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralConfigFindUniqueArgs>(args: SelectSubset<T, ReferralConfigFindUniqueArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ReferralConfig that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReferralConfigFindUniqueOrThrowArgs} args - Arguments to find a ReferralConfig
     * @example
     * // Get one ReferralConfig
     * const referralConfig = await prisma.referralConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ReferralConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigFindFirstArgs} args - Arguments to find a ReferralConfig
     * @example
     * // Get one ReferralConfig
     * const referralConfig = await prisma.referralConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralConfigFindFirstArgs>(args?: SelectSubset<T, ReferralConfigFindFirstArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ReferralConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigFindFirstOrThrowArgs} args - Arguments to find a ReferralConfig
     * @example
     * // Get one ReferralConfig
     * const referralConfig = await prisma.referralConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ReferralConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReferralConfigs
     * const referralConfigs = await prisma.referralConfig.findMany()
     * 
     * // Get first 10 ReferralConfigs
     * const referralConfigs = await prisma.referralConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralConfigWithIdOnly = await prisma.referralConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralConfigFindManyArgs>(args?: SelectSubset<T, ReferralConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ReferralConfig.
     * @param {ReferralConfigCreateArgs} args - Arguments to create a ReferralConfig.
     * @example
     * // Create one ReferralConfig
     * const ReferralConfig = await prisma.referralConfig.create({
     *   data: {
     *     // ... data to create a ReferralConfig
     *   }
     * })
     * 
     */
    create<T extends ReferralConfigCreateArgs>(args: SelectSubset<T, ReferralConfigCreateArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ReferralConfigs.
     * @param {ReferralConfigCreateManyArgs} args - Arguments to create many ReferralConfigs.
     * @example
     * // Create many ReferralConfigs
     * const referralConfig = await prisma.referralConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralConfigCreateManyArgs>(args?: SelectSubset<T, ReferralConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReferralConfigs and returns the data saved in the database.
     * @param {ReferralConfigCreateManyAndReturnArgs} args - Arguments to create many ReferralConfigs.
     * @example
     * // Create many ReferralConfigs
     * const referralConfig = await prisma.referralConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReferralConfigs and only return the `id`
     * const referralConfigWithIdOnly = await prisma.referralConfig.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ReferralConfig.
     * @param {ReferralConfigDeleteArgs} args - Arguments to delete one ReferralConfig.
     * @example
     * // Delete one ReferralConfig
     * const ReferralConfig = await prisma.referralConfig.delete({
     *   where: {
     *     // ... filter to delete one ReferralConfig
     *   }
     * })
     * 
     */
    delete<T extends ReferralConfigDeleteArgs>(args: SelectSubset<T, ReferralConfigDeleteArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ReferralConfig.
     * @param {ReferralConfigUpdateArgs} args - Arguments to update one ReferralConfig.
     * @example
     * // Update one ReferralConfig
     * const referralConfig = await prisma.referralConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralConfigUpdateArgs>(args: SelectSubset<T, ReferralConfigUpdateArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ReferralConfigs.
     * @param {ReferralConfigDeleteManyArgs} args - Arguments to filter ReferralConfigs to delete.
     * @example
     * // Delete a few ReferralConfigs
     * const { count } = await prisma.referralConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralConfigDeleteManyArgs>(args?: SelectSubset<T, ReferralConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReferralConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReferralConfigs
     * const referralConfig = await prisma.referralConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralConfigUpdateManyArgs>(args: SelectSubset<T, ReferralConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ReferralConfig.
     * @param {ReferralConfigUpsertArgs} args - Arguments to update or create a ReferralConfig.
     * @example
     * // Update or create a ReferralConfig
     * const referralConfig = await prisma.referralConfig.upsert({
     *   create: {
     *     // ... data to create a ReferralConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReferralConfig we want to update
     *   }
     * })
     */
    upsert<T extends ReferralConfigUpsertArgs>(args: SelectSubset<T, ReferralConfigUpsertArgs<ExtArgs>>): Prisma__ReferralConfigClient<$Result.GetResult<Prisma.$ReferralConfigPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ReferralConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigCountArgs} args - Arguments to filter ReferralConfigs to count.
     * @example
     * // Count the number of ReferralConfigs
     * const count = await prisma.referralConfig.count({
     *   where: {
     *     // ... the filter for the ReferralConfigs we want to count
     *   }
     * })
    **/
    count<T extends ReferralConfigCountArgs>(
      args?: Subset<T, ReferralConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReferralConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReferralConfigAggregateArgs>(args: Subset<T, ReferralConfigAggregateArgs>): Prisma.PrismaPromise<GetReferralConfigAggregateType<T>>

    /**
     * Group by ReferralConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralConfigGroupByArgs} args - Group by arguments.
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
      T extends ReferralConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralConfigGroupByArgs['orderBy'] }
        : { orderBy?: ReferralConfigGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReferralConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReferralConfig model
   */
  readonly fields: ReferralConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReferralConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ReferralConfig model
   */ 
  interface ReferralConfigFieldRefs {
    readonly id: FieldRef<"ReferralConfig", 'String'>
    readonly key: FieldRef<"ReferralConfig", 'String'>
    readonly value: FieldRef<"ReferralConfig", 'Decimal'>
    readonly description: FieldRef<"ReferralConfig", 'String'>
    readonly isActive: FieldRef<"ReferralConfig", 'Boolean'>
    readonly createdAt: FieldRef<"ReferralConfig", 'DateTime'>
    readonly updatedAt: FieldRef<"ReferralConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReferralConfig findUnique
   */
  export type ReferralConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter, which ReferralConfig to fetch.
     */
    where: ReferralConfigWhereUniqueInput
  }

  /**
   * ReferralConfig findUniqueOrThrow
   */
  export type ReferralConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter, which ReferralConfig to fetch.
     */
    where: ReferralConfigWhereUniqueInput
  }

  /**
   * ReferralConfig findFirst
   */
  export type ReferralConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter, which ReferralConfig to fetch.
     */
    where?: ReferralConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralConfigs to fetch.
     */
    orderBy?: ReferralConfigOrderByWithRelationInput | ReferralConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralConfigs.
     */
    cursor?: ReferralConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralConfigs.
     */
    distinct?: ReferralConfigScalarFieldEnum | ReferralConfigScalarFieldEnum[]
  }

  /**
   * ReferralConfig findFirstOrThrow
   */
  export type ReferralConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter, which ReferralConfig to fetch.
     */
    where?: ReferralConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralConfigs to fetch.
     */
    orderBy?: ReferralConfigOrderByWithRelationInput | ReferralConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralConfigs.
     */
    cursor?: ReferralConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralConfigs.
     */
    distinct?: ReferralConfigScalarFieldEnum | ReferralConfigScalarFieldEnum[]
  }

  /**
   * ReferralConfig findMany
   */
  export type ReferralConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter, which ReferralConfigs to fetch.
     */
    where?: ReferralConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralConfigs to fetch.
     */
    orderBy?: ReferralConfigOrderByWithRelationInput | ReferralConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReferralConfigs.
     */
    cursor?: ReferralConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralConfigs.
     */
    skip?: number
    distinct?: ReferralConfigScalarFieldEnum | ReferralConfigScalarFieldEnum[]
  }

  /**
   * ReferralConfig create
   */
  export type ReferralConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * The data needed to create a ReferralConfig.
     */
    data: XOR<ReferralConfigCreateInput, ReferralConfigUncheckedCreateInput>
  }

  /**
   * ReferralConfig createMany
   */
  export type ReferralConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReferralConfigs.
     */
    data: ReferralConfigCreateManyInput | ReferralConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralConfig createManyAndReturn
   */
  export type ReferralConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ReferralConfigs.
     */
    data: ReferralConfigCreateManyInput | ReferralConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralConfig update
   */
  export type ReferralConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * The data needed to update a ReferralConfig.
     */
    data: XOR<ReferralConfigUpdateInput, ReferralConfigUncheckedUpdateInput>
    /**
     * Choose, which ReferralConfig to update.
     */
    where: ReferralConfigWhereUniqueInput
  }

  /**
   * ReferralConfig updateMany
   */
  export type ReferralConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReferralConfigs.
     */
    data: XOR<ReferralConfigUpdateManyMutationInput, ReferralConfigUncheckedUpdateManyInput>
    /**
     * Filter which ReferralConfigs to update
     */
    where?: ReferralConfigWhereInput
  }

  /**
   * ReferralConfig upsert
   */
  export type ReferralConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * The filter to search for the ReferralConfig to update in case it exists.
     */
    where: ReferralConfigWhereUniqueInput
    /**
     * In case the ReferralConfig found by the `where` argument doesn't exist, create a new ReferralConfig with this data.
     */
    create: XOR<ReferralConfigCreateInput, ReferralConfigUncheckedCreateInput>
    /**
     * In case the ReferralConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralConfigUpdateInput, ReferralConfigUncheckedUpdateInput>
  }

  /**
   * ReferralConfig delete
   */
  export type ReferralConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
    /**
     * Filter which ReferralConfig to delete.
     */
    where: ReferralConfigWhereUniqueInput
  }

  /**
   * ReferralConfig deleteMany
   */
  export type ReferralConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralConfigs to delete
     */
    where?: ReferralConfigWhereInput
  }

  /**
   * ReferralConfig without action
   */
  export type ReferralConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralConfig
     */
    select?: ReferralConfigSelect<ExtArgs> | null
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


  export const ReferralCodeScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    code: 'code',
    isActive: 'isActive',
    maxUses: 'maxUses',
    currentUses: 'currentUses',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralCodeScalarFieldEnum = (typeof ReferralCodeScalarFieldEnum)[keyof typeof ReferralCodeScalarFieldEnum]


  export const ReferralScalarFieldEnum: {
    id: 'id',
    referrerId: 'referrerId',
    referredId: 'referredId',
    referralCodeId: 'referralCodeId',
    status: 'status',
    rewardAmount: 'rewardAmount',
    rewardStatus: 'rewardStatus',
    completedAt: 'completedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralScalarFieldEnum = (typeof ReferralScalarFieldEnum)[keyof typeof ReferralScalarFieldEnum]


  export const ReferralRewardScalarFieldEnum: {
    id: 'id',
    referralId: 'referralId',
    userId: 'userId',
    amount: 'amount',
    type: 'type',
    status: 'status',
    creditedAt: 'creditedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralRewardScalarFieldEnum = (typeof ReferralRewardScalarFieldEnum)[keyof typeof ReferralRewardScalarFieldEnum]


  export const ReferralConfigScalarFieldEnum: {
    id: 'id',
    key: 'key',
    value: 'value',
    description: 'description',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralConfigScalarFieldEnum = (typeof ReferralConfigScalarFieldEnum)[keyof typeof ReferralConfigScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


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
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


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


  export type ReferralCodeWhereInput = {
    AND?: ReferralCodeWhereInput | ReferralCodeWhereInput[]
    OR?: ReferralCodeWhereInput[]
    NOT?: ReferralCodeWhereInput | ReferralCodeWhereInput[]
    id?: StringFilter<"ReferralCode"> | string
    userId?: StringFilter<"ReferralCode"> | string
    code?: StringFilter<"ReferralCode"> | string
    isActive?: BoolFilter<"ReferralCode"> | boolean
    maxUses?: IntNullableFilter<"ReferralCode"> | number | null
    currentUses?: IntFilter<"ReferralCode"> | number
    expiresAt?: DateTimeNullableFilter<"ReferralCode"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralCode"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralCode"> | Date | string
    referrals?: ReferralListRelationFilter
  }

  export type ReferralCodeOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    maxUses?: SortOrderInput | SortOrder
    currentUses?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    referrals?: ReferralOrderByRelationAggregateInput
  }

  export type ReferralCodeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: ReferralCodeWhereInput | ReferralCodeWhereInput[]
    OR?: ReferralCodeWhereInput[]
    NOT?: ReferralCodeWhereInput | ReferralCodeWhereInput[]
    userId?: StringFilter<"ReferralCode"> | string
    isActive?: BoolFilter<"ReferralCode"> | boolean
    maxUses?: IntNullableFilter<"ReferralCode"> | number | null
    currentUses?: IntFilter<"ReferralCode"> | number
    expiresAt?: DateTimeNullableFilter<"ReferralCode"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralCode"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralCode"> | Date | string
    referrals?: ReferralListRelationFilter
  }, "id" | "code">

  export type ReferralCodeOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    maxUses?: SortOrderInput | SortOrder
    currentUses?: SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralCodeCountOrderByAggregateInput
    _avg?: ReferralCodeAvgOrderByAggregateInput
    _max?: ReferralCodeMaxOrderByAggregateInput
    _min?: ReferralCodeMinOrderByAggregateInput
    _sum?: ReferralCodeSumOrderByAggregateInput
  }

  export type ReferralCodeScalarWhereWithAggregatesInput = {
    AND?: ReferralCodeScalarWhereWithAggregatesInput | ReferralCodeScalarWhereWithAggregatesInput[]
    OR?: ReferralCodeScalarWhereWithAggregatesInput[]
    NOT?: ReferralCodeScalarWhereWithAggregatesInput | ReferralCodeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReferralCode"> | string
    userId?: StringWithAggregatesFilter<"ReferralCode"> | string
    code?: StringWithAggregatesFilter<"ReferralCode"> | string
    isActive?: BoolWithAggregatesFilter<"ReferralCode"> | boolean
    maxUses?: IntNullableWithAggregatesFilter<"ReferralCode"> | number | null
    currentUses?: IntWithAggregatesFilter<"ReferralCode"> | number
    expiresAt?: DateTimeNullableWithAggregatesFilter<"ReferralCode"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ReferralCode"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReferralCode"> | Date | string
  }

  export type ReferralWhereInput = {
    AND?: ReferralWhereInput | ReferralWhereInput[]
    OR?: ReferralWhereInput[]
    NOT?: ReferralWhereInput | ReferralWhereInput[]
    id?: StringFilter<"Referral"> | string
    referrerId?: StringFilter<"Referral"> | string
    referredId?: StringFilter<"Referral"> | string
    referralCodeId?: StringFilter<"Referral"> | string
    status?: StringFilter<"Referral"> | string
    rewardAmount?: DecimalNullableFilter<"Referral"> | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFilter<"Referral"> | string
    completedAt?: DateTimeNullableFilter<"Referral"> | Date | string | null
    createdAt?: DateTimeFilter<"Referral"> | Date | string
    updatedAt?: DateTimeFilter<"Referral"> | Date | string
    referralCode?: XOR<ReferralCodeRelationFilter, ReferralCodeWhereInput>
  }

  export type ReferralOrderByWithRelationInput = {
    id?: SortOrder
    referrerId?: SortOrder
    referredId?: SortOrder
    referralCodeId?: SortOrder
    status?: SortOrder
    rewardAmount?: SortOrderInput | SortOrder
    rewardStatus?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    referralCode?: ReferralCodeOrderByWithRelationInput
  }

  export type ReferralWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ReferralWhereInput | ReferralWhereInput[]
    OR?: ReferralWhereInput[]
    NOT?: ReferralWhereInput | ReferralWhereInput[]
    referrerId?: StringFilter<"Referral"> | string
    referredId?: StringFilter<"Referral"> | string
    referralCodeId?: StringFilter<"Referral"> | string
    status?: StringFilter<"Referral"> | string
    rewardAmount?: DecimalNullableFilter<"Referral"> | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFilter<"Referral"> | string
    completedAt?: DateTimeNullableFilter<"Referral"> | Date | string | null
    createdAt?: DateTimeFilter<"Referral"> | Date | string
    updatedAt?: DateTimeFilter<"Referral"> | Date | string
    referralCode?: XOR<ReferralCodeRelationFilter, ReferralCodeWhereInput>
  }, "id">

  export type ReferralOrderByWithAggregationInput = {
    id?: SortOrder
    referrerId?: SortOrder
    referredId?: SortOrder
    referralCodeId?: SortOrder
    status?: SortOrder
    rewardAmount?: SortOrderInput | SortOrder
    rewardStatus?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralCountOrderByAggregateInput
    _avg?: ReferralAvgOrderByAggregateInput
    _max?: ReferralMaxOrderByAggregateInput
    _min?: ReferralMinOrderByAggregateInput
    _sum?: ReferralSumOrderByAggregateInput
  }

  export type ReferralScalarWhereWithAggregatesInput = {
    AND?: ReferralScalarWhereWithAggregatesInput | ReferralScalarWhereWithAggregatesInput[]
    OR?: ReferralScalarWhereWithAggregatesInput[]
    NOT?: ReferralScalarWhereWithAggregatesInput | ReferralScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Referral"> | string
    referrerId?: StringWithAggregatesFilter<"Referral"> | string
    referredId?: StringWithAggregatesFilter<"Referral"> | string
    referralCodeId?: StringWithAggregatesFilter<"Referral"> | string
    status?: StringWithAggregatesFilter<"Referral"> | string
    rewardAmount?: DecimalNullableWithAggregatesFilter<"Referral"> | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringWithAggregatesFilter<"Referral"> | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"Referral"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Referral"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Referral"> | Date | string
  }

  export type ReferralRewardWhereInput = {
    AND?: ReferralRewardWhereInput | ReferralRewardWhereInput[]
    OR?: ReferralRewardWhereInput[]
    NOT?: ReferralRewardWhereInput | ReferralRewardWhereInput[]
    id?: StringFilter<"ReferralReward"> | string
    referralId?: StringFilter<"ReferralReward"> | string
    userId?: StringFilter<"ReferralReward"> | string
    amount?: DecimalFilter<"ReferralReward"> | Decimal | DecimalJsLike | number | string
    type?: StringFilter<"ReferralReward"> | string
    status?: StringFilter<"ReferralReward"> | string
    creditedAt?: DateTimeNullableFilter<"ReferralReward"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralReward"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralReward"> | Date | string
  }

  export type ReferralRewardOrderByWithRelationInput = {
    id?: SortOrder
    referralId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    creditedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralRewardWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    referralId?: string
    AND?: ReferralRewardWhereInput | ReferralRewardWhereInput[]
    OR?: ReferralRewardWhereInput[]
    NOT?: ReferralRewardWhereInput | ReferralRewardWhereInput[]
    userId?: StringFilter<"ReferralReward"> | string
    amount?: DecimalFilter<"ReferralReward"> | Decimal | DecimalJsLike | number | string
    type?: StringFilter<"ReferralReward"> | string
    status?: StringFilter<"ReferralReward"> | string
    creditedAt?: DateTimeNullableFilter<"ReferralReward"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralReward"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralReward"> | Date | string
  }, "id" | "referralId">

  export type ReferralRewardOrderByWithAggregationInput = {
    id?: SortOrder
    referralId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    creditedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralRewardCountOrderByAggregateInput
    _avg?: ReferralRewardAvgOrderByAggregateInput
    _max?: ReferralRewardMaxOrderByAggregateInput
    _min?: ReferralRewardMinOrderByAggregateInput
    _sum?: ReferralRewardSumOrderByAggregateInput
  }

  export type ReferralRewardScalarWhereWithAggregatesInput = {
    AND?: ReferralRewardScalarWhereWithAggregatesInput | ReferralRewardScalarWhereWithAggregatesInput[]
    OR?: ReferralRewardScalarWhereWithAggregatesInput[]
    NOT?: ReferralRewardScalarWhereWithAggregatesInput | ReferralRewardScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReferralReward"> | string
    referralId?: StringWithAggregatesFilter<"ReferralReward"> | string
    userId?: StringWithAggregatesFilter<"ReferralReward"> | string
    amount?: DecimalWithAggregatesFilter<"ReferralReward"> | Decimal | DecimalJsLike | number | string
    type?: StringWithAggregatesFilter<"ReferralReward"> | string
    status?: StringWithAggregatesFilter<"ReferralReward"> | string
    creditedAt?: DateTimeNullableWithAggregatesFilter<"ReferralReward"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ReferralReward"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReferralReward"> | Date | string
  }

  export type ReferralConfigWhereInput = {
    AND?: ReferralConfigWhereInput | ReferralConfigWhereInput[]
    OR?: ReferralConfigWhereInput[]
    NOT?: ReferralConfigWhereInput | ReferralConfigWhereInput[]
    id?: StringFilter<"ReferralConfig"> | string
    key?: StringFilter<"ReferralConfig"> | string
    value?: DecimalFilter<"ReferralConfig"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableFilter<"ReferralConfig"> | string | null
    isActive?: BoolFilter<"ReferralConfig"> | boolean
    createdAt?: DateTimeFilter<"ReferralConfig"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralConfig"> | Date | string
  }

  export type ReferralConfigOrderByWithRelationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    key?: string
    AND?: ReferralConfigWhereInput | ReferralConfigWhereInput[]
    OR?: ReferralConfigWhereInput[]
    NOT?: ReferralConfigWhereInput | ReferralConfigWhereInput[]
    value?: DecimalFilter<"ReferralConfig"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableFilter<"ReferralConfig"> | string | null
    isActive?: BoolFilter<"ReferralConfig"> | boolean
    createdAt?: DateTimeFilter<"ReferralConfig"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralConfig"> | Date | string
  }, "id" | "key">

  export type ReferralConfigOrderByWithAggregationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    description?: SortOrderInput | SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralConfigCountOrderByAggregateInput
    _avg?: ReferralConfigAvgOrderByAggregateInput
    _max?: ReferralConfigMaxOrderByAggregateInput
    _min?: ReferralConfigMinOrderByAggregateInput
    _sum?: ReferralConfigSumOrderByAggregateInput
  }

  export type ReferralConfigScalarWhereWithAggregatesInput = {
    AND?: ReferralConfigScalarWhereWithAggregatesInput | ReferralConfigScalarWhereWithAggregatesInput[]
    OR?: ReferralConfigScalarWhereWithAggregatesInput[]
    NOT?: ReferralConfigScalarWhereWithAggregatesInput | ReferralConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReferralConfig"> | string
    key?: StringWithAggregatesFilter<"ReferralConfig"> | string
    value?: DecimalWithAggregatesFilter<"ReferralConfig"> | Decimal | DecimalJsLike | number | string
    description?: StringNullableWithAggregatesFilter<"ReferralConfig"> | string | null
    isActive?: BoolWithAggregatesFilter<"ReferralConfig"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"ReferralConfig"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReferralConfig"> | Date | string
  }

  export type ReferralCodeCreateInput = {
    id?: string
    userId: string
    code: string
    isActive?: boolean
    maxUses?: number | null
    currentUses?: number
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    referrals?: ReferralCreateNestedManyWithoutReferralCodeInput
  }

  export type ReferralCodeUncheckedCreateInput = {
    id?: string
    userId: string
    code: string
    isActive?: boolean
    maxUses?: number | null
    currentUses?: number
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    referrals?: ReferralUncheckedCreateNestedManyWithoutReferralCodeInput
  }

  export type ReferralCodeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    referrals?: ReferralUpdateManyWithoutReferralCodeNestedInput
  }

  export type ReferralCodeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    referrals?: ReferralUncheckedUpdateManyWithoutReferralCodeNestedInput
  }

  export type ReferralCodeCreateManyInput = {
    id?: string
    userId: string
    code: string
    isActive?: boolean
    maxUses?: number | null
    currentUses?: number
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralCodeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCodeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCreateInput = {
    id?: string
    referrerId: string
    referredId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    referralCode: ReferralCodeCreateNestedOneWithoutReferralsInput
  }

  export type ReferralUncheckedCreateInput = {
    id?: string
    referrerId: string
    referredId: string
    referralCodeId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    referralCode?: ReferralCodeUpdateOneRequiredWithoutReferralsNestedInput
  }

  export type ReferralUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    referralCodeId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCreateManyInput = {
    id?: string
    referrerId: string
    referredId: string
    referralCodeId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    referralCodeId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralRewardCreateInput = {
    id?: string
    referralId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    status?: string
    creditedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralRewardUncheckedCreateInput = {
    id?: string
    referralId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    status?: string
    creditedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralRewardUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    referralId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    creditedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralRewardUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    referralId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    creditedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralRewardCreateManyInput = {
    id?: string
    referralId: string
    userId: string
    amount: Decimal | DecimalJsLike | number | string
    type: string
    status?: string
    creditedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralRewardUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    referralId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    creditedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralRewardUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    referralId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    type?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    creditedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralConfigCreateInput = {
    id?: string
    key: string
    value: Decimal | DecimalJsLike | number | string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralConfigUncheckedCreateInput = {
    id?: string
    key: string
    value: Decimal | DecimalJsLike | number | string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralConfigCreateManyInput = {
    id?: string
    key: string
    value: Decimal | DecimalJsLike | number | string
    description?: string | null
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
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

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
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

  export type ReferralListRelationFilter = {
    every?: ReferralWhereInput
    some?: ReferralWhereInput
    none?: ReferralWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ReferralOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ReferralCodeCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    maxUses?: SortOrder
    currentUses?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralCodeAvgOrderByAggregateInput = {
    maxUses?: SortOrder
    currentUses?: SortOrder
  }

  export type ReferralCodeMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    maxUses?: SortOrder
    currentUses?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralCodeMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    code?: SortOrder
    isActive?: SortOrder
    maxUses?: SortOrder
    currentUses?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralCodeSumOrderByAggregateInput = {
    maxUses?: SortOrder
    currentUses?: SortOrder
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

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
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

  export type ReferralCodeRelationFilter = {
    is?: ReferralCodeWhereInput
    isNot?: ReferralCodeWhereInput
  }

  export type ReferralCountOrderByAggregateInput = {
    id?: SortOrder
    referrerId?: SortOrder
    referredId?: SortOrder
    referralCodeId?: SortOrder
    status?: SortOrder
    rewardAmount?: SortOrder
    rewardStatus?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAvgOrderByAggregateInput = {
    rewardAmount?: SortOrder
  }

  export type ReferralMaxOrderByAggregateInput = {
    id?: SortOrder
    referrerId?: SortOrder
    referredId?: SortOrder
    referralCodeId?: SortOrder
    status?: SortOrder
    rewardAmount?: SortOrder
    rewardStatus?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralMinOrderByAggregateInput = {
    id?: SortOrder
    referrerId?: SortOrder
    referredId?: SortOrder
    referralCodeId?: SortOrder
    status?: SortOrder
    rewardAmount?: SortOrder
    rewardStatus?: SortOrder
    completedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralSumOrderByAggregateInput = {
    rewardAmount?: SortOrder
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

  export type ReferralRewardCountOrderByAggregateInput = {
    id?: SortOrder
    referralId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    creditedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralRewardAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type ReferralRewardMaxOrderByAggregateInput = {
    id?: SortOrder
    referralId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    creditedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralRewardMinOrderByAggregateInput = {
    id?: SortOrder
    referralId?: SortOrder
    userId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    creditedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralRewardSumOrderByAggregateInput = {
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

  export type ReferralConfigCountOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralConfigAvgOrderByAggregateInput = {
    value?: SortOrder
  }

  export type ReferralConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralConfigMinOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    description?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralConfigSumOrderByAggregateInput = {
    value?: SortOrder
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

  export type ReferralCreateNestedManyWithoutReferralCodeInput = {
    create?: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput> | ReferralCreateWithoutReferralCodeInput[] | ReferralUncheckedCreateWithoutReferralCodeInput[]
    connectOrCreate?: ReferralCreateOrConnectWithoutReferralCodeInput | ReferralCreateOrConnectWithoutReferralCodeInput[]
    createMany?: ReferralCreateManyReferralCodeInputEnvelope
    connect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
  }

  export type ReferralUncheckedCreateNestedManyWithoutReferralCodeInput = {
    create?: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput> | ReferralCreateWithoutReferralCodeInput[] | ReferralUncheckedCreateWithoutReferralCodeInput[]
    connectOrCreate?: ReferralCreateOrConnectWithoutReferralCodeInput | ReferralCreateOrConnectWithoutReferralCodeInput[]
    createMany?: ReferralCreateManyReferralCodeInputEnvelope
    connect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ReferralUpdateManyWithoutReferralCodeNestedInput = {
    create?: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput> | ReferralCreateWithoutReferralCodeInput[] | ReferralUncheckedCreateWithoutReferralCodeInput[]
    connectOrCreate?: ReferralCreateOrConnectWithoutReferralCodeInput | ReferralCreateOrConnectWithoutReferralCodeInput[]
    upsert?: ReferralUpsertWithWhereUniqueWithoutReferralCodeInput | ReferralUpsertWithWhereUniqueWithoutReferralCodeInput[]
    createMany?: ReferralCreateManyReferralCodeInputEnvelope
    set?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    disconnect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    delete?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    connect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    update?: ReferralUpdateWithWhereUniqueWithoutReferralCodeInput | ReferralUpdateWithWhereUniqueWithoutReferralCodeInput[]
    updateMany?: ReferralUpdateManyWithWhereWithoutReferralCodeInput | ReferralUpdateManyWithWhereWithoutReferralCodeInput[]
    deleteMany?: ReferralScalarWhereInput | ReferralScalarWhereInput[]
  }

  export type ReferralUncheckedUpdateManyWithoutReferralCodeNestedInput = {
    create?: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput> | ReferralCreateWithoutReferralCodeInput[] | ReferralUncheckedCreateWithoutReferralCodeInput[]
    connectOrCreate?: ReferralCreateOrConnectWithoutReferralCodeInput | ReferralCreateOrConnectWithoutReferralCodeInput[]
    upsert?: ReferralUpsertWithWhereUniqueWithoutReferralCodeInput | ReferralUpsertWithWhereUniqueWithoutReferralCodeInput[]
    createMany?: ReferralCreateManyReferralCodeInputEnvelope
    set?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    disconnect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    delete?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    connect?: ReferralWhereUniqueInput | ReferralWhereUniqueInput[]
    update?: ReferralUpdateWithWhereUniqueWithoutReferralCodeInput | ReferralUpdateWithWhereUniqueWithoutReferralCodeInput[]
    updateMany?: ReferralUpdateManyWithWhereWithoutReferralCodeInput | ReferralUpdateManyWithWhereWithoutReferralCodeInput[]
    deleteMany?: ReferralScalarWhereInput | ReferralScalarWhereInput[]
  }

  export type ReferralCodeCreateNestedOneWithoutReferralsInput = {
    create?: XOR<ReferralCodeCreateWithoutReferralsInput, ReferralCodeUncheckedCreateWithoutReferralsInput>
    connectOrCreate?: ReferralCodeCreateOrConnectWithoutReferralsInput
    connect?: ReferralCodeWhereUniqueInput
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type ReferralCodeUpdateOneRequiredWithoutReferralsNestedInput = {
    create?: XOR<ReferralCodeCreateWithoutReferralsInput, ReferralCodeUncheckedCreateWithoutReferralsInput>
    connectOrCreate?: ReferralCodeCreateOrConnectWithoutReferralsInput
    upsert?: ReferralCodeUpsertWithoutReferralsInput
    connect?: ReferralCodeWhereUniqueInput
    update?: XOR<XOR<ReferralCodeUpdateToOneWithWhereWithoutReferralsInput, ReferralCodeUpdateWithoutReferralsInput>, ReferralCodeUncheckedUpdateWithoutReferralsInput>
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
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

  export type ReferralCreateWithoutReferralCodeInput = {
    id?: string
    referrerId: string
    referredId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUncheckedCreateWithoutReferralCodeInput = {
    id?: string
    referrerId: string
    referredId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralCreateOrConnectWithoutReferralCodeInput = {
    where: ReferralWhereUniqueInput
    create: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput>
  }

  export type ReferralCreateManyReferralCodeInputEnvelope = {
    data: ReferralCreateManyReferralCodeInput | ReferralCreateManyReferralCodeInput[]
    skipDuplicates?: boolean
  }

  export type ReferralUpsertWithWhereUniqueWithoutReferralCodeInput = {
    where: ReferralWhereUniqueInput
    update: XOR<ReferralUpdateWithoutReferralCodeInput, ReferralUncheckedUpdateWithoutReferralCodeInput>
    create: XOR<ReferralCreateWithoutReferralCodeInput, ReferralUncheckedCreateWithoutReferralCodeInput>
  }

  export type ReferralUpdateWithWhereUniqueWithoutReferralCodeInput = {
    where: ReferralWhereUniqueInput
    data: XOR<ReferralUpdateWithoutReferralCodeInput, ReferralUncheckedUpdateWithoutReferralCodeInput>
  }

  export type ReferralUpdateManyWithWhereWithoutReferralCodeInput = {
    where: ReferralScalarWhereInput
    data: XOR<ReferralUpdateManyMutationInput, ReferralUncheckedUpdateManyWithoutReferralCodeInput>
  }

  export type ReferralScalarWhereInput = {
    AND?: ReferralScalarWhereInput | ReferralScalarWhereInput[]
    OR?: ReferralScalarWhereInput[]
    NOT?: ReferralScalarWhereInput | ReferralScalarWhereInput[]
    id?: StringFilter<"Referral"> | string
    referrerId?: StringFilter<"Referral"> | string
    referredId?: StringFilter<"Referral"> | string
    referralCodeId?: StringFilter<"Referral"> | string
    status?: StringFilter<"Referral"> | string
    rewardAmount?: DecimalNullableFilter<"Referral"> | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFilter<"Referral"> | string
    completedAt?: DateTimeNullableFilter<"Referral"> | Date | string | null
    createdAt?: DateTimeFilter<"Referral"> | Date | string
    updatedAt?: DateTimeFilter<"Referral"> | Date | string
  }

  export type ReferralCodeCreateWithoutReferralsInput = {
    id?: string
    userId: string
    code: string
    isActive?: boolean
    maxUses?: number | null
    currentUses?: number
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralCodeUncheckedCreateWithoutReferralsInput = {
    id?: string
    userId: string
    code: string
    isActive?: boolean
    maxUses?: number | null
    currentUses?: number
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralCodeCreateOrConnectWithoutReferralsInput = {
    where: ReferralCodeWhereUniqueInput
    create: XOR<ReferralCodeCreateWithoutReferralsInput, ReferralCodeUncheckedCreateWithoutReferralsInput>
  }

  export type ReferralCodeUpsertWithoutReferralsInput = {
    update: XOR<ReferralCodeUpdateWithoutReferralsInput, ReferralCodeUncheckedUpdateWithoutReferralsInput>
    create: XOR<ReferralCodeCreateWithoutReferralsInput, ReferralCodeUncheckedCreateWithoutReferralsInput>
    where?: ReferralCodeWhereInput
  }

  export type ReferralCodeUpdateToOneWithWhereWithoutReferralsInput = {
    where?: ReferralCodeWhereInput
    data: XOR<ReferralCodeUpdateWithoutReferralsInput, ReferralCodeUncheckedUpdateWithoutReferralsInput>
  }

  export type ReferralCodeUpdateWithoutReferralsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCodeUncheckedUpdateWithoutReferralsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    maxUses?: NullableIntFieldUpdateOperationsInput | number | null
    currentUses?: IntFieldUpdateOperationsInput | number
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCreateManyReferralCodeInput = {
    id?: string
    referrerId: string
    referredId: string
    status?: string
    rewardAmount?: Decimal | DecimalJsLike | number | string | null
    rewardStatus?: string
    completedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUpdateWithoutReferralCodeInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralUncheckedUpdateWithoutReferralCodeInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralUncheckedUpdateManyWithoutReferralCodeInput = {
    id?: StringFieldUpdateOperationsInput | string
    referrerId?: StringFieldUpdateOperationsInput | string
    referredId?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    rewardAmount?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    rewardStatus?: StringFieldUpdateOperationsInput | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use ReferralCodeCountOutputTypeDefaultArgs instead
     */
    export type ReferralCodeCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReferralCodeCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReferralCodeDefaultArgs instead
     */
    export type ReferralCodeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReferralCodeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReferralDefaultArgs instead
     */
    export type ReferralArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReferralDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReferralRewardDefaultArgs instead
     */
    export type ReferralRewardArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReferralRewardDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReferralConfigDefaultArgs instead
     */
    export type ReferralConfigArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReferralConfigDefaultArgs<ExtArgs>

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