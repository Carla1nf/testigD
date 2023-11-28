"use server";

import { getData } from "@/services/api";

/**
 * Anything that runs in this file will NEVER run in the client, we can make private RPC calls, access
 * databases or whatever we want here.
 */

export async function getDebitaData() {
  try {
    const data = await getData();
    return data;
  } catch (error) {
    return { error };
  }
}
