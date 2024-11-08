import Image from "next/image";
import { fetchBio } from "./api/db/connect";
import ThemeToggle from "../components/ThemeToggle";

export default async function Home() {

  return (
    <div className="">

    <ThemeToggle />

    </div>
  );
}