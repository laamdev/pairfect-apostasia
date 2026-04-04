/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as allergens from "../allergens.js";
import type * as authHelpers from "../authHelpers.js";
import type * as clientProfiles from "../clientProfiles.js";
import type * as http from "../http.js";
import type * as menuItems from "../menuItems.js";
import type * as recommendations from "../recommendations.js";
import type * as recommendationsClient from "../recommendationsClient.js";
import type * as recommendationsInternal from "../recommendationsInternal.js";
import type * as restaurantMembers from "../restaurantMembers.js";
import type * as restaurants from "../restaurants.js";
import type * as sampleData_allergensSeed from "../sampleData/allergensSeed.js";
import type * as sampleData_restaurantMenuSeed from "../sampleData/restaurantMenuSeed.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  allergens: typeof allergens;
  authHelpers: typeof authHelpers;
  clientProfiles: typeof clientProfiles;
  http: typeof http;
  menuItems: typeof menuItems;
  recommendations: typeof recommendations;
  recommendationsClient: typeof recommendationsClient;
  recommendationsInternal: typeof recommendationsInternal;
  restaurantMembers: typeof restaurantMembers;
  restaurants: typeof restaurants;
  "sampleData/allergensSeed": typeof sampleData_allergensSeed;
  "sampleData/restaurantMenuSeed": typeof sampleData_restaurantMenuSeed;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
