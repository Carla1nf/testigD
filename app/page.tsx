import Nav from "@/components/nav";
import styles from "./styles.module.css";
import { getDebitaData } from "@/server/actions";
import TotalLiquidityLent from "@/components/total-liquidity-lent";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function Home() {
  const debitaData = await getDebitaData();
  // const debitaData = null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Nav />
      {/* <section className={styles.dashboard}>Home</section> */}

      <TotalLiquidityLent debitaData={debitaData} />
    </main>
  );
}
