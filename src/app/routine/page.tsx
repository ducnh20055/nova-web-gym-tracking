"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import CustomBuilder from "@/components/workout/CustomBuilder";
import SavedRoutines from "@/components/SavedRoutines";
import { FolderHeart, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoutinePage() {
  const [activeTab, setActiveTab] = useState("saved");

  return (
    <main className="min-h-screen bg-black text-white antialiased pt-20">
      <Navbar />

      <section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-blue-300 font-bold bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            Routine Studio
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Xây dựng Routine của bạn
          </h1>
          <p className="text-zinc-300/80 text-sm leading-relaxed">
            Quản lý giáo án cá nhân hoặc tạo lịch tập mới từ thư viện bài tập.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-8 flex flex-col items-center"
        >
          <TabsList className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-2xl rounded-full border border-white/15">
            <TabsTrigger
              value="custom"
              className="rounded-full px-6 py-2.5 text-sm text-zinc-400 hover:text-white transition font-medium cursor-pointer bg-transparent shadow-none border-none data-[state=active]:bg-transparent! data-[state=active]:text-blue-400 data-[state=active]:font-extrabold flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Custom
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="rounded-full px-6 py-2.5 text-sm text-zinc-400 hover:text-white transition font-medium cursor-pointer bg-transparent shadow-none border-none data-[state=active]:bg-transparent! data-[state=active]:text-blue-400 data-[state=active]:font-extrabold flex items-center gap-2"
            >
              <FolderHeart className="w-4 h-4" /> Giáo án đã tạo
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="custom"
            className="w-full focus-visible:outline-none"
          >
            <CustomBuilder />
          </TabsContent>
          <TabsContent
            value="saved"
            className="w-full focus-visible:outline-none"
          >
            <SavedRoutines onNavigateToBuilder={() => setActiveTab("custom")} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
