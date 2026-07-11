import { LoadingScreen } from "@/components/LoadingScreen";
import { NavBar } from "@/components/NavBar";
import { CustomCursor } from "@/components/CustomCursor";
import { Hero } from "@/components/Hero";
import { DynamicLinks } from "@/components/DynamicLinks";
import { Stats } from "@/components/Stats";
import { Gallery } from "@/components/Gallery";
import { Chat } from "@/components/Chat";
import { ChatBot } from "@/components/ChatBot";

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <CustomCursor />
      <NavBar />

      <main className="flex min-h-screen flex-col bg-void-black text-ash-grey overflow-hidden selection:bg-blood-crimson selection:text-white">
        <Hero />
        <DynamicLinks />
        <Stats />
        <Gallery />
      </main>

      <Chat />
      <ChatBot />
    </>
  );
}
