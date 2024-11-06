import Image from "next/image";
import { fetchBio } from "./api/db/connect";

export default async function Home() {

  const bio = await fetchBio();

  return (
    <div>
      {''}
    </div>
  );
}