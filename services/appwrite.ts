import { Client, Databases, Account, ID, Query, Models } from 'appwrite';

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const TASKS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID!;
export const SETTINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!;
export const STATS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_STATS_COLLECTION_ID!;

export const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);

export { ID, Query };
export type { Models };
