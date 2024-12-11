'use server'

import { searchPortfolioPosts } from "@/utils/getData";
import { PortfolioPost } from "@/types/fetchedData.types";

export async function performSearch(query: string): Promise<PortfolioPost[] | null> {
  return await searchPortfolioPosts(query);
}