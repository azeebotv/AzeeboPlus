
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
 * Model UniverseMap
 * 
 */
export type UniverseMap = $Result.DefaultSelection<Prisma.$UniverseMapPayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model Character
 * 
 */
export type Character = $Result.DefaultSelection<Prisma.$CharacterPayload>
/**
 * Model CharacterLocation
 * 
 */
export type CharacterLocation = $Result.DefaultSelection<Prisma.$CharacterLocationPayload>
/**
 * Model CharacterRelationship
 * 
 */
export type CharacterRelationship = $Result.DefaultSelection<Prisma.$CharacterRelationshipPayload>
/**
 * Model TimelineEvent
 * 
 */
export type TimelineEvent = $Result.DefaultSelection<Prisma.$TimelineEventPayload>
/**
 * Model Title
 * 
 */
export type Title = $Result.DefaultSelection<Prisma.$TitlePayload>
/**
 * Model Chapter
 * 
 */
export type Chapter = $Result.DefaultSelection<Prisma.$ChapterPayload>
/**
 * Model LoreEntry
 * 
 */
export type LoreEntry = $Result.DefaultSelection<Prisma.$LoreEntryPayload>
/**
 * Model Crossover
 * 
 */
export type Crossover = $Result.DefaultSelection<Prisma.$CrossoverPayload>
/**
 * Model CrossoverTitle
 * 
 */
export type CrossoverTitle = $Result.DefaultSelection<Prisma.$CrossoverTitlePayload>
/**
 * Model Recap
 * 
 */
export type Recap = $Result.DefaultSelection<Prisma.$RecapPayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more UniverseMaps
 * const universeMaps = await prisma.universeMap.findMany()
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
   * // Fetch zero or more UniverseMaps
   * const universeMaps = await prisma.universeMap.findMany()
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
   * `prisma.universeMap`: Exposes CRUD operations for the **UniverseMap** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UniverseMaps
    * const universeMaps = await prisma.universeMap.findMany()
    * ```
    */
  get universeMap(): Prisma.UniverseMapDelegate<ExtArgs>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs>;

  /**
   * `prisma.character`: Exposes CRUD operations for the **Character** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Characters
    * const characters = await prisma.character.findMany()
    * ```
    */
  get character(): Prisma.CharacterDelegate<ExtArgs>;

  /**
   * `prisma.characterLocation`: Exposes CRUD operations for the **CharacterLocation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CharacterLocations
    * const characterLocations = await prisma.characterLocation.findMany()
    * ```
    */
  get characterLocation(): Prisma.CharacterLocationDelegate<ExtArgs>;

  /**
   * `prisma.characterRelationship`: Exposes CRUD operations for the **CharacterRelationship** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CharacterRelationships
    * const characterRelationships = await prisma.characterRelationship.findMany()
    * ```
    */
  get characterRelationship(): Prisma.CharacterRelationshipDelegate<ExtArgs>;

  /**
   * `prisma.timelineEvent`: Exposes CRUD operations for the **TimelineEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TimelineEvents
    * const timelineEvents = await prisma.timelineEvent.findMany()
    * ```
    */
  get timelineEvent(): Prisma.TimelineEventDelegate<ExtArgs>;

  /**
   * `prisma.title`: Exposes CRUD operations for the **Title** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Titles
    * const titles = await prisma.title.findMany()
    * ```
    */
  get title(): Prisma.TitleDelegate<ExtArgs>;

  /**
   * `prisma.chapter`: Exposes CRUD operations for the **Chapter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Chapters
    * const chapters = await prisma.chapter.findMany()
    * ```
    */
  get chapter(): Prisma.ChapterDelegate<ExtArgs>;

  /**
   * `prisma.loreEntry`: Exposes CRUD operations for the **LoreEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LoreEntries
    * const loreEntries = await prisma.loreEntry.findMany()
    * ```
    */
  get loreEntry(): Prisma.LoreEntryDelegate<ExtArgs>;

  /**
   * `prisma.crossover`: Exposes CRUD operations for the **Crossover** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Crossovers
    * const crossovers = await prisma.crossover.findMany()
    * ```
    */
  get crossover(): Prisma.CrossoverDelegate<ExtArgs>;

  /**
   * `prisma.crossoverTitle`: Exposes CRUD operations for the **CrossoverTitle** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CrossoverTitles
    * const crossoverTitles = await prisma.crossoverTitle.findMany()
    * ```
    */
  get crossoverTitle(): Prisma.CrossoverTitleDelegate<ExtArgs>;

  /**
   * `prisma.recap`: Exposes CRUD operations for the **Recap** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Recaps
    * const recaps = await prisma.recap.findMany()
    * ```
    */
  get recap(): Prisma.RecapDelegate<ExtArgs>;
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
    UniverseMap: 'UniverseMap',
    Location: 'Location',
    Character: 'Character',
    CharacterLocation: 'CharacterLocation',
    CharacterRelationship: 'CharacterRelationship',
    TimelineEvent: 'TimelineEvent',
    Title: 'Title',
    Chapter: 'Chapter',
    LoreEntry: 'LoreEntry',
    Crossover: 'Crossover',
    CrossoverTitle: 'CrossoverTitle',
    Recap: 'Recap'
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
      modelProps: "universeMap" | "location" | "character" | "characterLocation" | "characterRelationship" | "timelineEvent" | "title" | "chapter" | "loreEntry" | "crossover" | "crossoverTitle" | "recap"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      UniverseMap: {
        payload: Prisma.$UniverseMapPayload<ExtArgs>
        fields: Prisma.UniverseMapFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UniverseMapFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UniverseMapFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          findFirst: {
            args: Prisma.UniverseMapFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UniverseMapFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          findMany: {
            args: Prisma.UniverseMapFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>[]
          }
          create: {
            args: Prisma.UniverseMapCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          createMany: {
            args: Prisma.UniverseMapCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UniverseMapCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>[]
          }
          delete: {
            args: Prisma.UniverseMapDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          update: {
            args: Prisma.UniverseMapUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          deleteMany: {
            args: Prisma.UniverseMapDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UniverseMapUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UniverseMapUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UniverseMapPayload>
          }
          aggregate: {
            args: Prisma.UniverseMapAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUniverseMap>
          }
          groupBy: {
            args: Prisma.UniverseMapGroupByArgs<ExtArgs>
            result: $Utils.Optional<UniverseMapGroupByOutputType>[]
          }
          count: {
            args: Prisma.UniverseMapCountArgs<ExtArgs>
            result: $Utils.Optional<UniverseMapCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      Character: {
        payload: Prisma.$CharacterPayload<ExtArgs>
        fields: Prisma.CharacterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CharacterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CharacterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          findFirst: {
            args: Prisma.CharacterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CharacterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          findMany: {
            args: Prisma.CharacterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>[]
          }
          create: {
            args: Prisma.CharacterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          createMany: {
            args: Prisma.CharacterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CharacterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>[]
          }
          delete: {
            args: Prisma.CharacterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          update: {
            args: Prisma.CharacterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          deleteMany: {
            args: Prisma.CharacterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CharacterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CharacterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterPayload>
          }
          aggregate: {
            args: Prisma.CharacterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCharacter>
          }
          groupBy: {
            args: Prisma.CharacterGroupByArgs<ExtArgs>
            result: $Utils.Optional<CharacterGroupByOutputType>[]
          }
          count: {
            args: Prisma.CharacterCountArgs<ExtArgs>
            result: $Utils.Optional<CharacterCountAggregateOutputType> | number
          }
        }
      }
      CharacterLocation: {
        payload: Prisma.$CharacterLocationPayload<ExtArgs>
        fields: Prisma.CharacterLocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CharacterLocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CharacterLocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          findFirst: {
            args: Prisma.CharacterLocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CharacterLocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          findMany: {
            args: Prisma.CharacterLocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>[]
          }
          create: {
            args: Prisma.CharacterLocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          createMany: {
            args: Prisma.CharacterLocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CharacterLocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>[]
          }
          delete: {
            args: Prisma.CharacterLocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          update: {
            args: Prisma.CharacterLocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          deleteMany: {
            args: Prisma.CharacterLocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CharacterLocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CharacterLocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterLocationPayload>
          }
          aggregate: {
            args: Prisma.CharacterLocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCharacterLocation>
          }
          groupBy: {
            args: Prisma.CharacterLocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<CharacterLocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.CharacterLocationCountArgs<ExtArgs>
            result: $Utils.Optional<CharacterLocationCountAggregateOutputType> | number
          }
        }
      }
      CharacterRelationship: {
        payload: Prisma.$CharacterRelationshipPayload<ExtArgs>
        fields: Prisma.CharacterRelationshipFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CharacterRelationshipFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CharacterRelationshipFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          findFirst: {
            args: Prisma.CharacterRelationshipFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CharacterRelationshipFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          findMany: {
            args: Prisma.CharacterRelationshipFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>[]
          }
          create: {
            args: Prisma.CharacterRelationshipCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          createMany: {
            args: Prisma.CharacterRelationshipCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CharacterRelationshipCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>[]
          }
          delete: {
            args: Prisma.CharacterRelationshipDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          update: {
            args: Prisma.CharacterRelationshipUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          deleteMany: {
            args: Prisma.CharacterRelationshipDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CharacterRelationshipUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CharacterRelationshipUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CharacterRelationshipPayload>
          }
          aggregate: {
            args: Prisma.CharacterRelationshipAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCharacterRelationship>
          }
          groupBy: {
            args: Prisma.CharacterRelationshipGroupByArgs<ExtArgs>
            result: $Utils.Optional<CharacterRelationshipGroupByOutputType>[]
          }
          count: {
            args: Prisma.CharacterRelationshipCountArgs<ExtArgs>
            result: $Utils.Optional<CharacterRelationshipCountAggregateOutputType> | number
          }
        }
      }
      TimelineEvent: {
        payload: Prisma.$TimelineEventPayload<ExtArgs>
        fields: Prisma.TimelineEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TimelineEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TimelineEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          findFirst: {
            args: Prisma.TimelineEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TimelineEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          findMany: {
            args: Prisma.TimelineEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>[]
          }
          create: {
            args: Prisma.TimelineEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          createMany: {
            args: Prisma.TimelineEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TimelineEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>[]
          }
          delete: {
            args: Prisma.TimelineEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          update: {
            args: Prisma.TimelineEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          deleteMany: {
            args: Prisma.TimelineEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TimelineEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TimelineEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TimelineEventPayload>
          }
          aggregate: {
            args: Prisma.TimelineEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTimelineEvent>
          }
          groupBy: {
            args: Prisma.TimelineEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<TimelineEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.TimelineEventCountArgs<ExtArgs>
            result: $Utils.Optional<TimelineEventCountAggregateOutputType> | number
          }
        }
      }
      Title: {
        payload: Prisma.$TitlePayload<ExtArgs>
        fields: Prisma.TitleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TitleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TitleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          findFirst: {
            args: Prisma.TitleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TitleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          findMany: {
            args: Prisma.TitleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>[]
          }
          create: {
            args: Prisma.TitleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          createMany: {
            args: Prisma.TitleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TitleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>[]
          }
          delete: {
            args: Prisma.TitleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          update: {
            args: Prisma.TitleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          deleteMany: {
            args: Prisma.TitleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TitleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TitleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TitlePayload>
          }
          aggregate: {
            args: Prisma.TitleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTitle>
          }
          groupBy: {
            args: Prisma.TitleGroupByArgs<ExtArgs>
            result: $Utils.Optional<TitleGroupByOutputType>[]
          }
          count: {
            args: Prisma.TitleCountArgs<ExtArgs>
            result: $Utils.Optional<TitleCountAggregateOutputType> | number
          }
        }
      }
      Chapter: {
        payload: Prisma.$ChapterPayload<ExtArgs>
        fields: Prisma.ChapterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChapterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChapterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findFirst: {
            args: Prisma.ChapterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChapterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          findMany: {
            args: Prisma.ChapterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          create: {
            args: Prisma.ChapterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          createMany: {
            args: Prisma.ChapterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChapterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>[]
          }
          delete: {
            args: Prisma.ChapterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          update: {
            args: Prisma.ChapterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          deleteMany: {
            args: Prisma.ChapterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChapterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ChapterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChapterPayload>
          }
          aggregate: {
            args: Prisma.ChapterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChapter>
          }
          groupBy: {
            args: Prisma.ChapterGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChapterGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChapterCountArgs<ExtArgs>
            result: $Utils.Optional<ChapterCountAggregateOutputType> | number
          }
        }
      }
      LoreEntry: {
        payload: Prisma.$LoreEntryPayload<ExtArgs>
        fields: Prisma.LoreEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LoreEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LoreEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          findFirst: {
            args: Prisma.LoreEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LoreEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          findMany: {
            args: Prisma.LoreEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>[]
          }
          create: {
            args: Prisma.LoreEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          createMany: {
            args: Prisma.LoreEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LoreEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>[]
          }
          delete: {
            args: Prisma.LoreEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          update: {
            args: Prisma.LoreEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          deleteMany: {
            args: Prisma.LoreEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LoreEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LoreEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoreEntryPayload>
          }
          aggregate: {
            args: Prisma.LoreEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLoreEntry>
          }
          groupBy: {
            args: Prisma.LoreEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<LoreEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.LoreEntryCountArgs<ExtArgs>
            result: $Utils.Optional<LoreEntryCountAggregateOutputType> | number
          }
        }
      }
      Crossover: {
        payload: Prisma.$CrossoverPayload<ExtArgs>
        fields: Prisma.CrossoverFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrossoverFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrossoverFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          findFirst: {
            args: Prisma.CrossoverFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrossoverFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          findMany: {
            args: Prisma.CrossoverFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>[]
          }
          create: {
            args: Prisma.CrossoverCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          createMany: {
            args: Prisma.CrossoverCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrossoverCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>[]
          }
          delete: {
            args: Prisma.CrossoverDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          update: {
            args: Prisma.CrossoverUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          deleteMany: {
            args: Prisma.CrossoverDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrossoverUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CrossoverUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverPayload>
          }
          aggregate: {
            args: Prisma.CrossoverAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrossover>
          }
          groupBy: {
            args: Prisma.CrossoverGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrossoverGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrossoverCountArgs<ExtArgs>
            result: $Utils.Optional<CrossoverCountAggregateOutputType> | number
          }
        }
      }
      CrossoverTitle: {
        payload: Prisma.$CrossoverTitlePayload<ExtArgs>
        fields: Prisma.CrossoverTitleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrossoverTitleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrossoverTitleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          findFirst: {
            args: Prisma.CrossoverTitleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrossoverTitleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          findMany: {
            args: Prisma.CrossoverTitleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>[]
          }
          create: {
            args: Prisma.CrossoverTitleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          createMany: {
            args: Prisma.CrossoverTitleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrossoverTitleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>[]
          }
          delete: {
            args: Prisma.CrossoverTitleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          update: {
            args: Prisma.CrossoverTitleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          deleteMany: {
            args: Prisma.CrossoverTitleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrossoverTitleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.CrossoverTitleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrossoverTitlePayload>
          }
          aggregate: {
            args: Prisma.CrossoverTitleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrossoverTitle>
          }
          groupBy: {
            args: Prisma.CrossoverTitleGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrossoverTitleGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrossoverTitleCountArgs<ExtArgs>
            result: $Utils.Optional<CrossoverTitleCountAggregateOutputType> | number
          }
        }
      }
      Recap: {
        payload: Prisma.$RecapPayload<ExtArgs>
        fields: Prisma.RecapFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecapFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecapFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          findFirst: {
            args: Prisma.RecapFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecapFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          findMany: {
            args: Prisma.RecapFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>[]
          }
          create: {
            args: Prisma.RecapCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          createMany: {
            args: Prisma.RecapCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecapCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>[]
          }
          delete: {
            args: Prisma.RecapDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          update: {
            args: Prisma.RecapUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          deleteMany: {
            args: Prisma.RecapDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecapUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RecapUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecapPayload>
          }
          aggregate: {
            args: Prisma.RecapAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecap>
          }
          groupBy: {
            args: Prisma.RecapGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecapGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecapCountArgs<ExtArgs>
            result: $Utils.Optional<RecapCountAggregateOutputType> | number
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
   * Count Type UniverseMapCountOutputType
   */

  export type UniverseMapCountOutputType = {
    characters: number
    locations: number
    timeline: number
    titles: number
    loreEntries: number
  }

  export type UniverseMapCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    characters?: boolean | UniverseMapCountOutputTypeCountCharactersArgs
    locations?: boolean | UniverseMapCountOutputTypeCountLocationsArgs
    timeline?: boolean | UniverseMapCountOutputTypeCountTimelineArgs
    titles?: boolean | UniverseMapCountOutputTypeCountTitlesArgs
    loreEntries?: boolean | UniverseMapCountOutputTypeCountLoreEntriesArgs
  }

  // Custom InputTypes
  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMapCountOutputType
     */
    select?: UniverseMapCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeCountCharactersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterWhereInput
  }

  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeCountLocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
  }

  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeCountTimelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimelineEventWhereInput
  }

  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeCountTitlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TitleWhereInput
  }

  /**
   * UniverseMapCountOutputType without action
   */
  export type UniverseMapCountOutputTypeCountLoreEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoreEntryWhereInput
  }


  /**
   * Count Type LocationCountOutputType
   */

  export type LocationCountOutputType = {
    children: number
    characters: number
    timeline: number
  }

  export type LocationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | LocationCountOutputTypeCountChildrenArgs
    characters?: boolean | LocationCountOutputTypeCountCharactersArgs
    timeline?: boolean | LocationCountOutputTypeCountTimelineArgs
  }

  // Custom InputTypes
  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LocationCountOutputType
     */
    select?: LocationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountCharactersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterLocationWhereInput
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountTimelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimelineEventWhereInput
  }


  /**
   * Count Type CharacterCountOutputType
   */

  export type CharacterCountOutputType = {
    locations: number
    relationshipsFrom: number
    relationshipsTo: number
    timeline: number
  }

  export type CharacterCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    locations?: boolean | CharacterCountOutputTypeCountLocationsArgs
    relationshipsFrom?: boolean | CharacterCountOutputTypeCountRelationshipsFromArgs
    relationshipsTo?: boolean | CharacterCountOutputTypeCountRelationshipsToArgs
    timeline?: boolean | CharacterCountOutputTypeCountTimelineArgs
  }

  // Custom InputTypes
  /**
   * CharacterCountOutputType without action
   */
  export type CharacterCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterCountOutputType
     */
    select?: CharacterCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CharacterCountOutputType without action
   */
  export type CharacterCountOutputTypeCountLocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterLocationWhereInput
  }

  /**
   * CharacterCountOutputType without action
   */
  export type CharacterCountOutputTypeCountRelationshipsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterRelationshipWhereInput
  }

  /**
   * CharacterCountOutputType without action
   */
  export type CharacterCountOutputTypeCountRelationshipsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterRelationshipWhereInput
  }

  /**
   * CharacterCountOutputType without action
   */
  export type CharacterCountOutputTypeCountTimelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimelineEventWhereInput
  }


  /**
   * Count Type TitleCountOutputType
   */

  export type TitleCountOutputType = {
    recaps: number
    crossovers: number
    chapters: number
  }

  export type TitleCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    recaps?: boolean | TitleCountOutputTypeCountRecapsArgs
    crossovers?: boolean | TitleCountOutputTypeCountCrossoversArgs
    chapters?: boolean | TitleCountOutputTypeCountChaptersArgs
  }

  // Custom InputTypes
  /**
   * TitleCountOutputType without action
   */
  export type TitleCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TitleCountOutputType
     */
    select?: TitleCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TitleCountOutputType without action
   */
  export type TitleCountOutputTypeCountRecapsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecapWhereInput
  }

  /**
   * TitleCountOutputType without action
   */
  export type TitleCountOutputTypeCountCrossoversArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrossoverTitleWhereInput
  }

  /**
   * TitleCountOutputType without action
   */
  export type TitleCountOutputTypeCountChaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
  }


  /**
   * Count Type CrossoverCountOutputType
   */

  export type CrossoverCountOutputType = {
    titles: number
  }

  export type CrossoverCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    titles?: boolean | CrossoverCountOutputTypeCountTitlesArgs
  }

  // Custom InputTypes
  /**
   * CrossoverCountOutputType without action
   */
  export type CrossoverCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverCountOutputType
     */
    select?: CrossoverCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CrossoverCountOutputType without action
   */
  export type CrossoverCountOutputTypeCountTitlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrossoverTitleWhereInput
  }


  /**
   * Models
   */

  /**
   * Model UniverseMap
   */

  export type AggregateUniverseMap = {
    _count: UniverseMapCountAggregateOutputType | null
    _min: UniverseMapMinAggregateOutputType | null
    _max: UniverseMapMaxAggregateOutputType | null
  }

  export type UniverseMapMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    imageUrl: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UniverseMapMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    imageUrl: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UniverseMapCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    imageUrl: number
    data: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UniverseMapMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UniverseMapMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UniverseMapCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    data?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UniverseMapAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UniverseMap to aggregate.
     */
    where?: UniverseMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UniverseMaps to fetch.
     */
    orderBy?: UniverseMapOrderByWithRelationInput | UniverseMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UniverseMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UniverseMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UniverseMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UniverseMaps
    **/
    _count?: true | UniverseMapCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UniverseMapMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UniverseMapMaxAggregateInputType
  }

  export type GetUniverseMapAggregateType<T extends UniverseMapAggregateArgs> = {
        [P in keyof T & keyof AggregateUniverseMap]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUniverseMap[P]>
      : GetScalarType<T[P], AggregateUniverseMap[P]>
  }




  export type UniverseMapGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UniverseMapWhereInput
    orderBy?: UniverseMapOrderByWithAggregationInput | UniverseMapOrderByWithAggregationInput[]
    by: UniverseMapScalarFieldEnum[] | UniverseMapScalarFieldEnum
    having?: UniverseMapScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UniverseMapCountAggregateInputType | true
    _min?: UniverseMapMinAggregateInputType
    _max?: UniverseMapMaxAggregateInputType
  }

  export type UniverseMapGroupByOutputType = {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    data: JsonValue | null
    status: string
    createdAt: Date
    updatedAt: Date
    _count: UniverseMapCountAggregateOutputType | null
    _min: UniverseMapMinAggregateOutputType | null
    _max: UniverseMapMaxAggregateOutputType | null
  }

  type GetUniverseMapGroupByPayload<T extends UniverseMapGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UniverseMapGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UniverseMapGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UniverseMapGroupByOutputType[P]>
            : GetScalarType<T[P], UniverseMapGroupByOutputType[P]>
        }
      >
    >


  export type UniverseMapSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    data?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    characters?: boolean | UniverseMap$charactersArgs<ExtArgs>
    locations?: boolean | UniverseMap$locationsArgs<ExtArgs>
    timeline?: boolean | UniverseMap$timelineArgs<ExtArgs>
    titles?: boolean | UniverseMap$titlesArgs<ExtArgs>
    loreEntries?: boolean | UniverseMap$loreEntriesArgs<ExtArgs>
    _count?: boolean | UniverseMapCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["universeMap"]>

  export type UniverseMapSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    data?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["universeMap"]>

  export type UniverseMapSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    data?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UniverseMapInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    characters?: boolean | UniverseMap$charactersArgs<ExtArgs>
    locations?: boolean | UniverseMap$locationsArgs<ExtArgs>
    timeline?: boolean | UniverseMap$timelineArgs<ExtArgs>
    titles?: boolean | UniverseMap$titlesArgs<ExtArgs>
    loreEntries?: boolean | UniverseMap$loreEntriesArgs<ExtArgs>
    _count?: boolean | UniverseMapCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UniverseMapIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UniverseMapPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UniverseMap"
    objects: {
      characters: Prisma.$CharacterPayload<ExtArgs>[]
      locations: Prisma.$LocationPayload<ExtArgs>[]
      timeline: Prisma.$TimelineEventPayload<ExtArgs>[]
      titles: Prisma.$TitlePayload<ExtArgs>[]
      loreEntries: Prisma.$LoreEntryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      description: string | null
      imageUrl: string | null
      data: Prisma.JsonValue | null
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["universeMap"]>
    composites: {}
  }

  type UniverseMapGetPayload<S extends boolean | null | undefined | UniverseMapDefaultArgs> = $Result.GetResult<Prisma.$UniverseMapPayload, S>

  type UniverseMapCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UniverseMapFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UniverseMapCountAggregateInputType | true
    }

  export interface UniverseMapDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UniverseMap'], meta: { name: 'UniverseMap' } }
    /**
     * Find zero or one UniverseMap that matches the filter.
     * @param {UniverseMapFindUniqueArgs} args - Arguments to find a UniverseMap
     * @example
     * // Get one UniverseMap
     * const universeMap = await prisma.universeMap.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UniverseMapFindUniqueArgs>(args: SelectSubset<T, UniverseMapFindUniqueArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one UniverseMap that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UniverseMapFindUniqueOrThrowArgs} args - Arguments to find a UniverseMap
     * @example
     * // Get one UniverseMap
     * const universeMap = await prisma.universeMap.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UniverseMapFindUniqueOrThrowArgs>(args: SelectSubset<T, UniverseMapFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first UniverseMap that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapFindFirstArgs} args - Arguments to find a UniverseMap
     * @example
     * // Get one UniverseMap
     * const universeMap = await prisma.universeMap.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UniverseMapFindFirstArgs>(args?: SelectSubset<T, UniverseMapFindFirstArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first UniverseMap that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapFindFirstOrThrowArgs} args - Arguments to find a UniverseMap
     * @example
     * // Get one UniverseMap
     * const universeMap = await prisma.universeMap.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UniverseMapFindFirstOrThrowArgs>(args?: SelectSubset<T, UniverseMapFindFirstOrThrowArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more UniverseMaps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UniverseMaps
     * const universeMaps = await prisma.universeMap.findMany()
     * 
     * // Get first 10 UniverseMaps
     * const universeMaps = await prisma.universeMap.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const universeMapWithIdOnly = await prisma.universeMap.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UniverseMapFindManyArgs>(args?: SelectSubset<T, UniverseMapFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a UniverseMap.
     * @param {UniverseMapCreateArgs} args - Arguments to create a UniverseMap.
     * @example
     * // Create one UniverseMap
     * const UniverseMap = await prisma.universeMap.create({
     *   data: {
     *     // ... data to create a UniverseMap
     *   }
     * })
     * 
     */
    create<T extends UniverseMapCreateArgs>(args: SelectSubset<T, UniverseMapCreateArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many UniverseMaps.
     * @param {UniverseMapCreateManyArgs} args - Arguments to create many UniverseMaps.
     * @example
     * // Create many UniverseMaps
     * const universeMap = await prisma.universeMap.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UniverseMapCreateManyArgs>(args?: SelectSubset<T, UniverseMapCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UniverseMaps and returns the data saved in the database.
     * @param {UniverseMapCreateManyAndReturnArgs} args - Arguments to create many UniverseMaps.
     * @example
     * // Create many UniverseMaps
     * const universeMap = await prisma.universeMap.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UniverseMaps and only return the `id`
     * const universeMapWithIdOnly = await prisma.universeMap.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UniverseMapCreateManyAndReturnArgs>(args?: SelectSubset<T, UniverseMapCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a UniverseMap.
     * @param {UniverseMapDeleteArgs} args - Arguments to delete one UniverseMap.
     * @example
     * // Delete one UniverseMap
     * const UniverseMap = await prisma.universeMap.delete({
     *   where: {
     *     // ... filter to delete one UniverseMap
     *   }
     * })
     * 
     */
    delete<T extends UniverseMapDeleteArgs>(args: SelectSubset<T, UniverseMapDeleteArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one UniverseMap.
     * @param {UniverseMapUpdateArgs} args - Arguments to update one UniverseMap.
     * @example
     * // Update one UniverseMap
     * const universeMap = await prisma.universeMap.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UniverseMapUpdateArgs>(args: SelectSubset<T, UniverseMapUpdateArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more UniverseMaps.
     * @param {UniverseMapDeleteManyArgs} args - Arguments to filter UniverseMaps to delete.
     * @example
     * // Delete a few UniverseMaps
     * const { count } = await prisma.universeMap.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UniverseMapDeleteManyArgs>(args?: SelectSubset<T, UniverseMapDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UniverseMaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UniverseMaps
     * const universeMap = await prisma.universeMap.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UniverseMapUpdateManyArgs>(args: SelectSubset<T, UniverseMapUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one UniverseMap.
     * @param {UniverseMapUpsertArgs} args - Arguments to update or create a UniverseMap.
     * @example
     * // Update or create a UniverseMap
     * const universeMap = await prisma.universeMap.upsert({
     *   create: {
     *     // ... data to create a UniverseMap
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UniverseMap we want to update
     *   }
     * })
     */
    upsert<T extends UniverseMapUpsertArgs>(args: SelectSubset<T, UniverseMapUpsertArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of UniverseMaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapCountArgs} args - Arguments to filter UniverseMaps to count.
     * @example
     * // Count the number of UniverseMaps
     * const count = await prisma.universeMap.count({
     *   where: {
     *     // ... the filter for the UniverseMaps we want to count
     *   }
     * })
    **/
    count<T extends UniverseMapCountArgs>(
      args?: Subset<T, UniverseMapCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UniverseMapCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UniverseMap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends UniverseMapAggregateArgs>(args: Subset<T, UniverseMapAggregateArgs>): Prisma.PrismaPromise<GetUniverseMapAggregateType<T>>

    /**
     * Group by UniverseMap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UniverseMapGroupByArgs} args - Group by arguments.
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
      T extends UniverseMapGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UniverseMapGroupByArgs['orderBy'] }
        : { orderBy?: UniverseMapGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, UniverseMapGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUniverseMapGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UniverseMap model
   */
  readonly fields: UniverseMapFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UniverseMap.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UniverseMapClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    characters<T extends UniverseMap$charactersArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMap$charactersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findMany"> | Null>
    locations<T extends UniverseMap$locationsArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMap$locationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany"> | Null>
    timeline<T extends UniverseMap$timelineArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMap$timelineArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findMany"> | Null>
    titles<T extends UniverseMap$titlesArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMap$titlesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findMany"> | Null>
    loreEntries<T extends UniverseMap$loreEntriesArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMap$loreEntriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the UniverseMap model
   */ 
  interface UniverseMapFieldRefs {
    readonly id: FieldRef<"UniverseMap", 'String'>
    readonly name: FieldRef<"UniverseMap", 'String'>
    readonly slug: FieldRef<"UniverseMap", 'String'>
    readonly description: FieldRef<"UniverseMap", 'String'>
    readonly imageUrl: FieldRef<"UniverseMap", 'String'>
    readonly data: FieldRef<"UniverseMap", 'Json'>
    readonly status: FieldRef<"UniverseMap", 'String'>
    readonly createdAt: FieldRef<"UniverseMap", 'DateTime'>
    readonly updatedAt: FieldRef<"UniverseMap", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UniverseMap findUnique
   */
  export type UniverseMapFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter, which UniverseMap to fetch.
     */
    where: UniverseMapWhereUniqueInput
  }

  /**
   * UniverseMap findUniqueOrThrow
   */
  export type UniverseMapFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter, which UniverseMap to fetch.
     */
    where: UniverseMapWhereUniqueInput
  }

  /**
   * UniverseMap findFirst
   */
  export type UniverseMapFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter, which UniverseMap to fetch.
     */
    where?: UniverseMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UniverseMaps to fetch.
     */
    orderBy?: UniverseMapOrderByWithRelationInput | UniverseMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UniverseMaps.
     */
    cursor?: UniverseMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UniverseMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UniverseMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UniverseMaps.
     */
    distinct?: UniverseMapScalarFieldEnum | UniverseMapScalarFieldEnum[]
  }

  /**
   * UniverseMap findFirstOrThrow
   */
  export type UniverseMapFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter, which UniverseMap to fetch.
     */
    where?: UniverseMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UniverseMaps to fetch.
     */
    orderBy?: UniverseMapOrderByWithRelationInput | UniverseMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UniverseMaps.
     */
    cursor?: UniverseMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UniverseMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UniverseMaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UniverseMaps.
     */
    distinct?: UniverseMapScalarFieldEnum | UniverseMapScalarFieldEnum[]
  }

  /**
   * UniverseMap findMany
   */
  export type UniverseMapFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter, which UniverseMaps to fetch.
     */
    where?: UniverseMapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UniverseMaps to fetch.
     */
    orderBy?: UniverseMapOrderByWithRelationInput | UniverseMapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UniverseMaps.
     */
    cursor?: UniverseMapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UniverseMaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UniverseMaps.
     */
    skip?: number
    distinct?: UniverseMapScalarFieldEnum | UniverseMapScalarFieldEnum[]
  }

  /**
   * UniverseMap create
   */
  export type UniverseMapCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * The data needed to create a UniverseMap.
     */
    data: XOR<UniverseMapCreateInput, UniverseMapUncheckedCreateInput>
  }

  /**
   * UniverseMap createMany
   */
  export type UniverseMapCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UniverseMaps.
     */
    data: UniverseMapCreateManyInput | UniverseMapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UniverseMap createManyAndReturn
   */
  export type UniverseMapCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many UniverseMaps.
     */
    data: UniverseMapCreateManyInput | UniverseMapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UniverseMap update
   */
  export type UniverseMapUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * The data needed to update a UniverseMap.
     */
    data: XOR<UniverseMapUpdateInput, UniverseMapUncheckedUpdateInput>
    /**
     * Choose, which UniverseMap to update.
     */
    where: UniverseMapWhereUniqueInput
  }

  /**
   * UniverseMap updateMany
   */
  export type UniverseMapUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UniverseMaps.
     */
    data: XOR<UniverseMapUpdateManyMutationInput, UniverseMapUncheckedUpdateManyInput>
    /**
     * Filter which UniverseMaps to update
     */
    where?: UniverseMapWhereInput
  }

  /**
   * UniverseMap upsert
   */
  export type UniverseMapUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * The filter to search for the UniverseMap to update in case it exists.
     */
    where: UniverseMapWhereUniqueInput
    /**
     * In case the UniverseMap found by the `where` argument doesn't exist, create a new UniverseMap with this data.
     */
    create: XOR<UniverseMapCreateInput, UniverseMapUncheckedCreateInput>
    /**
     * In case the UniverseMap was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UniverseMapUpdateInput, UniverseMapUncheckedUpdateInput>
  }

  /**
   * UniverseMap delete
   */
  export type UniverseMapDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
    /**
     * Filter which UniverseMap to delete.
     */
    where: UniverseMapWhereUniqueInput
  }

  /**
   * UniverseMap deleteMany
   */
  export type UniverseMapDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UniverseMaps to delete
     */
    where?: UniverseMapWhereInput
  }

  /**
   * UniverseMap.characters
   */
  export type UniverseMap$charactersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    where?: CharacterWhereInput
    orderBy?: CharacterOrderByWithRelationInput | CharacterOrderByWithRelationInput[]
    cursor?: CharacterWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CharacterScalarFieldEnum | CharacterScalarFieldEnum[]
  }

  /**
   * UniverseMap.locations
   */
  export type UniverseMap$locationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    cursor?: LocationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * UniverseMap.timeline
   */
  export type UniverseMap$timelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    where?: TimelineEventWhereInput
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    cursor?: TimelineEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * UniverseMap.titles
   */
  export type UniverseMap$titlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    where?: TitleWhereInput
    orderBy?: TitleOrderByWithRelationInput | TitleOrderByWithRelationInput[]
    cursor?: TitleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TitleScalarFieldEnum | TitleScalarFieldEnum[]
  }

  /**
   * UniverseMap.loreEntries
   */
  export type UniverseMap$loreEntriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    where?: LoreEntryWhereInput
    orderBy?: LoreEntryOrderByWithRelationInput | LoreEntryOrderByWithRelationInput[]
    cursor?: LoreEntryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LoreEntryScalarFieldEnum | LoreEntryScalarFieldEnum[]
  }

  /**
   * UniverseMap without action
   */
  export type UniverseMapDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UniverseMap
     */
    select?: UniverseMapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UniverseMapInclude<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type LocationSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    imageUrl: string | null
    latitude: number | null
    longitude: number | null
    universeId: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    imageUrl: string | null
    latitude: number | null
    longitude: number | null
    universeId: string | null
    parentId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    imageUrl: number
    latitude: number
    longitude: number
    universeId: number
    parentId: number
    data: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LocationAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type LocationSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type LocationMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    latitude?: true
    longitude?: true
    universeId?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    latitude?: true
    longitude?: true
    universeId?: true
    parentId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    imageUrl?: true
    latitude?: true
    longitude?: true
    universeId?: true
    parentId?: true
    data?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LocationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LocationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _avg?: LocationAvgAggregateInputType
    _sum?: LocationSumAggregateInputType
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    latitude: number | null
    longitude: number | null
    universeId: string
    parentId: string | null
    data: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    latitude?: boolean
    longitude?: boolean
    universeId?: boolean
    parentId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    parent?: boolean | Location$parentArgs<ExtArgs>
    children?: boolean | Location$childrenArgs<ExtArgs>
    characters?: boolean | Location$charactersArgs<ExtArgs>
    timeline?: boolean | Location$timelineArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    latitude?: boolean
    longitude?: boolean
    universeId?: boolean
    parentId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    parent?: boolean | Location$parentArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    imageUrl?: boolean
    latitude?: boolean
    longitude?: boolean
    universeId?: boolean
    parentId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    parent?: boolean | Location$parentArgs<ExtArgs>
    children?: boolean | Location$childrenArgs<ExtArgs>
    characters?: boolean | Location$charactersArgs<ExtArgs>
    timeline?: boolean | Location$timelineArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    parent?: boolean | Location$parentArgs<ExtArgs>
  }

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {
      universe: Prisma.$UniverseMapPayload<ExtArgs>
      parent: Prisma.$LocationPayload<ExtArgs> | null
      children: Prisma.$LocationPayload<ExtArgs>[]
      characters: Prisma.$CharacterLocationPayload<ExtArgs>[]
      timeline: Prisma.$TimelineEventPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      description: string | null
      imageUrl: string | null
      latitude: number | null
      longitude: number | null
      universeId: string
      parentId: string | null
      data: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
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
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    universe<T extends UniverseMapDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMapDefaultArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    parent<T extends Location$parentArgs<ExtArgs> = {}>(args?: Subset<T, Location$parentArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    children<T extends Location$childrenArgs<ExtArgs> = {}>(args?: Subset<T, Location$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany"> | Null>
    characters<T extends Location$charactersArgs<ExtArgs> = {}>(args?: Subset<T, Location$charactersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findMany"> | Null>
    timeline<T extends Location$timelineArgs<ExtArgs> = {}>(args?: Subset<T, Location$timelineArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Location model
   */ 
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly name: FieldRef<"Location", 'String'>
    readonly slug: FieldRef<"Location", 'String'>
    readonly description: FieldRef<"Location", 'String'>
    readonly imageUrl: FieldRef<"Location", 'String'>
    readonly latitude: FieldRef<"Location", 'Float'>
    readonly longitude: FieldRef<"Location", 'Float'>
    readonly universeId: FieldRef<"Location", 'String'>
    readonly parentId: FieldRef<"Location", 'String'>
    readonly data: FieldRef<"Location", 'Json'>
    readonly createdAt: FieldRef<"Location", 'DateTime'>
    readonly updatedAt: FieldRef<"Location", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
  }

  /**
   * Location.parent
   */
  export type Location$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * Location.children
   */
  export type Location$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    cursor?: LocationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location.characters
   */
  export type Location$charactersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    where?: CharacterLocationWhereInput
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    cursor?: CharacterLocationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CharacterLocationScalarFieldEnum | CharacterLocationScalarFieldEnum[]
  }

  /**
   * Location.timeline
   */
  export type Location$timelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    where?: TimelineEventWhereInput
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    cursor?: TimelineEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
  }


  /**
   * Model Character
   */

  export type AggregateCharacter = {
    _count: CharacterCountAggregateOutputType | null
    _min: CharacterMinAggregateOutputType | null
    _max: CharacterMaxAggregateOutputType | null
  }

  export type CharacterMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    avatarUrl: string | null
    role: string | null
    status: string | null
    universeId: string | null
    birthDate: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CharacterMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    description: string | null
    avatarUrl: string | null
    role: string | null
    status: string | null
    universeId: string | null
    birthDate: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CharacterCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    avatarUrl: number
    role: number
    status: number
    universeId: number
    birthDate: number
    data: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CharacterMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    avatarUrl?: true
    role?: true
    status?: true
    universeId?: true
    birthDate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CharacterMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    avatarUrl?: true
    role?: true
    status?: true
    universeId?: true
    birthDate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CharacterCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    avatarUrl?: true
    role?: true
    status?: true
    universeId?: true
    birthDate?: true
    data?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CharacterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Character to aggregate.
     */
    where?: CharacterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Characters to fetch.
     */
    orderBy?: CharacterOrderByWithRelationInput | CharacterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CharacterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Characters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Characters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Characters
    **/
    _count?: true | CharacterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CharacterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CharacterMaxAggregateInputType
  }

  export type GetCharacterAggregateType<T extends CharacterAggregateArgs> = {
        [P in keyof T & keyof AggregateCharacter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCharacter[P]>
      : GetScalarType<T[P], AggregateCharacter[P]>
  }




  export type CharacterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterWhereInput
    orderBy?: CharacterOrderByWithAggregationInput | CharacterOrderByWithAggregationInput[]
    by: CharacterScalarFieldEnum[] | CharacterScalarFieldEnum
    having?: CharacterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CharacterCountAggregateInputType | true
    _min?: CharacterMinAggregateInputType
    _max?: CharacterMaxAggregateInputType
  }

  export type CharacterGroupByOutputType = {
    id: string
    name: string
    slug: string
    description: string | null
    avatarUrl: string | null
    role: string | null
    status: string
    universeId: string
    birthDate: Date | null
    data: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: CharacterCountAggregateOutputType | null
    _min: CharacterMinAggregateOutputType | null
    _max: CharacterMaxAggregateOutputType | null
  }

  type GetCharacterGroupByPayload<T extends CharacterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CharacterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CharacterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CharacterGroupByOutputType[P]>
            : GetScalarType<T[P], CharacterGroupByOutputType[P]>
        }
      >
    >


  export type CharacterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    avatarUrl?: boolean
    role?: boolean
    status?: boolean
    universeId?: boolean
    birthDate?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    locations?: boolean | Character$locationsArgs<ExtArgs>
    relationshipsFrom?: boolean | Character$relationshipsFromArgs<ExtArgs>
    relationshipsTo?: boolean | Character$relationshipsToArgs<ExtArgs>
    timeline?: boolean | Character$timelineArgs<ExtArgs>
    _count?: boolean | CharacterCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["character"]>

  export type CharacterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    avatarUrl?: boolean
    role?: boolean
    status?: boolean
    universeId?: boolean
    birthDate?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["character"]>

  export type CharacterSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    avatarUrl?: boolean
    role?: boolean
    status?: boolean
    universeId?: boolean
    birthDate?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CharacterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    locations?: boolean | Character$locationsArgs<ExtArgs>
    relationshipsFrom?: boolean | Character$relationshipsFromArgs<ExtArgs>
    relationshipsTo?: boolean | Character$relationshipsToArgs<ExtArgs>
    timeline?: boolean | Character$timelineArgs<ExtArgs>
    _count?: boolean | CharacterCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CharacterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }

  export type $CharacterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Character"
    objects: {
      universe: Prisma.$UniverseMapPayload<ExtArgs>
      locations: Prisma.$CharacterLocationPayload<ExtArgs>[]
      relationshipsFrom: Prisma.$CharacterRelationshipPayload<ExtArgs>[]
      relationshipsTo: Prisma.$CharacterRelationshipPayload<ExtArgs>[]
      timeline: Prisma.$TimelineEventPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      description: string | null
      avatarUrl: string | null
      role: string | null
      status: string
      universeId: string
      birthDate: Date | null
      data: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["character"]>
    composites: {}
  }

  type CharacterGetPayload<S extends boolean | null | undefined | CharacterDefaultArgs> = $Result.GetResult<Prisma.$CharacterPayload, S>

  type CharacterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CharacterFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CharacterCountAggregateInputType | true
    }

  export interface CharacterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Character'], meta: { name: 'Character' } }
    /**
     * Find zero or one Character that matches the filter.
     * @param {CharacterFindUniqueArgs} args - Arguments to find a Character
     * @example
     * // Get one Character
     * const character = await prisma.character.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CharacterFindUniqueArgs>(args: SelectSubset<T, CharacterFindUniqueArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Character that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CharacterFindUniqueOrThrowArgs} args - Arguments to find a Character
     * @example
     * // Get one Character
     * const character = await prisma.character.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CharacterFindUniqueOrThrowArgs>(args: SelectSubset<T, CharacterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Character that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterFindFirstArgs} args - Arguments to find a Character
     * @example
     * // Get one Character
     * const character = await prisma.character.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CharacterFindFirstArgs>(args?: SelectSubset<T, CharacterFindFirstArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Character that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterFindFirstOrThrowArgs} args - Arguments to find a Character
     * @example
     * // Get one Character
     * const character = await prisma.character.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CharacterFindFirstOrThrowArgs>(args?: SelectSubset<T, CharacterFindFirstOrThrowArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Characters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Characters
     * const characters = await prisma.character.findMany()
     * 
     * // Get first 10 Characters
     * const characters = await prisma.character.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const characterWithIdOnly = await prisma.character.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CharacterFindManyArgs>(args?: SelectSubset<T, CharacterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Character.
     * @param {CharacterCreateArgs} args - Arguments to create a Character.
     * @example
     * // Create one Character
     * const Character = await prisma.character.create({
     *   data: {
     *     // ... data to create a Character
     *   }
     * })
     * 
     */
    create<T extends CharacterCreateArgs>(args: SelectSubset<T, CharacterCreateArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Characters.
     * @param {CharacterCreateManyArgs} args - Arguments to create many Characters.
     * @example
     * // Create many Characters
     * const character = await prisma.character.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CharacterCreateManyArgs>(args?: SelectSubset<T, CharacterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Characters and returns the data saved in the database.
     * @param {CharacterCreateManyAndReturnArgs} args - Arguments to create many Characters.
     * @example
     * // Create many Characters
     * const character = await prisma.character.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Characters and only return the `id`
     * const characterWithIdOnly = await prisma.character.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CharacterCreateManyAndReturnArgs>(args?: SelectSubset<T, CharacterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Character.
     * @param {CharacterDeleteArgs} args - Arguments to delete one Character.
     * @example
     * // Delete one Character
     * const Character = await prisma.character.delete({
     *   where: {
     *     // ... filter to delete one Character
     *   }
     * })
     * 
     */
    delete<T extends CharacterDeleteArgs>(args: SelectSubset<T, CharacterDeleteArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Character.
     * @param {CharacterUpdateArgs} args - Arguments to update one Character.
     * @example
     * // Update one Character
     * const character = await prisma.character.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CharacterUpdateArgs>(args: SelectSubset<T, CharacterUpdateArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Characters.
     * @param {CharacterDeleteManyArgs} args - Arguments to filter Characters to delete.
     * @example
     * // Delete a few Characters
     * const { count } = await prisma.character.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CharacterDeleteManyArgs>(args?: SelectSubset<T, CharacterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Characters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Characters
     * const character = await prisma.character.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CharacterUpdateManyArgs>(args: SelectSubset<T, CharacterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Character.
     * @param {CharacterUpsertArgs} args - Arguments to update or create a Character.
     * @example
     * // Update or create a Character
     * const character = await prisma.character.upsert({
     *   create: {
     *     // ... data to create a Character
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Character we want to update
     *   }
     * })
     */
    upsert<T extends CharacterUpsertArgs>(args: SelectSubset<T, CharacterUpsertArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Characters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterCountArgs} args - Arguments to filter Characters to count.
     * @example
     * // Count the number of Characters
     * const count = await prisma.character.count({
     *   where: {
     *     // ... the filter for the Characters we want to count
     *   }
     * })
    **/
    count<T extends CharacterCountArgs>(
      args?: Subset<T, CharacterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CharacterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Character.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CharacterAggregateArgs>(args: Subset<T, CharacterAggregateArgs>): Prisma.PrismaPromise<GetCharacterAggregateType<T>>

    /**
     * Group by Character.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterGroupByArgs} args - Group by arguments.
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
      T extends CharacterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CharacterGroupByArgs['orderBy'] }
        : { orderBy?: CharacterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CharacterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCharacterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Character model
   */
  readonly fields: CharacterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Character.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CharacterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    universe<T extends UniverseMapDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMapDefaultArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    locations<T extends Character$locationsArgs<ExtArgs> = {}>(args?: Subset<T, Character$locationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findMany"> | Null>
    relationshipsFrom<T extends Character$relationshipsFromArgs<ExtArgs> = {}>(args?: Subset<T, Character$relationshipsFromArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findMany"> | Null>
    relationshipsTo<T extends Character$relationshipsToArgs<ExtArgs> = {}>(args?: Subset<T, Character$relationshipsToArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findMany"> | Null>
    timeline<T extends Character$timelineArgs<ExtArgs> = {}>(args?: Subset<T, Character$timelineArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Character model
   */ 
  interface CharacterFieldRefs {
    readonly id: FieldRef<"Character", 'String'>
    readonly name: FieldRef<"Character", 'String'>
    readonly slug: FieldRef<"Character", 'String'>
    readonly description: FieldRef<"Character", 'String'>
    readonly avatarUrl: FieldRef<"Character", 'String'>
    readonly role: FieldRef<"Character", 'String'>
    readonly status: FieldRef<"Character", 'String'>
    readonly universeId: FieldRef<"Character", 'String'>
    readonly birthDate: FieldRef<"Character", 'DateTime'>
    readonly data: FieldRef<"Character", 'Json'>
    readonly createdAt: FieldRef<"Character", 'DateTime'>
    readonly updatedAt: FieldRef<"Character", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Character findUnique
   */
  export type CharacterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter, which Character to fetch.
     */
    where: CharacterWhereUniqueInput
  }

  /**
   * Character findUniqueOrThrow
   */
  export type CharacterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter, which Character to fetch.
     */
    where: CharacterWhereUniqueInput
  }

  /**
   * Character findFirst
   */
  export type CharacterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter, which Character to fetch.
     */
    where?: CharacterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Characters to fetch.
     */
    orderBy?: CharacterOrderByWithRelationInput | CharacterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Characters.
     */
    cursor?: CharacterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Characters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Characters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Characters.
     */
    distinct?: CharacterScalarFieldEnum | CharacterScalarFieldEnum[]
  }

  /**
   * Character findFirstOrThrow
   */
  export type CharacterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter, which Character to fetch.
     */
    where?: CharacterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Characters to fetch.
     */
    orderBy?: CharacterOrderByWithRelationInput | CharacterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Characters.
     */
    cursor?: CharacterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Characters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Characters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Characters.
     */
    distinct?: CharacterScalarFieldEnum | CharacterScalarFieldEnum[]
  }

  /**
   * Character findMany
   */
  export type CharacterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter, which Characters to fetch.
     */
    where?: CharacterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Characters to fetch.
     */
    orderBy?: CharacterOrderByWithRelationInput | CharacterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Characters.
     */
    cursor?: CharacterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Characters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Characters.
     */
    skip?: number
    distinct?: CharacterScalarFieldEnum | CharacterScalarFieldEnum[]
  }

  /**
   * Character create
   */
  export type CharacterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * The data needed to create a Character.
     */
    data: XOR<CharacterCreateInput, CharacterUncheckedCreateInput>
  }

  /**
   * Character createMany
   */
  export type CharacterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Characters.
     */
    data: CharacterCreateManyInput | CharacterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Character createManyAndReturn
   */
  export type CharacterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Characters.
     */
    data: CharacterCreateManyInput | CharacterCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Character update
   */
  export type CharacterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * The data needed to update a Character.
     */
    data: XOR<CharacterUpdateInput, CharacterUncheckedUpdateInput>
    /**
     * Choose, which Character to update.
     */
    where: CharacterWhereUniqueInput
  }

  /**
   * Character updateMany
   */
  export type CharacterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Characters.
     */
    data: XOR<CharacterUpdateManyMutationInput, CharacterUncheckedUpdateManyInput>
    /**
     * Filter which Characters to update
     */
    where?: CharacterWhereInput
  }

  /**
   * Character upsert
   */
  export type CharacterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * The filter to search for the Character to update in case it exists.
     */
    where: CharacterWhereUniqueInput
    /**
     * In case the Character found by the `where` argument doesn't exist, create a new Character with this data.
     */
    create: XOR<CharacterCreateInput, CharacterUncheckedCreateInput>
    /**
     * In case the Character was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CharacterUpdateInput, CharacterUncheckedUpdateInput>
  }

  /**
   * Character delete
   */
  export type CharacterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    /**
     * Filter which Character to delete.
     */
    where: CharacterWhereUniqueInput
  }

  /**
   * Character deleteMany
   */
  export type CharacterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Characters to delete
     */
    where?: CharacterWhereInput
  }

  /**
   * Character.locations
   */
  export type Character$locationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    where?: CharacterLocationWhereInput
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    cursor?: CharacterLocationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CharacterLocationScalarFieldEnum | CharacterLocationScalarFieldEnum[]
  }

  /**
   * Character.relationshipsFrom
   */
  export type Character$relationshipsFromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    where?: CharacterRelationshipWhereInput
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    cursor?: CharacterRelationshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CharacterRelationshipScalarFieldEnum | CharacterRelationshipScalarFieldEnum[]
  }

  /**
   * Character.relationshipsTo
   */
  export type Character$relationshipsToArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    where?: CharacterRelationshipWhereInput
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    cursor?: CharacterRelationshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CharacterRelationshipScalarFieldEnum | CharacterRelationshipScalarFieldEnum[]
  }

  /**
   * Character.timeline
   */
  export type Character$timelineArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    where?: TimelineEventWhereInput
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    cursor?: TimelineEventWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * Character without action
   */
  export type CharacterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
  }


  /**
   * Model CharacterLocation
   */

  export type AggregateCharacterLocation = {
    _count: CharacterLocationCountAggregateOutputType | null
    _min: CharacterLocationMinAggregateOutputType | null
    _max: CharacterLocationMaxAggregateOutputType | null
  }

  export type CharacterLocationMinAggregateOutputType = {
    id: string | null
    characterId: string | null
    locationId: string | null
    role: string | null
    description: string | null
    firstSeenAt: Date | null
    lastSeenAt: Date | null
    createdAt: Date | null
  }

  export type CharacterLocationMaxAggregateOutputType = {
    id: string | null
    characterId: string | null
    locationId: string | null
    role: string | null
    description: string | null
    firstSeenAt: Date | null
    lastSeenAt: Date | null
    createdAt: Date | null
  }

  export type CharacterLocationCountAggregateOutputType = {
    id: number
    characterId: number
    locationId: number
    role: number
    description: number
    firstSeenAt: number
    lastSeenAt: number
    createdAt: number
    _all: number
  }


  export type CharacterLocationMinAggregateInputType = {
    id?: true
    characterId?: true
    locationId?: true
    role?: true
    description?: true
    firstSeenAt?: true
    lastSeenAt?: true
    createdAt?: true
  }

  export type CharacterLocationMaxAggregateInputType = {
    id?: true
    characterId?: true
    locationId?: true
    role?: true
    description?: true
    firstSeenAt?: true
    lastSeenAt?: true
    createdAt?: true
  }

  export type CharacterLocationCountAggregateInputType = {
    id?: true
    characterId?: true
    locationId?: true
    role?: true
    description?: true
    firstSeenAt?: true
    lastSeenAt?: true
    createdAt?: true
    _all?: true
  }

  export type CharacterLocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CharacterLocation to aggregate.
     */
    where?: CharacterLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterLocations to fetch.
     */
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CharacterLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CharacterLocations
    **/
    _count?: true | CharacterLocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CharacterLocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CharacterLocationMaxAggregateInputType
  }

  export type GetCharacterLocationAggregateType<T extends CharacterLocationAggregateArgs> = {
        [P in keyof T & keyof AggregateCharacterLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCharacterLocation[P]>
      : GetScalarType<T[P], AggregateCharacterLocation[P]>
  }




  export type CharacterLocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterLocationWhereInput
    orderBy?: CharacterLocationOrderByWithAggregationInput | CharacterLocationOrderByWithAggregationInput[]
    by: CharacterLocationScalarFieldEnum[] | CharacterLocationScalarFieldEnum
    having?: CharacterLocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CharacterLocationCountAggregateInputType | true
    _min?: CharacterLocationMinAggregateInputType
    _max?: CharacterLocationMaxAggregateInputType
  }

  export type CharacterLocationGroupByOutputType = {
    id: string
    characterId: string
    locationId: string
    role: string | null
    description: string | null
    firstSeenAt: Date | null
    lastSeenAt: Date | null
    createdAt: Date
    _count: CharacterLocationCountAggregateOutputType | null
    _min: CharacterLocationMinAggregateOutputType | null
    _max: CharacterLocationMaxAggregateOutputType | null
  }

  type GetCharacterLocationGroupByPayload<T extends CharacterLocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CharacterLocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CharacterLocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CharacterLocationGroupByOutputType[P]>
            : GetScalarType<T[P], CharacterLocationGroupByOutputType[P]>
        }
      >
    >


  export type CharacterLocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    characterId?: boolean
    locationId?: boolean
    role?: boolean
    description?: boolean
    firstSeenAt?: boolean
    lastSeenAt?: boolean
    createdAt?: boolean
    character?: boolean | CharacterDefaultArgs<ExtArgs>
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["characterLocation"]>

  export type CharacterLocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    characterId?: boolean
    locationId?: boolean
    role?: boolean
    description?: boolean
    firstSeenAt?: boolean
    lastSeenAt?: boolean
    createdAt?: boolean
    character?: boolean | CharacterDefaultArgs<ExtArgs>
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["characterLocation"]>

  export type CharacterLocationSelectScalar = {
    id?: boolean
    characterId?: boolean
    locationId?: boolean
    role?: boolean
    description?: boolean
    firstSeenAt?: boolean
    lastSeenAt?: boolean
    createdAt?: boolean
  }

  export type CharacterLocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    character?: boolean | CharacterDefaultArgs<ExtArgs>
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }
  export type CharacterLocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    character?: boolean | CharacterDefaultArgs<ExtArgs>
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }

  export type $CharacterLocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CharacterLocation"
    objects: {
      character: Prisma.$CharacterPayload<ExtArgs>
      location: Prisma.$LocationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      characterId: string
      locationId: string
      role: string | null
      description: string | null
      firstSeenAt: Date | null
      lastSeenAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["characterLocation"]>
    composites: {}
  }

  type CharacterLocationGetPayload<S extends boolean | null | undefined | CharacterLocationDefaultArgs> = $Result.GetResult<Prisma.$CharacterLocationPayload, S>

  type CharacterLocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CharacterLocationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CharacterLocationCountAggregateInputType | true
    }

  export interface CharacterLocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CharacterLocation'], meta: { name: 'CharacterLocation' } }
    /**
     * Find zero or one CharacterLocation that matches the filter.
     * @param {CharacterLocationFindUniqueArgs} args - Arguments to find a CharacterLocation
     * @example
     * // Get one CharacterLocation
     * const characterLocation = await prisma.characterLocation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CharacterLocationFindUniqueArgs>(args: SelectSubset<T, CharacterLocationFindUniqueArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CharacterLocation that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CharacterLocationFindUniqueOrThrowArgs} args - Arguments to find a CharacterLocation
     * @example
     * // Get one CharacterLocation
     * const characterLocation = await prisma.characterLocation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CharacterLocationFindUniqueOrThrowArgs>(args: SelectSubset<T, CharacterLocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CharacterLocation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationFindFirstArgs} args - Arguments to find a CharacterLocation
     * @example
     * // Get one CharacterLocation
     * const characterLocation = await prisma.characterLocation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CharacterLocationFindFirstArgs>(args?: SelectSubset<T, CharacterLocationFindFirstArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CharacterLocation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationFindFirstOrThrowArgs} args - Arguments to find a CharacterLocation
     * @example
     * // Get one CharacterLocation
     * const characterLocation = await prisma.characterLocation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CharacterLocationFindFirstOrThrowArgs>(args?: SelectSubset<T, CharacterLocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CharacterLocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CharacterLocations
     * const characterLocations = await prisma.characterLocation.findMany()
     * 
     * // Get first 10 CharacterLocations
     * const characterLocations = await prisma.characterLocation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const characterLocationWithIdOnly = await prisma.characterLocation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CharacterLocationFindManyArgs>(args?: SelectSubset<T, CharacterLocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CharacterLocation.
     * @param {CharacterLocationCreateArgs} args - Arguments to create a CharacterLocation.
     * @example
     * // Create one CharacterLocation
     * const CharacterLocation = await prisma.characterLocation.create({
     *   data: {
     *     // ... data to create a CharacterLocation
     *   }
     * })
     * 
     */
    create<T extends CharacterLocationCreateArgs>(args: SelectSubset<T, CharacterLocationCreateArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CharacterLocations.
     * @param {CharacterLocationCreateManyArgs} args - Arguments to create many CharacterLocations.
     * @example
     * // Create many CharacterLocations
     * const characterLocation = await prisma.characterLocation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CharacterLocationCreateManyArgs>(args?: SelectSubset<T, CharacterLocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CharacterLocations and returns the data saved in the database.
     * @param {CharacterLocationCreateManyAndReturnArgs} args - Arguments to create many CharacterLocations.
     * @example
     * // Create many CharacterLocations
     * const characterLocation = await prisma.characterLocation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CharacterLocations and only return the `id`
     * const characterLocationWithIdOnly = await prisma.characterLocation.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CharacterLocationCreateManyAndReturnArgs>(args?: SelectSubset<T, CharacterLocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CharacterLocation.
     * @param {CharacterLocationDeleteArgs} args - Arguments to delete one CharacterLocation.
     * @example
     * // Delete one CharacterLocation
     * const CharacterLocation = await prisma.characterLocation.delete({
     *   where: {
     *     // ... filter to delete one CharacterLocation
     *   }
     * })
     * 
     */
    delete<T extends CharacterLocationDeleteArgs>(args: SelectSubset<T, CharacterLocationDeleteArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CharacterLocation.
     * @param {CharacterLocationUpdateArgs} args - Arguments to update one CharacterLocation.
     * @example
     * // Update one CharacterLocation
     * const characterLocation = await prisma.characterLocation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CharacterLocationUpdateArgs>(args: SelectSubset<T, CharacterLocationUpdateArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CharacterLocations.
     * @param {CharacterLocationDeleteManyArgs} args - Arguments to filter CharacterLocations to delete.
     * @example
     * // Delete a few CharacterLocations
     * const { count } = await prisma.characterLocation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CharacterLocationDeleteManyArgs>(args?: SelectSubset<T, CharacterLocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CharacterLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CharacterLocations
     * const characterLocation = await prisma.characterLocation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CharacterLocationUpdateManyArgs>(args: SelectSubset<T, CharacterLocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CharacterLocation.
     * @param {CharacterLocationUpsertArgs} args - Arguments to update or create a CharacterLocation.
     * @example
     * // Update or create a CharacterLocation
     * const characterLocation = await prisma.characterLocation.upsert({
     *   create: {
     *     // ... data to create a CharacterLocation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CharacterLocation we want to update
     *   }
     * })
     */
    upsert<T extends CharacterLocationUpsertArgs>(args: SelectSubset<T, CharacterLocationUpsertArgs<ExtArgs>>): Prisma__CharacterLocationClient<$Result.GetResult<Prisma.$CharacterLocationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CharacterLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationCountArgs} args - Arguments to filter CharacterLocations to count.
     * @example
     * // Count the number of CharacterLocations
     * const count = await prisma.characterLocation.count({
     *   where: {
     *     // ... the filter for the CharacterLocations we want to count
     *   }
     * })
    **/
    count<T extends CharacterLocationCountArgs>(
      args?: Subset<T, CharacterLocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CharacterLocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CharacterLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CharacterLocationAggregateArgs>(args: Subset<T, CharacterLocationAggregateArgs>): Prisma.PrismaPromise<GetCharacterLocationAggregateType<T>>

    /**
     * Group by CharacterLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterLocationGroupByArgs} args - Group by arguments.
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
      T extends CharacterLocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CharacterLocationGroupByArgs['orderBy'] }
        : { orderBy?: CharacterLocationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CharacterLocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCharacterLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CharacterLocation model
   */
  readonly fields: CharacterLocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CharacterLocation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CharacterLocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    character<T extends CharacterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CharacterDefaultArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    location<T extends LocationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LocationDefaultArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the CharacterLocation model
   */ 
  interface CharacterLocationFieldRefs {
    readonly id: FieldRef<"CharacterLocation", 'String'>
    readonly characterId: FieldRef<"CharacterLocation", 'String'>
    readonly locationId: FieldRef<"CharacterLocation", 'String'>
    readonly role: FieldRef<"CharacterLocation", 'String'>
    readonly description: FieldRef<"CharacterLocation", 'String'>
    readonly firstSeenAt: FieldRef<"CharacterLocation", 'DateTime'>
    readonly lastSeenAt: FieldRef<"CharacterLocation", 'DateTime'>
    readonly createdAt: FieldRef<"CharacterLocation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CharacterLocation findUnique
   */
  export type CharacterLocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter, which CharacterLocation to fetch.
     */
    where: CharacterLocationWhereUniqueInput
  }

  /**
   * CharacterLocation findUniqueOrThrow
   */
  export type CharacterLocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter, which CharacterLocation to fetch.
     */
    where: CharacterLocationWhereUniqueInput
  }

  /**
   * CharacterLocation findFirst
   */
  export type CharacterLocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter, which CharacterLocation to fetch.
     */
    where?: CharacterLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterLocations to fetch.
     */
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CharacterLocations.
     */
    cursor?: CharacterLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CharacterLocations.
     */
    distinct?: CharacterLocationScalarFieldEnum | CharacterLocationScalarFieldEnum[]
  }

  /**
   * CharacterLocation findFirstOrThrow
   */
  export type CharacterLocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter, which CharacterLocation to fetch.
     */
    where?: CharacterLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterLocations to fetch.
     */
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CharacterLocations.
     */
    cursor?: CharacterLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterLocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CharacterLocations.
     */
    distinct?: CharacterLocationScalarFieldEnum | CharacterLocationScalarFieldEnum[]
  }

  /**
   * CharacterLocation findMany
   */
  export type CharacterLocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter, which CharacterLocations to fetch.
     */
    where?: CharacterLocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterLocations to fetch.
     */
    orderBy?: CharacterLocationOrderByWithRelationInput | CharacterLocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CharacterLocations.
     */
    cursor?: CharacterLocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterLocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterLocations.
     */
    skip?: number
    distinct?: CharacterLocationScalarFieldEnum | CharacterLocationScalarFieldEnum[]
  }

  /**
   * CharacterLocation create
   */
  export type CharacterLocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * The data needed to create a CharacterLocation.
     */
    data: XOR<CharacterLocationCreateInput, CharacterLocationUncheckedCreateInput>
  }

  /**
   * CharacterLocation createMany
   */
  export type CharacterLocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CharacterLocations.
     */
    data: CharacterLocationCreateManyInput | CharacterLocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CharacterLocation createManyAndReturn
   */
  export type CharacterLocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CharacterLocations.
     */
    data: CharacterLocationCreateManyInput | CharacterLocationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CharacterLocation update
   */
  export type CharacterLocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * The data needed to update a CharacterLocation.
     */
    data: XOR<CharacterLocationUpdateInput, CharacterLocationUncheckedUpdateInput>
    /**
     * Choose, which CharacterLocation to update.
     */
    where: CharacterLocationWhereUniqueInput
  }

  /**
   * CharacterLocation updateMany
   */
  export type CharacterLocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CharacterLocations.
     */
    data: XOR<CharacterLocationUpdateManyMutationInput, CharacterLocationUncheckedUpdateManyInput>
    /**
     * Filter which CharacterLocations to update
     */
    where?: CharacterLocationWhereInput
  }

  /**
   * CharacterLocation upsert
   */
  export type CharacterLocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * The filter to search for the CharacterLocation to update in case it exists.
     */
    where: CharacterLocationWhereUniqueInput
    /**
     * In case the CharacterLocation found by the `where` argument doesn't exist, create a new CharacterLocation with this data.
     */
    create: XOR<CharacterLocationCreateInput, CharacterLocationUncheckedCreateInput>
    /**
     * In case the CharacterLocation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CharacterLocationUpdateInput, CharacterLocationUncheckedUpdateInput>
  }

  /**
   * CharacterLocation delete
   */
  export type CharacterLocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
    /**
     * Filter which CharacterLocation to delete.
     */
    where: CharacterLocationWhereUniqueInput
  }

  /**
   * CharacterLocation deleteMany
   */
  export type CharacterLocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CharacterLocations to delete
     */
    where?: CharacterLocationWhereInput
  }

  /**
   * CharacterLocation without action
   */
  export type CharacterLocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterLocation
     */
    select?: CharacterLocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterLocationInclude<ExtArgs> | null
  }


  /**
   * Model CharacterRelationship
   */

  export type AggregateCharacterRelationship = {
    _count: CharacterRelationshipCountAggregateOutputType | null
    _min: CharacterRelationshipMinAggregateOutputType | null
    _max: CharacterRelationshipMaxAggregateOutputType | null
  }

  export type CharacterRelationshipMinAggregateOutputType = {
    id: string | null
    fromId: string | null
    toId: string | null
    type: string | null
    description: string | null
    startDate: Date | null
    endDate: Date | null
    isOfficial: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CharacterRelationshipMaxAggregateOutputType = {
    id: string | null
    fromId: string | null
    toId: string | null
    type: string | null
    description: string | null
    startDate: Date | null
    endDate: Date | null
    isOfficial: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CharacterRelationshipCountAggregateOutputType = {
    id: number
    fromId: number
    toId: number
    type: number
    description: number
    startDate: number
    endDate: number
    isOfficial: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CharacterRelationshipMinAggregateInputType = {
    id?: true
    fromId?: true
    toId?: true
    type?: true
    description?: true
    startDate?: true
    endDate?: true
    isOfficial?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CharacterRelationshipMaxAggregateInputType = {
    id?: true
    fromId?: true
    toId?: true
    type?: true
    description?: true
    startDate?: true
    endDate?: true
    isOfficial?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CharacterRelationshipCountAggregateInputType = {
    id?: true
    fromId?: true
    toId?: true
    type?: true
    description?: true
    startDate?: true
    endDate?: true
    isOfficial?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CharacterRelationshipAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CharacterRelationship to aggregate.
     */
    where?: CharacterRelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterRelationships to fetch.
     */
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CharacterRelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterRelationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterRelationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CharacterRelationships
    **/
    _count?: true | CharacterRelationshipCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CharacterRelationshipMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CharacterRelationshipMaxAggregateInputType
  }

  export type GetCharacterRelationshipAggregateType<T extends CharacterRelationshipAggregateArgs> = {
        [P in keyof T & keyof AggregateCharacterRelationship]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCharacterRelationship[P]>
      : GetScalarType<T[P], AggregateCharacterRelationship[P]>
  }




  export type CharacterRelationshipGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CharacterRelationshipWhereInput
    orderBy?: CharacterRelationshipOrderByWithAggregationInput | CharacterRelationshipOrderByWithAggregationInput[]
    by: CharacterRelationshipScalarFieldEnum[] | CharacterRelationshipScalarFieldEnum
    having?: CharacterRelationshipScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CharacterRelationshipCountAggregateInputType | true
    _min?: CharacterRelationshipMinAggregateInputType
    _max?: CharacterRelationshipMaxAggregateInputType
  }

  export type CharacterRelationshipGroupByOutputType = {
    id: string
    fromId: string
    toId: string
    type: string
    description: string | null
    startDate: Date | null
    endDate: Date | null
    isOfficial: boolean
    createdAt: Date
    updatedAt: Date
    _count: CharacterRelationshipCountAggregateOutputType | null
    _min: CharacterRelationshipMinAggregateOutputType | null
    _max: CharacterRelationshipMaxAggregateOutputType | null
  }

  type GetCharacterRelationshipGroupByPayload<T extends CharacterRelationshipGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CharacterRelationshipGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CharacterRelationshipGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CharacterRelationshipGroupByOutputType[P]>
            : GetScalarType<T[P], CharacterRelationshipGroupByOutputType[P]>
        }
      >
    >


  export type CharacterRelationshipSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromId?: boolean
    toId?: boolean
    type?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    isOfficial?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    from?: boolean | CharacterDefaultArgs<ExtArgs>
    to?: boolean | CharacterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["characterRelationship"]>

  export type CharacterRelationshipSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    fromId?: boolean
    toId?: boolean
    type?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    isOfficial?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    from?: boolean | CharacterDefaultArgs<ExtArgs>
    to?: boolean | CharacterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["characterRelationship"]>

  export type CharacterRelationshipSelectScalar = {
    id?: boolean
    fromId?: boolean
    toId?: boolean
    type?: boolean
    description?: boolean
    startDate?: boolean
    endDate?: boolean
    isOfficial?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CharacterRelationshipInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    from?: boolean | CharacterDefaultArgs<ExtArgs>
    to?: boolean | CharacterDefaultArgs<ExtArgs>
  }
  export type CharacterRelationshipIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    from?: boolean | CharacterDefaultArgs<ExtArgs>
    to?: boolean | CharacterDefaultArgs<ExtArgs>
  }

  export type $CharacterRelationshipPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CharacterRelationship"
    objects: {
      from: Prisma.$CharacterPayload<ExtArgs>
      to: Prisma.$CharacterPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      fromId: string
      toId: string
      type: string
      description: string | null
      startDate: Date | null
      endDate: Date | null
      isOfficial: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["characterRelationship"]>
    composites: {}
  }

  type CharacterRelationshipGetPayload<S extends boolean | null | undefined | CharacterRelationshipDefaultArgs> = $Result.GetResult<Prisma.$CharacterRelationshipPayload, S>

  type CharacterRelationshipCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CharacterRelationshipFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CharacterRelationshipCountAggregateInputType | true
    }

  export interface CharacterRelationshipDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CharacterRelationship'], meta: { name: 'CharacterRelationship' } }
    /**
     * Find zero or one CharacterRelationship that matches the filter.
     * @param {CharacterRelationshipFindUniqueArgs} args - Arguments to find a CharacterRelationship
     * @example
     * // Get one CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CharacterRelationshipFindUniqueArgs>(args: SelectSubset<T, CharacterRelationshipFindUniqueArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CharacterRelationship that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CharacterRelationshipFindUniqueOrThrowArgs} args - Arguments to find a CharacterRelationship
     * @example
     * // Get one CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CharacterRelationshipFindUniqueOrThrowArgs>(args: SelectSubset<T, CharacterRelationshipFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CharacterRelationship that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipFindFirstArgs} args - Arguments to find a CharacterRelationship
     * @example
     * // Get one CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CharacterRelationshipFindFirstArgs>(args?: SelectSubset<T, CharacterRelationshipFindFirstArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CharacterRelationship that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipFindFirstOrThrowArgs} args - Arguments to find a CharacterRelationship
     * @example
     * // Get one CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CharacterRelationshipFindFirstOrThrowArgs>(args?: SelectSubset<T, CharacterRelationshipFindFirstOrThrowArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CharacterRelationships that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CharacterRelationships
     * const characterRelationships = await prisma.characterRelationship.findMany()
     * 
     * // Get first 10 CharacterRelationships
     * const characterRelationships = await prisma.characterRelationship.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const characterRelationshipWithIdOnly = await prisma.characterRelationship.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CharacterRelationshipFindManyArgs>(args?: SelectSubset<T, CharacterRelationshipFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CharacterRelationship.
     * @param {CharacterRelationshipCreateArgs} args - Arguments to create a CharacterRelationship.
     * @example
     * // Create one CharacterRelationship
     * const CharacterRelationship = await prisma.characterRelationship.create({
     *   data: {
     *     // ... data to create a CharacterRelationship
     *   }
     * })
     * 
     */
    create<T extends CharacterRelationshipCreateArgs>(args: SelectSubset<T, CharacterRelationshipCreateArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CharacterRelationships.
     * @param {CharacterRelationshipCreateManyArgs} args - Arguments to create many CharacterRelationships.
     * @example
     * // Create many CharacterRelationships
     * const characterRelationship = await prisma.characterRelationship.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CharacterRelationshipCreateManyArgs>(args?: SelectSubset<T, CharacterRelationshipCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CharacterRelationships and returns the data saved in the database.
     * @param {CharacterRelationshipCreateManyAndReturnArgs} args - Arguments to create many CharacterRelationships.
     * @example
     * // Create many CharacterRelationships
     * const characterRelationship = await prisma.characterRelationship.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CharacterRelationships and only return the `id`
     * const characterRelationshipWithIdOnly = await prisma.characterRelationship.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CharacterRelationshipCreateManyAndReturnArgs>(args?: SelectSubset<T, CharacterRelationshipCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CharacterRelationship.
     * @param {CharacterRelationshipDeleteArgs} args - Arguments to delete one CharacterRelationship.
     * @example
     * // Delete one CharacterRelationship
     * const CharacterRelationship = await prisma.characterRelationship.delete({
     *   where: {
     *     // ... filter to delete one CharacterRelationship
     *   }
     * })
     * 
     */
    delete<T extends CharacterRelationshipDeleteArgs>(args: SelectSubset<T, CharacterRelationshipDeleteArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CharacterRelationship.
     * @param {CharacterRelationshipUpdateArgs} args - Arguments to update one CharacterRelationship.
     * @example
     * // Update one CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CharacterRelationshipUpdateArgs>(args: SelectSubset<T, CharacterRelationshipUpdateArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CharacterRelationships.
     * @param {CharacterRelationshipDeleteManyArgs} args - Arguments to filter CharacterRelationships to delete.
     * @example
     * // Delete a few CharacterRelationships
     * const { count } = await prisma.characterRelationship.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CharacterRelationshipDeleteManyArgs>(args?: SelectSubset<T, CharacterRelationshipDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CharacterRelationships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CharacterRelationships
     * const characterRelationship = await prisma.characterRelationship.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CharacterRelationshipUpdateManyArgs>(args: SelectSubset<T, CharacterRelationshipUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CharacterRelationship.
     * @param {CharacterRelationshipUpsertArgs} args - Arguments to update or create a CharacterRelationship.
     * @example
     * // Update or create a CharacterRelationship
     * const characterRelationship = await prisma.characterRelationship.upsert({
     *   create: {
     *     // ... data to create a CharacterRelationship
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CharacterRelationship we want to update
     *   }
     * })
     */
    upsert<T extends CharacterRelationshipUpsertArgs>(args: SelectSubset<T, CharacterRelationshipUpsertArgs<ExtArgs>>): Prisma__CharacterRelationshipClient<$Result.GetResult<Prisma.$CharacterRelationshipPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CharacterRelationships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipCountArgs} args - Arguments to filter CharacterRelationships to count.
     * @example
     * // Count the number of CharacterRelationships
     * const count = await prisma.characterRelationship.count({
     *   where: {
     *     // ... the filter for the CharacterRelationships we want to count
     *   }
     * })
    **/
    count<T extends CharacterRelationshipCountArgs>(
      args?: Subset<T, CharacterRelationshipCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CharacterRelationshipCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CharacterRelationship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CharacterRelationshipAggregateArgs>(args: Subset<T, CharacterRelationshipAggregateArgs>): Prisma.PrismaPromise<GetCharacterRelationshipAggregateType<T>>

    /**
     * Group by CharacterRelationship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CharacterRelationshipGroupByArgs} args - Group by arguments.
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
      T extends CharacterRelationshipGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CharacterRelationshipGroupByArgs['orderBy'] }
        : { orderBy?: CharacterRelationshipGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CharacterRelationshipGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCharacterRelationshipGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CharacterRelationship model
   */
  readonly fields: CharacterRelationshipFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CharacterRelationship.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CharacterRelationshipClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    from<T extends CharacterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CharacterDefaultArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    to<T extends CharacterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CharacterDefaultArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the CharacterRelationship model
   */ 
  interface CharacterRelationshipFieldRefs {
    readonly id: FieldRef<"CharacterRelationship", 'String'>
    readonly fromId: FieldRef<"CharacterRelationship", 'String'>
    readonly toId: FieldRef<"CharacterRelationship", 'String'>
    readonly type: FieldRef<"CharacterRelationship", 'String'>
    readonly description: FieldRef<"CharacterRelationship", 'String'>
    readonly startDate: FieldRef<"CharacterRelationship", 'DateTime'>
    readonly endDate: FieldRef<"CharacterRelationship", 'DateTime'>
    readonly isOfficial: FieldRef<"CharacterRelationship", 'Boolean'>
    readonly createdAt: FieldRef<"CharacterRelationship", 'DateTime'>
    readonly updatedAt: FieldRef<"CharacterRelationship", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CharacterRelationship findUnique
   */
  export type CharacterRelationshipFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter, which CharacterRelationship to fetch.
     */
    where: CharacterRelationshipWhereUniqueInput
  }

  /**
   * CharacterRelationship findUniqueOrThrow
   */
  export type CharacterRelationshipFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter, which CharacterRelationship to fetch.
     */
    where: CharacterRelationshipWhereUniqueInput
  }

  /**
   * CharacterRelationship findFirst
   */
  export type CharacterRelationshipFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter, which CharacterRelationship to fetch.
     */
    where?: CharacterRelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterRelationships to fetch.
     */
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CharacterRelationships.
     */
    cursor?: CharacterRelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterRelationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterRelationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CharacterRelationships.
     */
    distinct?: CharacterRelationshipScalarFieldEnum | CharacterRelationshipScalarFieldEnum[]
  }

  /**
   * CharacterRelationship findFirstOrThrow
   */
  export type CharacterRelationshipFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter, which CharacterRelationship to fetch.
     */
    where?: CharacterRelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterRelationships to fetch.
     */
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CharacterRelationships.
     */
    cursor?: CharacterRelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterRelationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterRelationships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CharacterRelationships.
     */
    distinct?: CharacterRelationshipScalarFieldEnum | CharacterRelationshipScalarFieldEnum[]
  }

  /**
   * CharacterRelationship findMany
   */
  export type CharacterRelationshipFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter, which CharacterRelationships to fetch.
     */
    where?: CharacterRelationshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CharacterRelationships to fetch.
     */
    orderBy?: CharacterRelationshipOrderByWithRelationInput | CharacterRelationshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CharacterRelationships.
     */
    cursor?: CharacterRelationshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CharacterRelationships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CharacterRelationships.
     */
    skip?: number
    distinct?: CharacterRelationshipScalarFieldEnum | CharacterRelationshipScalarFieldEnum[]
  }

  /**
   * CharacterRelationship create
   */
  export type CharacterRelationshipCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * The data needed to create a CharacterRelationship.
     */
    data: XOR<CharacterRelationshipCreateInput, CharacterRelationshipUncheckedCreateInput>
  }

  /**
   * CharacterRelationship createMany
   */
  export type CharacterRelationshipCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CharacterRelationships.
     */
    data: CharacterRelationshipCreateManyInput | CharacterRelationshipCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CharacterRelationship createManyAndReturn
   */
  export type CharacterRelationshipCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CharacterRelationships.
     */
    data: CharacterRelationshipCreateManyInput | CharacterRelationshipCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CharacterRelationship update
   */
  export type CharacterRelationshipUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * The data needed to update a CharacterRelationship.
     */
    data: XOR<CharacterRelationshipUpdateInput, CharacterRelationshipUncheckedUpdateInput>
    /**
     * Choose, which CharacterRelationship to update.
     */
    where: CharacterRelationshipWhereUniqueInput
  }

  /**
   * CharacterRelationship updateMany
   */
  export type CharacterRelationshipUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CharacterRelationships.
     */
    data: XOR<CharacterRelationshipUpdateManyMutationInput, CharacterRelationshipUncheckedUpdateManyInput>
    /**
     * Filter which CharacterRelationships to update
     */
    where?: CharacterRelationshipWhereInput
  }

  /**
   * CharacterRelationship upsert
   */
  export type CharacterRelationshipUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * The filter to search for the CharacterRelationship to update in case it exists.
     */
    where: CharacterRelationshipWhereUniqueInput
    /**
     * In case the CharacterRelationship found by the `where` argument doesn't exist, create a new CharacterRelationship with this data.
     */
    create: XOR<CharacterRelationshipCreateInput, CharacterRelationshipUncheckedCreateInput>
    /**
     * In case the CharacterRelationship was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CharacterRelationshipUpdateInput, CharacterRelationshipUncheckedUpdateInput>
  }

  /**
   * CharacterRelationship delete
   */
  export type CharacterRelationshipDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
    /**
     * Filter which CharacterRelationship to delete.
     */
    where: CharacterRelationshipWhereUniqueInput
  }

  /**
   * CharacterRelationship deleteMany
   */
  export type CharacterRelationshipDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CharacterRelationships to delete
     */
    where?: CharacterRelationshipWhereInput
  }

  /**
   * CharacterRelationship without action
   */
  export type CharacterRelationshipDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CharacterRelationship
     */
    select?: CharacterRelationshipSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterRelationshipInclude<ExtArgs> | null
  }


  /**
   * Model TimelineEvent
   */

  export type AggregateTimelineEvent = {
    _count: TimelineEventCountAggregateOutputType | null
    _min: TimelineEventMinAggregateOutputType | null
    _max: TimelineEventMaxAggregateOutputType | null
  }

  export type TimelineEventMinAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    date: Date | null
    endDate: Date | null
    type: string | null
    importance: string | null
    universeId: string | null
    characterId: string | null
    locationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TimelineEventMaxAggregateOutputType = {
    id: string | null
    title: string | null
    description: string | null
    date: Date | null
    endDate: Date | null
    type: string | null
    importance: string | null
    universeId: string | null
    characterId: string | null
    locationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TimelineEventCountAggregateOutputType = {
    id: number
    title: number
    description: number
    date: number
    endDate: number
    type: number
    importance: number
    universeId: number
    characterId: number
    locationId: number
    data: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TimelineEventMinAggregateInputType = {
    id?: true
    title?: true
    description?: true
    date?: true
    endDate?: true
    type?: true
    importance?: true
    universeId?: true
    characterId?: true
    locationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TimelineEventMaxAggregateInputType = {
    id?: true
    title?: true
    description?: true
    date?: true
    endDate?: true
    type?: true
    importance?: true
    universeId?: true
    characterId?: true
    locationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TimelineEventCountAggregateInputType = {
    id?: true
    title?: true
    description?: true
    date?: true
    endDate?: true
    type?: true
    importance?: true
    universeId?: true
    characterId?: true
    locationId?: true
    data?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TimelineEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimelineEvent to aggregate.
     */
    where?: TimelineEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimelineEvents to fetch.
     */
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TimelineEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimelineEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimelineEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TimelineEvents
    **/
    _count?: true | TimelineEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TimelineEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TimelineEventMaxAggregateInputType
  }

  export type GetTimelineEventAggregateType<T extends TimelineEventAggregateArgs> = {
        [P in keyof T & keyof AggregateTimelineEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTimelineEvent[P]>
      : GetScalarType<T[P], AggregateTimelineEvent[P]>
  }




  export type TimelineEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TimelineEventWhereInput
    orderBy?: TimelineEventOrderByWithAggregationInput | TimelineEventOrderByWithAggregationInput[]
    by: TimelineEventScalarFieldEnum[] | TimelineEventScalarFieldEnum
    having?: TimelineEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TimelineEventCountAggregateInputType | true
    _min?: TimelineEventMinAggregateInputType
    _max?: TimelineEventMaxAggregateInputType
  }

  export type TimelineEventGroupByOutputType = {
    id: string
    title: string
    description: string | null
    date: Date
    endDate: Date | null
    type: string
    importance: string
    universeId: string
    characterId: string | null
    locationId: string | null
    data: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: TimelineEventCountAggregateOutputType | null
    _min: TimelineEventMinAggregateOutputType | null
    _max: TimelineEventMaxAggregateOutputType | null
  }

  type GetTimelineEventGroupByPayload<T extends TimelineEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TimelineEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TimelineEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TimelineEventGroupByOutputType[P]>
            : GetScalarType<T[P], TimelineEventGroupByOutputType[P]>
        }
      >
    >


  export type TimelineEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    date?: boolean
    endDate?: boolean
    type?: boolean
    importance?: boolean
    universeId?: boolean
    characterId?: boolean
    locationId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    character?: boolean | TimelineEvent$characterArgs<ExtArgs>
    location?: boolean | TimelineEvent$locationArgs<ExtArgs>
  }, ExtArgs["result"]["timelineEvent"]>

  export type TimelineEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    description?: boolean
    date?: boolean
    endDate?: boolean
    type?: boolean
    importance?: boolean
    universeId?: boolean
    characterId?: boolean
    locationId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    character?: boolean | TimelineEvent$characterArgs<ExtArgs>
    location?: boolean | TimelineEvent$locationArgs<ExtArgs>
  }, ExtArgs["result"]["timelineEvent"]>

  export type TimelineEventSelectScalar = {
    id?: boolean
    title?: boolean
    description?: boolean
    date?: boolean
    endDate?: boolean
    type?: boolean
    importance?: boolean
    universeId?: boolean
    characterId?: boolean
    locationId?: boolean
    data?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TimelineEventInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    character?: boolean | TimelineEvent$characterArgs<ExtArgs>
    location?: boolean | TimelineEvent$locationArgs<ExtArgs>
  }
  export type TimelineEventIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    character?: boolean | TimelineEvent$characterArgs<ExtArgs>
    location?: boolean | TimelineEvent$locationArgs<ExtArgs>
  }

  export type $TimelineEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TimelineEvent"
    objects: {
      universe: Prisma.$UniverseMapPayload<ExtArgs>
      character: Prisma.$CharacterPayload<ExtArgs> | null
      location: Prisma.$LocationPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      description: string | null
      date: Date
      endDate: Date | null
      type: string
      importance: string
      universeId: string
      characterId: string | null
      locationId: string | null
      data: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["timelineEvent"]>
    composites: {}
  }

  type TimelineEventGetPayload<S extends boolean | null | undefined | TimelineEventDefaultArgs> = $Result.GetResult<Prisma.$TimelineEventPayload, S>

  type TimelineEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TimelineEventFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TimelineEventCountAggregateInputType | true
    }

  export interface TimelineEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TimelineEvent'], meta: { name: 'TimelineEvent' } }
    /**
     * Find zero or one TimelineEvent that matches the filter.
     * @param {TimelineEventFindUniqueArgs} args - Arguments to find a TimelineEvent
     * @example
     * // Get one TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TimelineEventFindUniqueArgs>(args: SelectSubset<T, TimelineEventFindUniqueArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one TimelineEvent that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TimelineEventFindUniqueOrThrowArgs} args - Arguments to find a TimelineEvent
     * @example
     * // Get one TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TimelineEventFindUniqueOrThrowArgs>(args: SelectSubset<T, TimelineEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first TimelineEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventFindFirstArgs} args - Arguments to find a TimelineEvent
     * @example
     * // Get one TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TimelineEventFindFirstArgs>(args?: SelectSubset<T, TimelineEventFindFirstArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first TimelineEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventFindFirstOrThrowArgs} args - Arguments to find a TimelineEvent
     * @example
     * // Get one TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TimelineEventFindFirstOrThrowArgs>(args?: SelectSubset<T, TimelineEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more TimelineEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TimelineEvents
     * const timelineEvents = await prisma.timelineEvent.findMany()
     * 
     * // Get first 10 TimelineEvents
     * const timelineEvents = await prisma.timelineEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const timelineEventWithIdOnly = await prisma.timelineEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TimelineEventFindManyArgs>(args?: SelectSubset<T, TimelineEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a TimelineEvent.
     * @param {TimelineEventCreateArgs} args - Arguments to create a TimelineEvent.
     * @example
     * // Create one TimelineEvent
     * const TimelineEvent = await prisma.timelineEvent.create({
     *   data: {
     *     // ... data to create a TimelineEvent
     *   }
     * })
     * 
     */
    create<T extends TimelineEventCreateArgs>(args: SelectSubset<T, TimelineEventCreateArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many TimelineEvents.
     * @param {TimelineEventCreateManyArgs} args - Arguments to create many TimelineEvents.
     * @example
     * // Create many TimelineEvents
     * const timelineEvent = await prisma.timelineEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TimelineEventCreateManyArgs>(args?: SelectSubset<T, TimelineEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TimelineEvents and returns the data saved in the database.
     * @param {TimelineEventCreateManyAndReturnArgs} args - Arguments to create many TimelineEvents.
     * @example
     * // Create many TimelineEvents
     * const timelineEvent = await prisma.timelineEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TimelineEvents and only return the `id`
     * const timelineEventWithIdOnly = await prisma.timelineEvent.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TimelineEventCreateManyAndReturnArgs>(args?: SelectSubset<T, TimelineEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a TimelineEvent.
     * @param {TimelineEventDeleteArgs} args - Arguments to delete one TimelineEvent.
     * @example
     * // Delete one TimelineEvent
     * const TimelineEvent = await prisma.timelineEvent.delete({
     *   where: {
     *     // ... filter to delete one TimelineEvent
     *   }
     * })
     * 
     */
    delete<T extends TimelineEventDeleteArgs>(args: SelectSubset<T, TimelineEventDeleteArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one TimelineEvent.
     * @param {TimelineEventUpdateArgs} args - Arguments to update one TimelineEvent.
     * @example
     * // Update one TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TimelineEventUpdateArgs>(args: SelectSubset<T, TimelineEventUpdateArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more TimelineEvents.
     * @param {TimelineEventDeleteManyArgs} args - Arguments to filter TimelineEvents to delete.
     * @example
     * // Delete a few TimelineEvents
     * const { count } = await prisma.timelineEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TimelineEventDeleteManyArgs>(args?: SelectSubset<T, TimelineEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TimelineEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TimelineEvents
     * const timelineEvent = await prisma.timelineEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TimelineEventUpdateManyArgs>(args: SelectSubset<T, TimelineEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one TimelineEvent.
     * @param {TimelineEventUpsertArgs} args - Arguments to update or create a TimelineEvent.
     * @example
     * // Update or create a TimelineEvent
     * const timelineEvent = await prisma.timelineEvent.upsert({
     *   create: {
     *     // ... data to create a TimelineEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TimelineEvent we want to update
     *   }
     * })
     */
    upsert<T extends TimelineEventUpsertArgs>(args: SelectSubset<T, TimelineEventUpsertArgs<ExtArgs>>): Prisma__TimelineEventClient<$Result.GetResult<Prisma.$TimelineEventPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of TimelineEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventCountArgs} args - Arguments to filter TimelineEvents to count.
     * @example
     * // Count the number of TimelineEvents
     * const count = await prisma.timelineEvent.count({
     *   where: {
     *     // ... the filter for the TimelineEvents we want to count
     *   }
     * })
    **/
    count<T extends TimelineEventCountArgs>(
      args?: Subset<T, TimelineEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TimelineEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TimelineEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TimelineEventAggregateArgs>(args: Subset<T, TimelineEventAggregateArgs>): Prisma.PrismaPromise<GetTimelineEventAggregateType<T>>

    /**
     * Group by TimelineEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TimelineEventGroupByArgs} args - Group by arguments.
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
      T extends TimelineEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TimelineEventGroupByArgs['orderBy'] }
        : { orderBy?: TimelineEventGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TimelineEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTimelineEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TimelineEvent model
   */
  readonly fields: TimelineEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TimelineEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TimelineEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    universe<T extends UniverseMapDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMapDefaultArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    character<T extends TimelineEvent$characterArgs<ExtArgs> = {}>(args?: Subset<T, TimelineEvent$characterArgs<ExtArgs>>): Prisma__CharacterClient<$Result.GetResult<Prisma.$CharacterPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    location<T extends TimelineEvent$locationArgs<ExtArgs> = {}>(args?: Subset<T, TimelineEvent$locationArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
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
   * Fields of the TimelineEvent model
   */ 
  interface TimelineEventFieldRefs {
    readonly id: FieldRef<"TimelineEvent", 'String'>
    readonly title: FieldRef<"TimelineEvent", 'String'>
    readonly description: FieldRef<"TimelineEvent", 'String'>
    readonly date: FieldRef<"TimelineEvent", 'DateTime'>
    readonly endDate: FieldRef<"TimelineEvent", 'DateTime'>
    readonly type: FieldRef<"TimelineEvent", 'String'>
    readonly importance: FieldRef<"TimelineEvent", 'String'>
    readonly universeId: FieldRef<"TimelineEvent", 'String'>
    readonly characterId: FieldRef<"TimelineEvent", 'String'>
    readonly locationId: FieldRef<"TimelineEvent", 'String'>
    readonly data: FieldRef<"TimelineEvent", 'Json'>
    readonly createdAt: FieldRef<"TimelineEvent", 'DateTime'>
    readonly updatedAt: FieldRef<"TimelineEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TimelineEvent findUnique
   */
  export type TimelineEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter, which TimelineEvent to fetch.
     */
    where: TimelineEventWhereUniqueInput
  }

  /**
   * TimelineEvent findUniqueOrThrow
   */
  export type TimelineEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter, which TimelineEvent to fetch.
     */
    where: TimelineEventWhereUniqueInput
  }

  /**
   * TimelineEvent findFirst
   */
  export type TimelineEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter, which TimelineEvent to fetch.
     */
    where?: TimelineEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimelineEvents to fetch.
     */
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimelineEvents.
     */
    cursor?: TimelineEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimelineEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimelineEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimelineEvents.
     */
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * TimelineEvent findFirstOrThrow
   */
  export type TimelineEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter, which TimelineEvent to fetch.
     */
    where?: TimelineEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimelineEvents to fetch.
     */
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TimelineEvents.
     */
    cursor?: TimelineEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimelineEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimelineEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TimelineEvents.
     */
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * TimelineEvent findMany
   */
  export type TimelineEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter, which TimelineEvents to fetch.
     */
    where?: TimelineEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TimelineEvents to fetch.
     */
    orderBy?: TimelineEventOrderByWithRelationInput | TimelineEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TimelineEvents.
     */
    cursor?: TimelineEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TimelineEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TimelineEvents.
     */
    skip?: number
    distinct?: TimelineEventScalarFieldEnum | TimelineEventScalarFieldEnum[]
  }

  /**
   * TimelineEvent create
   */
  export type TimelineEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * The data needed to create a TimelineEvent.
     */
    data: XOR<TimelineEventCreateInput, TimelineEventUncheckedCreateInput>
  }

  /**
   * TimelineEvent createMany
   */
  export type TimelineEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TimelineEvents.
     */
    data: TimelineEventCreateManyInput | TimelineEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TimelineEvent createManyAndReturn
   */
  export type TimelineEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many TimelineEvents.
     */
    data: TimelineEventCreateManyInput | TimelineEventCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TimelineEvent update
   */
  export type TimelineEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * The data needed to update a TimelineEvent.
     */
    data: XOR<TimelineEventUpdateInput, TimelineEventUncheckedUpdateInput>
    /**
     * Choose, which TimelineEvent to update.
     */
    where: TimelineEventWhereUniqueInput
  }

  /**
   * TimelineEvent updateMany
   */
  export type TimelineEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TimelineEvents.
     */
    data: XOR<TimelineEventUpdateManyMutationInput, TimelineEventUncheckedUpdateManyInput>
    /**
     * Filter which TimelineEvents to update
     */
    where?: TimelineEventWhereInput
  }

  /**
   * TimelineEvent upsert
   */
  export type TimelineEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * The filter to search for the TimelineEvent to update in case it exists.
     */
    where: TimelineEventWhereUniqueInput
    /**
     * In case the TimelineEvent found by the `where` argument doesn't exist, create a new TimelineEvent with this data.
     */
    create: XOR<TimelineEventCreateInput, TimelineEventUncheckedCreateInput>
    /**
     * In case the TimelineEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TimelineEventUpdateInput, TimelineEventUncheckedUpdateInput>
  }

  /**
   * TimelineEvent delete
   */
  export type TimelineEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
    /**
     * Filter which TimelineEvent to delete.
     */
    where: TimelineEventWhereUniqueInput
  }

  /**
   * TimelineEvent deleteMany
   */
  export type TimelineEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TimelineEvents to delete
     */
    where?: TimelineEventWhereInput
  }

  /**
   * TimelineEvent.character
   */
  export type TimelineEvent$characterArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Character
     */
    select?: CharacterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CharacterInclude<ExtArgs> | null
    where?: CharacterWhereInput
  }

  /**
   * TimelineEvent.location
   */
  export type TimelineEvent$locationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * TimelineEvent without action
   */
  export type TimelineEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TimelineEvent
     */
    select?: TimelineEventSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TimelineEventInclude<ExtArgs> | null
  }


  /**
   * Model Title
   */

  export type AggregateTitle = {
    _count: TitleCountAggregateOutputType | null
    _avg: TitleAvgAggregateOutputType | null
    _sum: TitleSumAggregateOutputType | null
    _min: TitleMinAggregateOutputType | null
    _max: TitleMaxAggregateOutputType | null
  }

  export type TitleAvgAggregateOutputType = {
    releaseYear: number | null
    endYear: number | null
    rating: number | null
    viewCount: number | null
  }

  export type TitleSumAggregateOutputType = {
    releaseYear: number | null
    endYear: number | null
    rating: number | null
    viewCount: number | null
  }

  export type TitleMinAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    type: string | null
    description: string | null
    coverImage: string | null
    releaseYear: number | null
    endYear: number | null
    status: string | null
    rating: number | null
    universeId: string | null
    viewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TitleMaxAggregateOutputType = {
    id: string | null
    name: string | null
    slug: string | null
    type: string | null
    description: string | null
    coverImage: string | null
    releaseYear: number | null
    endYear: number | null
    status: string | null
    rating: number | null
    universeId: string | null
    viewCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TitleCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    type: number
    description: number
    coverImage: number
    releaseYear: number
    endYear: number
    status: number
    rating: number
    universeId: number
    viewCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TitleAvgAggregateInputType = {
    releaseYear?: true
    endYear?: true
    rating?: true
    viewCount?: true
  }

  export type TitleSumAggregateInputType = {
    releaseYear?: true
    endYear?: true
    rating?: true
    viewCount?: true
  }

  export type TitleMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    type?: true
    description?: true
    coverImage?: true
    releaseYear?: true
    endYear?: true
    status?: true
    rating?: true
    universeId?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TitleMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    type?: true
    description?: true
    coverImage?: true
    releaseYear?: true
    endYear?: true
    status?: true
    rating?: true
    universeId?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TitleCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    type?: true
    description?: true
    coverImage?: true
    releaseYear?: true
    endYear?: true
    status?: true
    rating?: true
    universeId?: true
    viewCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TitleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Title to aggregate.
     */
    where?: TitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Titles to fetch.
     */
    orderBy?: TitleOrderByWithRelationInput | TitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Titles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Titles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Titles
    **/
    _count?: true | TitleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TitleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TitleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TitleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TitleMaxAggregateInputType
  }

  export type GetTitleAggregateType<T extends TitleAggregateArgs> = {
        [P in keyof T & keyof AggregateTitle]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTitle[P]>
      : GetScalarType<T[P], AggregateTitle[P]>
  }




  export type TitleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TitleWhereInput
    orderBy?: TitleOrderByWithAggregationInput | TitleOrderByWithAggregationInput[]
    by: TitleScalarFieldEnum[] | TitleScalarFieldEnum
    having?: TitleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TitleCountAggregateInputType | true
    _avg?: TitleAvgAggregateInputType
    _sum?: TitleSumAggregateInputType
    _min?: TitleMinAggregateInputType
    _max?: TitleMaxAggregateInputType
  }

  export type TitleGroupByOutputType = {
    id: string
    name: string
    slug: string
    type: string
    description: string | null
    coverImage: string | null
    releaseYear: number | null
    endYear: number | null
    status: string
    rating: number | null
    universeId: string
    viewCount: number
    createdAt: Date
    updatedAt: Date
    _count: TitleCountAggregateOutputType | null
    _avg: TitleAvgAggregateOutputType | null
    _sum: TitleSumAggregateOutputType | null
    _min: TitleMinAggregateOutputType | null
    _max: TitleMaxAggregateOutputType | null
  }

  type GetTitleGroupByPayload<T extends TitleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TitleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TitleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TitleGroupByOutputType[P]>
            : GetScalarType<T[P], TitleGroupByOutputType[P]>
        }
      >
    >


  export type TitleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    type?: boolean
    description?: boolean
    coverImage?: boolean
    releaseYear?: boolean
    endYear?: boolean
    status?: boolean
    rating?: boolean
    universeId?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    recaps?: boolean | Title$recapsArgs<ExtArgs>
    crossovers?: boolean | Title$crossoversArgs<ExtArgs>
    chapters?: boolean | Title$chaptersArgs<ExtArgs>
    _count?: boolean | TitleCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["title"]>

  export type TitleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    type?: boolean
    description?: boolean
    coverImage?: boolean
    releaseYear?: boolean
    endYear?: boolean
    status?: boolean
    rating?: boolean
    universeId?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["title"]>

  export type TitleSelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    type?: boolean
    description?: boolean
    coverImage?: boolean
    releaseYear?: boolean
    endYear?: boolean
    status?: boolean
    rating?: boolean
    universeId?: boolean
    viewCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TitleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
    recaps?: boolean | Title$recapsArgs<ExtArgs>
    crossovers?: boolean | Title$crossoversArgs<ExtArgs>
    chapters?: boolean | Title$chaptersArgs<ExtArgs>
    _count?: boolean | TitleCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TitleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }

  export type $TitlePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Title"
    objects: {
      universe: Prisma.$UniverseMapPayload<ExtArgs>
      recaps: Prisma.$RecapPayload<ExtArgs>[]
      crossovers: Prisma.$CrossoverTitlePayload<ExtArgs>[]
      chapters: Prisma.$ChapterPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      slug: string
      type: string
      description: string | null
      coverImage: string | null
      releaseYear: number | null
      endYear: number | null
      status: string
      rating: number | null
      universeId: string
      viewCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["title"]>
    composites: {}
  }

  type TitleGetPayload<S extends boolean | null | undefined | TitleDefaultArgs> = $Result.GetResult<Prisma.$TitlePayload, S>

  type TitleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TitleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TitleCountAggregateInputType | true
    }

  export interface TitleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Title'], meta: { name: 'Title' } }
    /**
     * Find zero or one Title that matches the filter.
     * @param {TitleFindUniqueArgs} args - Arguments to find a Title
     * @example
     * // Get one Title
     * const title = await prisma.title.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TitleFindUniqueArgs>(args: SelectSubset<T, TitleFindUniqueArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Title that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TitleFindUniqueOrThrowArgs} args - Arguments to find a Title
     * @example
     * // Get one Title
     * const title = await prisma.title.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TitleFindUniqueOrThrowArgs>(args: SelectSubset<T, TitleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Title that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleFindFirstArgs} args - Arguments to find a Title
     * @example
     * // Get one Title
     * const title = await prisma.title.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TitleFindFirstArgs>(args?: SelectSubset<T, TitleFindFirstArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Title that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleFindFirstOrThrowArgs} args - Arguments to find a Title
     * @example
     * // Get one Title
     * const title = await prisma.title.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TitleFindFirstOrThrowArgs>(args?: SelectSubset<T, TitleFindFirstOrThrowArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Titles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Titles
     * const titles = await prisma.title.findMany()
     * 
     * // Get first 10 Titles
     * const titles = await prisma.title.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const titleWithIdOnly = await prisma.title.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TitleFindManyArgs>(args?: SelectSubset<T, TitleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Title.
     * @param {TitleCreateArgs} args - Arguments to create a Title.
     * @example
     * // Create one Title
     * const Title = await prisma.title.create({
     *   data: {
     *     // ... data to create a Title
     *   }
     * })
     * 
     */
    create<T extends TitleCreateArgs>(args: SelectSubset<T, TitleCreateArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Titles.
     * @param {TitleCreateManyArgs} args - Arguments to create many Titles.
     * @example
     * // Create many Titles
     * const title = await prisma.title.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TitleCreateManyArgs>(args?: SelectSubset<T, TitleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Titles and returns the data saved in the database.
     * @param {TitleCreateManyAndReturnArgs} args - Arguments to create many Titles.
     * @example
     * // Create many Titles
     * const title = await prisma.title.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Titles and only return the `id`
     * const titleWithIdOnly = await prisma.title.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TitleCreateManyAndReturnArgs>(args?: SelectSubset<T, TitleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Title.
     * @param {TitleDeleteArgs} args - Arguments to delete one Title.
     * @example
     * // Delete one Title
     * const Title = await prisma.title.delete({
     *   where: {
     *     // ... filter to delete one Title
     *   }
     * })
     * 
     */
    delete<T extends TitleDeleteArgs>(args: SelectSubset<T, TitleDeleteArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Title.
     * @param {TitleUpdateArgs} args - Arguments to update one Title.
     * @example
     * // Update one Title
     * const title = await prisma.title.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TitleUpdateArgs>(args: SelectSubset<T, TitleUpdateArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Titles.
     * @param {TitleDeleteManyArgs} args - Arguments to filter Titles to delete.
     * @example
     * // Delete a few Titles
     * const { count } = await prisma.title.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TitleDeleteManyArgs>(args?: SelectSubset<T, TitleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Titles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Titles
     * const title = await prisma.title.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TitleUpdateManyArgs>(args: SelectSubset<T, TitleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Title.
     * @param {TitleUpsertArgs} args - Arguments to update or create a Title.
     * @example
     * // Update or create a Title
     * const title = await prisma.title.upsert({
     *   create: {
     *     // ... data to create a Title
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Title we want to update
     *   }
     * })
     */
    upsert<T extends TitleUpsertArgs>(args: SelectSubset<T, TitleUpsertArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Titles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleCountArgs} args - Arguments to filter Titles to count.
     * @example
     * // Count the number of Titles
     * const count = await prisma.title.count({
     *   where: {
     *     // ... the filter for the Titles we want to count
     *   }
     * })
    **/
    count<T extends TitleCountArgs>(
      args?: Subset<T, TitleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TitleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Title.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends TitleAggregateArgs>(args: Subset<T, TitleAggregateArgs>): Prisma.PrismaPromise<GetTitleAggregateType<T>>

    /**
     * Group by Title.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TitleGroupByArgs} args - Group by arguments.
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
      T extends TitleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TitleGroupByArgs['orderBy'] }
        : { orderBy?: TitleGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, TitleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTitleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Title model
   */
  readonly fields: TitleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Title.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TitleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    universe<T extends UniverseMapDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMapDefaultArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    recaps<T extends Title$recapsArgs<ExtArgs> = {}>(args?: Subset<T, Title$recapsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findMany"> | Null>
    crossovers<T extends Title$crossoversArgs<ExtArgs> = {}>(args?: Subset<T, Title$crossoversArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findMany"> | Null>
    chapters<T extends Title$chaptersArgs<ExtArgs> = {}>(args?: Subset<T, Title$chaptersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Title model
   */ 
  interface TitleFieldRefs {
    readonly id: FieldRef<"Title", 'String'>
    readonly name: FieldRef<"Title", 'String'>
    readonly slug: FieldRef<"Title", 'String'>
    readonly type: FieldRef<"Title", 'String'>
    readonly description: FieldRef<"Title", 'String'>
    readonly coverImage: FieldRef<"Title", 'String'>
    readonly releaseYear: FieldRef<"Title", 'Int'>
    readonly endYear: FieldRef<"Title", 'Int'>
    readonly status: FieldRef<"Title", 'String'>
    readonly rating: FieldRef<"Title", 'Float'>
    readonly universeId: FieldRef<"Title", 'String'>
    readonly viewCount: FieldRef<"Title", 'Int'>
    readonly createdAt: FieldRef<"Title", 'DateTime'>
    readonly updatedAt: FieldRef<"Title", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Title findUnique
   */
  export type TitleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter, which Title to fetch.
     */
    where: TitleWhereUniqueInput
  }

  /**
   * Title findUniqueOrThrow
   */
  export type TitleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter, which Title to fetch.
     */
    where: TitleWhereUniqueInput
  }

  /**
   * Title findFirst
   */
  export type TitleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter, which Title to fetch.
     */
    where?: TitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Titles to fetch.
     */
    orderBy?: TitleOrderByWithRelationInput | TitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Titles.
     */
    cursor?: TitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Titles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Titles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Titles.
     */
    distinct?: TitleScalarFieldEnum | TitleScalarFieldEnum[]
  }

  /**
   * Title findFirstOrThrow
   */
  export type TitleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter, which Title to fetch.
     */
    where?: TitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Titles to fetch.
     */
    orderBy?: TitleOrderByWithRelationInput | TitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Titles.
     */
    cursor?: TitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Titles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Titles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Titles.
     */
    distinct?: TitleScalarFieldEnum | TitleScalarFieldEnum[]
  }

  /**
   * Title findMany
   */
  export type TitleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter, which Titles to fetch.
     */
    where?: TitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Titles to fetch.
     */
    orderBy?: TitleOrderByWithRelationInput | TitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Titles.
     */
    cursor?: TitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Titles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Titles.
     */
    skip?: number
    distinct?: TitleScalarFieldEnum | TitleScalarFieldEnum[]
  }

  /**
   * Title create
   */
  export type TitleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * The data needed to create a Title.
     */
    data: XOR<TitleCreateInput, TitleUncheckedCreateInput>
  }

  /**
   * Title createMany
   */
  export type TitleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Titles.
     */
    data: TitleCreateManyInput | TitleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Title createManyAndReturn
   */
  export type TitleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Titles.
     */
    data: TitleCreateManyInput | TitleCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Title update
   */
  export type TitleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * The data needed to update a Title.
     */
    data: XOR<TitleUpdateInput, TitleUncheckedUpdateInput>
    /**
     * Choose, which Title to update.
     */
    where: TitleWhereUniqueInput
  }

  /**
   * Title updateMany
   */
  export type TitleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Titles.
     */
    data: XOR<TitleUpdateManyMutationInput, TitleUncheckedUpdateManyInput>
    /**
     * Filter which Titles to update
     */
    where?: TitleWhereInput
  }

  /**
   * Title upsert
   */
  export type TitleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * The filter to search for the Title to update in case it exists.
     */
    where: TitleWhereUniqueInput
    /**
     * In case the Title found by the `where` argument doesn't exist, create a new Title with this data.
     */
    create: XOR<TitleCreateInput, TitleUncheckedCreateInput>
    /**
     * In case the Title was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TitleUpdateInput, TitleUncheckedUpdateInput>
  }

  /**
   * Title delete
   */
  export type TitleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
    /**
     * Filter which Title to delete.
     */
    where: TitleWhereUniqueInput
  }

  /**
   * Title deleteMany
   */
  export type TitleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Titles to delete
     */
    where?: TitleWhereInput
  }

  /**
   * Title.recaps
   */
  export type Title$recapsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    where?: RecapWhereInput
    orderBy?: RecapOrderByWithRelationInput | RecapOrderByWithRelationInput[]
    cursor?: RecapWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecapScalarFieldEnum | RecapScalarFieldEnum[]
  }

  /**
   * Title.crossovers
   */
  export type Title$crossoversArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    where?: CrossoverTitleWhereInput
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    cursor?: CrossoverTitleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CrossoverTitleScalarFieldEnum | CrossoverTitleScalarFieldEnum[]
  }

  /**
   * Title.chapters
   */
  export type Title$chaptersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    cursor?: ChapterWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Title without action
   */
  export type TitleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Title
     */
    select?: TitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TitleInclude<ExtArgs> | null
  }


  /**
   * Model Chapter
   */

  export type AggregateChapter = {
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  export type ChapterAvgAggregateOutputType = {
    number: number | null
    wordCount: number | null
  }

  export type ChapterSumAggregateOutputType = {
    number: number | null
    wordCount: number | null
  }

  export type ChapterMinAggregateOutputType = {
    id: string | null
    titleId: string | null
    number: number | null
    name: string | null
    description: string | null
    coverImage: string | null
    content: string | null
    wordCount: number | null
    status: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type ChapterMaxAggregateOutputType = {
    id: string | null
    titleId: string | null
    number: number | null
    name: string | null
    description: string | null
    coverImage: string | null
    content: string | null
    wordCount: number | null
    status: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type ChapterCountAggregateOutputType = {
    id: number
    titleId: number
    number: number
    name: number
    description: number
    coverImage: number
    content: number
    wordCount: number
    status: number
    publishedAt: number
    createdAt: number
    _all: number
  }


  export type ChapterAvgAggregateInputType = {
    number?: true
    wordCount?: true
  }

  export type ChapterSumAggregateInputType = {
    number?: true
    wordCount?: true
  }

  export type ChapterMinAggregateInputType = {
    id?: true
    titleId?: true
    number?: true
    name?: true
    description?: true
    coverImage?: true
    content?: true
    wordCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
  }

  export type ChapterMaxAggregateInputType = {
    id?: true
    titleId?: true
    number?: true
    name?: true
    description?: true
    coverImage?: true
    content?: true
    wordCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
  }

  export type ChapterCountAggregateInputType = {
    id?: true
    titleId?: true
    number?: true
    name?: true
    description?: true
    coverImage?: true
    content?: true
    wordCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
    _all?: true
  }

  export type ChapterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapter to aggregate.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Chapters
    **/
    _count?: true | ChapterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChapterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChapterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChapterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChapterMaxAggregateInputType
  }

  export type GetChapterAggregateType<T extends ChapterAggregateArgs> = {
        [P in keyof T & keyof AggregateChapter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChapter[P]>
      : GetScalarType<T[P], AggregateChapter[P]>
  }




  export type ChapterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChapterWhereInput
    orderBy?: ChapterOrderByWithAggregationInput | ChapterOrderByWithAggregationInput[]
    by: ChapterScalarFieldEnum[] | ChapterScalarFieldEnum
    having?: ChapterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChapterCountAggregateInputType | true
    _avg?: ChapterAvgAggregateInputType
    _sum?: ChapterSumAggregateInputType
    _min?: ChapterMinAggregateInputType
    _max?: ChapterMaxAggregateInputType
  }

  export type ChapterGroupByOutputType = {
    id: string
    titleId: string
    number: number
    name: string | null
    description: string | null
    coverImage: string | null
    content: string | null
    wordCount: number | null
    status: string
    publishedAt: Date | null
    createdAt: Date
    _count: ChapterCountAggregateOutputType | null
    _avg: ChapterAvgAggregateOutputType | null
    _sum: ChapterSumAggregateOutputType | null
    _min: ChapterMinAggregateOutputType | null
    _max: ChapterMaxAggregateOutputType | null
  }

  type GetChapterGroupByPayload<T extends ChapterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChapterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChapterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChapterGroupByOutputType[P]>
            : GetScalarType<T[P], ChapterGroupByOutputType[P]>
        }
      >
    >


  export type ChapterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    titleId?: boolean
    number?: boolean
    name?: boolean
    description?: boolean
    coverImage?: boolean
    content?: boolean
    wordCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>

  export type ChapterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    titleId?: boolean
    number?: boolean
    name?: boolean
    description?: boolean
    coverImage?: boolean
    content?: boolean
    wordCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chapter"]>

  export type ChapterSelectScalar = {
    id?: boolean
    titleId?: boolean
    number?: boolean
    name?: boolean
    description?: boolean
    coverImage?: boolean
    content?: boolean
    wordCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
  }

  export type ChapterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }
  export type ChapterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }

  export type $ChapterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Chapter"
    objects: {
      title: Prisma.$TitlePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      titleId: string
      number: number
      name: string | null
      description: string | null
      coverImage: string | null
      content: string | null
      wordCount: number | null
      status: string
      publishedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["chapter"]>
    composites: {}
  }

  type ChapterGetPayload<S extends boolean | null | undefined | ChapterDefaultArgs> = $Result.GetResult<Prisma.$ChapterPayload, S>

  type ChapterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ChapterFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ChapterCountAggregateInputType | true
    }

  export interface ChapterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Chapter'], meta: { name: 'Chapter' } }
    /**
     * Find zero or one Chapter that matches the filter.
     * @param {ChapterFindUniqueArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChapterFindUniqueArgs>(args: SelectSubset<T, ChapterFindUniqueArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Chapter that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ChapterFindUniqueOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChapterFindUniqueOrThrowArgs>(args: SelectSubset<T, ChapterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Chapter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChapterFindFirstArgs>(args?: SelectSubset<T, ChapterFindFirstArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Chapter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindFirstOrThrowArgs} args - Arguments to find a Chapter
     * @example
     * // Get one Chapter
     * const chapter = await prisma.chapter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChapterFindFirstOrThrowArgs>(args?: SelectSubset<T, ChapterFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Chapters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Chapters
     * const chapters = await prisma.chapter.findMany()
     * 
     * // Get first 10 Chapters
     * const chapters = await prisma.chapter.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chapterWithIdOnly = await prisma.chapter.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChapterFindManyArgs>(args?: SelectSubset<T, ChapterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Chapter.
     * @param {ChapterCreateArgs} args - Arguments to create a Chapter.
     * @example
     * // Create one Chapter
     * const Chapter = await prisma.chapter.create({
     *   data: {
     *     // ... data to create a Chapter
     *   }
     * })
     * 
     */
    create<T extends ChapterCreateArgs>(args: SelectSubset<T, ChapterCreateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Chapters.
     * @param {ChapterCreateManyArgs} args - Arguments to create many Chapters.
     * @example
     * // Create many Chapters
     * const chapter = await prisma.chapter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChapterCreateManyArgs>(args?: SelectSubset<T, ChapterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Chapters and returns the data saved in the database.
     * @param {ChapterCreateManyAndReturnArgs} args - Arguments to create many Chapters.
     * @example
     * // Create many Chapters
     * const chapter = await prisma.chapter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Chapters and only return the `id`
     * const chapterWithIdOnly = await prisma.chapter.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChapterCreateManyAndReturnArgs>(args?: SelectSubset<T, ChapterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Chapter.
     * @param {ChapterDeleteArgs} args - Arguments to delete one Chapter.
     * @example
     * // Delete one Chapter
     * const Chapter = await prisma.chapter.delete({
     *   where: {
     *     // ... filter to delete one Chapter
     *   }
     * })
     * 
     */
    delete<T extends ChapterDeleteArgs>(args: SelectSubset<T, ChapterDeleteArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Chapter.
     * @param {ChapterUpdateArgs} args - Arguments to update one Chapter.
     * @example
     * // Update one Chapter
     * const chapter = await prisma.chapter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChapterUpdateArgs>(args: SelectSubset<T, ChapterUpdateArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Chapters.
     * @param {ChapterDeleteManyArgs} args - Arguments to filter Chapters to delete.
     * @example
     * // Delete a few Chapters
     * const { count } = await prisma.chapter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChapterDeleteManyArgs>(args?: SelectSubset<T, ChapterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Chapters
     * const chapter = await prisma.chapter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChapterUpdateManyArgs>(args: SelectSubset<T, ChapterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Chapter.
     * @param {ChapterUpsertArgs} args - Arguments to update or create a Chapter.
     * @example
     * // Update or create a Chapter
     * const chapter = await prisma.chapter.upsert({
     *   create: {
     *     // ... data to create a Chapter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Chapter we want to update
     *   }
     * })
     */
    upsert<T extends ChapterUpsertArgs>(args: SelectSubset<T, ChapterUpsertArgs<ExtArgs>>): Prisma__ChapterClient<$Result.GetResult<Prisma.$ChapterPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Chapters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterCountArgs} args - Arguments to filter Chapters to count.
     * @example
     * // Count the number of Chapters
     * const count = await prisma.chapter.count({
     *   where: {
     *     // ... the filter for the Chapters we want to count
     *   }
     * })
    **/
    count<T extends ChapterCountArgs>(
      args?: Subset<T, ChapterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChapterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ChapterAggregateArgs>(args: Subset<T, ChapterAggregateArgs>): Prisma.PrismaPromise<GetChapterAggregateType<T>>

    /**
     * Group by Chapter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChapterGroupByArgs} args - Group by arguments.
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
      T extends ChapterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChapterGroupByArgs['orderBy'] }
        : { orderBy?: ChapterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ChapterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChapterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Chapter model
   */
  readonly fields: ChapterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Chapter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChapterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    title<T extends TitleDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TitleDefaultArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Chapter model
   */ 
  interface ChapterFieldRefs {
    readonly id: FieldRef<"Chapter", 'String'>
    readonly titleId: FieldRef<"Chapter", 'String'>
    readonly number: FieldRef<"Chapter", 'Float'>
    readonly name: FieldRef<"Chapter", 'String'>
    readonly description: FieldRef<"Chapter", 'String'>
    readonly coverImage: FieldRef<"Chapter", 'String'>
    readonly content: FieldRef<"Chapter", 'String'>
    readonly wordCount: FieldRef<"Chapter", 'Int'>
    readonly status: FieldRef<"Chapter", 'String'>
    readonly publishedAt: FieldRef<"Chapter", 'DateTime'>
    readonly createdAt: FieldRef<"Chapter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Chapter findUnique
   */
  export type ChapterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findUniqueOrThrow
   */
  export type ChapterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter findFirst
   */
  export type ChapterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findFirstOrThrow
   */
  export type ChapterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapter to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Chapters.
     */
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter findMany
   */
  export type ChapterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter, which Chapters to fetch.
     */
    where?: ChapterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Chapters to fetch.
     */
    orderBy?: ChapterOrderByWithRelationInput | ChapterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Chapters.
     */
    cursor?: ChapterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Chapters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Chapters.
     */
    skip?: number
    distinct?: ChapterScalarFieldEnum | ChapterScalarFieldEnum[]
  }

  /**
   * Chapter create
   */
  export type ChapterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to create a Chapter.
     */
    data: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
  }

  /**
   * Chapter createMany
   */
  export type ChapterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Chapters.
     */
    data: ChapterCreateManyInput | ChapterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Chapter createManyAndReturn
   */
  export type ChapterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Chapters.
     */
    data: ChapterCreateManyInput | ChapterCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Chapter update
   */
  export type ChapterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The data needed to update a Chapter.
     */
    data: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
    /**
     * Choose, which Chapter to update.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter updateMany
   */
  export type ChapterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Chapters.
     */
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyInput>
    /**
     * Filter which Chapters to update
     */
    where?: ChapterWhereInput
  }

  /**
   * Chapter upsert
   */
  export type ChapterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * The filter to search for the Chapter to update in case it exists.
     */
    where: ChapterWhereUniqueInput
    /**
     * In case the Chapter found by the `where` argument doesn't exist, create a new Chapter with this data.
     */
    create: XOR<ChapterCreateInput, ChapterUncheckedCreateInput>
    /**
     * In case the Chapter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChapterUpdateInput, ChapterUncheckedUpdateInput>
  }

  /**
   * Chapter delete
   */
  export type ChapterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
    /**
     * Filter which Chapter to delete.
     */
    where: ChapterWhereUniqueInput
  }

  /**
   * Chapter deleteMany
   */
  export type ChapterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Chapters to delete
     */
    where?: ChapterWhereInput
  }

  /**
   * Chapter without action
   */
  export type ChapterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Chapter
     */
    select?: ChapterSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChapterInclude<ExtArgs> | null
  }


  /**
   * Model LoreEntry
   */

  export type AggregateLoreEntry = {
    _count: LoreEntryCountAggregateOutputType | null
    _avg: LoreEntryAvgAggregateOutputType | null
    _sum: LoreEntrySumAggregateOutputType | null
    _min: LoreEntryMinAggregateOutputType | null
    _max: LoreEntryMaxAggregateOutputType | null
  }

  export type LoreEntryAvgAggregateOutputType = {
    viewCount: number | null
  }

  export type LoreEntrySumAggregateOutputType = {
    viewCount: number | null
  }

  export type LoreEntryMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    category: string | null
    content: string | null
    excerpt: string | null
    coverImage: string | null
    importance: string | null
    universeId: string | null
    viewCount: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoreEntryMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    category: string | null
    content: string | null
    excerpt: string | null
    coverImage: string | null
    importance: string | null
    universeId: string | null
    viewCount: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoreEntryCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    category: number
    content: number
    excerpt: number
    coverImage: number
    importance: number
    universeId: number
    viewCount: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LoreEntryAvgAggregateInputType = {
    viewCount?: true
  }

  export type LoreEntrySumAggregateInputType = {
    viewCount?: true
  }

  export type LoreEntryMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    category?: true
    content?: true
    excerpt?: true
    coverImage?: true
    importance?: true
    universeId?: true
    viewCount?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoreEntryMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    category?: true
    content?: true
    excerpt?: true
    coverImage?: true
    importance?: true
    universeId?: true
    viewCount?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoreEntryCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    category?: true
    content?: true
    excerpt?: true
    coverImage?: true
    importance?: true
    universeId?: true
    viewCount?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LoreEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoreEntry to aggregate.
     */
    where?: LoreEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoreEntries to fetch.
     */
    orderBy?: LoreEntryOrderByWithRelationInput | LoreEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LoreEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoreEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoreEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LoreEntries
    **/
    _count?: true | LoreEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LoreEntryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LoreEntrySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LoreEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LoreEntryMaxAggregateInputType
  }

  export type GetLoreEntryAggregateType<T extends LoreEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateLoreEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLoreEntry[P]>
      : GetScalarType<T[P], AggregateLoreEntry[P]>
  }




  export type LoreEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoreEntryWhereInput
    orderBy?: LoreEntryOrderByWithAggregationInput | LoreEntryOrderByWithAggregationInput[]
    by: LoreEntryScalarFieldEnum[] | LoreEntryScalarFieldEnum
    having?: LoreEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LoreEntryCountAggregateInputType | true
    _avg?: LoreEntryAvgAggregateInputType
    _sum?: LoreEntrySumAggregateInputType
    _min?: LoreEntryMinAggregateInputType
    _max?: LoreEntryMaxAggregateInputType
  }

  export type LoreEntryGroupByOutputType = {
    id: string
    title: string
    slug: string
    category: string
    content: string
    excerpt: string | null
    coverImage: string | null
    importance: string
    universeId: string
    viewCount: number
    status: string
    createdAt: Date
    updatedAt: Date
    _count: LoreEntryCountAggregateOutputType | null
    _avg: LoreEntryAvgAggregateOutputType | null
    _sum: LoreEntrySumAggregateOutputType | null
    _min: LoreEntryMinAggregateOutputType | null
    _max: LoreEntryMaxAggregateOutputType | null
  }

  type GetLoreEntryGroupByPayload<T extends LoreEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LoreEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LoreEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LoreEntryGroupByOutputType[P]>
            : GetScalarType<T[P], LoreEntryGroupByOutputType[P]>
        }
      >
    >


  export type LoreEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    category?: boolean
    content?: boolean
    excerpt?: boolean
    coverImage?: boolean
    importance?: boolean
    universeId?: boolean
    viewCount?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loreEntry"]>

  export type LoreEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    category?: boolean
    content?: boolean
    excerpt?: boolean
    coverImage?: boolean
    importance?: boolean
    universeId?: boolean
    viewCount?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loreEntry"]>

  export type LoreEntrySelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    category?: boolean
    content?: boolean
    excerpt?: boolean
    coverImage?: boolean
    importance?: boolean
    universeId?: boolean
    viewCount?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LoreEntryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }
  export type LoreEntryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    universe?: boolean | UniverseMapDefaultArgs<ExtArgs>
  }

  export type $LoreEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LoreEntry"
    objects: {
      universe: Prisma.$UniverseMapPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      category: string
      content: string
      excerpt: string | null
      coverImage: string | null
      importance: string
      universeId: string
      viewCount: number
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["loreEntry"]>
    composites: {}
  }

  type LoreEntryGetPayload<S extends boolean | null | undefined | LoreEntryDefaultArgs> = $Result.GetResult<Prisma.$LoreEntryPayload, S>

  type LoreEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LoreEntryFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LoreEntryCountAggregateInputType | true
    }

  export interface LoreEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LoreEntry'], meta: { name: 'LoreEntry' } }
    /**
     * Find zero or one LoreEntry that matches the filter.
     * @param {LoreEntryFindUniqueArgs} args - Arguments to find a LoreEntry
     * @example
     * // Get one LoreEntry
     * const loreEntry = await prisma.loreEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LoreEntryFindUniqueArgs>(args: SelectSubset<T, LoreEntryFindUniqueArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one LoreEntry that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LoreEntryFindUniqueOrThrowArgs} args - Arguments to find a LoreEntry
     * @example
     * // Get one LoreEntry
     * const loreEntry = await prisma.loreEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LoreEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, LoreEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first LoreEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryFindFirstArgs} args - Arguments to find a LoreEntry
     * @example
     * // Get one LoreEntry
     * const loreEntry = await prisma.loreEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LoreEntryFindFirstArgs>(args?: SelectSubset<T, LoreEntryFindFirstArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first LoreEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryFindFirstOrThrowArgs} args - Arguments to find a LoreEntry
     * @example
     * // Get one LoreEntry
     * const loreEntry = await prisma.loreEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LoreEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, LoreEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more LoreEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LoreEntries
     * const loreEntries = await prisma.loreEntry.findMany()
     * 
     * // Get first 10 LoreEntries
     * const loreEntries = await prisma.loreEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const loreEntryWithIdOnly = await prisma.loreEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LoreEntryFindManyArgs>(args?: SelectSubset<T, LoreEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a LoreEntry.
     * @param {LoreEntryCreateArgs} args - Arguments to create a LoreEntry.
     * @example
     * // Create one LoreEntry
     * const LoreEntry = await prisma.loreEntry.create({
     *   data: {
     *     // ... data to create a LoreEntry
     *   }
     * })
     * 
     */
    create<T extends LoreEntryCreateArgs>(args: SelectSubset<T, LoreEntryCreateArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many LoreEntries.
     * @param {LoreEntryCreateManyArgs} args - Arguments to create many LoreEntries.
     * @example
     * // Create many LoreEntries
     * const loreEntry = await prisma.loreEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LoreEntryCreateManyArgs>(args?: SelectSubset<T, LoreEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LoreEntries and returns the data saved in the database.
     * @param {LoreEntryCreateManyAndReturnArgs} args - Arguments to create many LoreEntries.
     * @example
     * // Create many LoreEntries
     * const loreEntry = await prisma.loreEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LoreEntries and only return the `id`
     * const loreEntryWithIdOnly = await prisma.loreEntry.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LoreEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, LoreEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a LoreEntry.
     * @param {LoreEntryDeleteArgs} args - Arguments to delete one LoreEntry.
     * @example
     * // Delete one LoreEntry
     * const LoreEntry = await prisma.loreEntry.delete({
     *   where: {
     *     // ... filter to delete one LoreEntry
     *   }
     * })
     * 
     */
    delete<T extends LoreEntryDeleteArgs>(args: SelectSubset<T, LoreEntryDeleteArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one LoreEntry.
     * @param {LoreEntryUpdateArgs} args - Arguments to update one LoreEntry.
     * @example
     * // Update one LoreEntry
     * const loreEntry = await prisma.loreEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LoreEntryUpdateArgs>(args: SelectSubset<T, LoreEntryUpdateArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more LoreEntries.
     * @param {LoreEntryDeleteManyArgs} args - Arguments to filter LoreEntries to delete.
     * @example
     * // Delete a few LoreEntries
     * const { count } = await prisma.loreEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LoreEntryDeleteManyArgs>(args?: SelectSubset<T, LoreEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoreEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LoreEntries
     * const loreEntry = await prisma.loreEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LoreEntryUpdateManyArgs>(args: SelectSubset<T, LoreEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one LoreEntry.
     * @param {LoreEntryUpsertArgs} args - Arguments to update or create a LoreEntry.
     * @example
     * // Update or create a LoreEntry
     * const loreEntry = await prisma.loreEntry.upsert({
     *   create: {
     *     // ... data to create a LoreEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LoreEntry we want to update
     *   }
     * })
     */
    upsert<T extends LoreEntryUpsertArgs>(args: SelectSubset<T, LoreEntryUpsertArgs<ExtArgs>>): Prisma__LoreEntryClient<$Result.GetResult<Prisma.$LoreEntryPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of LoreEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryCountArgs} args - Arguments to filter LoreEntries to count.
     * @example
     * // Count the number of LoreEntries
     * const count = await prisma.loreEntry.count({
     *   where: {
     *     // ... the filter for the LoreEntries we want to count
     *   }
     * })
    **/
    count<T extends LoreEntryCountArgs>(
      args?: Subset<T, LoreEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LoreEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LoreEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LoreEntryAggregateArgs>(args: Subset<T, LoreEntryAggregateArgs>): Prisma.PrismaPromise<GetLoreEntryAggregateType<T>>

    /**
     * Group by LoreEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoreEntryGroupByArgs} args - Group by arguments.
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
      T extends LoreEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LoreEntryGroupByArgs['orderBy'] }
        : { orderBy?: LoreEntryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LoreEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLoreEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LoreEntry model
   */
  readonly fields: LoreEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LoreEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LoreEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    universe<T extends UniverseMapDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UniverseMapDefaultArgs<ExtArgs>>): Prisma__UniverseMapClient<$Result.GetResult<Prisma.$UniverseMapPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the LoreEntry model
   */ 
  interface LoreEntryFieldRefs {
    readonly id: FieldRef<"LoreEntry", 'String'>
    readonly title: FieldRef<"LoreEntry", 'String'>
    readonly slug: FieldRef<"LoreEntry", 'String'>
    readonly category: FieldRef<"LoreEntry", 'String'>
    readonly content: FieldRef<"LoreEntry", 'String'>
    readonly excerpt: FieldRef<"LoreEntry", 'String'>
    readonly coverImage: FieldRef<"LoreEntry", 'String'>
    readonly importance: FieldRef<"LoreEntry", 'String'>
    readonly universeId: FieldRef<"LoreEntry", 'String'>
    readonly viewCount: FieldRef<"LoreEntry", 'Int'>
    readonly status: FieldRef<"LoreEntry", 'String'>
    readonly createdAt: FieldRef<"LoreEntry", 'DateTime'>
    readonly updatedAt: FieldRef<"LoreEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LoreEntry findUnique
   */
  export type LoreEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter, which LoreEntry to fetch.
     */
    where: LoreEntryWhereUniqueInput
  }

  /**
   * LoreEntry findUniqueOrThrow
   */
  export type LoreEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter, which LoreEntry to fetch.
     */
    where: LoreEntryWhereUniqueInput
  }

  /**
   * LoreEntry findFirst
   */
  export type LoreEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter, which LoreEntry to fetch.
     */
    where?: LoreEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoreEntries to fetch.
     */
    orderBy?: LoreEntryOrderByWithRelationInput | LoreEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoreEntries.
     */
    cursor?: LoreEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoreEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoreEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoreEntries.
     */
    distinct?: LoreEntryScalarFieldEnum | LoreEntryScalarFieldEnum[]
  }

  /**
   * LoreEntry findFirstOrThrow
   */
  export type LoreEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter, which LoreEntry to fetch.
     */
    where?: LoreEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoreEntries to fetch.
     */
    orderBy?: LoreEntryOrderByWithRelationInput | LoreEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoreEntries.
     */
    cursor?: LoreEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoreEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoreEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoreEntries.
     */
    distinct?: LoreEntryScalarFieldEnum | LoreEntryScalarFieldEnum[]
  }

  /**
   * LoreEntry findMany
   */
  export type LoreEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter, which LoreEntries to fetch.
     */
    where?: LoreEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoreEntries to fetch.
     */
    orderBy?: LoreEntryOrderByWithRelationInput | LoreEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LoreEntries.
     */
    cursor?: LoreEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoreEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoreEntries.
     */
    skip?: number
    distinct?: LoreEntryScalarFieldEnum | LoreEntryScalarFieldEnum[]
  }

  /**
   * LoreEntry create
   */
  export type LoreEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * The data needed to create a LoreEntry.
     */
    data: XOR<LoreEntryCreateInput, LoreEntryUncheckedCreateInput>
  }

  /**
   * LoreEntry createMany
   */
  export type LoreEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LoreEntries.
     */
    data: LoreEntryCreateManyInput | LoreEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoreEntry createManyAndReturn
   */
  export type LoreEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many LoreEntries.
     */
    data: LoreEntryCreateManyInput | LoreEntryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LoreEntry update
   */
  export type LoreEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * The data needed to update a LoreEntry.
     */
    data: XOR<LoreEntryUpdateInput, LoreEntryUncheckedUpdateInput>
    /**
     * Choose, which LoreEntry to update.
     */
    where: LoreEntryWhereUniqueInput
  }

  /**
   * LoreEntry updateMany
   */
  export type LoreEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LoreEntries.
     */
    data: XOR<LoreEntryUpdateManyMutationInput, LoreEntryUncheckedUpdateManyInput>
    /**
     * Filter which LoreEntries to update
     */
    where?: LoreEntryWhereInput
  }

  /**
   * LoreEntry upsert
   */
  export type LoreEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * The filter to search for the LoreEntry to update in case it exists.
     */
    where: LoreEntryWhereUniqueInput
    /**
     * In case the LoreEntry found by the `where` argument doesn't exist, create a new LoreEntry with this data.
     */
    create: XOR<LoreEntryCreateInput, LoreEntryUncheckedCreateInput>
    /**
     * In case the LoreEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LoreEntryUpdateInput, LoreEntryUncheckedUpdateInput>
  }

  /**
   * LoreEntry delete
   */
  export type LoreEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
    /**
     * Filter which LoreEntry to delete.
     */
    where: LoreEntryWhereUniqueInput
  }

  /**
   * LoreEntry deleteMany
   */
  export type LoreEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoreEntries to delete
     */
    where?: LoreEntryWhereInput
  }

  /**
   * LoreEntry without action
   */
  export type LoreEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoreEntry
     */
    select?: LoreEntrySelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoreEntryInclude<ExtArgs> | null
  }


  /**
   * Model Crossover
   */

  export type AggregateCrossover = {
    _count: CrossoverCountAggregateOutputType | null
    _min: CrossoverMinAggregateOutputType | null
    _max: CrossoverMaxAggregateOutputType | null
  }

  export type CrossoverMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    description: string | null
    coverImage: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrossoverMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    description: string | null
    coverImage: string | null
    startDate: Date | null
    endDate: Date | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrossoverCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    description: number
    coverImage: number
    startDate: number
    endDate: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CrossoverMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    description?: true
    coverImage?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrossoverMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    description?: true
    coverImage?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrossoverCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    description?: true
    coverImage?: true
    startDate?: true
    endDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CrossoverAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Crossover to aggregate.
     */
    where?: CrossoverWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crossovers to fetch.
     */
    orderBy?: CrossoverOrderByWithRelationInput | CrossoverOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrossoverWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crossovers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crossovers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Crossovers
    **/
    _count?: true | CrossoverCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrossoverMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrossoverMaxAggregateInputType
  }

  export type GetCrossoverAggregateType<T extends CrossoverAggregateArgs> = {
        [P in keyof T & keyof AggregateCrossover]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrossover[P]>
      : GetScalarType<T[P], AggregateCrossover[P]>
  }




  export type CrossoverGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrossoverWhereInput
    orderBy?: CrossoverOrderByWithAggregationInput | CrossoverOrderByWithAggregationInput[]
    by: CrossoverScalarFieldEnum[] | CrossoverScalarFieldEnum
    having?: CrossoverScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrossoverCountAggregateInputType | true
    _min?: CrossoverMinAggregateInputType
    _max?: CrossoverMaxAggregateInputType
  }

  export type CrossoverGroupByOutputType = {
    id: string
    title: string
    slug: string
    description: string | null
    coverImage: string | null
    startDate: Date | null
    endDate: Date | null
    status: string
    createdAt: Date
    updatedAt: Date
    _count: CrossoverCountAggregateOutputType | null
    _min: CrossoverMinAggregateOutputType | null
    _max: CrossoverMaxAggregateOutputType | null
  }

  type GetCrossoverGroupByPayload<T extends CrossoverGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrossoverGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrossoverGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrossoverGroupByOutputType[P]>
            : GetScalarType<T[P], CrossoverGroupByOutputType[P]>
        }
      >
    >


  export type CrossoverSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    description?: boolean
    coverImage?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    titles?: boolean | Crossover$titlesArgs<ExtArgs>
    _count?: boolean | CrossoverCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crossover"]>

  export type CrossoverSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    description?: boolean
    coverImage?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crossover"]>

  export type CrossoverSelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    description?: boolean
    coverImage?: boolean
    startDate?: boolean
    endDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CrossoverInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    titles?: boolean | Crossover$titlesArgs<ExtArgs>
    _count?: boolean | CrossoverCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CrossoverIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CrossoverPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Crossover"
    objects: {
      titles: Prisma.$CrossoverTitlePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      description: string | null
      coverImage: string | null
      startDate: Date | null
      endDate: Date | null
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["crossover"]>
    composites: {}
  }

  type CrossoverGetPayload<S extends boolean | null | undefined | CrossoverDefaultArgs> = $Result.GetResult<Prisma.$CrossoverPayload, S>

  type CrossoverCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CrossoverFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CrossoverCountAggregateInputType | true
    }

  export interface CrossoverDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Crossover'], meta: { name: 'Crossover' } }
    /**
     * Find zero or one Crossover that matches the filter.
     * @param {CrossoverFindUniqueArgs} args - Arguments to find a Crossover
     * @example
     * // Get one Crossover
     * const crossover = await prisma.crossover.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrossoverFindUniqueArgs>(args: SelectSubset<T, CrossoverFindUniqueArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Crossover that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CrossoverFindUniqueOrThrowArgs} args - Arguments to find a Crossover
     * @example
     * // Get one Crossover
     * const crossover = await prisma.crossover.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrossoverFindUniqueOrThrowArgs>(args: SelectSubset<T, CrossoverFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Crossover that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverFindFirstArgs} args - Arguments to find a Crossover
     * @example
     * // Get one Crossover
     * const crossover = await prisma.crossover.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrossoverFindFirstArgs>(args?: SelectSubset<T, CrossoverFindFirstArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Crossover that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverFindFirstOrThrowArgs} args - Arguments to find a Crossover
     * @example
     * // Get one Crossover
     * const crossover = await prisma.crossover.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrossoverFindFirstOrThrowArgs>(args?: SelectSubset<T, CrossoverFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Crossovers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Crossovers
     * const crossovers = await prisma.crossover.findMany()
     * 
     * // Get first 10 Crossovers
     * const crossovers = await prisma.crossover.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crossoverWithIdOnly = await prisma.crossover.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrossoverFindManyArgs>(args?: SelectSubset<T, CrossoverFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Crossover.
     * @param {CrossoverCreateArgs} args - Arguments to create a Crossover.
     * @example
     * // Create one Crossover
     * const Crossover = await prisma.crossover.create({
     *   data: {
     *     // ... data to create a Crossover
     *   }
     * })
     * 
     */
    create<T extends CrossoverCreateArgs>(args: SelectSubset<T, CrossoverCreateArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Crossovers.
     * @param {CrossoverCreateManyArgs} args - Arguments to create many Crossovers.
     * @example
     * // Create many Crossovers
     * const crossover = await prisma.crossover.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrossoverCreateManyArgs>(args?: SelectSubset<T, CrossoverCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Crossovers and returns the data saved in the database.
     * @param {CrossoverCreateManyAndReturnArgs} args - Arguments to create many Crossovers.
     * @example
     * // Create many Crossovers
     * const crossover = await prisma.crossover.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Crossovers and only return the `id`
     * const crossoverWithIdOnly = await prisma.crossover.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrossoverCreateManyAndReturnArgs>(args?: SelectSubset<T, CrossoverCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Crossover.
     * @param {CrossoverDeleteArgs} args - Arguments to delete one Crossover.
     * @example
     * // Delete one Crossover
     * const Crossover = await prisma.crossover.delete({
     *   where: {
     *     // ... filter to delete one Crossover
     *   }
     * })
     * 
     */
    delete<T extends CrossoverDeleteArgs>(args: SelectSubset<T, CrossoverDeleteArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Crossover.
     * @param {CrossoverUpdateArgs} args - Arguments to update one Crossover.
     * @example
     * // Update one Crossover
     * const crossover = await prisma.crossover.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrossoverUpdateArgs>(args: SelectSubset<T, CrossoverUpdateArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Crossovers.
     * @param {CrossoverDeleteManyArgs} args - Arguments to filter Crossovers to delete.
     * @example
     * // Delete a few Crossovers
     * const { count } = await prisma.crossover.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrossoverDeleteManyArgs>(args?: SelectSubset<T, CrossoverDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Crossovers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Crossovers
     * const crossover = await prisma.crossover.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrossoverUpdateManyArgs>(args: SelectSubset<T, CrossoverUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Crossover.
     * @param {CrossoverUpsertArgs} args - Arguments to update or create a Crossover.
     * @example
     * // Update or create a Crossover
     * const crossover = await prisma.crossover.upsert({
     *   create: {
     *     // ... data to create a Crossover
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Crossover we want to update
     *   }
     * })
     */
    upsert<T extends CrossoverUpsertArgs>(args: SelectSubset<T, CrossoverUpsertArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Crossovers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverCountArgs} args - Arguments to filter Crossovers to count.
     * @example
     * // Count the number of Crossovers
     * const count = await prisma.crossover.count({
     *   where: {
     *     // ... the filter for the Crossovers we want to count
     *   }
     * })
    **/
    count<T extends CrossoverCountArgs>(
      args?: Subset<T, CrossoverCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrossoverCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Crossover.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CrossoverAggregateArgs>(args: Subset<T, CrossoverAggregateArgs>): Prisma.PrismaPromise<GetCrossoverAggregateType<T>>

    /**
     * Group by Crossover.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverGroupByArgs} args - Group by arguments.
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
      T extends CrossoverGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrossoverGroupByArgs['orderBy'] }
        : { orderBy?: CrossoverGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CrossoverGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrossoverGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Crossover model
   */
  readonly fields: CrossoverFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Crossover.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrossoverClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    titles<T extends Crossover$titlesArgs<ExtArgs> = {}>(args?: Subset<T, Crossover$titlesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findMany"> | Null>
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
   * Fields of the Crossover model
   */ 
  interface CrossoverFieldRefs {
    readonly id: FieldRef<"Crossover", 'String'>
    readonly title: FieldRef<"Crossover", 'String'>
    readonly slug: FieldRef<"Crossover", 'String'>
    readonly description: FieldRef<"Crossover", 'String'>
    readonly coverImage: FieldRef<"Crossover", 'String'>
    readonly startDate: FieldRef<"Crossover", 'DateTime'>
    readonly endDate: FieldRef<"Crossover", 'DateTime'>
    readonly status: FieldRef<"Crossover", 'String'>
    readonly createdAt: FieldRef<"Crossover", 'DateTime'>
    readonly updatedAt: FieldRef<"Crossover", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Crossover findUnique
   */
  export type CrossoverFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter, which Crossover to fetch.
     */
    where: CrossoverWhereUniqueInput
  }

  /**
   * Crossover findUniqueOrThrow
   */
  export type CrossoverFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter, which Crossover to fetch.
     */
    where: CrossoverWhereUniqueInput
  }

  /**
   * Crossover findFirst
   */
  export type CrossoverFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter, which Crossover to fetch.
     */
    where?: CrossoverWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crossovers to fetch.
     */
    orderBy?: CrossoverOrderByWithRelationInput | CrossoverOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Crossovers.
     */
    cursor?: CrossoverWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crossovers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crossovers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Crossovers.
     */
    distinct?: CrossoverScalarFieldEnum | CrossoverScalarFieldEnum[]
  }

  /**
   * Crossover findFirstOrThrow
   */
  export type CrossoverFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter, which Crossover to fetch.
     */
    where?: CrossoverWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crossovers to fetch.
     */
    orderBy?: CrossoverOrderByWithRelationInput | CrossoverOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Crossovers.
     */
    cursor?: CrossoverWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crossovers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crossovers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Crossovers.
     */
    distinct?: CrossoverScalarFieldEnum | CrossoverScalarFieldEnum[]
  }

  /**
   * Crossover findMany
   */
  export type CrossoverFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter, which Crossovers to fetch.
     */
    where?: CrossoverWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crossovers to fetch.
     */
    orderBy?: CrossoverOrderByWithRelationInput | CrossoverOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Crossovers.
     */
    cursor?: CrossoverWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crossovers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crossovers.
     */
    skip?: number
    distinct?: CrossoverScalarFieldEnum | CrossoverScalarFieldEnum[]
  }

  /**
   * Crossover create
   */
  export type CrossoverCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * The data needed to create a Crossover.
     */
    data: XOR<CrossoverCreateInput, CrossoverUncheckedCreateInput>
  }

  /**
   * Crossover createMany
   */
  export type CrossoverCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Crossovers.
     */
    data: CrossoverCreateManyInput | CrossoverCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Crossover createManyAndReturn
   */
  export type CrossoverCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Crossovers.
     */
    data: CrossoverCreateManyInput | CrossoverCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Crossover update
   */
  export type CrossoverUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * The data needed to update a Crossover.
     */
    data: XOR<CrossoverUpdateInput, CrossoverUncheckedUpdateInput>
    /**
     * Choose, which Crossover to update.
     */
    where: CrossoverWhereUniqueInput
  }

  /**
   * Crossover updateMany
   */
  export type CrossoverUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Crossovers.
     */
    data: XOR<CrossoverUpdateManyMutationInput, CrossoverUncheckedUpdateManyInput>
    /**
     * Filter which Crossovers to update
     */
    where?: CrossoverWhereInput
  }

  /**
   * Crossover upsert
   */
  export type CrossoverUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * The filter to search for the Crossover to update in case it exists.
     */
    where: CrossoverWhereUniqueInput
    /**
     * In case the Crossover found by the `where` argument doesn't exist, create a new Crossover with this data.
     */
    create: XOR<CrossoverCreateInput, CrossoverUncheckedCreateInput>
    /**
     * In case the Crossover was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrossoverUpdateInput, CrossoverUncheckedUpdateInput>
  }

  /**
   * Crossover delete
   */
  export type CrossoverDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
    /**
     * Filter which Crossover to delete.
     */
    where: CrossoverWhereUniqueInput
  }

  /**
   * Crossover deleteMany
   */
  export type CrossoverDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Crossovers to delete
     */
    where?: CrossoverWhereInput
  }

  /**
   * Crossover.titles
   */
  export type Crossover$titlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    where?: CrossoverTitleWhereInput
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    cursor?: CrossoverTitleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CrossoverTitleScalarFieldEnum | CrossoverTitleScalarFieldEnum[]
  }

  /**
   * Crossover without action
   */
  export type CrossoverDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crossover
     */
    select?: CrossoverSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverInclude<ExtArgs> | null
  }


  /**
   * Model CrossoverTitle
   */

  export type AggregateCrossoverTitle = {
    _count: CrossoverTitleCountAggregateOutputType | null
    _min: CrossoverTitleMinAggregateOutputType | null
    _max: CrossoverTitleMaxAggregateOutputType | null
  }

  export type CrossoverTitleMinAggregateOutputType = {
    id: string | null
    crossoverId: string | null
    titleId: string | null
  }

  export type CrossoverTitleMaxAggregateOutputType = {
    id: string | null
    crossoverId: string | null
    titleId: string | null
  }

  export type CrossoverTitleCountAggregateOutputType = {
    id: number
    crossoverId: number
    titleId: number
    _all: number
  }


  export type CrossoverTitleMinAggregateInputType = {
    id?: true
    crossoverId?: true
    titleId?: true
  }

  export type CrossoverTitleMaxAggregateInputType = {
    id?: true
    crossoverId?: true
    titleId?: true
  }

  export type CrossoverTitleCountAggregateInputType = {
    id?: true
    crossoverId?: true
    titleId?: true
    _all?: true
  }

  export type CrossoverTitleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrossoverTitle to aggregate.
     */
    where?: CrossoverTitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrossoverTitles to fetch.
     */
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrossoverTitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrossoverTitles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrossoverTitles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CrossoverTitles
    **/
    _count?: true | CrossoverTitleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrossoverTitleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrossoverTitleMaxAggregateInputType
  }

  export type GetCrossoverTitleAggregateType<T extends CrossoverTitleAggregateArgs> = {
        [P in keyof T & keyof AggregateCrossoverTitle]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrossoverTitle[P]>
      : GetScalarType<T[P], AggregateCrossoverTitle[P]>
  }




  export type CrossoverTitleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrossoverTitleWhereInput
    orderBy?: CrossoverTitleOrderByWithAggregationInput | CrossoverTitleOrderByWithAggregationInput[]
    by: CrossoverTitleScalarFieldEnum[] | CrossoverTitleScalarFieldEnum
    having?: CrossoverTitleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrossoverTitleCountAggregateInputType | true
    _min?: CrossoverTitleMinAggregateInputType
    _max?: CrossoverTitleMaxAggregateInputType
  }

  export type CrossoverTitleGroupByOutputType = {
    id: string
    crossoverId: string
    titleId: string
    _count: CrossoverTitleCountAggregateOutputType | null
    _min: CrossoverTitleMinAggregateOutputType | null
    _max: CrossoverTitleMaxAggregateOutputType | null
  }

  type GetCrossoverTitleGroupByPayload<T extends CrossoverTitleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrossoverTitleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrossoverTitleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrossoverTitleGroupByOutputType[P]>
            : GetScalarType<T[P], CrossoverTitleGroupByOutputType[P]>
        }
      >
    >


  export type CrossoverTitleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    crossoverId?: boolean
    titleId?: boolean
    crossover?: boolean | CrossoverDefaultArgs<ExtArgs>
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crossoverTitle"]>

  export type CrossoverTitleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    crossoverId?: boolean
    titleId?: boolean
    crossover?: boolean | CrossoverDefaultArgs<ExtArgs>
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crossoverTitle"]>

  export type CrossoverTitleSelectScalar = {
    id?: boolean
    crossoverId?: boolean
    titleId?: boolean
  }

  export type CrossoverTitleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    crossover?: boolean | CrossoverDefaultArgs<ExtArgs>
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }
  export type CrossoverTitleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    crossover?: boolean | CrossoverDefaultArgs<ExtArgs>
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }

  export type $CrossoverTitlePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CrossoverTitle"
    objects: {
      crossover: Prisma.$CrossoverPayload<ExtArgs>
      title: Prisma.$TitlePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      crossoverId: string
      titleId: string
    }, ExtArgs["result"]["crossoverTitle"]>
    composites: {}
  }

  type CrossoverTitleGetPayload<S extends boolean | null | undefined | CrossoverTitleDefaultArgs> = $Result.GetResult<Prisma.$CrossoverTitlePayload, S>

  type CrossoverTitleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<CrossoverTitleFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: CrossoverTitleCountAggregateInputType | true
    }

  export interface CrossoverTitleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CrossoverTitle'], meta: { name: 'CrossoverTitle' } }
    /**
     * Find zero or one CrossoverTitle that matches the filter.
     * @param {CrossoverTitleFindUniqueArgs} args - Arguments to find a CrossoverTitle
     * @example
     * // Get one CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrossoverTitleFindUniqueArgs>(args: SelectSubset<T, CrossoverTitleFindUniqueArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one CrossoverTitle that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {CrossoverTitleFindUniqueOrThrowArgs} args - Arguments to find a CrossoverTitle
     * @example
     * // Get one CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrossoverTitleFindUniqueOrThrowArgs>(args: SelectSubset<T, CrossoverTitleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first CrossoverTitle that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleFindFirstArgs} args - Arguments to find a CrossoverTitle
     * @example
     * // Get one CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrossoverTitleFindFirstArgs>(args?: SelectSubset<T, CrossoverTitleFindFirstArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first CrossoverTitle that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleFindFirstOrThrowArgs} args - Arguments to find a CrossoverTitle
     * @example
     * // Get one CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrossoverTitleFindFirstOrThrowArgs>(args?: SelectSubset<T, CrossoverTitleFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more CrossoverTitles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CrossoverTitles
     * const crossoverTitles = await prisma.crossoverTitle.findMany()
     * 
     * // Get first 10 CrossoverTitles
     * const crossoverTitles = await prisma.crossoverTitle.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crossoverTitleWithIdOnly = await prisma.crossoverTitle.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrossoverTitleFindManyArgs>(args?: SelectSubset<T, CrossoverTitleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a CrossoverTitle.
     * @param {CrossoverTitleCreateArgs} args - Arguments to create a CrossoverTitle.
     * @example
     * // Create one CrossoverTitle
     * const CrossoverTitle = await prisma.crossoverTitle.create({
     *   data: {
     *     // ... data to create a CrossoverTitle
     *   }
     * })
     * 
     */
    create<T extends CrossoverTitleCreateArgs>(args: SelectSubset<T, CrossoverTitleCreateArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many CrossoverTitles.
     * @param {CrossoverTitleCreateManyArgs} args - Arguments to create many CrossoverTitles.
     * @example
     * // Create many CrossoverTitles
     * const crossoverTitle = await prisma.crossoverTitle.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrossoverTitleCreateManyArgs>(args?: SelectSubset<T, CrossoverTitleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CrossoverTitles and returns the data saved in the database.
     * @param {CrossoverTitleCreateManyAndReturnArgs} args - Arguments to create many CrossoverTitles.
     * @example
     * // Create many CrossoverTitles
     * const crossoverTitle = await prisma.crossoverTitle.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CrossoverTitles and only return the `id`
     * const crossoverTitleWithIdOnly = await prisma.crossoverTitle.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrossoverTitleCreateManyAndReturnArgs>(args?: SelectSubset<T, CrossoverTitleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a CrossoverTitle.
     * @param {CrossoverTitleDeleteArgs} args - Arguments to delete one CrossoverTitle.
     * @example
     * // Delete one CrossoverTitle
     * const CrossoverTitle = await prisma.crossoverTitle.delete({
     *   where: {
     *     // ... filter to delete one CrossoverTitle
     *   }
     * })
     * 
     */
    delete<T extends CrossoverTitleDeleteArgs>(args: SelectSubset<T, CrossoverTitleDeleteArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one CrossoverTitle.
     * @param {CrossoverTitleUpdateArgs} args - Arguments to update one CrossoverTitle.
     * @example
     * // Update one CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrossoverTitleUpdateArgs>(args: SelectSubset<T, CrossoverTitleUpdateArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more CrossoverTitles.
     * @param {CrossoverTitleDeleteManyArgs} args - Arguments to filter CrossoverTitles to delete.
     * @example
     * // Delete a few CrossoverTitles
     * const { count } = await prisma.crossoverTitle.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrossoverTitleDeleteManyArgs>(args?: SelectSubset<T, CrossoverTitleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrossoverTitles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CrossoverTitles
     * const crossoverTitle = await prisma.crossoverTitle.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrossoverTitleUpdateManyArgs>(args: SelectSubset<T, CrossoverTitleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one CrossoverTitle.
     * @param {CrossoverTitleUpsertArgs} args - Arguments to update or create a CrossoverTitle.
     * @example
     * // Update or create a CrossoverTitle
     * const crossoverTitle = await prisma.crossoverTitle.upsert({
     *   create: {
     *     // ... data to create a CrossoverTitle
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CrossoverTitle we want to update
     *   }
     * })
     */
    upsert<T extends CrossoverTitleUpsertArgs>(args: SelectSubset<T, CrossoverTitleUpsertArgs<ExtArgs>>): Prisma__CrossoverTitleClient<$Result.GetResult<Prisma.$CrossoverTitlePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of CrossoverTitles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleCountArgs} args - Arguments to filter CrossoverTitles to count.
     * @example
     * // Count the number of CrossoverTitles
     * const count = await prisma.crossoverTitle.count({
     *   where: {
     *     // ... the filter for the CrossoverTitles we want to count
     *   }
     * })
    **/
    count<T extends CrossoverTitleCountArgs>(
      args?: Subset<T, CrossoverTitleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrossoverTitleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CrossoverTitle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CrossoverTitleAggregateArgs>(args: Subset<T, CrossoverTitleAggregateArgs>): Prisma.PrismaPromise<GetCrossoverTitleAggregateType<T>>

    /**
     * Group by CrossoverTitle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrossoverTitleGroupByArgs} args - Group by arguments.
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
      T extends CrossoverTitleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrossoverTitleGroupByArgs['orderBy'] }
        : { orderBy?: CrossoverTitleGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CrossoverTitleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrossoverTitleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CrossoverTitle model
   */
  readonly fields: CrossoverTitleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CrossoverTitle.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrossoverTitleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    crossover<T extends CrossoverDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CrossoverDefaultArgs<ExtArgs>>): Prisma__CrossoverClient<$Result.GetResult<Prisma.$CrossoverPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    title<T extends TitleDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TitleDefaultArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the CrossoverTitle model
   */ 
  interface CrossoverTitleFieldRefs {
    readonly id: FieldRef<"CrossoverTitle", 'String'>
    readonly crossoverId: FieldRef<"CrossoverTitle", 'String'>
    readonly titleId: FieldRef<"CrossoverTitle", 'String'>
  }
    

  // Custom InputTypes
  /**
   * CrossoverTitle findUnique
   */
  export type CrossoverTitleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter, which CrossoverTitle to fetch.
     */
    where: CrossoverTitleWhereUniqueInput
  }

  /**
   * CrossoverTitle findUniqueOrThrow
   */
  export type CrossoverTitleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter, which CrossoverTitle to fetch.
     */
    where: CrossoverTitleWhereUniqueInput
  }

  /**
   * CrossoverTitle findFirst
   */
  export type CrossoverTitleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter, which CrossoverTitle to fetch.
     */
    where?: CrossoverTitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrossoverTitles to fetch.
     */
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrossoverTitles.
     */
    cursor?: CrossoverTitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrossoverTitles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrossoverTitles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrossoverTitles.
     */
    distinct?: CrossoverTitleScalarFieldEnum | CrossoverTitleScalarFieldEnum[]
  }

  /**
   * CrossoverTitle findFirstOrThrow
   */
  export type CrossoverTitleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter, which CrossoverTitle to fetch.
     */
    where?: CrossoverTitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrossoverTitles to fetch.
     */
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrossoverTitles.
     */
    cursor?: CrossoverTitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrossoverTitles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrossoverTitles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrossoverTitles.
     */
    distinct?: CrossoverTitleScalarFieldEnum | CrossoverTitleScalarFieldEnum[]
  }

  /**
   * CrossoverTitle findMany
   */
  export type CrossoverTitleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter, which CrossoverTitles to fetch.
     */
    where?: CrossoverTitleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrossoverTitles to fetch.
     */
    orderBy?: CrossoverTitleOrderByWithRelationInput | CrossoverTitleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CrossoverTitles.
     */
    cursor?: CrossoverTitleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrossoverTitles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrossoverTitles.
     */
    skip?: number
    distinct?: CrossoverTitleScalarFieldEnum | CrossoverTitleScalarFieldEnum[]
  }

  /**
   * CrossoverTitle create
   */
  export type CrossoverTitleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * The data needed to create a CrossoverTitle.
     */
    data: XOR<CrossoverTitleCreateInput, CrossoverTitleUncheckedCreateInput>
  }

  /**
   * CrossoverTitle createMany
   */
  export type CrossoverTitleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CrossoverTitles.
     */
    data: CrossoverTitleCreateManyInput | CrossoverTitleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrossoverTitle createManyAndReturn
   */
  export type CrossoverTitleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many CrossoverTitles.
     */
    data: CrossoverTitleCreateManyInput | CrossoverTitleCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CrossoverTitle update
   */
  export type CrossoverTitleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * The data needed to update a CrossoverTitle.
     */
    data: XOR<CrossoverTitleUpdateInput, CrossoverTitleUncheckedUpdateInput>
    /**
     * Choose, which CrossoverTitle to update.
     */
    where: CrossoverTitleWhereUniqueInput
  }

  /**
   * CrossoverTitle updateMany
   */
  export type CrossoverTitleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CrossoverTitles.
     */
    data: XOR<CrossoverTitleUpdateManyMutationInput, CrossoverTitleUncheckedUpdateManyInput>
    /**
     * Filter which CrossoverTitles to update
     */
    where?: CrossoverTitleWhereInput
  }

  /**
   * CrossoverTitle upsert
   */
  export type CrossoverTitleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * The filter to search for the CrossoverTitle to update in case it exists.
     */
    where: CrossoverTitleWhereUniqueInput
    /**
     * In case the CrossoverTitle found by the `where` argument doesn't exist, create a new CrossoverTitle with this data.
     */
    create: XOR<CrossoverTitleCreateInput, CrossoverTitleUncheckedCreateInput>
    /**
     * In case the CrossoverTitle was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrossoverTitleUpdateInput, CrossoverTitleUncheckedUpdateInput>
  }

  /**
   * CrossoverTitle delete
   */
  export type CrossoverTitleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
    /**
     * Filter which CrossoverTitle to delete.
     */
    where: CrossoverTitleWhereUniqueInput
  }

  /**
   * CrossoverTitle deleteMany
   */
  export type CrossoverTitleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrossoverTitles to delete
     */
    where?: CrossoverTitleWhereInput
  }

  /**
   * CrossoverTitle without action
   */
  export type CrossoverTitleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrossoverTitle
     */
    select?: CrossoverTitleSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrossoverTitleInclude<ExtArgs> | null
  }


  /**
   * Model Recap
   */

  export type AggregateRecap = {
    _count: RecapCountAggregateOutputType | null
    _avg: RecapAvgAggregateOutputType | null
    _sum: RecapSumAggregateOutputType | null
    _min: RecapMinAggregateOutputType | null
    _max: RecapMaxAggregateOutputType | null
  }

  export type RecapAvgAggregateOutputType = {
    season: number | null
    episode: number | null
    viewCount: number | null
  }

  export type RecapSumAggregateOutputType = {
    season: number | null
    episode: number | null
    viewCount: number | null
  }

  export type RecapMinAggregateOutputType = {
    id: string | null
    titleId: string | null
    season: number | null
    episode: number | null
    name: string | null
    content: string | null
    coverImage: string | null
    isSpoiler: boolean | null
    viewCount: number | null
    status: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type RecapMaxAggregateOutputType = {
    id: string | null
    titleId: string | null
    season: number | null
    episode: number | null
    name: string | null
    content: string | null
    coverImage: string | null
    isSpoiler: boolean | null
    viewCount: number | null
    status: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type RecapCountAggregateOutputType = {
    id: number
    titleId: number
    season: number
    episode: number
    name: number
    content: number
    coverImage: number
    isSpoiler: number
    viewCount: number
    status: number
    publishedAt: number
    createdAt: number
    _all: number
  }


  export type RecapAvgAggregateInputType = {
    season?: true
    episode?: true
    viewCount?: true
  }

  export type RecapSumAggregateInputType = {
    season?: true
    episode?: true
    viewCount?: true
  }

  export type RecapMinAggregateInputType = {
    id?: true
    titleId?: true
    season?: true
    episode?: true
    name?: true
    content?: true
    coverImage?: true
    isSpoiler?: true
    viewCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
  }

  export type RecapMaxAggregateInputType = {
    id?: true
    titleId?: true
    season?: true
    episode?: true
    name?: true
    content?: true
    coverImage?: true
    isSpoiler?: true
    viewCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
  }

  export type RecapCountAggregateInputType = {
    id?: true
    titleId?: true
    season?: true
    episode?: true
    name?: true
    content?: true
    coverImage?: true
    isSpoiler?: true
    viewCount?: true
    status?: true
    publishedAt?: true
    createdAt?: true
    _all?: true
  }

  export type RecapAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Recap to aggregate.
     */
    where?: RecapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recaps to fetch.
     */
    orderBy?: RecapOrderByWithRelationInput | RecapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Recaps
    **/
    _count?: true | RecapCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RecapAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RecapSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecapMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecapMaxAggregateInputType
  }

  export type GetRecapAggregateType<T extends RecapAggregateArgs> = {
        [P in keyof T & keyof AggregateRecap]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecap[P]>
      : GetScalarType<T[P], AggregateRecap[P]>
  }




  export type RecapGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecapWhereInput
    orderBy?: RecapOrderByWithAggregationInput | RecapOrderByWithAggregationInput[]
    by: RecapScalarFieldEnum[] | RecapScalarFieldEnum
    having?: RecapScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecapCountAggregateInputType | true
    _avg?: RecapAvgAggregateInputType
    _sum?: RecapSumAggregateInputType
    _min?: RecapMinAggregateInputType
    _max?: RecapMaxAggregateInputType
  }

  export type RecapGroupByOutputType = {
    id: string
    titleId: string
    season: number | null
    episode: number | null
    name: string | null
    content: string
    coverImage: string | null
    isSpoiler: boolean
    viewCount: number
    status: string
    publishedAt: Date | null
    createdAt: Date
    _count: RecapCountAggregateOutputType | null
    _avg: RecapAvgAggregateOutputType | null
    _sum: RecapSumAggregateOutputType | null
    _min: RecapMinAggregateOutputType | null
    _max: RecapMaxAggregateOutputType | null
  }

  type GetRecapGroupByPayload<T extends RecapGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecapGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecapGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecapGroupByOutputType[P]>
            : GetScalarType<T[P], RecapGroupByOutputType[P]>
        }
      >
    >


  export type RecapSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    titleId?: boolean
    season?: boolean
    episode?: boolean
    name?: boolean
    content?: boolean
    coverImage?: boolean
    isSpoiler?: boolean
    viewCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recap"]>

  export type RecapSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    titleId?: boolean
    season?: boolean
    episode?: boolean
    name?: boolean
    content?: boolean
    coverImage?: boolean
    isSpoiler?: boolean
    viewCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recap"]>

  export type RecapSelectScalar = {
    id?: boolean
    titleId?: boolean
    season?: boolean
    episode?: boolean
    name?: boolean
    content?: boolean
    coverImage?: boolean
    isSpoiler?: boolean
    viewCount?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
  }

  export type RecapInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }
  export type RecapIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    title?: boolean | TitleDefaultArgs<ExtArgs>
  }

  export type $RecapPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Recap"
    objects: {
      title: Prisma.$TitlePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      titleId: string
      season: number | null
      episode: number | null
      name: string | null
      content: string
      coverImage: string | null
      isSpoiler: boolean
      viewCount: number
      status: string
      publishedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["recap"]>
    composites: {}
  }

  type RecapGetPayload<S extends boolean | null | undefined | RecapDefaultArgs> = $Result.GetResult<Prisma.$RecapPayload, S>

  type RecapCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RecapFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RecapCountAggregateInputType | true
    }

  export interface RecapDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Recap'], meta: { name: 'Recap' } }
    /**
     * Find zero or one Recap that matches the filter.
     * @param {RecapFindUniqueArgs} args - Arguments to find a Recap
     * @example
     * // Get one Recap
     * const recap = await prisma.recap.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecapFindUniqueArgs>(args: SelectSubset<T, RecapFindUniqueArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Recap that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RecapFindUniqueOrThrowArgs} args - Arguments to find a Recap
     * @example
     * // Get one Recap
     * const recap = await prisma.recap.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecapFindUniqueOrThrowArgs>(args: SelectSubset<T, RecapFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Recap that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapFindFirstArgs} args - Arguments to find a Recap
     * @example
     * // Get one Recap
     * const recap = await prisma.recap.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecapFindFirstArgs>(args?: SelectSubset<T, RecapFindFirstArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Recap that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapFindFirstOrThrowArgs} args - Arguments to find a Recap
     * @example
     * // Get one Recap
     * const recap = await prisma.recap.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecapFindFirstOrThrowArgs>(args?: SelectSubset<T, RecapFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Recaps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Recaps
     * const recaps = await prisma.recap.findMany()
     * 
     * // Get first 10 Recaps
     * const recaps = await prisma.recap.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recapWithIdOnly = await prisma.recap.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecapFindManyArgs>(args?: SelectSubset<T, RecapFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Recap.
     * @param {RecapCreateArgs} args - Arguments to create a Recap.
     * @example
     * // Create one Recap
     * const Recap = await prisma.recap.create({
     *   data: {
     *     // ... data to create a Recap
     *   }
     * })
     * 
     */
    create<T extends RecapCreateArgs>(args: SelectSubset<T, RecapCreateArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Recaps.
     * @param {RecapCreateManyArgs} args - Arguments to create many Recaps.
     * @example
     * // Create many Recaps
     * const recap = await prisma.recap.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecapCreateManyArgs>(args?: SelectSubset<T, RecapCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Recaps and returns the data saved in the database.
     * @param {RecapCreateManyAndReturnArgs} args - Arguments to create many Recaps.
     * @example
     * // Create many Recaps
     * const recap = await prisma.recap.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Recaps and only return the `id`
     * const recapWithIdOnly = await prisma.recap.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecapCreateManyAndReturnArgs>(args?: SelectSubset<T, RecapCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Recap.
     * @param {RecapDeleteArgs} args - Arguments to delete one Recap.
     * @example
     * // Delete one Recap
     * const Recap = await prisma.recap.delete({
     *   where: {
     *     // ... filter to delete one Recap
     *   }
     * })
     * 
     */
    delete<T extends RecapDeleteArgs>(args: SelectSubset<T, RecapDeleteArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Recap.
     * @param {RecapUpdateArgs} args - Arguments to update one Recap.
     * @example
     * // Update one Recap
     * const recap = await prisma.recap.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecapUpdateArgs>(args: SelectSubset<T, RecapUpdateArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Recaps.
     * @param {RecapDeleteManyArgs} args - Arguments to filter Recaps to delete.
     * @example
     * // Delete a few Recaps
     * const { count } = await prisma.recap.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecapDeleteManyArgs>(args?: SelectSubset<T, RecapDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Recaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Recaps
     * const recap = await prisma.recap.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecapUpdateManyArgs>(args: SelectSubset<T, RecapUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Recap.
     * @param {RecapUpsertArgs} args - Arguments to update or create a Recap.
     * @example
     * // Update or create a Recap
     * const recap = await prisma.recap.upsert({
     *   create: {
     *     // ... data to create a Recap
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Recap we want to update
     *   }
     * })
     */
    upsert<T extends RecapUpsertArgs>(args: SelectSubset<T, RecapUpsertArgs<ExtArgs>>): Prisma__RecapClient<$Result.GetResult<Prisma.$RecapPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Recaps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapCountArgs} args - Arguments to filter Recaps to count.
     * @example
     * // Count the number of Recaps
     * const count = await prisma.recap.count({
     *   where: {
     *     // ... the filter for the Recaps we want to count
     *   }
     * })
    **/
    count<T extends RecapCountArgs>(
      args?: Subset<T, RecapCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecapCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Recap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends RecapAggregateArgs>(args: Subset<T, RecapAggregateArgs>): Prisma.PrismaPromise<GetRecapAggregateType<T>>

    /**
     * Group by Recap.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecapGroupByArgs} args - Group by arguments.
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
      T extends RecapGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecapGroupByArgs['orderBy'] }
        : { orderBy?: RecapGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, RecapGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecapGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Recap model
   */
  readonly fields: RecapFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Recap.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecapClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    title<T extends TitleDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TitleDefaultArgs<ExtArgs>>): Prisma__TitleClient<$Result.GetResult<Prisma.$TitlePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
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
   * Fields of the Recap model
   */ 
  interface RecapFieldRefs {
    readonly id: FieldRef<"Recap", 'String'>
    readonly titleId: FieldRef<"Recap", 'String'>
    readonly season: FieldRef<"Recap", 'Int'>
    readonly episode: FieldRef<"Recap", 'Int'>
    readonly name: FieldRef<"Recap", 'String'>
    readonly content: FieldRef<"Recap", 'String'>
    readonly coverImage: FieldRef<"Recap", 'String'>
    readonly isSpoiler: FieldRef<"Recap", 'Boolean'>
    readonly viewCount: FieldRef<"Recap", 'Int'>
    readonly status: FieldRef<"Recap", 'String'>
    readonly publishedAt: FieldRef<"Recap", 'DateTime'>
    readonly createdAt: FieldRef<"Recap", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Recap findUnique
   */
  export type RecapFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter, which Recap to fetch.
     */
    where: RecapWhereUniqueInput
  }

  /**
   * Recap findUniqueOrThrow
   */
  export type RecapFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter, which Recap to fetch.
     */
    where: RecapWhereUniqueInput
  }

  /**
   * Recap findFirst
   */
  export type RecapFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter, which Recap to fetch.
     */
    where?: RecapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recaps to fetch.
     */
    orderBy?: RecapOrderByWithRelationInput | RecapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Recaps.
     */
    cursor?: RecapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Recaps.
     */
    distinct?: RecapScalarFieldEnum | RecapScalarFieldEnum[]
  }

  /**
   * Recap findFirstOrThrow
   */
  export type RecapFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter, which Recap to fetch.
     */
    where?: RecapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recaps to fetch.
     */
    orderBy?: RecapOrderByWithRelationInput | RecapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Recaps.
     */
    cursor?: RecapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recaps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Recaps.
     */
    distinct?: RecapScalarFieldEnum | RecapScalarFieldEnum[]
  }

  /**
   * Recap findMany
   */
  export type RecapFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter, which Recaps to fetch.
     */
    where?: RecapWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Recaps to fetch.
     */
    orderBy?: RecapOrderByWithRelationInput | RecapOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Recaps.
     */
    cursor?: RecapWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Recaps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Recaps.
     */
    skip?: number
    distinct?: RecapScalarFieldEnum | RecapScalarFieldEnum[]
  }

  /**
   * Recap create
   */
  export type RecapCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * The data needed to create a Recap.
     */
    data: XOR<RecapCreateInput, RecapUncheckedCreateInput>
  }

  /**
   * Recap createMany
   */
  export type RecapCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Recaps.
     */
    data: RecapCreateManyInput | RecapCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Recap createManyAndReturn
   */
  export type RecapCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Recaps.
     */
    data: RecapCreateManyInput | RecapCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Recap update
   */
  export type RecapUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * The data needed to update a Recap.
     */
    data: XOR<RecapUpdateInput, RecapUncheckedUpdateInput>
    /**
     * Choose, which Recap to update.
     */
    where: RecapWhereUniqueInput
  }

  /**
   * Recap updateMany
   */
  export type RecapUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Recaps.
     */
    data: XOR<RecapUpdateManyMutationInput, RecapUncheckedUpdateManyInput>
    /**
     * Filter which Recaps to update
     */
    where?: RecapWhereInput
  }

  /**
   * Recap upsert
   */
  export type RecapUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * The filter to search for the Recap to update in case it exists.
     */
    where: RecapWhereUniqueInput
    /**
     * In case the Recap found by the `where` argument doesn't exist, create a new Recap with this data.
     */
    create: XOR<RecapCreateInput, RecapUncheckedCreateInput>
    /**
     * In case the Recap was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecapUpdateInput, RecapUncheckedUpdateInput>
  }

  /**
   * Recap delete
   */
  export type RecapDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
    /**
     * Filter which Recap to delete.
     */
    where: RecapWhereUniqueInput
  }

  /**
   * Recap deleteMany
   */
  export type RecapDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Recaps to delete
     */
    where?: RecapWhereInput
  }

  /**
   * Recap without action
   */
  export type RecapDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Recap
     */
    select?: RecapSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecapInclude<ExtArgs> | null
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


  export const UniverseMapScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    imageUrl: 'imageUrl',
    data: 'data',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UniverseMapScalarFieldEnum = (typeof UniverseMapScalarFieldEnum)[keyof typeof UniverseMapScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    imageUrl: 'imageUrl',
    latitude: 'latitude',
    longitude: 'longitude',
    universeId: 'universeId',
    parentId: 'parentId',
    data: 'data',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const CharacterScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    avatarUrl: 'avatarUrl',
    role: 'role',
    status: 'status',
    universeId: 'universeId',
    birthDate: 'birthDate',
    data: 'data',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CharacterScalarFieldEnum = (typeof CharacterScalarFieldEnum)[keyof typeof CharacterScalarFieldEnum]


  export const CharacterLocationScalarFieldEnum: {
    id: 'id',
    characterId: 'characterId',
    locationId: 'locationId',
    role: 'role',
    description: 'description',
    firstSeenAt: 'firstSeenAt',
    lastSeenAt: 'lastSeenAt',
    createdAt: 'createdAt'
  };

  export type CharacterLocationScalarFieldEnum = (typeof CharacterLocationScalarFieldEnum)[keyof typeof CharacterLocationScalarFieldEnum]


  export const CharacterRelationshipScalarFieldEnum: {
    id: 'id',
    fromId: 'fromId',
    toId: 'toId',
    type: 'type',
    description: 'description',
    startDate: 'startDate',
    endDate: 'endDate',
    isOfficial: 'isOfficial',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CharacterRelationshipScalarFieldEnum = (typeof CharacterRelationshipScalarFieldEnum)[keyof typeof CharacterRelationshipScalarFieldEnum]


  export const TimelineEventScalarFieldEnum: {
    id: 'id',
    title: 'title',
    description: 'description',
    date: 'date',
    endDate: 'endDate',
    type: 'type',
    importance: 'importance',
    universeId: 'universeId',
    characterId: 'characterId',
    locationId: 'locationId',
    data: 'data',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TimelineEventScalarFieldEnum = (typeof TimelineEventScalarFieldEnum)[keyof typeof TimelineEventScalarFieldEnum]


  export const TitleScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    type: 'type',
    description: 'description',
    coverImage: 'coverImage',
    releaseYear: 'releaseYear',
    endYear: 'endYear',
    status: 'status',
    rating: 'rating',
    universeId: 'universeId',
    viewCount: 'viewCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TitleScalarFieldEnum = (typeof TitleScalarFieldEnum)[keyof typeof TitleScalarFieldEnum]


  export const ChapterScalarFieldEnum: {
    id: 'id',
    titleId: 'titleId',
    number: 'number',
    name: 'name',
    description: 'description',
    coverImage: 'coverImage',
    content: 'content',
    wordCount: 'wordCount',
    status: 'status',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt'
  };

  export type ChapterScalarFieldEnum = (typeof ChapterScalarFieldEnum)[keyof typeof ChapterScalarFieldEnum]


  export const LoreEntryScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    category: 'category',
    content: 'content',
    excerpt: 'excerpt',
    coverImage: 'coverImage',
    importance: 'importance',
    universeId: 'universeId',
    viewCount: 'viewCount',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LoreEntryScalarFieldEnum = (typeof LoreEntryScalarFieldEnum)[keyof typeof LoreEntryScalarFieldEnum]


  export const CrossoverScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    description: 'description',
    coverImage: 'coverImage',
    startDate: 'startDate',
    endDate: 'endDate',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CrossoverScalarFieldEnum = (typeof CrossoverScalarFieldEnum)[keyof typeof CrossoverScalarFieldEnum]


  export const CrossoverTitleScalarFieldEnum: {
    id: 'id',
    crossoverId: 'crossoverId',
    titleId: 'titleId'
  };

  export type CrossoverTitleScalarFieldEnum = (typeof CrossoverTitleScalarFieldEnum)[keyof typeof CrossoverTitleScalarFieldEnum]


  export const RecapScalarFieldEnum: {
    id: 'id',
    titleId: 'titleId',
    season: 'season',
    episode: 'episode',
    name: 'name',
    content: 'content',
    coverImage: 'coverImage',
    isSpoiler: 'isSpoiler',
    viewCount: 'viewCount',
    status: 'status',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt'
  };

  export type RecapScalarFieldEnum = (typeof RecapScalarFieldEnum)[keyof typeof RecapScalarFieldEnum]


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
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


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
   * Deep Input Types
   */


  export type UniverseMapWhereInput = {
    AND?: UniverseMapWhereInput | UniverseMapWhereInput[]
    OR?: UniverseMapWhereInput[]
    NOT?: UniverseMapWhereInput | UniverseMapWhereInput[]
    id?: StringFilter<"UniverseMap"> | string
    name?: StringFilter<"UniverseMap"> | string
    slug?: StringFilter<"UniverseMap"> | string
    description?: StringNullableFilter<"UniverseMap"> | string | null
    imageUrl?: StringNullableFilter<"UniverseMap"> | string | null
    data?: JsonNullableFilter<"UniverseMap">
    status?: StringFilter<"UniverseMap"> | string
    createdAt?: DateTimeFilter<"UniverseMap"> | Date | string
    updatedAt?: DateTimeFilter<"UniverseMap"> | Date | string
    characters?: CharacterListRelationFilter
    locations?: LocationListRelationFilter
    timeline?: TimelineEventListRelationFilter
    titles?: TitleListRelationFilter
    loreEntries?: LoreEntryListRelationFilter
  }

  export type UniverseMapOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    characters?: CharacterOrderByRelationAggregateInput
    locations?: LocationOrderByRelationAggregateInput
    timeline?: TimelineEventOrderByRelationAggregateInput
    titles?: TitleOrderByRelationAggregateInput
    loreEntries?: LoreEntryOrderByRelationAggregateInput
  }

  export type UniverseMapWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: UniverseMapWhereInput | UniverseMapWhereInput[]
    OR?: UniverseMapWhereInput[]
    NOT?: UniverseMapWhereInput | UniverseMapWhereInput[]
    name?: StringFilter<"UniverseMap"> | string
    description?: StringNullableFilter<"UniverseMap"> | string | null
    imageUrl?: StringNullableFilter<"UniverseMap"> | string | null
    data?: JsonNullableFilter<"UniverseMap">
    status?: StringFilter<"UniverseMap"> | string
    createdAt?: DateTimeFilter<"UniverseMap"> | Date | string
    updatedAt?: DateTimeFilter<"UniverseMap"> | Date | string
    characters?: CharacterListRelationFilter
    locations?: LocationListRelationFilter
    timeline?: TimelineEventListRelationFilter
    titles?: TitleListRelationFilter
    loreEntries?: LoreEntryListRelationFilter
  }, "id" | "slug">

  export type UniverseMapOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UniverseMapCountOrderByAggregateInput
    _max?: UniverseMapMaxOrderByAggregateInput
    _min?: UniverseMapMinOrderByAggregateInput
  }

  export type UniverseMapScalarWhereWithAggregatesInput = {
    AND?: UniverseMapScalarWhereWithAggregatesInput | UniverseMapScalarWhereWithAggregatesInput[]
    OR?: UniverseMapScalarWhereWithAggregatesInput[]
    NOT?: UniverseMapScalarWhereWithAggregatesInput | UniverseMapScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UniverseMap"> | string
    name?: StringWithAggregatesFilter<"UniverseMap"> | string
    slug?: StringWithAggregatesFilter<"UniverseMap"> | string
    description?: StringNullableWithAggregatesFilter<"UniverseMap"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"UniverseMap"> | string | null
    data?: JsonNullableWithAggregatesFilter<"UniverseMap">
    status?: StringWithAggregatesFilter<"UniverseMap"> | string
    createdAt?: DateTimeWithAggregatesFilter<"UniverseMap"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"UniverseMap"> | Date | string
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    name?: StringFilter<"Location"> | string
    slug?: StringFilter<"Location"> | string
    description?: StringNullableFilter<"Location"> | string | null
    imageUrl?: StringNullableFilter<"Location"> | string | null
    latitude?: FloatNullableFilter<"Location"> | number | null
    longitude?: FloatNullableFilter<"Location"> | number | null
    universeId?: StringFilter<"Location"> | string
    parentId?: StringNullableFilter<"Location"> | string | null
    data?: JsonNullableFilter<"Location">
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    parent?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
    children?: LocationListRelationFilter
    characters?: CharacterLocationListRelationFilter
    timeline?: TimelineEventListRelationFilter
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    universeId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    universe?: UniverseMapOrderByWithRelationInput
    parent?: LocationOrderByWithRelationInput
    children?: LocationOrderByRelationAggregateInput
    characters?: CharacterLocationOrderByRelationAggregateInput
    timeline?: TimelineEventOrderByRelationAggregateInput
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    name?: StringFilter<"Location"> | string
    description?: StringNullableFilter<"Location"> | string | null
    imageUrl?: StringNullableFilter<"Location"> | string | null
    latitude?: FloatNullableFilter<"Location"> | number | null
    longitude?: FloatNullableFilter<"Location"> | number | null
    universeId?: StringFilter<"Location"> | string
    parentId?: StringNullableFilter<"Location"> | string | null
    data?: JsonNullableFilter<"Location">
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    parent?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
    children?: LocationListRelationFilter
    characters?: CharacterLocationListRelationFilter
    timeline?: TimelineEventListRelationFilter
  }, "id" | "slug">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    imageUrl?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    universeId?: SortOrder
    parentId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _avg?: LocationAvgOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
    _sum?: LocationSumOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    name?: StringWithAggregatesFilter<"Location"> | string
    slug?: StringWithAggregatesFilter<"Location"> | string
    description?: StringNullableWithAggregatesFilter<"Location"> | string | null
    imageUrl?: StringNullableWithAggregatesFilter<"Location"> | string | null
    latitude?: FloatNullableWithAggregatesFilter<"Location"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"Location"> | number | null
    universeId?: StringWithAggregatesFilter<"Location"> | string
    parentId?: StringNullableWithAggregatesFilter<"Location"> | string | null
    data?: JsonNullableWithAggregatesFilter<"Location">
    createdAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
  }

  export type CharacterWhereInput = {
    AND?: CharacterWhereInput | CharacterWhereInput[]
    OR?: CharacterWhereInput[]
    NOT?: CharacterWhereInput | CharacterWhereInput[]
    id?: StringFilter<"Character"> | string
    name?: StringFilter<"Character"> | string
    slug?: StringFilter<"Character"> | string
    description?: StringNullableFilter<"Character"> | string | null
    avatarUrl?: StringNullableFilter<"Character"> | string | null
    role?: StringNullableFilter<"Character"> | string | null
    status?: StringFilter<"Character"> | string
    universeId?: StringFilter<"Character"> | string
    birthDate?: DateTimeNullableFilter<"Character"> | Date | string | null
    data?: JsonNullableFilter<"Character">
    createdAt?: DateTimeFilter<"Character"> | Date | string
    updatedAt?: DateTimeFilter<"Character"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    locations?: CharacterLocationListRelationFilter
    relationshipsFrom?: CharacterRelationshipListRelationFilter
    relationshipsTo?: CharacterRelationshipListRelationFilter
    timeline?: TimelineEventListRelationFilter
  }

  export type CharacterOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    status?: SortOrder
    universeId?: SortOrder
    birthDate?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    universe?: UniverseMapOrderByWithRelationInput
    locations?: CharacterLocationOrderByRelationAggregateInput
    relationshipsFrom?: CharacterRelationshipOrderByRelationAggregateInput
    relationshipsTo?: CharacterRelationshipOrderByRelationAggregateInput
    timeline?: TimelineEventOrderByRelationAggregateInput
  }

  export type CharacterWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: CharacterWhereInput | CharacterWhereInput[]
    OR?: CharacterWhereInput[]
    NOT?: CharacterWhereInput | CharacterWhereInput[]
    name?: StringFilter<"Character"> | string
    description?: StringNullableFilter<"Character"> | string | null
    avatarUrl?: StringNullableFilter<"Character"> | string | null
    role?: StringNullableFilter<"Character"> | string | null
    status?: StringFilter<"Character"> | string
    universeId?: StringFilter<"Character"> | string
    birthDate?: DateTimeNullableFilter<"Character"> | Date | string | null
    data?: JsonNullableFilter<"Character">
    createdAt?: DateTimeFilter<"Character"> | Date | string
    updatedAt?: DateTimeFilter<"Character"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    locations?: CharacterLocationListRelationFilter
    relationshipsFrom?: CharacterRelationshipListRelationFilter
    relationshipsTo?: CharacterRelationshipListRelationFilter
    timeline?: TimelineEventListRelationFilter
  }, "id" | "slug">

  export type CharacterOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    status?: SortOrder
    universeId?: SortOrder
    birthDate?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CharacterCountOrderByAggregateInput
    _max?: CharacterMaxOrderByAggregateInput
    _min?: CharacterMinOrderByAggregateInput
  }

  export type CharacterScalarWhereWithAggregatesInput = {
    AND?: CharacterScalarWhereWithAggregatesInput | CharacterScalarWhereWithAggregatesInput[]
    OR?: CharacterScalarWhereWithAggregatesInput[]
    NOT?: CharacterScalarWhereWithAggregatesInput | CharacterScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Character"> | string
    name?: StringWithAggregatesFilter<"Character"> | string
    slug?: StringWithAggregatesFilter<"Character"> | string
    description?: StringNullableWithAggregatesFilter<"Character"> | string | null
    avatarUrl?: StringNullableWithAggregatesFilter<"Character"> | string | null
    role?: StringNullableWithAggregatesFilter<"Character"> | string | null
    status?: StringWithAggregatesFilter<"Character"> | string
    universeId?: StringWithAggregatesFilter<"Character"> | string
    birthDate?: DateTimeNullableWithAggregatesFilter<"Character"> | Date | string | null
    data?: JsonNullableWithAggregatesFilter<"Character">
    createdAt?: DateTimeWithAggregatesFilter<"Character"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Character"> | Date | string
  }

  export type CharacterLocationWhereInput = {
    AND?: CharacterLocationWhereInput | CharacterLocationWhereInput[]
    OR?: CharacterLocationWhereInput[]
    NOT?: CharacterLocationWhereInput | CharacterLocationWhereInput[]
    id?: StringFilter<"CharacterLocation"> | string
    characterId?: StringFilter<"CharacterLocation"> | string
    locationId?: StringFilter<"CharacterLocation"> | string
    role?: StringNullableFilter<"CharacterLocation"> | string | null
    description?: StringNullableFilter<"CharacterLocation"> | string | null
    firstSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    lastSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    createdAt?: DateTimeFilter<"CharacterLocation"> | Date | string
    character?: XOR<CharacterRelationFilter, CharacterWhereInput>
    location?: XOR<LocationRelationFilter, LocationWhereInput>
  }

  export type CharacterLocationOrderByWithRelationInput = {
    id?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    role?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    firstSeenAt?: SortOrderInput | SortOrder
    lastSeenAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    character?: CharacterOrderByWithRelationInput
    location?: LocationOrderByWithRelationInput
  }

  export type CharacterLocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    characterId_locationId?: CharacterLocationCharacterIdLocationIdCompoundUniqueInput
    AND?: CharacterLocationWhereInput | CharacterLocationWhereInput[]
    OR?: CharacterLocationWhereInput[]
    NOT?: CharacterLocationWhereInput | CharacterLocationWhereInput[]
    characterId?: StringFilter<"CharacterLocation"> | string
    locationId?: StringFilter<"CharacterLocation"> | string
    role?: StringNullableFilter<"CharacterLocation"> | string | null
    description?: StringNullableFilter<"CharacterLocation"> | string | null
    firstSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    lastSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    createdAt?: DateTimeFilter<"CharacterLocation"> | Date | string
    character?: XOR<CharacterRelationFilter, CharacterWhereInput>
    location?: XOR<LocationRelationFilter, LocationWhereInput>
  }, "id" | "characterId_locationId">

  export type CharacterLocationOrderByWithAggregationInput = {
    id?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    role?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    firstSeenAt?: SortOrderInput | SortOrder
    lastSeenAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CharacterLocationCountOrderByAggregateInput
    _max?: CharacterLocationMaxOrderByAggregateInput
    _min?: CharacterLocationMinOrderByAggregateInput
  }

  export type CharacterLocationScalarWhereWithAggregatesInput = {
    AND?: CharacterLocationScalarWhereWithAggregatesInput | CharacterLocationScalarWhereWithAggregatesInput[]
    OR?: CharacterLocationScalarWhereWithAggregatesInput[]
    NOT?: CharacterLocationScalarWhereWithAggregatesInput | CharacterLocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CharacterLocation"> | string
    characterId?: StringWithAggregatesFilter<"CharacterLocation"> | string
    locationId?: StringWithAggregatesFilter<"CharacterLocation"> | string
    role?: StringNullableWithAggregatesFilter<"CharacterLocation"> | string | null
    description?: StringNullableWithAggregatesFilter<"CharacterLocation"> | string | null
    firstSeenAt?: DateTimeNullableWithAggregatesFilter<"CharacterLocation"> | Date | string | null
    lastSeenAt?: DateTimeNullableWithAggregatesFilter<"CharacterLocation"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CharacterLocation"> | Date | string
  }

  export type CharacterRelationshipWhereInput = {
    AND?: CharacterRelationshipWhereInput | CharacterRelationshipWhereInput[]
    OR?: CharacterRelationshipWhereInput[]
    NOT?: CharacterRelationshipWhereInput | CharacterRelationshipWhereInput[]
    id?: StringFilter<"CharacterRelationship"> | string
    fromId?: StringFilter<"CharacterRelationship"> | string
    toId?: StringFilter<"CharacterRelationship"> | string
    type?: StringFilter<"CharacterRelationship"> | string
    description?: StringNullableFilter<"CharacterRelationship"> | string | null
    startDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    endDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    isOfficial?: BoolFilter<"CharacterRelationship"> | boolean
    createdAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
    updatedAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
    from?: XOR<CharacterRelationFilter, CharacterWhereInput>
    to?: XOR<CharacterRelationFilter, CharacterWhereInput>
  }

  export type CharacterRelationshipOrderByWithRelationInput = {
    id?: SortOrder
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    isOfficial?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    from?: CharacterOrderByWithRelationInput
    to?: CharacterOrderByWithRelationInput
  }

  export type CharacterRelationshipWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CharacterRelationshipWhereInput | CharacterRelationshipWhereInput[]
    OR?: CharacterRelationshipWhereInput[]
    NOT?: CharacterRelationshipWhereInput | CharacterRelationshipWhereInput[]
    fromId?: StringFilter<"CharacterRelationship"> | string
    toId?: StringFilter<"CharacterRelationship"> | string
    type?: StringFilter<"CharacterRelationship"> | string
    description?: StringNullableFilter<"CharacterRelationship"> | string | null
    startDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    endDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    isOfficial?: BoolFilter<"CharacterRelationship"> | boolean
    createdAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
    updatedAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
    from?: XOR<CharacterRelationFilter, CharacterWhereInput>
    to?: XOR<CharacterRelationFilter, CharacterWhereInput>
  }, "id">

  export type CharacterRelationshipOrderByWithAggregationInput = {
    id?: SortOrder
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    isOfficial?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CharacterRelationshipCountOrderByAggregateInput
    _max?: CharacterRelationshipMaxOrderByAggregateInput
    _min?: CharacterRelationshipMinOrderByAggregateInput
  }

  export type CharacterRelationshipScalarWhereWithAggregatesInput = {
    AND?: CharacterRelationshipScalarWhereWithAggregatesInput | CharacterRelationshipScalarWhereWithAggregatesInput[]
    OR?: CharacterRelationshipScalarWhereWithAggregatesInput[]
    NOT?: CharacterRelationshipScalarWhereWithAggregatesInput | CharacterRelationshipScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CharacterRelationship"> | string
    fromId?: StringWithAggregatesFilter<"CharacterRelationship"> | string
    toId?: StringWithAggregatesFilter<"CharacterRelationship"> | string
    type?: StringWithAggregatesFilter<"CharacterRelationship"> | string
    description?: StringNullableWithAggregatesFilter<"CharacterRelationship"> | string | null
    startDate?: DateTimeNullableWithAggregatesFilter<"CharacterRelationship"> | Date | string | null
    endDate?: DateTimeNullableWithAggregatesFilter<"CharacterRelationship"> | Date | string | null
    isOfficial?: BoolWithAggregatesFilter<"CharacterRelationship"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CharacterRelationship"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CharacterRelationship"> | Date | string
  }

  export type TimelineEventWhereInput = {
    AND?: TimelineEventWhereInput | TimelineEventWhereInput[]
    OR?: TimelineEventWhereInput[]
    NOT?: TimelineEventWhereInput | TimelineEventWhereInput[]
    id?: StringFilter<"TimelineEvent"> | string
    title?: StringFilter<"TimelineEvent"> | string
    description?: StringNullableFilter<"TimelineEvent"> | string | null
    date?: DateTimeFilter<"TimelineEvent"> | Date | string
    endDate?: DateTimeNullableFilter<"TimelineEvent"> | Date | string | null
    type?: StringFilter<"TimelineEvent"> | string
    importance?: StringFilter<"TimelineEvent"> | string
    universeId?: StringFilter<"TimelineEvent"> | string
    characterId?: StringNullableFilter<"TimelineEvent"> | string | null
    locationId?: StringNullableFilter<"TimelineEvent"> | string | null
    data?: JsonNullableFilter<"TimelineEvent">
    createdAt?: DateTimeFilter<"TimelineEvent"> | Date | string
    updatedAt?: DateTimeFilter<"TimelineEvent"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    character?: XOR<CharacterNullableRelationFilter, CharacterWhereInput> | null
    location?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
  }

  export type TimelineEventOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    date?: SortOrder
    endDate?: SortOrderInput | SortOrder
    type?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    characterId?: SortOrderInput | SortOrder
    locationId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    universe?: UniverseMapOrderByWithRelationInput
    character?: CharacterOrderByWithRelationInput
    location?: LocationOrderByWithRelationInput
  }

  export type TimelineEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TimelineEventWhereInput | TimelineEventWhereInput[]
    OR?: TimelineEventWhereInput[]
    NOT?: TimelineEventWhereInput | TimelineEventWhereInput[]
    title?: StringFilter<"TimelineEvent"> | string
    description?: StringNullableFilter<"TimelineEvent"> | string | null
    date?: DateTimeFilter<"TimelineEvent"> | Date | string
    endDate?: DateTimeNullableFilter<"TimelineEvent"> | Date | string | null
    type?: StringFilter<"TimelineEvent"> | string
    importance?: StringFilter<"TimelineEvent"> | string
    universeId?: StringFilter<"TimelineEvent"> | string
    characterId?: StringNullableFilter<"TimelineEvent"> | string | null
    locationId?: StringNullableFilter<"TimelineEvent"> | string | null
    data?: JsonNullableFilter<"TimelineEvent">
    createdAt?: DateTimeFilter<"TimelineEvent"> | Date | string
    updatedAt?: DateTimeFilter<"TimelineEvent"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    character?: XOR<CharacterNullableRelationFilter, CharacterWhereInput> | null
    location?: XOR<LocationNullableRelationFilter, LocationWhereInput> | null
  }, "id">

  export type TimelineEventOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    date?: SortOrder
    endDate?: SortOrderInput | SortOrder
    type?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    characterId?: SortOrderInput | SortOrder
    locationId?: SortOrderInput | SortOrder
    data?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TimelineEventCountOrderByAggregateInput
    _max?: TimelineEventMaxOrderByAggregateInput
    _min?: TimelineEventMinOrderByAggregateInput
  }

  export type TimelineEventScalarWhereWithAggregatesInput = {
    AND?: TimelineEventScalarWhereWithAggregatesInput | TimelineEventScalarWhereWithAggregatesInput[]
    OR?: TimelineEventScalarWhereWithAggregatesInput[]
    NOT?: TimelineEventScalarWhereWithAggregatesInput | TimelineEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TimelineEvent"> | string
    title?: StringWithAggregatesFilter<"TimelineEvent"> | string
    description?: StringNullableWithAggregatesFilter<"TimelineEvent"> | string | null
    date?: DateTimeWithAggregatesFilter<"TimelineEvent"> | Date | string
    endDate?: DateTimeNullableWithAggregatesFilter<"TimelineEvent"> | Date | string | null
    type?: StringWithAggregatesFilter<"TimelineEvent"> | string
    importance?: StringWithAggregatesFilter<"TimelineEvent"> | string
    universeId?: StringWithAggregatesFilter<"TimelineEvent"> | string
    characterId?: StringNullableWithAggregatesFilter<"TimelineEvent"> | string | null
    locationId?: StringNullableWithAggregatesFilter<"TimelineEvent"> | string | null
    data?: JsonNullableWithAggregatesFilter<"TimelineEvent">
    createdAt?: DateTimeWithAggregatesFilter<"TimelineEvent"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TimelineEvent"> | Date | string
  }

  export type TitleWhereInput = {
    AND?: TitleWhereInput | TitleWhereInput[]
    OR?: TitleWhereInput[]
    NOT?: TitleWhereInput | TitleWhereInput[]
    id?: StringFilter<"Title"> | string
    name?: StringFilter<"Title"> | string
    slug?: StringFilter<"Title"> | string
    type?: StringFilter<"Title"> | string
    description?: StringNullableFilter<"Title"> | string | null
    coverImage?: StringNullableFilter<"Title"> | string | null
    releaseYear?: IntNullableFilter<"Title"> | number | null
    endYear?: IntNullableFilter<"Title"> | number | null
    status?: StringFilter<"Title"> | string
    rating?: FloatNullableFilter<"Title"> | number | null
    universeId?: StringFilter<"Title"> | string
    viewCount?: IntFilter<"Title"> | number
    createdAt?: DateTimeFilter<"Title"> | Date | string
    updatedAt?: DateTimeFilter<"Title"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    recaps?: RecapListRelationFilter
    crossovers?: CrossoverTitleListRelationFilter
    chapters?: ChapterListRelationFilter
  }

  export type TitleOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    releaseYear?: SortOrderInput | SortOrder
    endYear?: SortOrderInput | SortOrder
    status?: SortOrder
    rating?: SortOrderInput | SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    universe?: UniverseMapOrderByWithRelationInput
    recaps?: RecapOrderByRelationAggregateInput
    crossovers?: CrossoverTitleOrderByRelationAggregateInput
    chapters?: ChapterOrderByRelationAggregateInput
  }

  export type TitleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: TitleWhereInput | TitleWhereInput[]
    OR?: TitleWhereInput[]
    NOT?: TitleWhereInput | TitleWhereInput[]
    name?: StringFilter<"Title"> | string
    type?: StringFilter<"Title"> | string
    description?: StringNullableFilter<"Title"> | string | null
    coverImage?: StringNullableFilter<"Title"> | string | null
    releaseYear?: IntNullableFilter<"Title"> | number | null
    endYear?: IntNullableFilter<"Title"> | number | null
    status?: StringFilter<"Title"> | string
    rating?: FloatNullableFilter<"Title"> | number | null
    universeId?: StringFilter<"Title"> | string
    viewCount?: IntFilter<"Title"> | number
    createdAt?: DateTimeFilter<"Title"> | Date | string
    updatedAt?: DateTimeFilter<"Title"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
    recaps?: RecapListRelationFilter
    crossovers?: CrossoverTitleListRelationFilter
    chapters?: ChapterListRelationFilter
  }, "id" | "slug">

  export type TitleOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    releaseYear?: SortOrderInput | SortOrder
    endYear?: SortOrderInput | SortOrder
    status?: SortOrder
    rating?: SortOrderInput | SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TitleCountOrderByAggregateInput
    _avg?: TitleAvgOrderByAggregateInput
    _max?: TitleMaxOrderByAggregateInput
    _min?: TitleMinOrderByAggregateInput
    _sum?: TitleSumOrderByAggregateInput
  }

  export type TitleScalarWhereWithAggregatesInput = {
    AND?: TitleScalarWhereWithAggregatesInput | TitleScalarWhereWithAggregatesInput[]
    OR?: TitleScalarWhereWithAggregatesInput[]
    NOT?: TitleScalarWhereWithAggregatesInput | TitleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Title"> | string
    name?: StringWithAggregatesFilter<"Title"> | string
    slug?: StringWithAggregatesFilter<"Title"> | string
    type?: StringWithAggregatesFilter<"Title"> | string
    description?: StringNullableWithAggregatesFilter<"Title"> | string | null
    coverImage?: StringNullableWithAggregatesFilter<"Title"> | string | null
    releaseYear?: IntNullableWithAggregatesFilter<"Title"> | number | null
    endYear?: IntNullableWithAggregatesFilter<"Title"> | number | null
    status?: StringWithAggregatesFilter<"Title"> | string
    rating?: FloatNullableWithAggregatesFilter<"Title"> | number | null
    universeId?: StringWithAggregatesFilter<"Title"> | string
    viewCount?: IntWithAggregatesFilter<"Title"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Title"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Title"> | Date | string
  }

  export type ChapterWhereInput = {
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    id?: StringFilter<"Chapter"> | string
    titleId?: StringFilter<"Chapter"> | string
    number?: FloatFilter<"Chapter"> | number
    name?: StringNullableFilter<"Chapter"> | string | null
    description?: StringNullableFilter<"Chapter"> | string | null
    coverImage?: StringNullableFilter<"Chapter"> | string | null
    content?: StringNullableFilter<"Chapter"> | string | null
    wordCount?: IntNullableFilter<"Chapter"> | number | null
    status?: StringFilter<"Chapter"> | string
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }

  export type ChapterOrderByWithRelationInput = {
    id?: SortOrder
    titleId?: SortOrder
    number?: SortOrder
    name?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    content?: SortOrderInput | SortOrder
    wordCount?: SortOrderInput | SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    title?: TitleOrderByWithRelationInput
  }

  export type ChapterWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChapterWhereInput | ChapterWhereInput[]
    OR?: ChapterWhereInput[]
    NOT?: ChapterWhereInput | ChapterWhereInput[]
    titleId?: StringFilter<"Chapter"> | string
    number?: FloatFilter<"Chapter"> | number
    name?: StringNullableFilter<"Chapter"> | string | null
    description?: StringNullableFilter<"Chapter"> | string | null
    coverImage?: StringNullableFilter<"Chapter"> | string | null
    content?: StringNullableFilter<"Chapter"> | string | null
    wordCount?: IntNullableFilter<"Chapter"> | number | null
    status?: StringFilter<"Chapter"> | string
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }, "id">

  export type ChapterOrderByWithAggregationInput = {
    id?: SortOrder
    titleId?: SortOrder
    number?: SortOrder
    name?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    content?: SortOrderInput | SortOrder
    wordCount?: SortOrderInput | SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ChapterCountOrderByAggregateInput
    _avg?: ChapterAvgOrderByAggregateInput
    _max?: ChapterMaxOrderByAggregateInput
    _min?: ChapterMinOrderByAggregateInput
    _sum?: ChapterSumOrderByAggregateInput
  }

  export type ChapterScalarWhereWithAggregatesInput = {
    AND?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    OR?: ChapterScalarWhereWithAggregatesInput[]
    NOT?: ChapterScalarWhereWithAggregatesInput | ChapterScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Chapter"> | string
    titleId?: StringWithAggregatesFilter<"Chapter"> | string
    number?: FloatWithAggregatesFilter<"Chapter"> | number
    name?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    description?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    coverImage?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    content?: StringNullableWithAggregatesFilter<"Chapter"> | string | null
    wordCount?: IntNullableWithAggregatesFilter<"Chapter"> | number | null
    status?: StringWithAggregatesFilter<"Chapter"> | string
    publishedAt?: DateTimeNullableWithAggregatesFilter<"Chapter"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Chapter"> | Date | string
  }

  export type LoreEntryWhereInput = {
    AND?: LoreEntryWhereInput | LoreEntryWhereInput[]
    OR?: LoreEntryWhereInput[]
    NOT?: LoreEntryWhereInput | LoreEntryWhereInput[]
    id?: StringFilter<"LoreEntry"> | string
    title?: StringFilter<"LoreEntry"> | string
    slug?: StringFilter<"LoreEntry"> | string
    category?: StringFilter<"LoreEntry"> | string
    content?: StringFilter<"LoreEntry"> | string
    excerpt?: StringNullableFilter<"LoreEntry"> | string | null
    coverImage?: StringNullableFilter<"LoreEntry"> | string | null
    importance?: StringFilter<"LoreEntry"> | string
    universeId?: StringFilter<"LoreEntry"> | string
    viewCount?: IntFilter<"LoreEntry"> | number
    status?: StringFilter<"LoreEntry"> | string
    createdAt?: DateTimeFilter<"LoreEntry"> | Date | string
    updatedAt?: DateTimeFilter<"LoreEntry"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
  }

  export type LoreEntryOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    category?: SortOrder
    content?: SortOrder
    excerpt?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    universe?: UniverseMapOrderByWithRelationInput
  }

  export type LoreEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: LoreEntryWhereInput | LoreEntryWhereInput[]
    OR?: LoreEntryWhereInput[]
    NOT?: LoreEntryWhereInput | LoreEntryWhereInput[]
    title?: StringFilter<"LoreEntry"> | string
    category?: StringFilter<"LoreEntry"> | string
    content?: StringFilter<"LoreEntry"> | string
    excerpt?: StringNullableFilter<"LoreEntry"> | string | null
    coverImage?: StringNullableFilter<"LoreEntry"> | string | null
    importance?: StringFilter<"LoreEntry"> | string
    universeId?: StringFilter<"LoreEntry"> | string
    viewCount?: IntFilter<"LoreEntry"> | number
    status?: StringFilter<"LoreEntry"> | string
    createdAt?: DateTimeFilter<"LoreEntry"> | Date | string
    updatedAt?: DateTimeFilter<"LoreEntry"> | Date | string
    universe?: XOR<UniverseMapRelationFilter, UniverseMapWhereInput>
  }, "id" | "slug">

  export type LoreEntryOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    category?: SortOrder
    content?: SortOrder
    excerpt?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LoreEntryCountOrderByAggregateInput
    _avg?: LoreEntryAvgOrderByAggregateInput
    _max?: LoreEntryMaxOrderByAggregateInput
    _min?: LoreEntryMinOrderByAggregateInput
    _sum?: LoreEntrySumOrderByAggregateInput
  }

  export type LoreEntryScalarWhereWithAggregatesInput = {
    AND?: LoreEntryScalarWhereWithAggregatesInput | LoreEntryScalarWhereWithAggregatesInput[]
    OR?: LoreEntryScalarWhereWithAggregatesInput[]
    NOT?: LoreEntryScalarWhereWithAggregatesInput | LoreEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LoreEntry"> | string
    title?: StringWithAggregatesFilter<"LoreEntry"> | string
    slug?: StringWithAggregatesFilter<"LoreEntry"> | string
    category?: StringWithAggregatesFilter<"LoreEntry"> | string
    content?: StringWithAggregatesFilter<"LoreEntry"> | string
    excerpt?: StringNullableWithAggregatesFilter<"LoreEntry"> | string | null
    coverImage?: StringNullableWithAggregatesFilter<"LoreEntry"> | string | null
    importance?: StringWithAggregatesFilter<"LoreEntry"> | string
    universeId?: StringWithAggregatesFilter<"LoreEntry"> | string
    viewCount?: IntWithAggregatesFilter<"LoreEntry"> | number
    status?: StringWithAggregatesFilter<"LoreEntry"> | string
    createdAt?: DateTimeWithAggregatesFilter<"LoreEntry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LoreEntry"> | Date | string
  }

  export type CrossoverWhereInput = {
    AND?: CrossoverWhereInput | CrossoverWhereInput[]
    OR?: CrossoverWhereInput[]
    NOT?: CrossoverWhereInput | CrossoverWhereInput[]
    id?: StringFilter<"Crossover"> | string
    title?: StringFilter<"Crossover"> | string
    slug?: StringFilter<"Crossover"> | string
    description?: StringNullableFilter<"Crossover"> | string | null
    coverImage?: StringNullableFilter<"Crossover"> | string | null
    startDate?: DateTimeNullableFilter<"Crossover"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Crossover"> | Date | string | null
    status?: StringFilter<"Crossover"> | string
    createdAt?: DateTimeFilter<"Crossover"> | Date | string
    updatedAt?: DateTimeFilter<"Crossover"> | Date | string
    titles?: CrossoverTitleListRelationFilter
  }

  export type CrossoverOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    titles?: CrossoverTitleOrderByRelationAggregateInput
  }

  export type CrossoverWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: CrossoverWhereInput | CrossoverWhereInput[]
    OR?: CrossoverWhereInput[]
    NOT?: CrossoverWhereInput | CrossoverWhereInput[]
    title?: StringFilter<"Crossover"> | string
    description?: StringNullableFilter<"Crossover"> | string | null
    coverImage?: StringNullableFilter<"Crossover"> | string | null
    startDate?: DateTimeNullableFilter<"Crossover"> | Date | string | null
    endDate?: DateTimeNullableFilter<"Crossover"> | Date | string | null
    status?: StringFilter<"Crossover"> | string
    createdAt?: DateTimeFilter<"Crossover"> | Date | string
    updatedAt?: DateTimeFilter<"Crossover"> | Date | string
    titles?: CrossoverTitleListRelationFilter
  }, "id" | "slug">

  export type CrossoverOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    coverImage?: SortOrderInput | SortOrder
    startDate?: SortOrderInput | SortOrder
    endDate?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CrossoverCountOrderByAggregateInput
    _max?: CrossoverMaxOrderByAggregateInput
    _min?: CrossoverMinOrderByAggregateInput
  }

  export type CrossoverScalarWhereWithAggregatesInput = {
    AND?: CrossoverScalarWhereWithAggregatesInput | CrossoverScalarWhereWithAggregatesInput[]
    OR?: CrossoverScalarWhereWithAggregatesInput[]
    NOT?: CrossoverScalarWhereWithAggregatesInput | CrossoverScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Crossover"> | string
    title?: StringWithAggregatesFilter<"Crossover"> | string
    slug?: StringWithAggregatesFilter<"Crossover"> | string
    description?: StringNullableWithAggregatesFilter<"Crossover"> | string | null
    coverImage?: StringNullableWithAggregatesFilter<"Crossover"> | string | null
    startDate?: DateTimeNullableWithAggregatesFilter<"Crossover"> | Date | string | null
    endDate?: DateTimeNullableWithAggregatesFilter<"Crossover"> | Date | string | null
    status?: StringWithAggregatesFilter<"Crossover"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Crossover"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Crossover"> | Date | string
  }

  export type CrossoverTitleWhereInput = {
    AND?: CrossoverTitleWhereInput | CrossoverTitleWhereInput[]
    OR?: CrossoverTitleWhereInput[]
    NOT?: CrossoverTitleWhereInput | CrossoverTitleWhereInput[]
    id?: StringFilter<"CrossoverTitle"> | string
    crossoverId?: StringFilter<"CrossoverTitle"> | string
    titleId?: StringFilter<"CrossoverTitle"> | string
    crossover?: XOR<CrossoverRelationFilter, CrossoverWhereInput>
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }

  export type CrossoverTitleOrderByWithRelationInput = {
    id?: SortOrder
    crossoverId?: SortOrder
    titleId?: SortOrder
    crossover?: CrossoverOrderByWithRelationInput
    title?: TitleOrderByWithRelationInput
  }

  export type CrossoverTitleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    crossoverId_titleId?: CrossoverTitleCrossoverIdTitleIdCompoundUniqueInput
    AND?: CrossoverTitleWhereInput | CrossoverTitleWhereInput[]
    OR?: CrossoverTitleWhereInput[]
    NOT?: CrossoverTitleWhereInput | CrossoverTitleWhereInput[]
    crossoverId?: StringFilter<"CrossoverTitle"> | string
    titleId?: StringFilter<"CrossoverTitle"> | string
    crossover?: XOR<CrossoverRelationFilter, CrossoverWhereInput>
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }, "id" | "crossoverId_titleId">

  export type CrossoverTitleOrderByWithAggregationInput = {
    id?: SortOrder
    crossoverId?: SortOrder
    titleId?: SortOrder
    _count?: CrossoverTitleCountOrderByAggregateInput
    _max?: CrossoverTitleMaxOrderByAggregateInput
    _min?: CrossoverTitleMinOrderByAggregateInput
  }

  export type CrossoverTitleScalarWhereWithAggregatesInput = {
    AND?: CrossoverTitleScalarWhereWithAggregatesInput | CrossoverTitleScalarWhereWithAggregatesInput[]
    OR?: CrossoverTitleScalarWhereWithAggregatesInput[]
    NOT?: CrossoverTitleScalarWhereWithAggregatesInput | CrossoverTitleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CrossoverTitle"> | string
    crossoverId?: StringWithAggregatesFilter<"CrossoverTitle"> | string
    titleId?: StringWithAggregatesFilter<"CrossoverTitle"> | string
  }

  export type RecapWhereInput = {
    AND?: RecapWhereInput | RecapWhereInput[]
    OR?: RecapWhereInput[]
    NOT?: RecapWhereInput | RecapWhereInput[]
    id?: StringFilter<"Recap"> | string
    titleId?: StringFilter<"Recap"> | string
    season?: IntNullableFilter<"Recap"> | number | null
    episode?: IntNullableFilter<"Recap"> | number | null
    name?: StringNullableFilter<"Recap"> | string | null
    content?: StringFilter<"Recap"> | string
    coverImage?: StringNullableFilter<"Recap"> | string | null
    isSpoiler?: BoolFilter<"Recap"> | boolean
    viewCount?: IntFilter<"Recap"> | number
    status?: StringFilter<"Recap"> | string
    publishedAt?: DateTimeNullableFilter<"Recap"> | Date | string | null
    createdAt?: DateTimeFilter<"Recap"> | Date | string
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }

  export type RecapOrderByWithRelationInput = {
    id?: SortOrder
    titleId?: SortOrder
    season?: SortOrderInput | SortOrder
    episode?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    content?: SortOrder
    coverImage?: SortOrderInput | SortOrder
    isSpoiler?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    title?: TitleOrderByWithRelationInput
  }

  export type RecapWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RecapWhereInput | RecapWhereInput[]
    OR?: RecapWhereInput[]
    NOT?: RecapWhereInput | RecapWhereInput[]
    titleId?: StringFilter<"Recap"> | string
    season?: IntNullableFilter<"Recap"> | number | null
    episode?: IntNullableFilter<"Recap"> | number | null
    name?: StringNullableFilter<"Recap"> | string | null
    content?: StringFilter<"Recap"> | string
    coverImage?: StringNullableFilter<"Recap"> | string | null
    isSpoiler?: BoolFilter<"Recap"> | boolean
    viewCount?: IntFilter<"Recap"> | number
    status?: StringFilter<"Recap"> | string
    publishedAt?: DateTimeNullableFilter<"Recap"> | Date | string | null
    createdAt?: DateTimeFilter<"Recap"> | Date | string
    title?: XOR<TitleRelationFilter, TitleWhereInput>
  }, "id">

  export type RecapOrderByWithAggregationInput = {
    id?: SortOrder
    titleId?: SortOrder
    season?: SortOrderInput | SortOrder
    episode?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    content?: SortOrder
    coverImage?: SortOrderInput | SortOrder
    isSpoiler?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: RecapCountOrderByAggregateInput
    _avg?: RecapAvgOrderByAggregateInput
    _max?: RecapMaxOrderByAggregateInput
    _min?: RecapMinOrderByAggregateInput
    _sum?: RecapSumOrderByAggregateInput
  }

  export type RecapScalarWhereWithAggregatesInput = {
    AND?: RecapScalarWhereWithAggregatesInput | RecapScalarWhereWithAggregatesInput[]
    OR?: RecapScalarWhereWithAggregatesInput[]
    NOT?: RecapScalarWhereWithAggregatesInput | RecapScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Recap"> | string
    titleId?: StringWithAggregatesFilter<"Recap"> | string
    season?: IntNullableWithAggregatesFilter<"Recap"> | number | null
    episode?: IntNullableWithAggregatesFilter<"Recap"> | number | null
    name?: StringNullableWithAggregatesFilter<"Recap"> | string | null
    content?: StringWithAggregatesFilter<"Recap"> | string
    coverImage?: StringNullableWithAggregatesFilter<"Recap"> | string | null
    isSpoiler?: BoolWithAggregatesFilter<"Recap"> | boolean
    viewCount?: IntWithAggregatesFilter<"Recap"> | number
    status?: StringWithAggregatesFilter<"Recap"> | string
    publishedAt?: DateTimeNullableWithAggregatesFilter<"Recap"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Recap"> | Date | string
  }

  export type UniverseMapCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterCreateNestedManyWithoutUniverseInput
    locations?: LocationCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventCreateNestedManyWithoutUniverseInput
    titles?: TitleCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterUncheckedCreateNestedManyWithoutUniverseInput
    locations?: LocationUncheckedCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutUniverseInput
    titles?: TitleUncheckedCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUpdateManyWithoutUniverseNestedInput
    locations?: LocationUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUpdateManyWithoutUniverseNestedInput
    titles?: TitleUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUncheckedUpdateManyWithoutUniverseNestedInput
    locations?: LocationUncheckedUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput
    titles?: TitleUncheckedUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapCreateManyInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UniverseMapUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UniverseMapUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLocationsInput
    parent?: LocationCreateNestedOneWithoutChildrenInput
    children?: LocationCreateNestedManyWithoutParentInput
    characters?: CharacterLocationCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: LocationUncheckedCreateNestedManyWithoutParentInput
    characters?: CharacterLocationUncheckedCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLocationsNestedInput
    parent?: LocationUpdateOneWithoutChildrenNestedInput
    children?: LocationUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: LocationUncheckedUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationCreateManyInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutCharactersInput
    locations?: CharacterLocationCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipCreateNestedManyWithoutToInput
    timeline?: TimelineEventCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipUncheckedCreateNestedManyWithoutToInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutCharactersNestedInput
    locations?: CharacterLocationUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterCreateManyInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationCreateInput = {
    id?: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
    character: CharacterCreateNestedOneWithoutLocationsInput
    location: LocationCreateNestedOneWithoutCharactersInput
  }

  export type CharacterLocationUncheckedCreateInput = {
    id?: string
    characterId: string
    locationId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CharacterLocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    character?: CharacterUpdateOneRequiredWithoutLocationsNestedInput
    location?: LocationUpdateOneRequiredWithoutCharactersNestedInput
  }

  export type CharacterLocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    characterId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationCreateManyInput = {
    id?: string
    characterId: string
    locationId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CharacterLocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    characterId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipCreateInput = {
    id?: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    from: CharacterCreateNestedOneWithoutRelationshipsFromInput
    to: CharacterCreateNestedOneWithoutRelationshipsToInput
  }

  export type CharacterRelationshipUncheckedCreateInput = {
    id?: string
    fromId: string
    toId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterRelationshipUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    from?: CharacterUpdateOneRequiredWithoutRelationshipsFromNestedInput
    to?: CharacterUpdateOneRequiredWithoutRelationshipsToNestedInput
  }

  export type CharacterRelationshipUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromId?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipCreateManyInput = {
    id?: string
    fromId: string
    toId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterRelationshipUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromId?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventCreateInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTimelineInput
    character?: CharacterCreateNestedOneWithoutTimelineInput
    location?: LocationCreateNestedOneWithoutTimelineInput
  }

  export type TimelineEventUncheckedCreateInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    characterId?: string | null
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTimelineNestedInput
    character?: CharacterUpdateOneWithoutTimelineNestedInput
    location?: LocationUpdateOneWithoutTimelineNestedInput
  }

  export type TimelineEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventCreateManyInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    characterId?: string | null
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TitleCreateInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTitlesInput
    recaps?: RecapCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleCreateNestedManyWithoutTitleInput
    chapters?: ChapterCreateNestedManyWithoutTitleInput
  }

  export type TitleUncheckedCreateInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    universeId: string
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    recaps?: RecapUncheckedCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleUncheckedCreateNestedManyWithoutTitleInput
    chapters?: ChapterUncheckedCreateNestedManyWithoutTitleInput
  }

  export type TitleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTitlesNestedInput
    recaps?: RecapUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recaps?: RecapUncheckedUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUncheckedUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUncheckedUpdateManyWithoutTitleNestedInput
  }

  export type TitleCreateManyInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    universeId: string
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TitleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TitleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterCreateInput = {
    id?: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
    title: TitleCreateNestedOneWithoutChaptersInput
  }

  export type ChapterUncheckedCreateInput = {
    id?: string
    titleId: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ChapterUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: TitleUpdateOneRequiredWithoutChaptersNestedInput
  }

  export type ChapterUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterCreateManyInput = {
    id?: string
    titleId: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ChapterUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryCreateInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLoreEntriesInput
  }

  export type LoreEntryUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    universeId: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoreEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLoreEntriesNestedInput
  }

  export type LoreEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryCreateManyInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    universeId: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoreEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverCreateInput = {
    id?: string
    title: string
    slug: string
    description?: string | null
    coverImage?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    titles?: CrossoverTitleCreateNestedManyWithoutCrossoverInput
  }

  export type CrossoverUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    description?: string | null
    coverImage?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    titles?: CrossoverTitleUncheckedCreateNestedManyWithoutCrossoverInput
  }

  export type CrossoverUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    titles?: CrossoverTitleUpdateManyWithoutCrossoverNestedInput
  }

  export type CrossoverUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    titles?: CrossoverTitleUncheckedUpdateManyWithoutCrossoverNestedInput
  }

  export type CrossoverCreateManyInput = {
    id?: string
    title: string
    slug: string
    description?: string | null
    coverImage?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrossoverUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverTitleCreateInput = {
    id?: string
    crossover: CrossoverCreateNestedOneWithoutTitlesInput
    title: TitleCreateNestedOneWithoutCrossoversInput
  }

  export type CrossoverTitleUncheckedCreateInput = {
    id?: string
    crossoverId: string
    titleId: string
  }

  export type CrossoverTitleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossover?: CrossoverUpdateOneRequiredWithoutTitlesNestedInput
    title?: TitleUpdateOneRequiredWithoutCrossoversNestedInput
  }

  export type CrossoverTitleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossoverId?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
  }

  export type CrossoverTitleCreateManyInput = {
    id?: string
    crossoverId: string
    titleId: string
  }

  export type CrossoverTitleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type CrossoverTitleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossoverId?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
  }

  export type RecapCreateInput = {
    id?: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
    title: TitleCreateNestedOneWithoutRecapsInput
  }

  export type RecapUncheckedCreateInput = {
    id?: string
    titleId: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RecapUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    title?: TitleUpdateOneRequiredWithoutRecapsNestedInput
  }

  export type RecapUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecapCreateManyInput = {
    id?: string
    titleId: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RecapUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecapUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
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

  export type CharacterListRelationFilter = {
    every?: CharacterWhereInput
    some?: CharacterWhereInput
    none?: CharacterWhereInput
  }

  export type LocationListRelationFilter = {
    every?: LocationWhereInput
    some?: LocationWhereInput
    none?: LocationWhereInput
  }

  export type TimelineEventListRelationFilter = {
    every?: TimelineEventWhereInput
    some?: TimelineEventWhereInput
    none?: TimelineEventWhereInput
  }

  export type TitleListRelationFilter = {
    every?: TitleWhereInput
    some?: TitleWhereInput
    none?: TitleWhereInput
  }

  export type LoreEntryListRelationFilter = {
    every?: LoreEntryWhereInput
    some?: LoreEntryWhereInput
    none?: LoreEntryWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CharacterOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LocationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TimelineEventOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TitleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LoreEntryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UniverseMapCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    data?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UniverseMapMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UniverseMapMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    status?: SortOrder
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

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type UniverseMapRelationFilter = {
    is?: UniverseMapWhereInput
    isNot?: UniverseMapWhereInput
  }

  export type LocationNullableRelationFilter = {
    is?: LocationWhereInput | null
    isNot?: LocationWhereInput | null
  }

  export type CharacterLocationListRelationFilter = {
    every?: CharacterLocationWhereInput
    some?: CharacterLocationWhereInput
    none?: CharacterLocationWhereInput
  }

  export type CharacterLocationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    universeId?: SortOrder
    parentId?: SortOrder
    data?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    universeId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    imageUrl?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    universeId?: SortOrder
    parentId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type CharacterRelationshipListRelationFilter = {
    every?: CharacterRelationshipWhereInput
    some?: CharacterRelationshipWhereInput
    none?: CharacterRelationshipWhereInput
  }

  export type CharacterRelationshipOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CharacterCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    avatarUrl?: SortOrder
    role?: SortOrder
    status?: SortOrder
    universeId?: SortOrder
    birthDate?: SortOrder
    data?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CharacterMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    avatarUrl?: SortOrder
    role?: SortOrder
    status?: SortOrder
    universeId?: SortOrder
    birthDate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CharacterMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    avatarUrl?: SortOrder
    role?: SortOrder
    status?: SortOrder
    universeId?: SortOrder
    birthDate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type CharacterRelationFilter = {
    is?: CharacterWhereInput
    isNot?: CharacterWhereInput
  }

  export type LocationRelationFilter = {
    is?: LocationWhereInput
    isNot?: LocationWhereInput
  }

  export type CharacterLocationCharacterIdLocationIdCompoundUniqueInput = {
    characterId: string
    locationId: string
  }

  export type CharacterLocationCountOrderByAggregateInput = {
    id?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    role?: SortOrder
    description?: SortOrder
    firstSeenAt?: SortOrder
    lastSeenAt?: SortOrder
    createdAt?: SortOrder
  }

  export type CharacterLocationMaxOrderByAggregateInput = {
    id?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    role?: SortOrder
    description?: SortOrder
    firstSeenAt?: SortOrder
    lastSeenAt?: SortOrder
    createdAt?: SortOrder
  }

  export type CharacterLocationMinOrderByAggregateInput = {
    id?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    role?: SortOrder
    description?: SortOrder
    firstSeenAt?: SortOrder
    lastSeenAt?: SortOrder
    createdAt?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type CharacterRelationshipCountOrderByAggregateInput = {
    id?: SortOrder
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isOfficial?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CharacterRelationshipMaxOrderByAggregateInput = {
    id?: SortOrder
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isOfficial?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CharacterRelationshipMinOrderByAggregateInput = {
    id?: SortOrder
    fromId?: SortOrder
    toId?: SortOrder
    type?: SortOrder
    description?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    isOfficial?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CharacterNullableRelationFilter = {
    is?: CharacterWhereInput | null
    isNot?: CharacterWhereInput | null
  }

  export type TimelineEventCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    endDate?: SortOrder
    type?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    data?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TimelineEventMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    endDate?: SortOrder
    type?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TimelineEventMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    endDate?: SortOrder
    type?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    characterId?: SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type RecapListRelationFilter = {
    every?: RecapWhereInput
    some?: RecapWhereInput
    none?: RecapWhereInput
  }

  export type CrossoverTitleListRelationFilter = {
    every?: CrossoverTitleWhereInput
    some?: CrossoverTitleWhereInput
    none?: CrossoverTitleWhereInput
  }

  export type ChapterListRelationFilter = {
    every?: ChapterWhereInput
    some?: ChapterWhereInput
    none?: ChapterWhereInput
  }

  export type RecapOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CrossoverTitleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChapterOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TitleCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    type?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    releaseYear?: SortOrder
    endYear?: SortOrder
    status?: SortOrder
    rating?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TitleAvgOrderByAggregateInput = {
    releaseYear?: SortOrder
    endYear?: SortOrder
    rating?: SortOrder
    viewCount?: SortOrder
  }

  export type TitleMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    type?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    releaseYear?: SortOrder
    endYear?: SortOrder
    status?: SortOrder
    rating?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TitleMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    type?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    releaseYear?: SortOrder
    endYear?: SortOrder
    status?: SortOrder
    rating?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TitleSumOrderByAggregateInput = {
    releaseYear?: SortOrder
    endYear?: SortOrder
    rating?: SortOrder
    viewCount?: SortOrder
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

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TitleRelationFilter = {
    is?: TitleWhereInput
    isNot?: TitleWhereInput
  }

  export type ChapterCountOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    content?: SortOrder
    wordCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ChapterAvgOrderByAggregateInput = {
    number?: SortOrder
    wordCount?: SortOrder
  }

  export type ChapterMaxOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    content?: SortOrder
    wordCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ChapterMinOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    number?: SortOrder
    name?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    content?: SortOrder
    wordCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ChapterSumOrderByAggregateInput = {
    number?: SortOrder
    wordCount?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type LoreEntryCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    category?: SortOrder
    content?: SortOrder
    excerpt?: SortOrder
    coverImage?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoreEntryAvgOrderByAggregateInput = {
    viewCount?: SortOrder
  }

  export type LoreEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    category?: SortOrder
    content?: SortOrder
    excerpt?: SortOrder
    coverImage?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoreEntryMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    category?: SortOrder
    content?: SortOrder
    excerpt?: SortOrder
    coverImage?: SortOrder
    importance?: SortOrder
    universeId?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoreEntrySumOrderByAggregateInput = {
    viewCount?: SortOrder
  }

  export type CrossoverCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrossoverMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrossoverMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    coverImage?: SortOrder
    startDate?: SortOrder
    endDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrossoverRelationFilter = {
    is?: CrossoverWhereInput
    isNot?: CrossoverWhereInput
  }

  export type CrossoverTitleCrossoverIdTitleIdCompoundUniqueInput = {
    crossoverId: string
    titleId: string
  }

  export type CrossoverTitleCountOrderByAggregateInput = {
    id?: SortOrder
    crossoverId?: SortOrder
    titleId?: SortOrder
  }

  export type CrossoverTitleMaxOrderByAggregateInput = {
    id?: SortOrder
    crossoverId?: SortOrder
    titleId?: SortOrder
  }

  export type CrossoverTitleMinOrderByAggregateInput = {
    id?: SortOrder
    crossoverId?: SortOrder
    titleId?: SortOrder
  }

  export type RecapCountOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    season?: SortOrder
    episode?: SortOrder
    name?: SortOrder
    content?: SortOrder
    coverImage?: SortOrder
    isSpoiler?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RecapAvgOrderByAggregateInput = {
    season?: SortOrder
    episode?: SortOrder
    viewCount?: SortOrder
  }

  export type RecapMaxOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    season?: SortOrder
    episode?: SortOrder
    name?: SortOrder
    content?: SortOrder
    coverImage?: SortOrder
    isSpoiler?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RecapMinOrderByAggregateInput = {
    id?: SortOrder
    titleId?: SortOrder
    season?: SortOrder
    episode?: SortOrder
    name?: SortOrder
    content?: SortOrder
    coverImage?: SortOrder
    isSpoiler?: SortOrder
    viewCount?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RecapSumOrderByAggregateInput = {
    season?: SortOrder
    episode?: SortOrder
    viewCount?: SortOrder
  }

  export type CharacterCreateNestedManyWithoutUniverseInput = {
    create?: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput> | CharacterCreateWithoutUniverseInput[] | CharacterUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: CharacterCreateOrConnectWithoutUniverseInput | CharacterCreateOrConnectWithoutUniverseInput[]
    createMany?: CharacterCreateManyUniverseInputEnvelope
    connect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
  }

  export type LocationCreateNestedManyWithoutUniverseInput = {
    create?: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput> | LocationCreateWithoutUniverseInput[] | LocationUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutUniverseInput | LocationCreateOrConnectWithoutUniverseInput[]
    createMany?: LocationCreateManyUniverseInputEnvelope
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
  }

  export type TimelineEventCreateNestedManyWithoutUniverseInput = {
    create?: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput> | TimelineEventCreateWithoutUniverseInput[] | TimelineEventUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutUniverseInput | TimelineEventCreateOrConnectWithoutUniverseInput[]
    createMany?: TimelineEventCreateManyUniverseInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type TitleCreateNestedManyWithoutUniverseInput = {
    create?: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput> | TitleCreateWithoutUniverseInput[] | TitleUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TitleCreateOrConnectWithoutUniverseInput | TitleCreateOrConnectWithoutUniverseInput[]
    createMany?: TitleCreateManyUniverseInputEnvelope
    connect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
  }

  export type LoreEntryCreateNestedManyWithoutUniverseInput = {
    create?: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput> | LoreEntryCreateWithoutUniverseInput[] | LoreEntryUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LoreEntryCreateOrConnectWithoutUniverseInput | LoreEntryCreateOrConnectWithoutUniverseInput[]
    createMany?: LoreEntryCreateManyUniverseInputEnvelope
    connect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
  }

  export type CharacterUncheckedCreateNestedManyWithoutUniverseInput = {
    create?: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput> | CharacterCreateWithoutUniverseInput[] | CharacterUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: CharacterCreateOrConnectWithoutUniverseInput | CharacterCreateOrConnectWithoutUniverseInput[]
    createMany?: CharacterCreateManyUniverseInputEnvelope
    connect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
  }

  export type LocationUncheckedCreateNestedManyWithoutUniverseInput = {
    create?: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput> | LocationCreateWithoutUniverseInput[] | LocationUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutUniverseInput | LocationCreateOrConnectWithoutUniverseInput[]
    createMany?: LocationCreateManyUniverseInputEnvelope
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
  }

  export type TimelineEventUncheckedCreateNestedManyWithoutUniverseInput = {
    create?: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput> | TimelineEventCreateWithoutUniverseInput[] | TimelineEventUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutUniverseInput | TimelineEventCreateOrConnectWithoutUniverseInput[]
    createMany?: TimelineEventCreateManyUniverseInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type TitleUncheckedCreateNestedManyWithoutUniverseInput = {
    create?: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput> | TitleCreateWithoutUniverseInput[] | TitleUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TitleCreateOrConnectWithoutUniverseInput | TitleCreateOrConnectWithoutUniverseInput[]
    createMany?: TitleCreateManyUniverseInputEnvelope
    connect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
  }

  export type LoreEntryUncheckedCreateNestedManyWithoutUniverseInput = {
    create?: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput> | LoreEntryCreateWithoutUniverseInput[] | LoreEntryUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LoreEntryCreateOrConnectWithoutUniverseInput | LoreEntryCreateOrConnectWithoutUniverseInput[]
    createMany?: LoreEntryCreateManyUniverseInputEnvelope
    connect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CharacterUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput> | CharacterCreateWithoutUniverseInput[] | CharacterUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: CharacterCreateOrConnectWithoutUniverseInput | CharacterCreateOrConnectWithoutUniverseInput[]
    upsert?: CharacterUpsertWithWhereUniqueWithoutUniverseInput | CharacterUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: CharacterCreateManyUniverseInputEnvelope
    set?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    disconnect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    delete?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    connect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    update?: CharacterUpdateWithWhereUniqueWithoutUniverseInput | CharacterUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: CharacterUpdateManyWithWhereWithoutUniverseInput | CharacterUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: CharacterScalarWhereInput | CharacterScalarWhereInput[]
  }

  export type LocationUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput> | LocationCreateWithoutUniverseInput[] | LocationUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutUniverseInput | LocationCreateOrConnectWithoutUniverseInput[]
    upsert?: LocationUpsertWithWhereUniqueWithoutUniverseInput | LocationUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: LocationCreateManyUniverseInputEnvelope
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    update?: LocationUpdateWithWhereUniqueWithoutUniverseInput | LocationUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: LocationUpdateManyWithWhereWithoutUniverseInput | LocationUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[]
  }

  export type TimelineEventUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput> | TimelineEventCreateWithoutUniverseInput[] | TimelineEventUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutUniverseInput | TimelineEventCreateOrConnectWithoutUniverseInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutUniverseInput | TimelineEventUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: TimelineEventCreateManyUniverseInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutUniverseInput | TimelineEventUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutUniverseInput | TimelineEventUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type TitleUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput> | TitleCreateWithoutUniverseInput[] | TitleUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TitleCreateOrConnectWithoutUniverseInput | TitleCreateOrConnectWithoutUniverseInput[]
    upsert?: TitleUpsertWithWhereUniqueWithoutUniverseInput | TitleUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: TitleCreateManyUniverseInputEnvelope
    set?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    disconnect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    delete?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    connect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    update?: TitleUpdateWithWhereUniqueWithoutUniverseInput | TitleUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: TitleUpdateManyWithWhereWithoutUniverseInput | TitleUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: TitleScalarWhereInput | TitleScalarWhereInput[]
  }

  export type LoreEntryUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput> | LoreEntryCreateWithoutUniverseInput[] | LoreEntryUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LoreEntryCreateOrConnectWithoutUniverseInput | LoreEntryCreateOrConnectWithoutUniverseInput[]
    upsert?: LoreEntryUpsertWithWhereUniqueWithoutUniverseInput | LoreEntryUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: LoreEntryCreateManyUniverseInputEnvelope
    set?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    disconnect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    delete?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    connect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    update?: LoreEntryUpdateWithWhereUniqueWithoutUniverseInput | LoreEntryUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: LoreEntryUpdateManyWithWhereWithoutUniverseInput | LoreEntryUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: LoreEntryScalarWhereInput | LoreEntryScalarWhereInput[]
  }

  export type CharacterUncheckedUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput> | CharacterCreateWithoutUniverseInput[] | CharacterUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: CharacterCreateOrConnectWithoutUniverseInput | CharacterCreateOrConnectWithoutUniverseInput[]
    upsert?: CharacterUpsertWithWhereUniqueWithoutUniverseInput | CharacterUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: CharacterCreateManyUniverseInputEnvelope
    set?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    disconnect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    delete?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    connect?: CharacterWhereUniqueInput | CharacterWhereUniqueInput[]
    update?: CharacterUpdateWithWhereUniqueWithoutUniverseInput | CharacterUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: CharacterUpdateManyWithWhereWithoutUniverseInput | CharacterUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: CharacterScalarWhereInput | CharacterScalarWhereInput[]
  }

  export type LocationUncheckedUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput> | LocationCreateWithoutUniverseInput[] | LocationUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutUniverseInput | LocationCreateOrConnectWithoutUniverseInput[]
    upsert?: LocationUpsertWithWhereUniqueWithoutUniverseInput | LocationUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: LocationCreateManyUniverseInputEnvelope
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    update?: LocationUpdateWithWhereUniqueWithoutUniverseInput | LocationUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: LocationUpdateManyWithWhereWithoutUniverseInput | LocationUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[]
  }

  export type TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput> | TimelineEventCreateWithoutUniverseInput[] | TimelineEventUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutUniverseInput | TimelineEventCreateOrConnectWithoutUniverseInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutUniverseInput | TimelineEventUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: TimelineEventCreateManyUniverseInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutUniverseInput | TimelineEventUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutUniverseInput | TimelineEventUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type TitleUncheckedUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput> | TitleCreateWithoutUniverseInput[] | TitleUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: TitleCreateOrConnectWithoutUniverseInput | TitleCreateOrConnectWithoutUniverseInput[]
    upsert?: TitleUpsertWithWhereUniqueWithoutUniverseInput | TitleUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: TitleCreateManyUniverseInputEnvelope
    set?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    disconnect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    delete?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    connect?: TitleWhereUniqueInput | TitleWhereUniqueInput[]
    update?: TitleUpdateWithWhereUniqueWithoutUniverseInput | TitleUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: TitleUpdateManyWithWhereWithoutUniverseInput | TitleUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: TitleScalarWhereInput | TitleScalarWhereInput[]
  }

  export type LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput = {
    create?: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput> | LoreEntryCreateWithoutUniverseInput[] | LoreEntryUncheckedCreateWithoutUniverseInput[]
    connectOrCreate?: LoreEntryCreateOrConnectWithoutUniverseInput | LoreEntryCreateOrConnectWithoutUniverseInput[]
    upsert?: LoreEntryUpsertWithWhereUniqueWithoutUniverseInput | LoreEntryUpsertWithWhereUniqueWithoutUniverseInput[]
    createMany?: LoreEntryCreateManyUniverseInputEnvelope
    set?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    disconnect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    delete?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    connect?: LoreEntryWhereUniqueInput | LoreEntryWhereUniqueInput[]
    update?: LoreEntryUpdateWithWhereUniqueWithoutUniverseInput | LoreEntryUpdateWithWhereUniqueWithoutUniverseInput[]
    updateMany?: LoreEntryUpdateManyWithWhereWithoutUniverseInput | LoreEntryUpdateManyWithWhereWithoutUniverseInput[]
    deleteMany?: LoreEntryScalarWhereInput | LoreEntryScalarWhereInput[]
  }

  export type UniverseMapCreateNestedOneWithoutLocationsInput = {
    create?: XOR<UniverseMapCreateWithoutLocationsInput, UniverseMapUncheckedCreateWithoutLocationsInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutLocationsInput
    connect?: UniverseMapWhereUniqueInput
  }

  export type LocationCreateNestedOneWithoutChildrenInput = {
    create?: XOR<LocationCreateWithoutChildrenInput, LocationUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: LocationCreateOrConnectWithoutChildrenInput
    connect?: LocationWhereUniqueInput
  }

  export type LocationCreateNestedManyWithoutParentInput = {
    create?: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput> | LocationCreateWithoutParentInput[] | LocationUncheckedCreateWithoutParentInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutParentInput | LocationCreateOrConnectWithoutParentInput[]
    createMany?: LocationCreateManyParentInputEnvelope
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
  }

  export type CharacterLocationCreateNestedManyWithoutLocationInput = {
    create?: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput> | CharacterLocationCreateWithoutLocationInput[] | CharacterLocationUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutLocationInput | CharacterLocationCreateOrConnectWithoutLocationInput[]
    createMany?: CharacterLocationCreateManyLocationInputEnvelope
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
  }

  export type TimelineEventCreateNestedManyWithoutLocationInput = {
    create?: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput> | TimelineEventCreateWithoutLocationInput[] | TimelineEventUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutLocationInput | TimelineEventCreateOrConnectWithoutLocationInput[]
    createMany?: TimelineEventCreateManyLocationInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type LocationUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput> | LocationCreateWithoutParentInput[] | LocationUncheckedCreateWithoutParentInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutParentInput | LocationCreateOrConnectWithoutParentInput[]
    createMany?: LocationCreateManyParentInputEnvelope
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
  }

  export type CharacterLocationUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput> | CharacterLocationCreateWithoutLocationInput[] | CharacterLocationUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutLocationInput | CharacterLocationCreateOrConnectWithoutLocationInput[]
    createMany?: CharacterLocationCreateManyLocationInputEnvelope
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
  }

  export type TimelineEventUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput> | TimelineEventCreateWithoutLocationInput[] | TimelineEventUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutLocationInput | TimelineEventCreateOrConnectWithoutLocationInput[]
    createMany?: TimelineEventCreateManyLocationInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UniverseMapUpdateOneRequiredWithoutLocationsNestedInput = {
    create?: XOR<UniverseMapCreateWithoutLocationsInput, UniverseMapUncheckedCreateWithoutLocationsInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutLocationsInput
    upsert?: UniverseMapUpsertWithoutLocationsInput
    connect?: UniverseMapWhereUniqueInput
    update?: XOR<XOR<UniverseMapUpdateToOneWithWhereWithoutLocationsInput, UniverseMapUpdateWithoutLocationsInput>, UniverseMapUncheckedUpdateWithoutLocationsInput>
  }

  export type LocationUpdateOneWithoutChildrenNestedInput = {
    create?: XOR<LocationCreateWithoutChildrenInput, LocationUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: LocationCreateOrConnectWithoutChildrenInput
    upsert?: LocationUpsertWithoutChildrenInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutChildrenInput, LocationUpdateWithoutChildrenInput>, LocationUncheckedUpdateWithoutChildrenInput>
  }

  export type LocationUpdateManyWithoutParentNestedInput = {
    create?: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput> | LocationCreateWithoutParentInput[] | LocationUncheckedCreateWithoutParentInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutParentInput | LocationCreateOrConnectWithoutParentInput[]
    upsert?: LocationUpsertWithWhereUniqueWithoutParentInput | LocationUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: LocationCreateManyParentInputEnvelope
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    update?: LocationUpdateWithWhereUniqueWithoutParentInput | LocationUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: LocationUpdateManyWithWhereWithoutParentInput | LocationUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[]
  }

  export type CharacterLocationUpdateManyWithoutLocationNestedInput = {
    create?: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput> | CharacterLocationCreateWithoutLocationInput[] | CharacterLocationUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutLocationInput | CharacterLocationCreateOrConnectWithoutLocationInput[]
    upsert?: CharacterLocationUpsertWithWhereUniqueWithoutLocationInput | CharacterLocationUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: CharacterLocationCreateManyLocationInputEnvelope
    set?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    disconnect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    delete?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    update?: CharacterLocationUpdateWithWhereUniqueWithoutLocationInput | CharacterLocationUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: CharacterLocationUpdateManyWithWhereWithoutLocationInput | CharacterLocationUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
  }

  export type TimelineEventUpdateManyWithoutLocationNestedInput = {
    create?: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput> | TimelineEventCreateWithoutLocationInput[] | TimelineEventUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutLocationInput | TimelineEventCreateOrConnectWithoutLocationInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutLocationInput | TimelineEventUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: TimelineEventCreateManyLocationInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutLocationInput | TimelineEventUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutLocationInput | TimelineEventUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type LocationUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput> | LocationCreateWithoutParentInput[] | LocationUncheckedCreateWithoutParentInput[]
    connectOrCreate?: LocationCreateOrConnectWithoutParentInput | LocationCreateOrConnectWithoutParentInput[]
    upsert?: LocationUpsertWithWhereUniqueWithoutParentInput | LocationUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: LocationCreateManyParentInputEnvelope
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[]
    update?: LocationUpdateWithWhereUniqueWithoutParentInput | LocationUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: LocationUpdateManyWithWhereWithoutParentInput | LocationUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[]
  }

  export type CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput> | CharacterLocationCreateWithoutLocationInput[] | CharacterLocationUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutLocationInput | CharacterLocationCreateOrConnectWithoutLocationInput[]
    upsert?: CharacterLocationUpsertWithWhereUniqueWithoutLocationInput | CharacterLocationUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: CharacterLocationCreateManyLocationInputEnvelope
    set?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    disconnect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    delete?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    update?: CharacterLocationUpdateWithWhereUniqueWithoutLocationInput | CharacterLocationUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: CharacterLocationUpdateManyWithWhereWithoutLocationInput | CharacterLocationUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
  }

  export type TimelineEventUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput> | TimelineEventCreateWithoutLocationInput[] | TimelineEventUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutLocationInput | TimelineEventCreateOrConnectWithoutLocationInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutLocationInput | TimelineEventUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: TimelineEventCreateManyLocationInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutLocationInput | TimelineEventUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutLocationInput | TimelineEventUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type UniverseMapCreateNestedOneWithoutCharactersInput = {
    create?: XOR<UniverseMapCreateWithoutCharactersInput, UniverseMapUncheckedCreateWithoutCharactersInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutCharactersInput
    connect?: UniverseMapWhereUniqueInput
  }

  export type CharacterLocationCreateNestedManyWithoutCharacterInput = {
    create?: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput> | CharacterLocationCreateWithoutCharacterInput[] | CharacterLocationUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutCharacterInput | CharacterLocationCreateOrConnectWithoutCharacterInput[]
    createMany?: CharacterLocationCreateManyCharacterInputEnvelope
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
  }

  export type CharacterRelationshipCreateNestedManyWithoutFromInput = {
    create?: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput> | CharacterRelationshipCreateWithoutFromInput[] | CharacterRelationshipUncheckedCreateWithoutFromInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutFromInput | CharacterRelationshipCreateOrConnectWithoutFromInput[]
    createMany?: CharacterRelationshipCreateManyFromInputEnvelope
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
  }

  export type CharacterRelationshipCreateNestedManyWithoutToInput = {
    create?: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput> | CharacterRelationshipCreateWithoutToInput[] | CharacterRelationshipUncheckedCreateWithoutToInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutToInput | CharacterRelationshipCreateOrConnectWithoutToInput[]
    createMany?: CharacterRelationshipCreateManyToInputEnvelope
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
  }

  export type TimelineEventCreateNestedManyWithoutCharacterInput = {
    create?: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput> | TimelineEventCreateWithoutCharacterInput[] | TimelineEventUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutCharacterInput | TimelineEventCreateOrConnectWithoutCharacterInput[]
    createMany?: TimelineEventCreateManyCharacterInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput = {
    create?: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput> | CharacterLocationCreateWithoutCharacterInput[] | CharacterLocationUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutCharacterInput | CharacterLocationCreateOrConnectWithoutCharacterInput[]
    createMany?: CharacterLocationCreateManyCharacterInputEnvelope
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
  }

  export type CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput = {
    create?: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput> | CharacterRelationshipCreateWithoutFromInput[] | CharacterRelationshipUncheckedCreateWithoutFromInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutFromInput | CharacterRelationshipCreateOrConnectWithoutFromInput[]
    createMany?: CharacterRelationshipCreateManyFromInputEnvelope
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
  }

  export type CharacterRelationshipUncheckedCreateNestedManyWithoutToInput = {
    create?: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput> | CharacterRelationshipCreateWithoutToInput[] | CharacterRelationshipUncheckedCreateWithoutToInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutToInput | CharacterRelationshipCreateOrConnectWithoutToInput[]
    createMany?: CharacterRelationshipCreateManyToInputEnvelope
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
  }

  export type TimelineEventUncheckedCreateNestedManyWithoutCharacterInput = {
    create?: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput> | TimelineEventCreateWithoutCharacterInput[] | TimelineEventUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutCharacterInput | TimelineEventCreateOrConnectWithoutCharacterInput[]
    createMany?: TimelineEventCreateManyCharacterInputEnvelope
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UniverseMapUpdateOneRequiredWithoutCharactersNestedInput = {
    create?: XOR<UniverseMapCreateWithoutCharactersInput, UniverseMapUncheckedCreateWithoutCharactersInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutCharactersInput
    upsert?: UniverseMapUpsertWithoutCharactersInput
    connect?: UniverseMapWhereUniqueInput
    update?: XOR<XOR<UniverseMapUpdateToOneWithWhereWithoutCharactersInput, UniverseMapUpdateWithoutCharactersInput>, UniverseMapUncheckedUpdateWithoutCharactersInput>
  }

  export type CharacterLocationUpdateManyWithoutCharacterNestedInput = {
    create?: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput> | CharacterLocationCreateWithoutCharacterInput[] | CharacterLocationUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutCharacterInput | CharacterLocationCreateOrConnectWithoutCharacterInput[]
    upsert?: CharacterLocationUpsertWithWhereUniqueWithoutCharacterInput | CharacterLocationUpsertWithWhereUniqueWithoutCharacterInput[]
    createMany?: CharacterLocationCreateManyCharacterInputEnvelope
    set?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    disconnect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    delete?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    update?: CharacterLocationUpdateWithWhereUniqueWithoutCharacterInput | CharacterLocationUpdateWithWhereUniqueWithoutCharacterInput[]
    updateMany?: CharacterLocationUpdateManyWithWhereWithoutCharacterInput | CharacterLocationUpdateManyWithWhereWithoutCharacterInput[]
    deleteMany?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
  }

  export type CharacterRelationshipUpdateManyWithoutFromNestedInput = {
    create?: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput> | CharacterRelationshipCreateWithoutFromInput[] | CharacterRelationshipUncheckedCreateWithoutFromInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutFromInput | CharacterRelationshipCreateOrConnectWithoutFromInput[]
    upsert?: CharacterRelationshipUpsertWithWhereUniqueWithoutFromInput | CharacterRelationshipUpsertWithWhereUniqueWithoutFromInput[]
    createMany?: CharacterRelationshipCreateManyFromInputEnvelope
    set?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    disconnect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    delete?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    update?: CharacterRelationshipUpdateWithWhereUniqueWithoutFromInput | CharacterRelationshipUpdateWithWhereUniqueWithoutFromInput[]
    updateMany?: CharacterRelationshipUpdateManyWithWhereWithoutFromInput | CharacterRelationshipUpdateManyWithWhereWithoutFromInput[]
    deleteMany?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
  }

  export type CharacterRelationshipUpdateManyWithoutToNestedInput = {
    create?: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput> | CharacterRelationshipCreateWithoutToInput[] | CharacterRelationshipUncheckedCreateWithoutToInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutToInput | CharacterRelationshipCreateOrConnectWithoutToInput[]
    upsert?: CharacterRelationshipUpsertWithWhereUniqueWithoutToInput | CharacterRelationshipUpsertWithWhereUniqueWithoutToInput[]
    createMany?: CharacterRelationshipCreateManyToInputEnvelope
    set?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    disconnect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    delete?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    update?: CharacterRelationshipUpdateWithWhereUniqueWithoutToInput | CharacterRelationshipUpdateWithWhereUniqueWithoutToInput[]
    updateMany?: CharacterRelationshipUpdateManyWithWhereWithoutToInput | CharacterRelationshipUpdateManyWithWhereWithoutToInput[]
    deleteMany?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
  }

  export type TimelineEventUpdateManyWithoutCharacterNestedInput = {
    create?: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput> | TimelineEventCreateWithoutCharacterInput[] | TimelineEventUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutCharacterInput | TimelineEventCreateOrConnectWithoutCharacterInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutCharacterInput | TimelineEventUpsertWithWhereUniqueWithoutCharacterInput[]
    createMany?: TimelineEventCreateManyCharacterInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutCharacterInput | TimelineEventUpdateWithWhereUniqueWithoutCharacterInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutCharacterInput | TimelineEventUpdateManyWithWhereWithoutCharacterInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput = {
    create?: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput> | CharacterLocationCreateWithoutCharacterInput[] | CharacterLocationUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: CharacterLocationCreateOrConnectWithoutCharacterInput | CharacterLocationCreateOrConnectWithoutCharacterInput[]
    upsert?: CharacterLocationUpsertWithWhereUniqueWithoutCharacterInput | CharacterLocationUpsertWithWhereUniqueWithoutCharacterInput[]
    createMany?: CharacterLocationCreateManyCharacterInputEnvelope
    set?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    disconnect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    delete?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    connect?: CharacterLocationWhereUniqueInput | CharacterLocationWhereUniqueInput[]
    update?: CharacterLocationUpdateWithWhereUniqueWithoutCharacterInput | CharacterLocationUpdateWithWhereUniqueWithoutCharacterInput[]
    updateMany?: CharacterLocationUpdateManyWithWhereWithoutCharacterInput | CharacterLocationUpdateManyWithWhereWithoutCharacterInput[]
    deleteMany?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
  }

  export type CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput = {
    create?: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput> | CharacterRelationshipCreateWithoutFromInput[] | CharacterRelationshipUncheckedCreateWithoutFromInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutFromInput | CharacterRelationshipCreateOrConnectWithoutFromInput[]
    upsert?: CharacterRelationshipUpsertWithWhereUniqueWithoutFromInput | CharacterRelationshipUpsertWithWhereUniqueWithoutFromInput[]
    createMany?: CharacterRelationshipCreateManyFromInputEnvelope
    set?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    disconnect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    delete?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    update?: CharacterRelationshipUpdateWithWhereUniqueWithoutFromInput | CharacterRelationshipUpdateWithWhereUniqueWithoutFromInput[]
    updateMany?: CharacterRelationshipUpdateManyWithWhereWithoutFromInput | CharacterRelationshipUpdateManyWithWhereWithoutFromInput[]
    deleteMany?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
  }

  export type CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput = {
    create?: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput> | CharacterRelationshipCreateWithoutToInput[] | CharacterRelationshipUncheckedCreateWithoutToInput[]
    connectOrCreate?: CharacterRelationshipCreateOrConnectWithoutToInput | CharacterRelationshipCreateOrConnectWithoutToInput[]
    upsert?: CharacterRelationshipUpsertWithWhereUniqueWithoutToInput | CharacterRelationshipUpsertWithWhereUniqueWithoutToInput[]
    createMany?: CharacterRelationshipCreateManyToInputEnvelope
    set?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    disconnect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    delete?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    connect?: CharacterRelationshipWhereUniqueInput | CharacterRelationshipWhereUniqueInput[]
    update?: CharacterRelationshipUpdateWithWhereUniqueWithoutToInput | CharacterRelationshipUpdateWithWhereUniqueWithoutToInput[]
    updateMany?: CharacterRelationshipUpdateManyWithWhereWithoutToInput | CharacterRelationshipUpdateManyWithWhereWithoutToInput[]
    deleteMany?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
  }

  export type TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput = {
    create?: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput> | TimelineEventCreateWithoutCharacterInput[] | TimelineEventUncheckedCreateWithoutCharacterInput[]
    connectOrCreate?: TimelineEventCreateOrConnectWithoutCharacterInput | TimelineEventCreateOrConnectWithoutCharacterInput[]
    upsert?: TimelineEventUpsertWithWhereUniqueWithoutCharacterInput | TimelineEventUpsertWithWhereUniqueWithoutCharacterInput[]
    createMany?: TimelineEventCreateManyCharacterInputEnvelope
    set?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    disconnect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    delete?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    connect?: TimelineEventWhereUniqueInput | TimelineEventWhereUniqueInput[]
    update?: TimelineEventUpdateWithWhereUniqueWithoutCharacterInput | TimelineEventUpdateWithWhereUniqueWithoutCharacterInput[]
    updateMany?: TimelineEventUpdateManyWithWhereWithoutCharacterInput | TimelineEventUpdateManyWithWhereWithoutCharacterInput[]
    deleteMany?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
  }

  export type CharacterCreateNestedOneWithoutLocationsInput = {
    create?: XOR<CharacterCreateWithoutLocationsInput, CharacterUncheckedCreateWithoutLocationsInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutLocationsInput
    connect?: CharacterWhereUniqueInput
  }

  export type LocationCreateNestedOneWithoutCharactersInput = {
    create?: XOR<LocationCreateWithoutCharactersInput, LocationUncheckedCreateWithoutCharactersInput>
    connectOrCreate?: LocationCreateOrConnectWithoutCharactersInput
    connect?: LocationWhereUniqueInput
  }

  export type CharacterUpdateOneRequiredWithoutLocationsNestedInput = {
    create?: XOR<CharacterCreateWithoutLocationsInput, CharacterUncheckedCreateWithoutLocationsInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutLocationsInput
    upsert?: CharacterUpsertWithoutLocationsInput
    connect?: CharacterWhereUniqueInput
    update?: XOR<XOR<CharacterUpdateToOneWithWhereWithoutLocationsInput, CharacterUpdateWithoutLocationsInput>, CharacterUncheckedUpdateWithoutLocationsInput>
  }

  export type LocationUpdateOneRequiredWithoutCharactersNestedInput = {
    create?: XOR<LocationCreateWithoutCharactersInput, LocationUncheckedCreateWithoutCharactersInput>
    connectOrCreate?: LocationCreateOrConnectWithoutCharactersInput
    upsert?: LocationUpsertWithoutCharactersInput
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutCharactersInput, LocationUpdateWithoutCharactersInput>, LocationUncheckedUpdateWithoutCharactersInput>
  }

  export type CharacterCreateNestedOneWithoutRelationshipsFromInput = {
    create?: XOR<CharacterCreateWithoutRelationshipsFromInput, CharacterUncheckedCreateWithoutRelationshipsFromInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutRelationshipsFromInput
    connect?: CharacterWhereUniqueInput
  }

  export type CharacterCreateNestedOneWithoutRelationshipsToInput = {
    create?: XOR<CharacterCreateWithoutRelationshipsToInput, CharacterUncheckedCreateWithoutRelationshipsToInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutRelationshipsToInput
    connect?: CharacterWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CharacterUpdateOneRequiredWithoutRelationshipsFromNestedInput = {
    create?: XOR<CharacterCreateWithoutRelationshipsFromInput, CharacterUncheckedCreateWithoutRelationshipsFromInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutRelationshipsFromInput
    upsert?: CharacterUpsertWithoutRelationshipsFromInput
    connect?: CharacterWhereUniqueInput
    update?: XOR<XOR<CharacterUpdateToOneWithWhereWithoutRelationshipsFromInput, CharacterUpdateWithoutRelationshipsFromInput>, CharacterUncheckedUpdateWithoutRelationshipsFromInput>
  }

  export type CharacterUpdateOneRequiredWithoutRelationshipsToNestedInput = {
    create?: XOR<CharacterCreateWithoutRelationshipsToInput, CharacterUncheckedCreateWithoutRelationshipsToInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutRelationshipsToInput
    upsert?: CharacterUpsertWithoutRelationshipsToInput
    connect?: CharacterWhereUniqueInput
    update?: XOR<XOR<CharacterUpdateToOneWithWhereWithoutRelationshipsToInput, CharacterUpdateWithoutRelationshipsToInput>, CharacterUncheckedUpdateWithoutRelationshipsToInput>
  }

  export type UniverseMapCreateNestedOneWithoutTimelineInput = {
    create?: XOR<UniverseMapCreateWithoutTimelineInput, UniverseMapUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutTimelineInput
    connect?: UniverseMapWhereUniqueInput
  }

  export type CharacterCreateNestedOneWithoutTimelineInput = {
    create?: XOR<CharacterCreateWithoutTimelineInput, CharacterUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutTimelineInput
    connect?: CharacterWhereUniqueInput
  }

  export type LocationCreateNestedOneWithoutTimelineInput = {
    create?: XOR<LocationCreateWithoutTimelineInput, LocationUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: LocationCreateOrConnectWithoutTimelineInput
    connect?: LocationWhereUniqueInput
  }

  export type UniverseMapUpdateOneRequiredWithoutTimelineNestedInput = {
    create?: XOR<UniverseMapCreateWithoutTimelineInput, UniverseMapUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutTimelineInput
    upsert?: UniverseMapUpsertWithoutTimelineInput
    connect?: UniverseMapWhereUniqueInput
    update?: XOR<XOR<UniverseMapUpdateToOneWithWhereWithoutTimelineInput, UniverseMapUpdateWithoutTimelineInput>, UniverseMapUncheckedUpdateWithoutTimelineInput>
  }

  export type CharacterUpdateOneWithoutTimelineNestedInput = {
    create?: XOR<CharacterCreateWithoutTimelineInput, CharacterUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: CharacterCreateOrConnectWithoutTimelineInput
    upsert?: CharacterUpsertWithoutTimelineInput
    disconnect?: CharacterWhereInput | boolean
    delete?: CharacterWhereInput | boolean
    connect?: CharacterWhereUniqueInput
    update?: XOR<XOR<CharacterUpdateToOneWithWhereWithoutTimelineInput, CharacterUpdateWithoutTimelineInput>, CharacterUncheckedUpdateWithoutTimelineInput>
  }

  export type LocationUpdateOneWithoutTimelineNestedInput = {
    create?: XOR<LocationCreateWithoutTimelineInput, LocationUncheckedCreateWithoutTimelineInput>
    connectOrCreate?: LocationCreateOrConnectWithoutTimelineInput
    upsert?: LocationUpsertWithoutTimelineInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutTimelineInput, LocationUpdateWithoutTimelineInput>, LocationUncheckedUpdateWithoutTimelineInput>
  }

  export type UniverseMapCreateNestedOneWithoutTitlesInput = {
    create?: XOR<UniverseMapCreateWithoutTitlesInput, UniverseMapUncheckedCreateWithoutTitlesInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutTitlesInput
    connect?: UniverseMapWhereUniqueInput
  }

  export type RecapCreateNestedManyWithoutTitleInput = {
    create?: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput> | RecapCreateWithoutTitleInput[] | RecapUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: RecapCreateOrConnectWithoutTitleInput | RecapCreateOrConnectWithoutTitleInput[]
    createMany?: RecapCreateManyTitleInputEnvelope
    connect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
  }

  export type CrossoverTitleCreateNestedManyWithoutTitleInput = {
    create?: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput> | CrossoverTitleCreateWithoutTitleInput[] | CrossoverTitleUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutTitleInput | CrossoverTitleCreateOrConnectWithoutTitleInput[]
    createMany?: CrossoverTitleCreateManyTitleInputEnvelope
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
  }

  export type ChapterCreateNestedManyWithoutTitleInput = {
    create?: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput> | ChapterCreateWithoutTitleInput[] | ChapterUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTitleInput | ChapterCreateOrConnectWithoutTitleInput[]
    createMany?: ChapterCreateManyTitleInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
  }

  export type RecapUncheckedCreateNestedManyWithoutTitleInput = {
    create?: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput> | RecapCreateWithoutTitleInput[] | RecapUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: RecapCreateOrConnectWithoutTitleInput | RecapCreateOrConnectWithoutTitleInput[]
    createMany?: RecapCreateManyTitleInputEnvelope
    connect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
  }

  export type CrossoverTitleUncheckedCreateNestedManyWithoutTitleInput = {
    create?: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput> | CrossoverTitleCreateWithoutTitleInput[] | CrossoverTitleUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutTitleInput | CrossoverTitleCreateOrConnectWithoutTitleInput[]
    createMany?: CrossoverTitleCreateManyTitleInputEnvelope
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
  }

  export type ChapterUncheckedCreateNestedManyWithoutTitleInput = {
    create?: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput> | ChapterCreateWithoutTitleInput[] | ChapterUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTitleInput | ChapterCreateOrConnectWithoutTitleInput[]
    createMany?: ChapterCreateManyTitleInputEnvelope
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
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

  export type UniverseMapUpdateOneRequiredWithoutTitlesNestedInput = {
    create?: XOR<UniverseMapCreateWithoutTitlesInput, UniverseMapUncheckedCreateWithoutTitlesInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutTitlesInput
    upsert?: UniverseMapUpsertWithoutTitlesInput
    connect?: UniverseMapWhereUniqueInput
    update?: XOR<XOR<UniverseMapUpdateToOneWithWhereWithoutTitlesInput, UniverseMapUpdateWithoutTitlesInput>, UniverseMapUncheckedUpdateWithoutTitlesInput>
  }

  export type RecapUpdateManyWithoutTitleNestedInput = {
    create?: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput> | RecapCreateWithoutTitleInput[] | RecapUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: RecapCreateOrConnectWithoutTitleInput | RecapCreateOrConnectWithoutTitleInput[]
    upsert?: RecapUpsertWithWhereUniqueWithoutTitleInput | RecapUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: RecapCreateManyTitleInputEnvelope
    set?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    disconnect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    delete?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    connect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    update?: RecapUpdateWithWhereUniqueWithoutTitleInput | RecapUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: RecapUpdateManyWithWhereWithoutTitleInput | RecapUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: RecapScalarWhereInput | RecapScalarWhereInput[]
  }

  export type CrossoverTitleUpdateManyWithoutTitleNestedInput = {
    create?: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput> | CrossoverTitleCreateWithoutTitleInput[] | CrossoverTitleUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutTitleInput | CrossoverTitleCreateOrConnectWithoutTitleInput[]
    upsert?: CrossoverTitleUpsertWithWhereUniqueWithoutTitleInput | CrossoverTitleUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: CrossoverTitleCreateManyTitleInputEnvelope
    set?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    disconnect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    delete?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    update?: CrossoverTitleUpdateWithWhereUniqueWithoutTitleInput | CrossoverTitleUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: CrossoverTitleUpdateManyWithWhereWithoutTitleInput | CrossoverTitleUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
  }

  export type ChapterUpdateManyWithoutTitleNestedInput = {
    create?: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput> | ChapterCreateWithoutTitleInput[] | ChapterUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTitleInput | ChapterCreateOrConnectWithoutTitleInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutTitleInput | ChapterUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: ChapterCreateManyTitleInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutTitleInput | ChapterUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutTitleInput | ChapterUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type RecapUncheckedUpdateManyWithoutTitleNestedInput = {
    create?: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput> | RecapCreateWithoutTitleInput[] | RecapUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: RecapCreateOrConnectWithoutTitleInput | RecapCreateOrConnectWithoutTitleInput[]
    upsert?: RecapUpsertWithWhereUniqueWithoutTitleInput | RecapUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: RecapCreateManyTitleInputEnvelope
    set?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    disconnect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    delete?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    connect?: RecapWhereUniqueInput | RecapWhereUniqueInput[]
    update?: RecapUpdateWithWhereUniqueWithoutTitleInput | RecapUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: RecapUpdateManyWithWhereWithoutTitleInput | RecapUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: RecapScalarWhereInput | RecapScalarWhereInput[]
  }

  export type CrossoverTitleUncheckedUpdateManyWithoutTitleNestedInput = {
    create?: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput> | CrossoverTitleCreateWithoutTitleInput[] | CrossoverTitleUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutTitleInput | CrossoverTitleCreateOrConnectWithoutTitleInput[]
    upsert?: CrossoverTitleUpsertWithWhereUniqueWithoutTitleInput | CrossoverTitleUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: CrossoverTitleCreateManyTitleInputEnvelope
    set?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    disconnect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    delete?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    update?: CrossoverTitleUpdateWithWhereUniqueWithoutTitleInput | CrossoverTitleUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: CrossoverTitleUpdateManyWithWhereWithoutTitleInput | CrossoverTitleUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
  }

  export type ChapterUncheckedUpdateManyWithoutTitleNestedInput = {
    create?: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput> | ChapterCreateWithoutTitleInput[] | ChapterUncheckedCreateWithoutTitleInput[]
    connectOrCreate?: ChapterCreateOrConnectWithoutTitleInput | ChapterCreateOrConnectWithoutTitleInput[]
    upsert?: ChapterUpsertWithWhereUniqueWithoutTitleInput | ChapterUpsertWithWhereUniqueWithoutTitleInput[]
    createMany?: ChapterCreateManyTitleInputEnvelope
    set?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    disconnect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    delete?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    connect?: ChapterWhereUniqueInput | ChapterWhereUniqueInput[]
    update?: ChapterUpdateWithWhereUniqueWithoutTitleInput | ChapterUpdateWithWhereUniqueWithoutTitleInput[]
    updateMany?: ChapterUpdateManyWithWhereWithoutTitleInput | ChapterUpdateManyWithWhereWithoutTitleInput[]
    deleteMany?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
  }

  export type TitleCreateNestedOneWithoutChaptersInput = {
    create?: XOR<TitleCreateWithoutChaptersInput, TitleUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: TitleCreateOrConnectWithoutChaptersInput
    connect?: TitleWhereUniqueInput
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TitleUpdateOneRequiredWithoutChaptersNestedInput = {
    create?: XOR<TitleCreateWithoutChaptersInput, TitleUncheckedCreateWithoutChaptersInput>
    connectOrCreate?: TitleCreateOrConnectWithoutChaptersInput
    upsert?: TitleUpsertWithoutChaptersInput
    connect?: TitleWhereUniqueInput
    update?: XOR<XOR<TitleUpdateToOneWithWhereWithoutChaptersInput, TitleUpdateWithoutChaptersInput>, TitleUncheckedUpdateWithoutChaptersInput>
  }

  export type UniverseMapCreateNestedOneWithoutLoreEntriesInput = {
    create?: XOR<UniverseMapCreateWithoutLoreEntriesInput, UniverseMapUncheckedCreateWithoutLoreEntriesInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutLoreEntriesInput
    connect?: UniverseMapWhereUniqueInput
  }

  export type UniverseMapUpdateOneRequiredWithoutLoreEntriesNestedInput = {
    create?: XOR<UniverseMapCreateWithoutLoreEntriesInput, UniverseMapUncheckedCreateWithoutLoreEntriesInput>
    connectOrCreate?: UniverseMapCreateOrConnectWithoutLoreEntriesInput
    upsert?: UniverseMapUpsertWithoutLoreEntriesInput
    connect?: UniverseMapWhereUniqueInput
    update?: XOR<XOR<UniverseMapUpdateToOneWithWhereWithoutLoreEntriesInput, UniverseMapUpdateWithoutLoreEntriesInput>, UniverseMapUncheckedUpdateWithoutLoreEntriesInput>
  }

  export type CrossoverTitleCreateNestedManyWithoutCrossoverInput = {
    create?: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput> | CrossoverTitleCreateWithoutCrossoverInput[] | CrossoverTitleUncheckedCreateWithoutCrossoverInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutCrossoverInput | CrossoverTitleCreateOrConnectWithoutCrossoverInput[]
    createMany?: CrossoverTitleCreateManyCrossoverInputEnvelope
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
  }

  export type CrossoverTitleUncheckedCreateNestedManyWithoutCrossoverInput = {
    create?: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput> | CrossoverTitleCreateWithoutCrossoverInput[] | CrossoverTitleUncheckedCreateWithoutCrossoverInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutCrossoverInput | CrossoverTitleCreateOrConnectWithoutCrossoverInput[]
    createMany?: CrossoverTitleCreateManyCrossoverInputEnvelope
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
  }

  export type CrossoverTitleUpdateManyWithoutCrossoverNestedInput = {
    create?: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput> | CrossoverTitleCreateWithoutCrossoverInput[] | CrossoverTitleUncheckedCreateWithoutCrossoverInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutCrossoverInput | CrossoverTitleCreateOrConnectWithoutCrossoverInput[]
    upsert?: CrossoverTitleUpsertWithWhereUniqueWithoutCrossoverInput | CrossoverTitleUpsertWithWhereUniqueWithoutCrossoverInput[]
    createMany?: CrossoverTitleCreateManyCrossoverInputEnvelope
    set?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    disconnect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    delete?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    update?: CrossoverTitleUpdateWithWhereUniqueWithoutCrossoverInput | CrossoverTitleUpdateWithWhereUniqueWithoutCrossoverInput[]
    updateMany?: CrossoverTitleUpdateManyWithWhereWithoutCrossoverInput | CrossoverTitleUpdateManyWithWhereWithoutCrossoverInput[]
    deleteMany?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
  }

  export type CrossoverTitleUncheckedUpdateManyWithoutCrossoverNestedInput = {
    create?: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput> | CrossoverTitleCreateWithoutCrossoverInput[] | CrossoverTitleUncheckedCreateWithoutCrossoverInput[]
    connectOrCreate?: CrossoverTitleCreateOrConnectWithoutCrossoverInput | CrossoverTitleCreateOrConnectWithoutCrossoverInput[]
    upsert?: CrossoverTitleUpsertWithWhereUniqueWithoutCrossoverInput | CrossoverTitleUpsertWithWhereUniqueWithoutCrossoverInput[]
    createMany?: CrossoverTitleCreateManyCrossoverInputEnvelope
    set?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    disconnect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    delete?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    connect?: CrossoverTitleWhereUniqueInput | CrossoverTitleWhereUniqueInput[]
    update?: CrossoverTitleUpdateWithWhereUniqueWithoutCrossoverInput | CrossoverTitleUpdateWithWhereUniqueWithoutCrossoverInput[]
    updateMany?: CrossoverTitleUpdateManyWithWhereWithoutCrossoverInput | CrossoverTitleUpdateManyWithWhereWithoutCrossoverInput[]
    deleteMany?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
  }

  export type CrossoverCreateNestedOneWithoutTitlesInput = {
    create?: XOR<CrossoverCreateWithoutTitlesInput, CrossoverUncheckedCreateWithoutTitlesInput>
    connectOrCreate?: CrossoverCreateOrConnectWithoutTitlesInput
    connect?: CrossoverWhereUniqueInput
  }

  export type TitleCreateNestedOneWithoutCrossoversInput = {
    create?: XOR<TitleCreateWithoutCrossoversInput, TitleUncheckedCreateWithoutCrossoversInput>
    connectOrCreate?: TitleCreateOrConnectWithoutCrossoversInput
    connect?: TitleWhereUniqueInput
  }

  export type CrossoverUpdateOneRequiredWithoutTitlesNestedInput = {
    create?: XOR<CrossoverCreateWithoutTitlesInput, CrossoverUncheckedCreateWithoutTitlesInput>
    connectOrCreate?: CrossoverCreateOrConnectWithoutTitlesInput
    upsert?: CrossoverUpsertWithoutTitlesInput
    connect?: CrossoverWhereUniqueInput
    update?: XOR<XOR<CrossoverUpdateToOneWithWhereWithoutTitlesInput, CrossoverUpdateWithoutTitlesInput>, CrossoverUncheckedUpdateWithoutTitlesInput>
  }

  export type TitleUpdateOneRequiredWithoutCrossoversNestedInput = {
    create?: XOR<TitleCreateWithoutCrossoversInput, TitleUncheckedCreateWithoutCrossoversInput>
    connectOrCreate?: TitleCreateOrConnectWithoutCrossoversInput
    upsert?: TitleUpsertWithoutCrossoversInput
    connect?: TitleWhereUniqueInput
    update?: XOR<XOR<TitleUpdateToOneWithWhereWithoutCrossoversInput, TitleUpdateWithoutCrossoversInput>, TitleUncheckedUpdateWithoutCrossoversInput>
  }

  export type TitleCreateNestedOneWithoutRecapsInput = {
    create?: XOR<TitleCreateWithoutRecapsInput, TitleUncheckedCreateWithoutRecapsInput>
    connectOrCreate?: TitleCreateOrConnectWithoutRecapsInput
    connect?: TitleWhereUniqueInput
  }

  export type TitleUpdateOneRequiredWithoutRecapsNestedInput = {
    create?: XOR<TitleCreateWithoutRecapsInput, TitleUncheckedCreateWithoutRecapsInput>
    connectOrCreate?: TitleCreateOrConnectWithoutRecapsInput
    upsert?: TitleUpsertWithoutRecapsInput
    connect?: TitleWhereUniqueInput
    update?: XOR<XOR<TitleUpdateToOneWithWhereWithoutRecapsInput, TitleUpdateWithoutRecapsInput>, TitleUncheckedUpdateWithoutRecapsInput>
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

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
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

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type CharacterCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipCreateNestedManyWithoutToInput
    timeline?: TimelineEventCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUncheckedCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipUncheckedCreateNestedManyWithoutToInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutCharacterInput
  }

  export type CharacterCreateOrConnectWithoutUniverseInput = {
    where: CharacterWhereUniqueInput
    create: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput>
  }

  export type CharacterCreateManyUniverseInputEnvelope = {
    data: CharacterCreateManyUniverseInput | CharacterCreateManyUniverseInput[]
    skipDuplicates?: boolean
  }

  export type LocationCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: LocationCreateNestedOneWithoutChildrenInput
    children?: LocationCreateNestedManyWithoutParentInput
    characters?: CharacterLocationCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: LocationUncheckedCreateNestedManyWithoutParentInput
    characters?: CharacterLocationUncheckedCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutUniverseInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput>
  }

  export type LocationCreateManyUniverseInputEnvelope = {
    data: LocationCreateManyUniverseInput | LocationCreateManyUniverseInput[]
    skipDuplicates?: boolean
  }

  export type TimelineEventCreateWithoutUniverseInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    character?: CharacterCreateNestedOneWithoutTimelineInput
    location?: LocationCreateNestedOneWithoutTimelineInput
  }

  export type TimelineEventUncheckedCreateWithoutUniverseInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    characterId?: string | null
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventCreateOrConnectWithoutUniverseInput = {
    where: TimelineEventWhereUniqueInput
    create: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput>
  }

  export type TimelineEventCreateManyUniverseInputEnvelope = {
    data: TimelineEventCreateManyUniverseInput | TimelineEventCreateManyUniverseInput[]
    skipDuplicates?: boolean
  }

  export type TitleCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    recaps?: RecapCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleCreateNestedManyWithoutTitleInput
    chapters?: ChapterCreateNestedManyWithoutTitleInput
  }

  export type TitleUncheckedCreateWithoutUniverseInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    recaps?: RecapUncheckedCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleUncheckedCreateNestedManyWithoutTitleInput
    chapters?: ChapterUncheckedCreateNestedManyWithoutTitleInput
  }

  export type TitleCreateOrConnectWithoutUniverseInput = {
    where: TitleWhereUniqueInput
    create: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput>
  }

  export type TitleCreateManyUniverseInputEnvelope = {
    data: TitleCreateManyUniverseInput | TitleCreateManyUniverseInput[]
    skipDuplicates?: boolean
  }

  export type LoreEntryCreateWithoutUniverseInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoreEntryUncheckedCreateWithoutUniverseInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoreEntryCreateOrConnectWithoutUniverseInput = {
    where: LoreEntryWhereUniqueInput
    create: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput>
  }

  export type LoreEntryCreateManyUniverseInputEnvelope = {
    data: LoreEntryCreateManyUniverseInput | LoreEntryCreateManyUniverseInput[]
    skipDuplicates?: boolean
  }

  export type CharacterUpsertWithWhereUniqueWithoutUniverseInput = {
    where: CharacterWhereUniqueInput
    update: XOR<CharacterUpdateWithoutUniverseInput, CharacterUncheckedUpdateWithoutUniverseInput>
    create: XOR<CharacterCreateWithoutUniverseInput, CharacterUncheckedCreateWithoutUniverseInput>
  }

  export type CharacterUpdateWithWhereUniqueWithoutUniverseInput = {
    where: CharacterWhereUniqueInput
    data: XOR<CharacterUpdateWithoutUniverseInput, CharacterUncheckedUpdateWithoutUniverseInput>
  }

  export type CharacterUpdateManyWithWhereWithoutUniverseInput = {
    where: CharacterScalarWhereInput
    data: XOR<CharacterUpdateManyMutationInput, CharacterUncheckedUpdateManyWithoutUniverseInput>
  }

  export type CharacterScalarWhereInput = {
    AND?: CharacterScalarWhereInput | CharacterScalarWhereInput[]
    OR?: CharacterScalarWhereInput[]
    NOT?: CharacterScalarWhereInput | CharacterScalarWhereInput[]
    id?: StringFilter<"Character"> | string
    name?: StringFilter<"Character"> | string
    slug?: StringFilter<"Character"> | string
    description?: StringNullableFilter<"Character"> | string | null
    avatarUrl?: StringNullableFilter<"Character"> | string | null
    role?: StringNullableFilter<"Character"> | string | null
    status?: StringFilter<"Character"> | string
    universeId?: StringFilter<"Character"> | string
    birthDate?: DateTimeNullableFilter<"Character"> | Date | string | null
    data?: JsonNullableFilter<"Character">
    createdAt?: DateTimeFilter<"Character"> | Date | string
    updatedAt?: DateTimeFilter<"Character"> | Date | string
  }

  export type LocationUpsertWithWhereUniqueWithoutUniverseInput = {
    where: LocationWhereUniqueInput
    update: XOR<LocationUpdateWithoutUniverseInput, LocationUncheckedUpdateWithoutUniverseInput>
    create: XOR<LocationCreateWithoutUniverseInput, LocationUncheckedCreateWithoutUniverseInput>
  }

  export type LocationUpdateWithWhereUniqueWithoutUniverseInput = {
    where: LocationWhereUniqueInput
    data: XOR<LocationUpdateWithoutUniverseInput, LocationUncheckedUpdateWithoutUniverseInput>
  }

  export type LocationUpdateManyWithWhereWithoutUniverseInput = {
    where: LocationScalarWhereInput
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyWithoutUniverseInput>
  }

  export type LocationScalarWhereInput = {
    AND?: LocationScalarWhereInput | LocationScalarWhereInput[]
    OR?: LocationScalarWhereInput[]
    NOT?: LocationScalarWhereInput | LocationScalarWhereInput[]
    id?: StringFilter<"Location"> | string
    name?: StringFilter<"Location"> | string
    slug?: StringFilter<"Location"> | string
    description?: StringNullableFilter<"Location"> | string | null
    imageUrl?: StringNullableFilter<"Location"> | string | null
    latitude?: FloatNullableFilter<"Location"> | number | null
    longitude?: FloatNullableFilter<"Location"> | number | null
    universeId?: StringFilter<"Location"> | string
    parentId?: StringNullableFilter<"Location"> | string | null
    data?: JsonNullableFilter<"Location">
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
  }

  export type TimelineEventUpsertWithWhereUniqueWithoutUniverseInput = {
    where: TimelineEventWhereUniqueInput
    update: XOR<TimelineEventUpdateWithoutUniverseInput, TimelineEventUncheckedUpdateWithoutUniverseInput>
    create: XOR<TimelineEventCreateWithoutUniverseInput, TimelineEventUncheckedCreateWithoutUniverseInput>
  }

  export type TimelineEventUpdateWithWhereUniqueWithoutUniverseInput = {
    where: TimelineEventWhereUniqueInput
    data: XOR<TimelineEventUpdateWithoutUniverseInput, TimelineEventUncheckedUpdateWithoutUniverseInput>
  }

  export type TimelineEventUpdateManyWithWhereWithoutUniverseInput = {
    where: TimelineEventScalarWhereInput
    data: XOR<TimelineEventUpdateManyMutationInput, TimelineEventUncheckedUpdateManyWithoutUniverseInput>
  }

  export type TimelineEventScalarWhereInput = {
    AND?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
    OR?: TimelineEventScalarWhereInput[]
    NOT?: TimelineEventScalarWhereInput | TimelineEventScalarWhereInput[]
    id?: StringFilter<"TimelineEvent"> | string
    title?: StringFilter<"TimelineEvent"> | string
    description?: StringNullableFilter<"TimelineEvent"> | string | null
    date?: DateTimeFilter<"TimelineEvent"> | Date | string
    endDate?: DateTimeNullableFilter<"TimelineEvent"> | Date | string | null
    type?: StringFilter<"TimelineEvent"> | string
    importance?: StringFilter<"TimelineEvent"> | string
    universeId?: StringFilter<"TimelineEvent"> | string
    characterId?: StringNullableFilter<"TimelineEvent"> | string | null
    locationId?: StringNullableFilter<"TimelineEvent"> | string | null
    data?: JsonNullableFilter<"TimelineEvent">
    createdAt?: DateTimeFilter<"TimelineEvent"> | Date | string
    updatedAt?: DateTimeFilter<"TimelineEvent"> | Date | string
  }

  export type TitleUpsertWithWhereUniqueWithoutUniverseInput = {
    where: TitleWhereUniqueInput
    update: XOR<TitleUpdateWithoutUniverseInput, TitleUncheckedUpdateWithoutUniverseInput>
    create: XOR<TitleCreateWithoutUniverseInput, TitleUncheckedCreateWithoutUniverseInput>
  }

  export type TitleUpdateWithWhereUniqueWithoutUniverseInput = {
    where: TitleWhereUniqueInput
    data: XOR<TitleUpdateWithoutUniverseInput, TitleUncheckedUpdateWithoutUniverseInput>
  }

  export type TitleUpdateManyWithWhereWithoutUniverseInput = {
    where: TitleScalarWhereInput
    data: XOR<TitleUpdateManyMutationInput, TitleUncheckedUpdateManyWithoutUniverseInput>
  }

  export type TitleScalarWhereInput = {
    AND?: TitleScalarWhereInput | TitleScalarWhereInput[]
    OR?: TitleScalarWhereInput[]
    NOT?: TitleScalarWhereInput | TitleScalarWhereInput[]
    id?: StringFilter<"Title"> | string
    name?: StringFilter<"Title"> | string
    slug?: StringFilter<"Title"> | string
    type?: StringFilter<"Title"> | string
    description?: StringNullableFilter<"Title"> | string | null
    coverImage?: StringNullableFilter<"Title"> | string | null
    releaseYear?: IntNullableFilter<"Title"> | number | null
    endYear?: IntNullableFilter<"Title"> | number | null
    status?: StringFilter<"Title"> | string
    rating?: FloatNullableFilter<"Title"> | number | null
    universeId?: StringFilter<"Title"> | string
    viewCount?: IntFilter<"Title"> | number
    createdAt?: DateTimeFilter<"Title"> | Date | string
    updatedAt?: DateTimeFilter<"Title"> | Date | string
  }

  export type LoreEntryUpsertWithWhereUniqueWithoutUniverseInput = {
    where: LoreEntryWhereUniqueInput
    update: XOR<LoreEntryUpdateWithoutUniverseInput, LoreEntryUncheckedUpdateWithoutUniverseInput>
    create: XOR<LoreEntryCreateWithoutUniverseInput, LoreEntryUncheckedCreateWithoutUniverseInput>
  }

  export type LoreEntryUpdateWithWhereUniqueWithoutUniverseInput = {
    where: LoreEntryWhereUniqueInput
    data: XOR<LoreEntryUpdateWithoutUniverseInput, LoreEntryUncheckedUpdateWithoutUniverseInput>
  }

  export type LoreEntryUpdateManyWithWhereWithoutUniverseInput = {
    where: LoreEntryScalarWhereInput
    data: XOR<LoreEntryUpdateManyMutationInput, LoreEntryUncheckedUpdateManyWithoutUniverseInput>
  }

  export type LoreEntryScalarWhereInput = {
    AND?: LoreEntryScalarWhereInput | LoreEntryScalarWhereInput[]
    OR?: LoreEntryScalarWhereInput[]
    NOT?: LoreEntryScalarWhereInput | LoreEntryScalarWhereInput[]
    id?: StringFilter<"LoreEntry"> | string
    title?: StringFilter<"LoreEntry"> | string
    slug?: StringFilter<"LoreEntry"> | string
    category?: StringFilter<"LoreEntry"> | string
    content?: StringFilter<"LoreEntry"> | string
    excerpt?: StringNullableFilter<"LoreEntry"> | string | null
    coverImage?: StringNullableFilter<"LoreEntry"> | string | null
    importance?: StringFilter<"LoreEntry"> | string
    universeId?: StringFilter<"LoreEntry"> | string
    viewCount?: IntFilter<"LoreEntry"> | number
    status?: StringFilter<"LoreEntry"> | string
    createdAt?: DateTimeFilter<"LoreEntry"> | Date | string
    updatedAt?: DateTimeFilter<"LoreEntry"> | Date | string
  }

  export type UniverseMapCreateWithoutLocationsInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventCreateNestedManyWithoutUniverseInput
    titles?: TitleCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateWithoutLocationsInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterUncheckedCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutUniverseInput
    titles?: TitleUncheckedCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapCreateOrConnectWithoutLocationsInput = {
    where: UniverseMapWhereUniqueInput
    create: XOR<UniverseMapCreateWithoutLocationsInput, UniverseMapUncheckedCreateWithoutLocationsInput>
  }

  export type LocationCreateWithoutChildrenInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLocationsInput
    parent?: LocationCreateNestedOneWithoutChildrenInput
    characters?: CharacterLocationCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutChildrenInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterLocationUncheckedCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutChildrenInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutChildrenInput, LocationUncheckedCreateWithoutChildrenInput>
  }

  export type LocationCreateWithoutParentInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLocationsInput
    children?: LocationCreateNestedManyWithoutParentInput
    characters?: CharacterLocationCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutParentInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: LocationUncheckedCreateNestedManyWithoutParentInput
    characters?: CharacterLocationUncheckedCreateNestedManyWithoutLocationInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutParentInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput>
  }

  export type LocationCreateManyParentInputEnvelope = {
    data: LocationCreateManyParentInput | LocationCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type CharacterLocationCreateWithoutLocationInput = {
    id?: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
    character: CharacterCreateNestedOneWithoutLocationsInput
  }

  export type CharacterLocationUncheckedCreateWithoutLocationInput = {
    id?: string
    characterId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CharacterLocationCreateOrConnectWithoutLocationInput = {
    where: CharacterLocationWhereUniqueInput
    create: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput>
  }

  export type CharacterLocationCreateManyLocationInputEnvelope = {
    data: CharacterLocationCreateManyLocationInput | CharacterLocationCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type TimelineEventCreateWithoutLocationInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTimelineInput
    character?: CharacterCreateNestedOneWithoutTimelineInput
  }

  export type TimelineEventUncheckedCreateWithoutLocationInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    characterId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventCreateOrConnectWithoutLocationInput = {
    where: TimelineEventWhereUniqueInput
    create: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput>
  }

  export type TimelineEventCreateManyLocationInputEnvelope = {
    data: TimelineEventCreateManyLocationInput | TimelineEventCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type UniverseMapUpsertWithoutLocationsInput = {
    update: XOR<UniverseMapUpdateWithoutLocationsInput, UniverseMapUncheckedUpdateWithoutLocationsInput>
    create: XOR<UniverseMapCreateWithoutLocationsInput, UniverseMapUncheckedCreateWithoutLocationsInput>
    where?: UniverseMapWhereInput
  }

  export type UniverseMapUpdateToOneWithWhereWithoutLocationsInput = {
    where?: UniverseMapWhereInput
    data: XOR<UniverseMapUpdateWithoutLocationsInput, UniverseMapUncheckedUpdateWithoutLocationsInput>
  }

  export type UniverseMapUpdateWithoutLocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUpdateManyWithoutUniverseNestedInput
    titles?: TitleUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateWithoutLocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUncheckedUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput
    titles?: TitleUncheckedUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type LocationUpsertWithoutChildrenInput = {
    update: XOR<LocationUpdateWithoutChildrenInput, LocationUncheckedUpdateWithoutChildrenInput>
    create: XOR<LocationCreateWithoutChildrenInput, LocationUncheckedCreateWithoutChildrenInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutChildrenInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutChildrenInput, LocationUncheckedUpdateWithoutChildrenInput>
  }

  export type LocationUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLocationsNestedInput
    parent?: LocationUpdateOneWithoutChildrenNestedInput
    characters?: CharacterLocationUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationUpsertWithWhereUniqueWithoutParentInput = {
    where: LocationWhereUniqueInput
    update: XOR<LocationUpdateWithoutParentInput, LocationUncheckedUpdateWithoutParentInput>
    create: XOR<LocationCreateWithoutParentInput, LocationUncheckedCreateWithoutParentInput>
  }

  export type LocationUpdateWithWhereUniqueWithoutParentInput = {
    where: LocationWhereUniqueInput
    data: XOR<LocationUpdateWithoutParentInput, LocationUncheckedUpdateWithoutParentInput>
  }

  export type LocationUpdateManyWithWhereWithoutParentInput = {
    where: LocationScalarWhereInput
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyWithoutParentInput>
  }

  export type CharacterLocationUpsertWithWhereUniqueWithoutLocationInput = {
    where: CharacterLocationWhereUniqueInput
    update: XOR<CharacterLocationUpdateWithoutLocationInput, CharacterLocationUncheckedUpdateWithoutLocationInput>
    create: XOR<CharacterLocationCreateWithoutLocationInput, CharacterLocationUncheckedCreateWithoutLocationInput>
  }

  export type CharacterLocationUpdateWithWhereUniqueWithoutLocationInput = {
    where: CharacterLocationWhereUniqueInput
    data: XOR<CharacterLocationUpdateWithoutLocationInput, CharacterLocationUncheckedUpdateWithoutLocationInput>
  }

  export type CharacterLocationUpdateManyWithWhereWithoutLocationInput = {
    where: CharacterLocationScalarWhereInput
    data: XOR<CharacterLocationUpdateManyMutationInput, CharacterLocationUncheckedUpdateManyWithoutLocationInput>
  }

  export type CharacterLocationScalarWhereInput = {
    AND?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
    OR?: CharacterLocationScalarWhereInput[]
    NOT?: CharacterLocationScalarWhereInput | CharacterLocationScalarWhereInput[]
    id?: StringFilter<"CharacterLocation"> | string
    characterId?: StringFilter<"CharacterLocation"> | string
    locationId?: StringFilter<"CharacterLocation"> | string
    role?: StringNullableFilter<"CharacterLocation"> | string | null
    description?: StringNullableFilter<"CharacterLocation"> | string | null
    firstSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    lastSeenAt?: DateTimeNullableFilter<"CharacterLocation"> | Date | string | null
    createdAt?: DateTimeFilter<"CharacterLocation"> | Date | string
  }

  export type TimelineEventUpsertWithWhereUniqueWithoutLocationInput = {
    where: TimelineEventWhereUniqueInput
    update: XOR<TimelineEventUpdateWithoutLocationInput, TimelineEventUncheckedUpdateWithoutLocationInput>
    create: XOR<TimelineEventCreateWithoutLocationInput, TimelineEventUncheckedCreateWithoutLocationInput>
  }

  export type TimelineEventUpdateWithWhereUniqueWithoutLocationInput = {
    where: TimelineEventWhereUniqueInput
    data: XOR<TimelineEventUpdateWithoutLocationInput, TimelineEventUncheckedUpdateWithoutLocationInput>
  }

  export type TimelineEventUpdateManyWithWhereWithoutLocationInput = {
    where: TimelineEventScalarWhereInput
    data: XOR<TimelineEventUpdateManyMutationInput, TimelineEventUncheckedUpdateManyWithoutLocationInput>
  }

  export type UniverseMapCreateWithoutCharactersInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: LocationCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventCreateNestedManyWithoutUniverseInput
    titles?: TitleCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateWithoutCharactersInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: LocationUncheckedCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutUniverseInput
    titles?: TitleUncheckedCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapCreateOrConnectWithoutCharactersInput = {
    where: UniverseMapWhereUniqueInput
    create: XOR<UniverseMapCreateWithoutCharactersInput, UniverseMapUncheckedCreateWithoutCharactersInput>
  }

  export type CharacterLocationCreateWithoutCharacterInput = {
    id?: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
    location: LocationCreateNestedOneWithoutCharactersInput
  }

  export type CharacterLocationUncheckedCreateWithoutCharacterInput = {
    id?: string
    locationId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CharacterLocationCreateOrConnectWithoutCharacterInput = {
    where: CharacterLocationWhereUniqueInput
    create: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput>
  }

  export type CharacterLocationCreateManyCharacterInputEnvelope = {
    data: CharacterLocationCreateManyCharacterInput | CharacterLocationCreateManyCharacterInput[]
    skipDuplicates?: boolean
  }

  export type CharacterRelationshipCreateWithoutFromInput = {
    id?: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    to: CharacterCreateNestedOneWithoutRelationshipsToInput
  }

  export type CharacterRelationshipUncheckedCreateWithoutFromInput = {
    id?: string
    toId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterRelationshipCreateOrConnectWithoutFromInput = {
    where: CharacterRelationshipWhereUniqueInput
    create: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput>
  }

  export type CharacterRelationshipCreateManyFromInputEnvelope = {
    data: CharacterRelationshipCreateManyFromInput | CharacterRelationshipCreateManyFromInput[]
    skipDuplicates?: boolean
  }

  export type CharacterRelationshipCreateWithoutToInput = {
    id?: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    from: CharacterCreateNestedOneWithoutRelationshipsFromInput
  }

  export type CharacterRelationshipUncheckedCreateWithoutToInput = {
    id?: string
    fromId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterRelationshipCreateOrConnectWithoutToInput = {
    where: CharacterRelationshipWhereUniqueInput
    create: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput>
  }

  export type CharacterRelationshipCreateManyToInputEnvelope = {
    data: CharacterRelationshipCreateManyToInput | CharacterRelationshipCreateManyToInput[]
    skipDuplicates?: boolean
  }

  export type TimelineEventCreateWithoutCharacterInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTimelineInput
    location?: LocationCreateNestedOneWithoutTimelineInput
  }

  export type TimelineEventUncheckedCreateWithoutCharacterInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventCreateOrConnectWithoutCharacterInput = {
    where: TimelineEventWhereUniqueInput
    create: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput>
  }

  export type TimelineEventCreateManyCharacterInputEnvelope = {
    data: TimelineEventCreateManyCharacterInput | TimelineEventCreateManyCharacterInput[]
    skipDuplicates?: boolean
  }

  export type UniverseMapUpsertWithoutCharactersInput = {
    update: XOR<UniverseMapUpdateWithoutCharactersInput, UniverseMapUncheckedUpdateWithoutCharactersInput>
    create: XOR<UniverseMapCreateWithoutCharactersInput, UniverseMapUncheckedCreateWithoutCharactersInput>
    where?: UniverseMapWhereInput
  }

  export type UniverseMapUpdateToOneWithWhereWithoutCharactersInput = {
    where?: UniverseMapWhereInput
    data: XOR<UniverseMapUpdateWithoutCharactersInput, UniverseMapUncheckedUpdateWithoutCharactersInput>
  }

  export type UniverseMapUpdateWithoutCharactersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: LocationUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUpdateManyWithoutUniverseNestedInput
    titles?: TitleUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateWithoutCharactersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: LocationUncheckedUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput
    titles?: TitleUncheckedUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type CharacterLocationUpsertWithWhereUniqueWithoutCharacterInput = {
    where: CharacterLocationWhereUniqueInput
    update: XOR<CharacterLocationUpdateWithoutCharacterInput, CharacterLocationUncheckedUpdateWithoutCharacterInput>
    create: XOR<CharacterLocationCreateWithoutCharacterInput, CharacterLocationUncheckedCreateWithoutCharacterInput>
  }

  export type CharacterLocationUpdateWithWhereUniqueWithoutCharacterInput = {
    where: CharacterLocationWhereUniqueInput
    data: XOR<CharacterLocationUpdateWithoutCharacterInput, CharacterLocationUncheckedUpdateWithoutCharacterInput>
  }

  export type CharacterLocationUpdateManyWithWhereWithoutCharacterInput = {
    where: CharacterLocationScalarWhereInput
    data: XOR<CharacterLocationUpdateManyMutationInput, CharacterLocationUncheckedUpdateManyWithoutCharacterInput>
  }

  export type CharacterRelationshipUpsertWithWhereUniqueWithoutFromInput = {
    where: CharacterRelationshipWhereUniqueInput
    update: XOR<CharacterRelationshipUpdateWithoutFromInput, CharacterRelationshipUncheckedUpdateWithoutFromInput>
    create: XOR<CharacterRelationshipCreateWithoutFromInput, CharacterRelationshipUncheckedCreateWithoutFromInput>
  }

  export type CharacterRelationshipUpdateWithWhereUniqueWithoutFromInput = {
    where: CharacterRelationshipWhereUniqueInput
    data: XOR<CharacterRelationshipUpdateWithoutFromInput, CharacterRelationshipUncheckedUpdateWithoutFromInput>
  }

  export type CharacterRelationshipUpdateManyWithWhereWithoutFromInput = {
    where: CharacterRelationshipScalarWhereInput
    data: XOR<CharacterRelationshipUpdateManyMutationInput, CharacterRelationshipUncheckedUpdateManyWithoutFromInput>
  }

  export type CharacterRelationshipScalarWhereInput = {
    AND?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
    OR?: CharacterRelationshipScalarWhereInput[]
    NOT?: CharacterRelationshipScalarWhereInput | CharacterRelationshipScalarWhereInput[]
    id?: StringFilter<"CharacterRelationship"> | string
    fromId?: StringFilter<"CharacterRelationship"> | string
    toId?: StringFilter<"CharacterRelationship"> | string
    type?: StringFilter<"CharacterRelationship"> | string
    description?: StringNullableFilter<"CharacterRelationship"> | string | null
    startDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    endDate?: DateTimeNullableFilter<"CharacterRelationship"> | Date | string | null
    isOfficial?: BoolFilter<"CharacterRelationship"> | boolean
    createdAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
    updatedAt?: DateTimeFilter<"CharacterRelationship"> | Date | string
  }

  export type CharacterRelationshipUpsertWithWhereUniqueWithoutToInput = {
    where: CharacterRelationshipWhereUniqueInput
    update: XOR<CharacterRelationshipUpdateWithoutToInput, CharacterRelationshipUncheckedUpdateWithoutToInput>
    create: XOR<CharacterRelationshipCreateWithoutToInput, CharacterRelationshipUncheckedCreateWithoutToInput>
  }

  export type CharacterRelationshipUpdateWithWhereUniqueWithoutToInput = {
    where: CharacterRelationshipWhereUniqueInput
    data: XOR<CharacterRelationshipUpdateWithoutToInput, CharacterRelationshipUncheckedUpdateWithoutToInput>
  }

  export type CharacterRelationshipUpdateManyWithWhereWithoutToInput = {
    where: CharacterRelationshipScalarWhereInput
    data: XOR<CharacterRelationshipUpdateManyMutationInput, CharacterRelationshipUncheckedUpdateManyWithoutToInput>
  }

  export type TimelineEventUpsertWithWhereUniqueWithoutCharacterInput = {
    where: TimelineEventWhereUniqueInput
    update: XOR<TimelineEventUpdateWithoutCharacterInput, TimelineEventUncheckedUpdateWithoutCharacterInput>
    create: XOR<TimelineEventCreateWithoutCharacterInput, TimelineEventUncheckedCreateWithoutCharacterInput>
  }

  export type TimelineEventUpdateWithWhereUniqueWithoutCharacterInput = {
    where: TimelineEventWhereUniqueInput
    data: XOR<TimelineEventUpdateWithoutCharacterInput, TimelineEventUncheckedUpdateWithoutCharacterInput>
  }

  export type TimelineEventUpdateManyWithWhereWithoutCharacterInput = {
    where: TimelineEventScalarWhereInput
    data: XOR<TimelineEventUpdateManyMutationInput, TimelineEventUncheckedUpdateManyWithoutCharacterInput>
  }

  export type CharacterCreateWithoutLocationsInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutCharactersInput
    relationshipsFrom?: CharacterRelationshipCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipCreateNestedManyWithoutToInput
    timeline?: TimelineEventCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUncheckedCreateWithoutLocationsInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    relationshipsFrom?: CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipUncheckedCreateNestedManyWithoutToInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutCharacterInput
  }

  export type CharacterCreateOrConnectWithoutLocationsInput = {
    where: CharacterWhereUniqueInput
    create: XOR<CharacterCreateWithoutLocationsInput, CharacterUncheckedCreateWithoutLocationsInput>
  }

  export type LocationCreateWithoutCharactersInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLocationsInput
    parent?: LocationCreateNestedOneWithoutChildrenInput
    children?: LocationCreateNestedManyWithoutParentInput
    timeline?: TimelineEventCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutCharactersInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: LocationUncheckedCreateNestedManyWithoutParentInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutCharactersInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutCharactersInput, LocationUncheckedCreateWithoutCharactersInput>
  }

  export type CharacterUpsertWithoutLocationsInput = {
    update: XOR<CharacterUpdateWithoutLocationsInput, CharacterUncheckedUpdateWithoutLocationsInput>
    create: XOR<CharacterCreateWithoutLocationsInput, CharacterUncheckedCreateWithoutLocationsInput>
    where?: CharacterWhereInput
  }

  export type CharacterUpdateToOneWithWhereWithoutLocationsInput = {
    where?: CharacterWhereInput
    data: XOR<CharacterUpdateWithoutLocationsInput, CharacterUncheckedUpdateWithoutLocationsInput>
  }

  export type CharacterUpdateWithoutLocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutCharactersNestedInput
    relationshipsFrom?: CharacterRelationshipUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateWithoutLocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    relationshipsFrom?: CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput
  }

  export type LocationUpsertWithoutCharactersInput = {
    update: XOR<LocationUpdateWithoutCharactersInput, LocationUncheckedUpdateWithoutCharactersInput>
    create: XOR<LocationCreateWithoutCharactersInput, LocationUncheckedCreateWithoutCharactersInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutCharactersInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutCharactersInput, LocationUncheckedUpdateWithoutCharactersInput>
  }

  export type LocationUpdateWithoutCharactersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLocationsNestedInput
    parent?: LocationUpdateOneWithoutChildrenNestedInput
    children?: LocationUpdateManyWithoutParentNestedInput
    timeline?: TimelineEventUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutCharactersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: LocationUncheckedUpdateManyWithoutParentNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type CharacterCreateWithoutRelationshipsFromInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutCharactersInput
    locations?: CharacterLocationCreateNestedManyWithoutCharacterInput
    relationshipsTo?: CharacterRelationshipCreateNestedManyWithoutToInput
    timeline?: TimelineEventCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUncheckedCreateWithoutRelationshipsFromInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput
    relationshipsTo?: CharacterRelationshipUncheckedCreateNestedManyWithoutToInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutCharacterInput
  }

  export type CharacterCreateOrConnectWithoutRelationshipsFromInput = {
    where: CharacterWhereUniqueInput
    create: XOR<CharacterCreateWithoutRelationshipsFromInput, CharacterUncheckedCreateWithoutRelationshipsFromInput>
  }

  export type CharacterCreateWithoutRelationshipsToInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutCharactersInput
    locations?: CharacterLocationCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipCreateNestedManyWithoutFromInput
    timeline?: TimelineEventCreateNestedManyWithoutCharacterInput
  }

  export type CharacterUncheckedCreateWithoutRelationshipsToInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutCharacterInput
  }

  export type CharacterCreateOrConnectWithoutRelationshipsToInput = {
    where: CharacterWhereUniqueInput
    create: XOR<CharacterCreateWithoutRelationshipsToInput, CharacterUncheckedCreateWithoutRelationshipsToInput>
  }

  export type CharacterUpsertWithoutRelationshipsFromInput = {
    update: XOR<CharacterUpdateWithoutRelationshipsFromInput, CharacterUncheckedUpdateWithoutRelationshipsFromInput>
    create: XOR<CharacterCreateWithoutRelationshipsFromInput, CharacterUncheckedCreateWithoutRelationshipsFromInput>
    where?: CharacterWhereInput
  }

  export type CharacterUpdateToOneWithWhereWithoutRelationshipsFromInput = {
    where?: CharacterWhereInput
    data: XOR<CharacterUpdateWithoutRelationshipsFromInput, CharacterUncheckedUpdateWithoutRelationshipsFromInput>
  }

  export type CharacterUpdateWithoutRelationshipsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutCharactersNestedInput
    locations?: CharacterLocationUpdateManyWithoutCharacterNestedInput
    relationshipsTo?: CharacterRelationshipUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateWithoutRelationshipsFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput
    relationshipsTo?: CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUpsertWithoutRelationshipsToInput = {
    update: XOR<CharacterUpdateWithoutRelationshipsToInput, CharacterUncheckedUpdateWithoutRelationshipsToInput>
    create: XOR<CharacterCreateWithoutRelationshipsToInput, CharacterUncheckedCreateWithoutRelationshipsToInput>
    where?: CharacterWhereInput
  }

  export type CharacterUpdateToOneWithWhereWithoutRelationshipsToInput = {
    where?: CharacterWhereInput
    data: XOR<CharacterUpdateWithoutRelationshipsToInput, CharacterUncheckedUpdateWithoutRelationshipsToInput>
  }

  export type CharacterUpdateWithoutRelationshipsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutCharactersNestedInput
    locations?: CharacterLocationUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUpdateManyWithoutFromNestedInput
    timeline?: TimelineEventUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateWithoutRelationshipsToInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput
  }

  export type UniverseMapCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterCreateNestedManyWithoutUniverseInput
    locations?: LocationCreateNestedManyWithoutUniverseInput
    titles?: TitleCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterUncheckedCreateNestedManyWithoutUniverseInput
    locations?: LocationUncheckedCreateNestedManyWithoutUniverseInput
    titles?: TitleUncheckedCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapCreateOrConnectWithoutTimelineInput = {
    where: UniverseMapWhereUniqueInput
    create: XOR<UniverseMapCreateWithoutTimelineInput, UniverseMapUncheckedCreateWithoutTimelineInput>
  }

  export type CharacterCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutCharactersInput
    locations?: CharacterLocationCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipCreateNestedManyWithoutToInput
  }

  export type CharacterUncheckedCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    universeId: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    locations?: CharacterLocationUncheckedCreateNestedManyWithoutCharacterInput
    relationshipsFrom?: CharacterRelationshipUncheckedCreateNestedManyWithoutFromInput
    relationshipsTo?: CharacterRelationshipUncheckedCreateNestedManyWithoutToInput
  }

  export type CharacterCreateOrConnectWithoutTimelineInput = {
    where: CharacterWhereUniqueInput
    create: XOR<CharacterCreateWithoutTimelineInput, CharacterUncheckedCreateWithoutTimelineInput>
  }

  export type LocationCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutLocationsInput
    parent?: LocationCreateNestedOneWithoutChildrenInput
    children?: LocationCreateNestedManyWithoutParentInput
    characters?: CharacterLocationCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutTimelineInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: LocationUncheckedCreateNestedManyWithoutParentInput
    characters?: CharacterLocationUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutTimelineInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutTimelineInput, LocationUncheckedCreateWithoutTimelineInput>
  }

  export type UniverseMapUpsertWithoutTimelineInput = {
    update: XOR<UniverseMapUpdateWithoutTimelineInput, UniverseMapUncheckedUpdateWithoutTimelineInput>
    create: XOR<UniverseMapCreateWithoutTimelineInput, UniverseMapUncheckedCreateWithoutTimelineInput>
    where?: UniverseMapWhereInput
  }

  export type UniverseMapUpdateToOneWithWhereWithoutTimelineInput = {
    where?: UniverseMapWhereInput
    data: XOR<UniverseMapUpdateWithoutTimelineInput, UniverseMapUncheckedUpdateWithoutTimelineInput>
  }

  export type UniverseMapUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUpdateManyWithoutUniverseNestedInput
    locations?: LocationUpdateManyWithoutUniverseNestedInput
    titles?: TitleUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUncheckedUpdateManyWithoutUniverseNestedInput
    locations?: LocationUncheckedUpdateManyWithoutUniverseNestedInput
    titles?: TitleUncheckedUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type CharacterUpsertWithoutTimelineInput = {
    update: XOR<CharacterUpdateWithoutTimelineInput, CharacterUncheckedUpdateWithoutTimelineInput>
    create: XOR<CharacterCreateWithoutTimelineInput, CharacterUncheckedCreateWithoutTimelineInput>
    where?: CharacterWhereInput
  }

  export type CharacterUpdateToOneWithWhereWithoutTimelineInput = {
    where?: CharacterWhereInput
    data: XOR<CharacterUpdateWithoutTimelineInput, CharacterUncheckedUpdateWithoutTimelineInput>
  }

  export type CharacterUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutCharactersNestedInput
    locations?: CharacterLocationUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUpdateManyWithoutToNestedInput
  }

  export type CharacterUncheckedUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput
  }

  export type LocationUpsertWithoutTimelineInput = {
    update: XOR<LocationUpdateWithoutTimelineInput, LocationUncheckedUpdateWithoutTimelineInput>
    create: XOR<LocationCreateWithoutTimelineInput, LocationUncheckedCreateWithoutTimelineInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutTimelineInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutTimelineInput, LocationUncheckedUpdateWithoutTimelineInput>
  }

  export type LocationUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLocationsNestedInput
    parent?: LocationUpdateOneWithoutChildrenNestedInput
    children?: LocationUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutTimelineInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: LocationUncheckedUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type UniverseMapCreateWithoutTitlesInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterCreateNestedManyWithoutUniverseInput
    locations?: LocationCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateWithoutTitlesInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterUncheckedCreateNestedManyWithoutUniverseInput
    locations?: LocationUncheckedCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutUniverseInput
    loreEntries?: LoreEntryUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapCreateOrConnectWithoutTitlesInput = {
    where: UniverseMapWhereUniqueInput
    create: XOR<UniverseMapCreateWithoutTitlesInput, UniverseMapUncheckedCreateWithoutTitlesInput>
  }

  export type RecapCreateWithoutTitleInput = {
    id?: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RecapUncheckedCreateWithoutTitleInput = {
    id?: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RecapCreateOrConnectWithoutTitleInput = {
    where: RecapWhereUniqueInput
    create: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput>
  }

  export type RecapCreateManyTitleInputEnvelope = {
    data: RecapCreateManyTitleInput | RecapCreateManyTitleInput[]
    skipDuplicates?: boolean
  }

  export type CrossoverTitleCreateWithoutTitleInput = {
    id?: string
    crossover: CrossoverCreateNestedOneWithoutTitlesInput
  }

  export type CrossoverTitleUncheckedCreateWithoutTitleInput = {
    id?: string
    crossoverId: string
  }

  export type CrossoverTitleCreateOrConnectWithoutTitleInput = {
    where: CrossoverTitleWhereUniqueInput
    create: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput>
  }

  export type CrossoverTitleCreateManyTitleInputEnvelope = {
    data: CrossoverTitleCreateManyTitleInput | CrossoverTitleCreateManyTitleInput[]
    skipDuplicates?: boolean
  }

  export type ChapterCreateWithoutTitleInput = {
    id?: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ChapterUncheckedCreateWithoutTitleInput = {
    id?: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ChapterCreateOrConnectWithoutTitleInput = {
    where: ChapterWhereUniqueInput
    create: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput>
  }

  export type ChapterCreateManyTitleInputEnvelope = {
    data: ChapterCreateManyTitleInput | ChapterCreateManyTitleInput[]
    skipDuplicates?: boolean
  }

  export type UniverseMapUpsertWithoutTitlesInput = {
    update: XOR<UniverseMapUpdateWithoutTitlesInput, UniverseMapUncheckedUpdateWithoutTitlesInput>
    create: XOR<UniverseMapCreateWithoutTitlesInput, UniverseMapUncheckedCreateWithoutTitlesInput>
    where?: UniverseMapWhereInput
  }

  export type UniverseMapUpdateToOneWithWhereWithoutTitlesInput = {
    where?: UniverseMapWhereInput
    data: XOR<UniverseMapUpdateWithoutTitlesInput, UniverseMapUncheckedUpdateWithoutTitlesInput>
  }

  export type UniverseMapUpdateWithoutTitlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUpdateManyWithoutUniverseNestedInput
    locations?: LocationUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateWithoutTitlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUncheckedUpdateManyWithoutUniverseNestedInput
    locations?: LocationUncheckedUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput
    loreEntries?: LoreEntryUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type RecapUpsertWithWhereUniqueWithoutTitleInput = {
    where: RecapWhereUniqueInput
    update: XOR<RecapUpdateWithoutTitleInput, RecapUncheckedUpdateWithoutTitleInput>
    create: XOR<RecapCreateWithoutTitleInput, RecapUncheckedCreateWithoutTitleInput>
  }

  export type RecapUpdateWithWhereUniqueWithoutTitleInput = {
    where: RecapWhereUniqueInput
    data: XOR<RecapUpdateWithoutTitleInput, RecapUncheckedUpdateWithoutTitleInput>
  }

  export type RecapUpdateManyWithWhereWithoutTitleInput = {
    where: RecapScalarWhereInput
    data: XOR<RecapUpdateManyMutationInput, RecapUncheckedUpdateManyWithoutTitleInput>
  }

  export type RecapScalarWhereInput = {
    AND?: RecapScalarWhereInput | RecapScalarWhereInput[]
    OR?: RecapScalarWhereInput[]
    NOT?: RecapScalarWhereInput | RecapScalarWhereInput[]
    id?: StringFilter<"Recap"> | string
    titleId?: StringFilter<"Recap"> | string
    season?: IntNullableFilter<"Recap"> | number | null
    episode?: IntNullableFilter<"Recap"> | number | null
    name?: StringNullableFilter<"Recap"> | string | null
    content?: StringFilter<"Recap"> | string
    coverImage?: StringNullableFilter<"Recap"> | string | null
    isSpoiler?: BoolFilter<"Recap"> | boolean
    viewCount?: IntFilter<"Recap"> | number
    status?: StringFilter<"Recap"> | string
    publishedAt?: DateTimeNullableFilter<"Recap"> | Date | string | null
    createdAt?: DateTimeFilter<"Recap"> | Date | string
  }

  export type CrossoverTitleUpsertWithWhereUniqueWithoutTitleInput = {
    where: CrossoverTitleWhereUniqueInput
    update: XOR<CrossoverTitleUpdateWithoutTitleInput, CrossoverTitleUncheckedUpdateWithoutTitleInput>
    create: XOR<CrossoverTitleCreateWithoutTitleInput, CrossoverTitleUncheckedCreateWithoutTitleInput>
  }

  export type CrossoverTitleUpdateWithWhereUniqueWithoutTitleInput = {
    where: CrossoverTitleWhereUniqueInput
    data: XOR<CrossoverTitleUpdateWithoutTitleInput, CrossoverTitleUncheckedUpdateWithoutTitleInput>
  }

  export type CrossoverTitleUpdateManyWithWhereWithoutTitleInput = {
    where: CrossoverTitleScalarWhereInput
    data: XOR<CrossoverTitleUpdateManyMutationInput, CrossoverTitleUncheckedUpdateManyWithoutTitleInput>
  }

  export type CrossoverTitleScalarWhereInput = {
    AND?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
    OR?: CrossoverTitleScalarWhereInput[]
    NOT?: CrossoverTitleScalarWhereInput | CrossoverTitleScalarWhereInput[]
    id?: StringFilter<"CrossoverTitle"> | string
    crossoverId?: StringFilter<"CrossoverTitle"> | string
    titleId?: StringFilter<"CrossoverTitle"> | string
  }

  export type ChapterUpsertWithWhereUniqueWithoutTitleInput = {
    where: ChapterWhereUniqueInput
    update: XOR<ChapterUpdateWithoutTitleInput, ChapterUncheckedUpdateWithoutTitleInput>
    create: XOR<ChapterCreateWithoutTitleInput, ChapterUncheckedCreateWithoutTitleInput>
  }

  export type ChapterUpdateWithWhereUniqueWithoutTitleInput = {
    where: ChapterWhereUniqueInput
    data: XOR<ChapterUpdateWithoutTitleInput, ChapterUncheckedUpdateWithoutTitleInput>
  }

  export type ChapterUpdateManyWithWhereWithoutTitleInput = {
    where: ChapterScalarWhereInput
    data: XOR<ChapterUpdateManyMutationInput, ChapterUncheckedUpdateManyWithoutTitleInput>
  }

  export type ChapterScalarWhereInput = {
    AND?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    OR?: ChapterScalarWhereInput[]
    NOT?: ChapterScalarWhereInput | ChapterScalarWhereInput[]
    id?: StringFilter<"Chapter"> | string
    titleId?: StringFilter<"Chapter"> | string
    number?: FloatFilter<"Chapter"> | number
    name?: StringNullableFilter<"Chapter"> | string | null
    description?: StringNullableFilter<"Chapter"> | string | null
    coverImage?: StringNullableFilter<"Chapter"> | string | null
    content?: StringNullableFilter<"Chapter"> | string | null
    wordCount?: IntNullableFilter<"Chapter"> | number | null
    status?: StringFilter<"Chapter"> | string
    publishedAt?: DateTimeNullableFilter<"Chapter"> | Date | string | null
    createdAt?: DateTimeFilter<"Chapter"> | Date | string
  }

  export type TitleCreateWithoutChaptersInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTitlesInput
    recaps?: RecapCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleCreateNestedManyWithoutTitleInput
  }

  export type TitleUncheckedCreateWithoutChaptersInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    universeId: string
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    recaps?: RecapUncheckedCreateNestedManyWithoutTitleInput
    crossovers?: CrossoverTitleUncheckedCreateNestedManyWithoutTitleInput
  }

  export type TitleCreateOrConnectWithoutChaptersInput = {
    where: TitleWhereUniqueInput
    create: XOR<TitleCreateWithoutChaptersInput, TitleUncheckedCreateWithoutChaptersInput>
  }

  export type TitleUpsertWithoutChaptersInput = {
    update: XOR<TitleUpdateWithoutChaptersInput, TitleUncheckedUpdateWithoutChaptersInput>
    create: XOR<TitleCreateWithoutChaptersInput, TitleUncheckedCreateWithoutChaptersInput>
    where?: TitleWhereInput
  }

  export type TitleUpdateToOneWithWhereWithoutChaptersInput = {
    where?: TitleWhereInput
    data: XOR<TitleUpdateWithoutChaptersInput, TitleUncheckedUpdateWithoutChaptersInput>
  }

  export type TitleUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTitlesNestedInput
    recaps?: RecapUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateWithoutChaptersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recaps?: RecapUncheckedUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUncheckedUpdateManyWithoutTitleNestedInput
  }

  export type UniverseMapCreateWithoutLoreEntriesInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterCreateNestedManyWithoutUniverseInput
    locations?: LocationCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventCreateNestedManyWithoutUniverseInput
    titles?: TitleCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapUncheckedCreateWithoutLoreEntriesInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    characters?: CharacterUncheckedCreateNestedManyWithoutUniverseInput
    locations?: LocationUncheckedCreateNestedManyWithoutUniverseInput
    timeline?: TimelineEventUncheckedCreateNestedManyWithoutUniverseInput
    titles?: TitleUncheckedCreateNestedManyWithoutUniverseInput
  }

  export type UniverseMapCreateOrConnectWithoutLoreEntriesInput = {
    where: UniverseMapWhereUniqueInput
    create: XOR<UniverseMapCreateWithoutLoreEntriesInput, UniverseMapUncheckedCreateWithoutLoreEntriesInput>
  }

  export type UniverseMapUpsertWithoutLoreEntriesInput = {
    update: XOR<UniverseMapUpdateWithoutLoreEntriesInput, UniverseMapUncheckedUpdateWithoutLoreEntriesInput>
    create: XOR<UniverseMapCreateWithoutLoreEntriesInput, UniverseMapUncheckedCreateWithoutLoreEntriesInput>
    where?: UniverseMapWhereInput
  }

  export type UniverseMapUpdateToOneWithWhereWithoutLoreEntriesInput = {
    where?: UniverseMapWhereInput
    data: XOR<UniverseMapUpdateWithoutLoreEntriesInput, UniverseMapUncheckedUpdateWithoutLoreEntriesInput>
  }

  export type UniverseMapUpdateWithoutLoreEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUpdateManyWithoutUniverseNestedInput
    locations?: LocationUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUpdateManyWithoutUniverseNestedInput
    titles?: TitleUpdateManyWithoutUniverseNestedInput
  }

  export type UniverseMapUncheckedUpdateWithoutLoreEntriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    characters?: CharacterUncheckedUpdateManyWithoutUniverseNestedInput
    locations?: LocationUncheckedUpdateManyWithoutUniverseNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutUniverseNestedInput
    titles?: TitleUncheckedUpdateManyWithoutUniverseNestedInput
  }

  export type CrossoverTitleCreateWithoutCrossoverInput = {
    id?: string
    title: TitleCreateNestedOneWithoutCrossoversInput
  }

  export type CrossoverTitleUncheckedCreateWithoutCrossoverInput = {
    id?: string
    titleId: string
  }

  export type CrossoverTitleCreateOrConnectWithoutCrossoverInput = {
    where: CrossoverTitleWhereUniqueInput
    create: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput>
  }

  export type CrossoverTitleCreateManyCrossoverInputEnvelope = {
    data: CrossoverTitleCreateManyCrossoverInput | CrossoverTitleCreateManyCrossoverInput[]
    skipDuplicates?: boolean
  }

  export type CrossoverTitleUpsertWithWhereUniqueWithoutCrossoverInput = {
    where: CrossoverTitleWhereUniqueInput
    update: XOR<CrossoverTitleUpdateWithoutCrossoverInput, CrossoverTitleUncheckedUpdateWithoutCrossoverInput>
    create: XOR<CrossoverTitleCreateWithoutCrossoverInput, CrossoverTitleUncheckedCreateWithoutCrossoverInput>
  }

  export type CrossoverTitleUpdateWithWhereUniqueWithoutCrossoverInput = {
    where: CrossoverTitleWhereUniqueInput
    data: XOR<CrossoverTitleUpdateWithoutCrossoverInput, CrossoverTitleUncheckedUpdateWithoutCrossoverInput>
  }

  export type CrossoverTitleUpdateManyWithWhereWithoutCrossoverInput = {
    where: CrossoverTitleScalarWhereInput
    data: XOR<CrossoverTitleUpdateManyMutationInput, CrossoverTitleUncheckedUpdateManyWithoutCrossoverInput>
  }

  export type CrossoverCreateWithoutTitlesInput = {
    id?: string
    title: string
    slug: string
    description?: string | null
    coverImage?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrossoverUncheckedCreateWithoutTitlesInput = {
    id?: string
    title: string
    slug: string
    description?: string | null
    coverImage?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrossoverCreateOrConnectWithoutTitlesInput = {
    where: CrossoverWhereUniqueInput
    create: XOR<CrossoverCreateWithoutTitlesInput, CrossoverUncheckedCreateWithoutTitlesInput>
  }

  export type TitleCreateWithoutCrossoversInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTitlesInput
    recaps?: RecapCreateNestedManyWithoutTitleInput
    chapters?: ChapterCreateNestedManyWithoutTitleInput
  }

  export type TitleUncheckedCreateWithoutCrossoversInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    universeId: string
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    recaps?: RecapUncheckedCreateNestedManyWithoutTitleInput
    chapters?: ChapterUncheckedCreateNestedManyWithoutTitleInput
  }

  export type TitleCreateOrConnectWithoutCrossoversInput = {
    where: TitleWhereUniqueInput
    create: XOR<TitleCreateWithoutCrossoversInput, TitleUncheckedCreateWithoutCrossoversInput>
  }

  export type CrossoverUpsertWithoutTitlesInput = {
    update: XOR<CrossoverUpdateWithoutTitlesInput, CrossoverUncheckedUpdateWithoutTitlesInput>
    create: XOR<CrossoverCreateWithoutTitlesInput, CrossoverUncheckedCreateWithoutTitlesInput>
    where?: CrossoverWhereInput
  }

  export type CrossoverUpdateToOneWithWhereWithoutTitlesInput = {
    where?: CrossoverWhereInput
    data: XOR<CrossoverUpdateWithoutTitlesInput, CrossoverUncheckedUpdateWithoutTitlesInput>
  }

  export type CrossoverUpdateWithoutTitlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverUncheckedUpdateWithoutTitlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TitleUpsertWithoutCrossoversInput = {
    update: XOR<TitleUpdateWithoutCrossoversInput, TitleUncheckedUpdateWithoutCrossoversInput>
    create: XOR<TitleCreateWithoutCrossoversInput, TitleUncheckedCreateWithoutCrossoversInput>
    where?: TitleWhereInput
  }

  export type TitleUpdateToOneWithWhereWithoutCrossoversInput = {
    where?: TitleWhereInput
    data: XOR<TitleUpdateWithoutCrossoversInput, TitleUncheckedUpdateWithoutCrossoversInput>
  }

  export type TitleUpdateWithoutCrossoversInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTitlesNestedInput
    recaps?: RecapUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateWithoutCrossoversInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recaps?: RecapUncheckedUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUncheckedUpdateManyWithoutTitleNestedInput
  }

  export type TitleCreateWithoutRecapsInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    universe: UniverseMapCreateNestedOneWithoutTitlesInput
    crossovers?: CrossoverTitleCreateNestedManyWithoutTitleInput
    chapters?: ChapterCreateNestedManyWithoutTitleInput
  }

  export type TitleUncheckedCreateWithoutRecapsInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    universeId: string
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    crossovers?: CrossoverTitleUncheckedCreateNestedManyWithoutTitleInput
    chapters?: ChapterUncheckedCreateNestedManyWithoutTitleInput
  }

  export type TitleCreateOrConnectWithoutRecapsInput = {
    where: TitleWhereUniqueInput
    create: XOR<TitleCreateWithoutRecapsInput, TitleUncheckedCreateWithoutRecapsInput>
  }

  export type TitleUpsertWithoutRecapsInput = {
    update: XOR<TitleUpdateWithoutRecapsInput, TitleUncheckedUpdateWithoutRecapsInput>
    create: XOR<TitleCreateWithoutRecapsInput, TitleUncheckedCreateWithoutRecapsInput>
    where?: TitleWhereInput
  }

  export type TitleUpdateToOneWithWhereWithoutRecapsInput = {
    where?: TitleWhereInput
    data: XOR<TitleUpdateWithoutRecapsInput, TitleUncheckedUpdateWithoutRecapsInput>
  }

  export type TitleUpdateWithoutRecapsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTitlesNestedInput
    crossovers?: CrossoverTitleUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateWithoutRecapsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    crossovers?: CrossoverTitleUncheckedUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUncheckedUpdateManyWithoutTitleNestedInput
  }

  export type CharacterCreateManyUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    avatarUrl?: string | null
    role?: string | null
    status?: string
    birthDate?: Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationCreateManyUniverseInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    parentId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventCreateManyUniverseInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    characterId?: string | null
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TitleCreateManyUniverseInput = {
    id?: string
    name: string
    slug: string
    type: string
    description?: string | null
    coverImage?: string | null
    releaseYear?: number | null
    endYear?: number | null
    status?: string
    rating?: number | null
    viewCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoreEntryCreateManyUniverseInput = {
    id?: string
    title: string
    slug: string
    category: string
    content: string
    excerpt?: string | null
    coverImage?: string | null
    importance?: string
    viewCount?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    locations?: CharacterLocationUncheckedUpdateManyWithoutCharacterNestedInput
    relationshipsFrom?: CharacterRelationshipUncheckedUpdateManyWithoutFromNestedInput
    relationshipsTo?: CharacterRelationshipUncheckedUpdateManyWithoutToNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutCharacterNestedInput
  }

  export type CharacterUncheckedUpdateManyWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    birthDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: LocationUpdateOneWithoutChildrenNestedInput
    children?: LocationUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: LocationUncheckedUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateManyWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    parentId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    character?: CharacterUpdateOneWithoutTimelineNestedInput
    location?: LocationUpdateOneWithoutTimelineNestedInput
  }

  export type TimelineEventUncheckedUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUncheckedUpdateManyWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TitleUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recaps?: RecapUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    recaps?: RecapUncheckedUpdateManyWithoutTitleNestedInput
    crossovers?: CrossoverTitleUncheckedUpdateManyWithoutTitleNestedInput
    chapters?: ChapterUncheckedUpdateManyWithoutTitleNestedInput
  }

  export type TitleUncheckedUpdateManyWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    releaseYear?: NullableIntFieldUpdateOperationsInput | number | null
    endYear?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    rating?: NullableFloatFieldUpdateOperationsInput | number | null
    viewCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryUncheckedUpdateWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoreEntryUncheckedUpdateManyWithoutUniverseInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    excerpt?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    importance?: StringFieldUpdateOperationsInput | string
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateManyParentInput = {
    id?: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
    latitude?: number | null
    longitude?: number | null
    universeId: string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterLocationCreateManyLocationInput = {
    id?: string
    characterId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type TimelineEventCreateManyLocationInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    characterId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutLocationsNestedInput
    children?: LocationUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: LocationUncheckedUpdateManyWithoutParentNestedInput
    characters?: CharacterLocationUncheckedUpdateManyWithoutLocationNestedInput
    timeline?: TimelineEventUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    universeId?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    character?: CharacterUpdateOneRequiredWithoutLocationsNestedInput
  }

  export type CharacterLocationUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    characterId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    characterId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTimelineNestedInput
    character?: CharacterUpdateOneWithoutTimelineNestedInput
  }

  export type TimelineEventUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    characterId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationCreateManyCharacterInput = {
    id?: string
    locationId: string
    role?: string | null
    description?: string | null
    firstSeenAt?: Date | string | null
    lastSeenAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CharacterRelationshipCreateManyFromInput = {
    id?: string
    toId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterRelationshipCreateManyToInput = {
    id?: string
    fromId: string
    type: string
    description?: string | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    isOfficial?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TimelineEventCreateManyCharacterInput = {
    id?: string
    title: string
    description?: string | null
    date: Date | string
    endDate?: Date | string | null
    type: string
    importance?: string
    universeId: string
    locationId?: string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CharacterLocationUpdateWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutCharactersNestedInput
  }

  export type CharacterLocationUncheckedUpdateWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterLocationUncheckedUpdateManyWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    role?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    firstSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipUpdateWithoutFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    to?: CharacterUpdateOneRequiredWithoutRelationshipsToNestedInput
  }

  export type CharacterRelationshipUncheckedUpdateWithoutFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipUncheckedUpdateManyWithoutFromInput = {
    id?: StringFieldUpdateOperationsInput | string
    toId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipUpdateWithoutToInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    from?: CharacterUpdateOneRequiredWithoutRelationshipsFromNestedInput
  }

  export type CharacterRelationshipUncheckedUpdateWithoutToInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CharacterRelationshipUncheckedUpdateManyWithoutToInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOfficial?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUpdateWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    universe?: UniverseMapUpdateOneRequiredWithoutTimelineNestedInput
    location?: LocationUpdateOneWithoutTimelineNestedInput
  }

  export type TimelineEventUncheckedUpdateWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TimelineEventUncheckedUpdateManyWithoutCharacterInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    type?: StringFieldUpdateOperationsInput | string
    importance?: StringFieldUpdateOperationsInput | string
    universeId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    data?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecapCreateManyTitleInput = {
    id?: string
    season?: number | null
    episode?: number | null
    name?: string | null
    content: string
    coverImage?: string | null
    isSpoiler?: boolean
    viewCount?: number
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type CrossoverTitleCreateManyTitleInput = {
    id?: string
    crossoverId: string
  }

  export type ChapterCreateManyTitleInput = {
    id?: string
    number: number
    name?: string | null
    description?: string | null
    coverImage?: string | null
    content?: string | null
    wordCount?: number | null
    status?: string
    publishedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type RecapUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecapUncheckedUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecapUncheckedUpdateManyWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    season?: NullableIntFieldUpdateOperationsInput | number | null
    episode?: NullableIntFieldUpdateOperationsInput | number | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    isSpoiler?: BoolFieldUpdateOperationsInput | boolean
    viewCount?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverTitleUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossover?: CrossoverUpdateOneRequiredWithoutTitlesNestedInput
  }

  export type CrossoverTitleUncheckedUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossoverId?: StringFieldUpdateOperationsInput | string
  }

  export type CrossoverTitleUncheckedUpdateManyWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    crossoverId?: StringFieldUpdateOperationsInput | string
  }

  export type ChapterUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterUncheckedUpdateWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChapterUncheckedUpdateManyWithoutTitleInput = {
    id?: StringFieldUpdateOperationsInput | string
    number?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    coverImage?: NullableStringFieldUpdateOperationsInput | string | null
    content?: NullableStringFieldUpdateOperationsInput | string | null
    wordCount?: NullableIntFieldUpdateOperationsInput | number | null
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrossoverTitleCreateManyCrossoverInput = {
    id?: string
    titleId: string
  }

  export type CrossoverTitleUpdateWithoutCrossoverInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: TitleUpdateOneRequiredWithoutCrossoversNestedInput
  }

  export type CrossoverTitleUncheckedUpdateWithoutCrossoverInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
  }

  export type CrossoverTitleUncheckedUpdateManyWithoutCrossoverInput = {
    id?: StringFieldUpdateOperationsInput | string
    titleId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UniverseMapCountOutputTypeDefaultArgs instead
     */
    export type UniverseMapCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UniverseMapCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LocationCountOutputTypeDefaultArgs instead
     */
    export type LocationCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LocationCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CharacterCountOutputTypeDefaultArgs instead
     */
    export type CharacterCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CharacterCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TitleCountOutputTypeDefaultArgs instead
     */
    export type TitleCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TitleCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CrossoverCountOutputTypeDefaultArgs instead
     */
    export type CrossoverCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CrossoverCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UniverseMapDefaultArgs instead
     */
    export type UniverseMapArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UniverseMapDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LocationDefaultArgs instead
     */
    export type LocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LocationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CharacterDefaultArgs instead
     */
    export type CharacterArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CharacterDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CharacterLocationDefaultArgs instead
     */
    export type CharacterLocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CharacterLocationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CharacterRelationshipDefaultArgs instead
     */
    export type CharacterRelationshipArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CharacterRelationshipDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TimelineEventDefaultArgs instead
     */
    export type TimelineEventArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TimelineEventDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TitleDefaultArgs instead
     */
    export type TitleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TitleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ChapterDefaultArgs instead
     */
    export type ChapterArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ChapterDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LoreEntryDefaultArgs instead
     */
    export type LoreEntryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LoreEntryDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CrossoverDefaultArgs instead
     */
    export type CrossoverArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CrossoverDefaultArgs<ExtArgs>
    /**
     * @deprecated Use CrossoverTitleDefaultArgs instead
     */
    export type CrossoverTitleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = CrossoverTitleDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RecapDefaultArgs instead
     */
    export type RecapArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RecapDefaultArgs<ExtArgs>

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